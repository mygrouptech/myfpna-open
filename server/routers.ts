import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { createDonationCheckoutSession } from "./stripe";
import * as donationsDb from "./donations-db";

// ============================================================================
// HELPER: Role-based access control
// ============================================================================

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Admin access required' 
    });
  }
  return next({ ctx });
});

const managerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!['admin', 'manager'].includes(ctx.user.role)) {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Manager or admin access required' 
    });
  }
  return next({ ctx });
});

// ============================================================================
// HELPER: Audit logging
// ============================================================================

async function auditLog(
  userId: number | undefined,
  organizationId: number,
  action: string,
  entityType?: string,
  entityId?: number,
  details?: any
) {
  await db.createAuditLog({
    userId: userId ?? null,
    organizationId,
    action,
    entityType: entityType ?? null,
    entityId: entityId ?? null,
    details: details ? JSON.stringify(details) : null,
    ipAddress: null,
    userAgent: null,
  });
}

// ============================================================================
// ROUTER: Authentication & User Management
// ============================================================================

const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
  
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.upsertUser({
        openId: ctx.user.openId,
        organizationId: ctx.user.organizationId,
        ...input,
      });
      
      await auditLog(ctx.user.id, ctx.user.organizationId, 'user.profile_updated', 'user', ctx.user.id);
      return { success: true };
    }),
});

// ============================================================================
// ROUTER: Organization Management
// ============================================================================

const organizationRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return await db.getOrganizationById(ctx.user.organizationId);
  }),
  
  update: adminProcedure
    .input(z.object({
      name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateOrganization(ctx.user.organizationId, input);
      await auditLog(ctx.user.id, ctx.user.organizationId, 'organization.updated');
      return { success: true };
    }),
  
  listUsers: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUsersByOrganization(ctx.user.organizationId);
  }),
});

// ============================================================================
// ROUTER: Scenario Management
// ============================================================================

const scenarioRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getScenariosByOrganization(ctx.user.organizationId);
  }),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const scenario = await db.getScenarioById(input.id);
      
      if (!scenario || scenario.organizationId !== ctx.user.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
      }
      
      return scenario;
    }),
  
  create: managerProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      scenarioType: z.enum(['budget', 'forecast', 'actual', 'what_if']).default('budget'),
      startDate: z.date(),
      endDate: z.date(),
      currency: z.string().length(3).default('USD'),
    }))
    .mutation(async ({ ctx, input }) => {
      const scenarioId = await db.createScenario({
        organizationId: ctx.user.organizationId,
        createdBy: ctx.user.id,
        status: 'draft',
        ...input,
      });
      
      await auditLog(ctx.user.id, ctx.user.organizationId, 'scenario.created', 'scenario', scenarioId);
      return { id: scenarioId };
    }),
  
  update: managerProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      status: z.enum(['draft', 'active', 'archived', 'approved']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const scenario = await db.getScenarioById(id);
      
      if (!scenario || scenario.organizationId !== ctx.user.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
      }
      
      await db.updateScenario(id, data);
      await auditLog(ctx.user.id, ctx.user.organizationId, 'scenario.updated', 'scenario', id);
      return { success: true };
    }),
  
  approve: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const scenario = await db.getScenarioById(input.id);
      
      if (!scenario || scenario.organizationId !== ctx.user.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
      }
      
      await db.updateScenario(input.id, {
        status: 'approved',
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
      });
      
      await auditLog(ctx.user.id, ctx.user.organizationId, 'scenario.approved', 'scenario', input.id);
      return { success: true };
    }),
  
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const scenario = await db.getScenarioById(input.id);
      
      if (!scenario || scenario.organizationId !== ctx.user.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
      }
      
      await db.deleteScenario(input.id);
      await auditLog(ctx.user.id, ctx.user.organizationId, 'scenario.deleted', 'scenario', input.id);
      return { success: true };
    }),
});

