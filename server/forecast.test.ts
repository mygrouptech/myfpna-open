import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(role: 'admin' | 'manager' | 'analyst' | 'viewer' = 'manager'): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    organizationId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Forecast Management", () => {
  it("should list forecasts for organization", async () => {
    const { ctx } = createTestContext('manager');
    const caller = appRouter.createCaller(ctx);

    const forecasts = await caller.forecast.list({});
    
    expect(Array.isArray(forecasts)).toBe(true);
  });

  it("should list forecasts filtered by scenario", async () => {
    const { ctx } = createTestContext('manager');
    const caller = appRouter.createCaller(ctx);

    const forecasts = await caller.forecast.list({ scenarioId: 1 });
    
    expect(Array.isArray(forecasts)).toBe(true);
  });

  it("should generate forecasts for a scenario", async () => {
    const { ctx } = createTestContext('manager');
    const caller = appRouter.createCaller(ctx);

    // First create a scenario
    const scenario = await caller.scenario.create({
      name: "Forecast Test Scenario",
      description: "Testing forecast generation",
      scenarioType: "budget",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    });

    // Add some budget line items for historical data
    await caller.budget.createLineItem({
      scenarioId: scenario.id,
      accountName: "Revenue",
      category: "Sales",
      period: new Date("2024-01-01"),
      amount: 100000, // $1000
    });

    await caller.budget.createLineItem({
      scenarioId: scenario.id,
      accountName: "Revenue",
      category: "Sales",
      period: new Date("2024-02-01"),
      amount: 120000, // $1200
    });

    // Generate forecasts
    const result = await caller.forecast.generate({
      scenarioId: scenario.id,
      periods: 3,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
    expect(result.ids).toHaveLength(3);
  });

  it("should prevent non-managers from generating forecasts", async () => {
    const { ctx } = createTestContext('analyst');
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.forecast.generate({
        scenarioId: 1,
        periods: 6,
      })
    ).rejects.toThrow();
  });
});

describe("Analytics Dashboard", () => {
  it("should return dashboard metrics", async () => {
    const { ctx } = createTestContext('analyst');
    const caller = appRouter.createCaller(ctx);

    const dashboard = await caller.analytics.dashboard({});
    
    expect(dashboard).toBeDefined();
    expect(typeof dashboard.totalBudget).toBe('number');
    expect(typeof dashboard.totalActuals).toBe('number');
    expect(typeof dashboard.variance).toBe('number');
    expect(typeof dashboard.variancePercent).toBe('number');
    expect(typeof dashboard.budgetItemCount).toBe('number');
    expect(typeof dashboard.actualsCount).toBe('number');
  });

  it("should calculate variance correctly", async () => {
    const { ctx } = createTestContext('manager');
    const caller = appRouter.createCaller(ctx);

    // Create test scenario with budget and actuals
    const scenario = await caller.scenario.create({
      name: "Variance Test",
      description: "Testing variance calculation",
      scenarioType: "budget",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    });

    await caller.budget.createLineItem({
      scenarioId: scenario.id,
      accountName: "Test Account",
      category: "Test",
      period: new Date("2024-01-01"),
      amount: 100000, // Budget: $1000
    });

    await caller.actuals.import({
      actuals: [{
        accountName: "Test Account",
        category: "Test",
        period: new Date("2024-01-01"),
        amount: 120000, // Actual: $1200
        source: "Test",
      }],
    });

    const dashboard = await caller.analytics.dashboard({});
    
    // Variance should be positive (over budget)
    expect(dashboard.variance).toBeGreaterThan(0);
  });
});

describe("Budget Bulk Import", () => {
  it("should import multiple budget line items at once", async () => {
    const { ctx } = createTestContext('manager');
    const caller = appRouter.createCaller(ctx);

    const scenario = await caller.scenario.create({
      name: "Bulk Import Test",
      description: "Testing bulk import",
      scenarioType: "budget",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    });

    const result = await caller.budget.bulkImport({
      scenarioId: scenario.id,
      items: [
        {
          accountName: "Revenue - Product A",
          category: "Revenue",
          period: "2024-01-01",
          amount: 50000,
        },
        {
          accountName: "Revenue - Product B",
          category: "Revenue",
          period: "2024-01-01",
          amount: 75000,
        },
        {
          accountName: "Expenses - Marketing",
          category: "Expenses",
          period: "2024-01-01",
          amount: 30000,
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
    expect(result.ids).toHaveLength(3);

    // Verify items were created
    const lineItems = await caller.budget.getLineItems({ scenarioId: scenario.id });
    expect(lineItems.length).toBeGreaterThanOrEqual(3);
  });

  it("should prevent non-managers from bulk importing", async () => {
    const { ctx } = createTestContext('analyst');
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.budget.bulkImport({
        scenarioId: 1,
        items: [{
          accountName: "Test",
          period: "2024-01-01",
          amount: 1000,
        }],
      })
    ).rejects.toThrow();
  });
});

describe("Actuals Management", () => {
  it("should import actuals data", async () => {
    const { ctx } = createTestContext('manager');
    const caller = appRouter.createCaller(ctx);

    const result = await caller.actuals.import({
      actuals: [
        {
          accountName: "Revenue",
          category: "Sales",
          period: new Date("2024-01-01"),
          amount: 150000,
          source: "QuickBooks",
        },
        {
          accountName: "Expenses",
          category: "Marketing",
          period: new Date("2024-01-01"),
          amount: 50000,
          source: "QuickBooks",
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
  });

  it("should list actuals with date filtering", async () => {
    const { ctx } = createTestContext('analyst');
    const caller = appRouter.createCaller(ctx);

    const actuals = await caller.actuals.list({
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    });

    expect(Array.isArray(actuals)).toBe(true);
  });
});
