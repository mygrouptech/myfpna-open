import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, organizations, InsertOrganization,
  scenarios, InsertScenario, Scenario,
  budgetLineItems, InsertBudgetLineItem, BudgetLineItem,
  actuals, InsertActual, Actual,
  forecasts, InsertForecast, Forecast,
  auditLogs, InsertAuditLog,
  backgroundJobs, InsertBackgroundJob, BackgroundJob,
  savedReports, InsertSavedReport, SavedReport
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _testDb: ReturnType<typeof drizzle> | null = null;

// Set test database (used by tests)
export function setTestDb(db: any) {
  _testDb = db;
}

// Clear test database
export function clearTestDb() {
  _testDb = null;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  // Use test database if set
  if (_testDb) {
    return _testDb;
  }
  
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER & ORGANIZATION MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Get or create organization for the user
    let organizationId = user.organizationId;
    if (!organizationId) {
      // Create a default organization for new users
      const orgName = user.name ? `${user.name}'s Organization` : "Default Organization";
      const orgResult = await db.insert(organizations).values({
        name: orgName,
      });
      organizationId = Number(orgResult[0].insertId);
    }

    const values: InsertUser = {
      openId: user.openId,
      organizationId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrganizationById(orgId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUsersByOrganization(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users).where(eq(users.organizationId, orgId));
}

export async function updateOrganization(orgId: number, data: Partial<InsertOrganization>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(organizations).set(data).where(eq(organizations.id, orgId));
}

// ============================================================================
// SCENARIO MANAGEMENT
// ============================================================================

export async function createScenario(scenario: InsertScenario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(scenarios).values(scenario);
  return Number(result[0].insertId);
}

export async function getScenarioById(scenarioId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(scenarios).where(eq(scenarios.id, scenarioId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getScenariosByOrganization(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(scenarios)
    .where(eq(scenarios.organizationId, orgId))
    .orderBy(desc(scenarios.createdAt));
}

export async function updateScenario(scenarioId: number, data: Partial<InsertScenario>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(scenarios).set(data).where(eq(scenarios.id, scenarioId));
}

export async function deleteScenario(scenarioId: number) {
  const db = await getDb();
  if (!db) return;
  
  // Delete associated budget line items first
  await db.delete(budgetLineItems).where(eq(budgetLineItems.scenarioId, scenarioId));
  // Delete the scenario
  await db.delete(scenarios).where(eq(scenarios.id, scenarioId));
}

// ============================================================================
// BUDGET LINE ITEMS
// ============================================================================

export async function createBudgetLineItem(item: InsertBudgetLineItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(budgetLineItems).values(item);
  return Number(result[0].insertId);
}

export async function getBudgetLineItemsByScenario(scenarioId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(budgetLineItems)
    .where(eq(budgetLineItems.scenarioId, scenarioId))
    .orderBy(budgetLineItems.period, budgetLineItems.accountName);
}

export async function getBudgetLineItemsByPeriod(scenarioId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(budgetLineItems)
    .where(
      and(
        eq(budgetLineItems.scenarioId, scenarioId),
        gte(budgetLineItems.period, startDate),
        lte(budgetLineItems.period, endDate)
      )
    )
    .orderBy(budgetLineItems.period, budgetLineItems.accountName);
}

export async function updateBudgetLineItem(itemId: number, data: Partial<InsertBudgetLineItem>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(budgetLineItems).set(data).where(eq(budgetLineItems.id, itemId));
}

export async function deleteBudgetLineItem(itemId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(budgetLineItems).where(eq(budgetLineItems.id, itemId));
}

export async function bulkCreateBudgetLineItems(items: InsertBudgetLineItem[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (items.length === 0) return;
  await db.insert(budgetLineItems).values(items);
}

// ============================================================================
// ACTUALS MANAGEMENT
// ============================================================================

export async function createActual(actual: InsertActual) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(actuals).values(actual);
  return Number(result[0].insertId);
}

export async function getActualsByOrganization(orgId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(actuals.organizationId, orgId)];
  if (startDate) conditions.push(gte(actuals.period, startDate));
  if (endDate) conditions.push(lte(actuals.period, endDate));
  
  return await db.select().from(actuals)
    .where(and(...conditions))
    .orderBy(actuals.period, actuals.accountName);
}

export async function bulkCreateActuals(actualsList: InsertActual[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (actualsList.length === 0) return;
  await db.insert(actuals).values(actualsList);
}

// ============================================================================
// FORECASTS
// ============================================================================

export async function createForecast(forecast: InsertForecast) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(forecasts).values(forecast);
  return Number(result[0].insertId);
}

export async function getForecastsByOrganization(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(forecasts)
    .where(eq(forecasts.organizationId, orgId))
    .orderBy(desc(forecasts.createdAt));
}

export async function getForecastsByScenario(scenarioId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(forecasts)
    .where(eq(forecasts.scenarioId, scenarioId))
    .orderBy(forecasts.period);
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(auditLogs).values(log);
  } catch (error) {
    console.error("[Audit] Failed to create audit log:", error);
  }
}

export async function getAuditLogsByOrganization(orgId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(auditLogs)
    .where(eq(auditLogs.organizationId, orgId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

// ============================================================================
// BACKGROUND JOBS
// ============================================================================

export async function createBackgroundJob(job: InsertBackgroundJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(backgroundJobs).values(job);
}

export async function getBackgroundJobById(jobId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(backgroundJobs).where(eq(backgroundJobs.id, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBackgroundJob(jobId: string, data: Partial<InsertBackgroundJob>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(backgroundJobs).set(data).where(eq(backgroundJobs.id, jobId));
}

export async function getJobsByUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(backgroundJobs)
    .where(eq(backgroundJobs.userId, userId))
    .orderBy(desc(backgroundJobs.createdAt))
    .limit(limit);
}

// ============================================================================
// SAVED REPORTS
// ============================================================================

export async function createSavedReport(report: InsertSavedReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(savedReports).values(report);
  return Number(result[0].insertId);
}

export async function getSavedReportsByOrganization(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(savedReports)
    .where(eq(savedReports.organizationId, orgId))
    .orderBy(desc(savedReports.createdAt));
}

export async function getSavedReportById(reportId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(savedReports).where(eq(savedReports.id, reportId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteSavedReport(reportId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(savedReports).where(eq(savedReports.id, reportId));
}