// ============================================================================
// ROUTER: Budget Management
// ============================================================================

const budgetRouter = router({
  getLineItems: protectedProcedure
    .input(z.object({ scenarioId: z.number() }))
    .query(async ({ ctx, input }) => {
      const scenario = await db.getScenarioById(input.scenarioId);
      
      if (!scenario || scenario.organizationId !== ctx.user.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
      }
      
      return await db.getBudgetLineItemsByScenario(input.scenarioId);
    }),
  
  createLineItem: managerProcedure
    .input(z.object({
      scenarioId: z.number(),
      accountName: z.string().min(1).max(255),
      accountCode: z.string().max(50).optional(),
      category: z.string().max(100).optional(),
      subCategory: z.string().max(100).optional(),
      period: z.date(),
      amount: z.number(), // Amount in cents
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const scenario = await db.getScenarioById(input.scenarioId);
      
      if (!scenario || scenario.organizationId !== ctx.user.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
      }
      
      const itemId = await db.createBudgetLineItem(input);
      await auditLog(ctx.user.id, ctx.user.organizationId, 'budget.line_item_created', 'budget_line_item', itemId);
      return { id: itemId };
    }),
  
  bulkImport: managerProcedure
    .input(z.object({
      scenarioId: z.number(),
      items: z.array(z.object({
        accountName: z.string(),
        accountCode: z.string().optional(),
        category: z.string().optional(),
        subCategory: z.string().optional(),
        period: z.string(), // ISO date string
        amount: z.number(), // Amount in cents
        notes: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const scenario = await db.getScenarioById(input.scenarioId);
      
      if (!scenario || scenario.organizationId !== ctx.user.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
      }
      
      const createdIds: number[] = [];
      for (const item of input.items) {
        const itemId = await db.createBudgetLineItem({
          scenarioId: input.scenarioId,
          accountName: item.accountName,
          accountCode: item.accountCode,
          category: item.category,
          subCategory: item.subCategory,
          period: new Date(item.period),
          amount: item.amount,
          notes: item.notes,
        });
        createdIds.push(itemId);
      }
      
      await auditLog(
        ctx.user.id, 
        ctx.user.organizationId, 
        'budget.bulk_import', 
        'budget_line_item', 
        input.scenarioId,
        { count: createdIds.length }
      );
      
      return { success: true, count: createdIds.length, ids: createdIds };
    }),
  
  updateLineItem: managerProcedure
    .input(z.object({
      id: z.number(),
      accountName: z.string().optional(),
      category: z.string().optional(),
      period: z.date().optional(),
      amount: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateBudgetLineItem(id, data);
      await auditLog(ctx.user.id, ctx.user.organizationId, 'budget.line_item_updated', 'budget_line_item', id);
      return { success: true };
    }),
  
  deleteLineItem: managerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteBudgetLineItem(input.id);
      await auditLog(ctx.user.id, ctx.user.organizationId, 'budget.line_item_deleted', 'budget_line_item', input.id);
      return { success: true };
    }),
});

// ============================================================================
// ROUTER: Actuals Management
// ============================================================================

const actualsRouter = router({
  list: protectedProcedure
    .input(z.object({
      scenarioId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Note: actuals are organization-wide, scenarioId is ignored for now
      // In a full implementation, you'd filter by scenario if provided
      return await db.getActualsByOrganization(
        ctx.user.organizationId,
        input.startDate,
        input.endDate
      );
    }),
  
  import: managerProcedure
    .input(z.object({
      actuals: z.array(z.object({
        accountName: z.string(),
        accountCode: z.string().optional(),
        category: z.string().optional(),
        period: z.date(),
        amount: z.number(),
        source: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const actuals = input.actuals.map(actual => ({
        organizationId: ctx.user.organizationId,
        importedAt: new Date(),
        ...actual,
      }));
      
      await db.bulkCreateActuals(actuals);
      await auditLog(ctx.user.id, ctx.user.organizationId, 'actuals.imported', undefined, undefined, { count: actuals.length });
      return { success: true, count: actuals.length };
    }),
});

// ============================================================================
// ROUTER: Forecasting with AI
// ============================================================================

const forecastRouter = router({
  list: protectedProcedure
    .input(z.object({
      scenarioId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (input.scenarioId) {
        return await db.getForecastsByScenario(input.scenarioId);
      }
      return await db.getForecastsByOrganization(ctx.user.organizationId);
    }),
  
  generate: managerProcedure
    .input(z.object({
      scenarioId: z.number(),
      periods: z.number().min(1).max(24).default(12),
    }))
    .mutation(async ({ ctx, input }) => {
      const scenario = await db.getScenarioById(input.scenarioId);
      if (!scenario || scenario.organizationId !== ctx.user.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
      }
      
      // Get historical budget data for context
      const historicalData = await db.getBudgetLineItemsByScenario(input.scenarioId);
      const totalBudget = historicalData.reduce((sum, item) => sum + item.amount, 0);
      const avgMonthly = historicalData.length > 0 ? totalBudget / historicalData.length : 0;
      
      // Generate forecasts for multiple periods
      const createdForecasts: number[] = [];
      const startDate = new Date();
      
      for (let i = 0; i < input.periods; i++) {
        const forecastDate = new Date(startDate);
        forecastDate.setMonth(forecastDate.getMonth() + i + 1);
        
        // Simple forecast: use average with some variation
        const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
        const predictedAmount = Math.round(avgMonthly * (1 + variation));
        const confidence = 70 + Math.floor(Math.random() * 20); // 70-90% confidence
        
        const forecastId = await db.createForecast({
          organizationId: ctx.user.organizationId,
          scenarioId: input.scenarioId,
          name: `Forecast for ${forecastDate.toISOString().split('T')[0]}`,
          forecastType: 'comprehensive',
          period: forecastDate,
          predictedAmount,
          confidence,
          methodology: 'Statistical Average',
          aiInsights: JSON.stringify({ avgMonthly, variation, historicalCount: historicalData.length }),
          createdBy: ctx.user.id,
        });
        
        createdForecasts.push(forecastId);
      }
      
      await auditLog(ctx.user.id, ctx.user.organizationId, 'forecast.generated', 'scenario', input.scenarioId, { count: createdForecasts.length });
      return { success: true, count: createdForecasts.length, ids: createdForecasts };
    }),
});

// ============================================================================
// ROUTER: Analytics & Reporting
// ============================================================================

const analyticsRouter = router({
  dashboard: protectedProcedure
    .input(z.object({
      scenarioId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Get budget data
      let budgetItems: any[] = [];
      if (input.scenarioId) {
        const scenario = await db.getScenarioById(input.scenarioId);
        if (scenario && scenario.organizationId === ctx.user.organizationId) {
          budgetItems = await db.getBudgetLineItemsByScenario(input.scenarioId);
        }
      }
      
      // Get actuals
      const actuals = await db.getActualsByOrganization(
        ctx.user.organizationId,
        input.startDate,
        input.endDate
      );
      
      // Calculate KPIs
      const totalBudget = budgetItems.reduce((sum, item) => sum + item.amount, 0);
      const totalActuals = actuals.reduce((sum, item) => sum + item.amount, 0);
      const variance = totalActuals - totalBudget;
      const variancePercent = totalBudget !== 0 ? (variance / totalBudget) * 100 : 0;
      
      return {
        totalBudget,
        totalActuals,
        variance,
        variancePercent,
        budgetItemCount: budgetItems.length,
        actualsCount: actuals.length,
      };
    }),
  
  varianceAnalysis: protectedProcedure
    .input(z.object({
      scenarioId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const scenario = await db.getScenarioById(input.scenarioId);
      if (!scenario || scenario.organizationId !== ctx.user.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
      }
      
      const budgetItems = input.startDate && input.endDate
        ? await db.getBudgetLineItemsByPeriod(input.scenarioId, input.startDate, input.endDate)
        : await db.getBudgetLineItemsByScenario(input.scenarioId);
      
      const actuals = await db.getActualsByOrganization(
        ctx.user.organizationId,
        input.startDate,
        input.endDate
      );
      
      // Group by account and calculate variance
      const varianceByAccount: Record<string, any> = {};
      
      budgetItems.forEach(item => {
        const key = item.accountName;
        if (!varianceByAccount[key]) {
          varianceByAccount[key] = {
            accountName: item.accountName,
            budgeted: 0,
            actual: 0,
            variance: 0,
            variancePercent: 0,
          };
        }
        varianceByAccount[key].budgeted += item.amount;
      });
      
      actuals.forEach(item => {
        const key = item.accountName;
        if (!varianceByAccount[key]) {
          varianceByAccount[key] = {
            accountName: item.accountName,
            budgeted: 0,
            actual: 0,
            variance: 0,
            variancePercent: 0,
          };
        }
        varianceByAccount[key].actual += item.amount;
      });
      
      // Calculate variance
      Object.values(varianceByAccount).forEach((item: any) => {
        item.variance = item.actual - item.budgeted;
        item.variancePercent = item.budgeted !== 0 ? (item.variance / item.budgeted) * 100 : 0;
      });
      
      return Object.values(varianceByAccount);
    }),
});

// ============================================================================
// ROUTER: Saved Reports
// ============================================================================

const reportsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getSavedReportsByOrganization(ctx.user.organizationId);
  }),
  
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const report = await db.getSavedReportById(input.id);
      
      if (!report || report.organizationId !== ctx.user.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Report not found' });
      }
      
      return report;
    }),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      reportType: z.string(),
      configuration: z.string(), // JSON string
      isPublic: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const reportId = await db.createSavedReport({
        organizationId: ctx.user.organizationId,
        createdBy: ctx.user.id,
        ...input,
      });
      
      await auditLog(ctx.user.id, ctx.user.organizationId, 'report.created', 'saved_report', reportId);
      return { id: reportId };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const report = await db.getSavedReportById(input.id);
      
      if (!report || report.organizationId !== ctx.user.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Report not found' });
      }
      
      // Only creator or admin can delete
      if (report.createdBy !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the creator or admin can delete this report' });
      }
      
      await db.deleteSavedReport(input.id);
      await auditLog(ctx.user.id, ctx.user.organizationId, 'report.deleted', 'saved_report', input.id);
      return { success: true };
    }),
});

// ============================================================================
// DONATIONS ROUTER
// ============================================================================

const donationsRouter = router({
  createCheckoutSession: protectedProcedure
    .input(z.object({
      amount: z.number().min(100).max(1000000), // Min $1, max $10,000
    }))
    .mutation(async ({ ctx, input }) => {
      const { url, sessionId } = await createDonationCheckoutSession({
        amount: input.amount,
        userId: ctx.user.id,
      });
      
      await auditLog(
        ctx.user.id,
        ctx.user.organizationId,
        'donation.checkout_created',
        'donation',
        undefined,
        { amount: input.amount, sessionId }
      );
      
      return { url };
    }),
  
  listUserDonations: protectedProcedure
    .query(async ({ ctx }) => {
      return await donationsDb.getUserDonations(ctx.user.id);
    }),
  
  listAllDonations: adminProcedure
    .query(async () => {
      return await donationsDb.getAllDonations();
    }),
});

// ============================================================================
// MAIN APP ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  organization: organizationRouter,
  scenario: scenarioRouter,
  budget: budgetRouter,
  actuals: actualsRouter,
  forecast: forecastRouter,
  analytics: analyticsRouter,
  reports: reportsRouter,
  donations: donationsRouter,
});

export type AppRouter = typeof appRouter;
