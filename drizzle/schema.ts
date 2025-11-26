import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, uniqueIndex } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * MyFPnA Suite Database Schema
 * 
 * This schema implements a complete FP&A (Financial Planning & Analysis) system
 * with multi-tenancy, role-based access control, and comprehensive financial tracking.
 */

// ============================================================================
// CORE TABLES: Users & Organizations
// ============================================================================

/**
 * Organizations table - Multi-tenant support
 * Each organization is a separate tenant with its own data and subscription
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  subscriptionStatus: mysqlEnum("subscription_status", ["trial", "active", "cancelled", "past_due"]).default("trial"),
  subscriptionTier: mysqlEnum("subscription_tier", ["free", "pro", "enterprise"]).default("free"),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/**
 * Users table - Extended with FP&A roles and organization linkage
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  organizationId: int("organization_id").notNull().default(1),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "manager", "analyst", "viewer"]).default("analyst").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  orgIdx: index("org_idx").on(table.organizationId),
}));

// ============================================================================
// FINANCIAL PLANNING: Scenarios & Budgets
// ============================================================================

/**
 * Scenarios table - Budget scenarios and financial plans
 * Supports multiple scenarios per organization (best case, worst case, etc.)
 */
export const scenarios = mysqlTable("scenarios", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  scenarioType: mysqlEnum("scenario_type", ["budget", "forecast", "actual", "what_if"]).default("budget").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["draft", "active", "archived", "approved"]).default("draft").notNull(),
  createdBy: int("created_by").notNull(),
  approvedBy: int("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("scenario_org_idx").on(table.organizationId),
  statusIdx: index("scenario_status_idx").on(table.status),
}));

/**
 * Budget Line Items - Individual line items for budget scenarios
 * Stores monthly/quarterly financial data at account level
 */
export const budgetLineItems = mysqlTable("budget_line_items", {
  id: int("id").autoincrement().primaryKey(),
  scenarioId: int("scenario_id").notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountCode: varchar("account_code", { length: 50 }),
  category: varchar("category", { length: 100 }),
  subCategory: varchar("sub_category", { length: 100 }),
  period: timestamp("period").notNull(), // Month/quarter start date
  amount: int("amount").notNull(), // Stored in cents to avoid decimal issues
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  scenarioIdx: index("budget_scenario_idx").on(table.scenarioId),
  periodIdx: index("budget_period_idx").on(table.period),
  accountIdx: index("budget_account_idx").on(table.accountName),
}));

// ============================================================================
// ACTUALS & VARIANCE TRACKING
// ============================================================================

/**
 * Actuals table - Actual financial results
 * Used for variance analysis against budgets
 */
export const actuals = mysqlTable("actuals", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountCode: varchar("account_code", { length: 50 }),
  category: varchar("category", { length: 100 }),
  period: timestamp("period").notNull(),
  amount: int("amount").notNull(), // Stored in cents
  source: varchar("source", { length: 100 }), // e.g., "QuickBooks", "Manual Entry", "CSV Import"
  importedAt: timestamp("imported_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("actuals_org_idx").on(table.organizationId),
  periodIdx: index("actuals_period_idx").on(table.period),
  accountIdx: index("actuals_account_idx").on(table.accountName),
}));

// ============================================================================
// FORECASTING & AI
// ============================================================================

/**
 * Forecasts table - AI-powered forecasts and predictions
 */
export const forecasts = mysqlTable("forecasts", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  scenarioId: int("scenario_id"),
  name: varchar("name", { length: 255 }).notNull(),
  forecastType: mysqlEnum("forecast_type", ["revenue", "expense", "cash_flow", "comprehensive"]).notNull(),
  period: timestamp("period").notNull(),
  predictedAmount: int("predicted_amount").notNull(), // Stored in cents
  confidence: int("confidence"), // 0-100 percentage
  methodology: varchar("methodology", { length: 100 }), // e.g., "AI-GPT4", "Linear Regression", "Manual"
  aiInsights: text("ai_insights"), // JSON string with AI analysis
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("forecast_org_idx").on(table.organizationId),
  scenarioIdx: index("forecast_scenario_idx").on(table.scenarioId),
}));

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

/**
 * Background Jobs table - Track async report generation and data processing
 */
export const backgroundJobs = mysqlTable("background_jobs", {
  id: varchar("id", { length: 255 }).primaryKey(), // Celery/Bull task ID
  userId: int("user_id").notNull(),
  organizationId: int("organization_id").notNull(),
  jobType: varchar("job_type", { length: 100 }).notNull(), // e.g., "report_generation", "data_import"
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  progress: int("progress").default(0), // 0-100 percentage
  resultUrl: varchar("result_url", { length: 512 }), // S3 URL for downloadable results
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON string with job-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("job_user_idx").on(table.userId),
  statusIdx: index("job_status_idx").on(table.status),
}));

/**
 * Audit Logs table - Security and compliance tracking
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  organizationId: int("organization_id").notNull(),
  action: varchar("action", { length: 255 }).notNull(), // e.g., "user.login", "budget.create", "scenario.approve"
  entityType: varchar("entity_type", { length: 100 }), // e.g., "scenario", "budget", "user"
  entityId: int("entity_id"),
  details: text("details"), // JSON string with action details
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("audit_user_idx").on(table.userId),
  orgIdx: index("audit_org_idx").on(table.organizationId),
  actionIdx: index("audit_action_idx").on(table.action),
  createdIdx: index("audit_created_idx").on(table.createdAt),
}));

// ============================================================================
// SAVED REPORTS & DASHBOARDS
// ============================================================================

/**
 * Saved Reports table - User-defined custom reports
 */
export const savedReports = mysqlTable("saved_reports", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  createdBy: int("created_by").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  reportType: varchar("report_type", { length: 100 }).notNull(), // e.g., "variance", "forecast", "kpi_dashboard"
  configuration: text("configuration").notNull(), // JSON string with report config
  isPublic: boolean("is_public").default(false).notNull(), // Share within organization
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("report_org_idx").on(table.organizationId),
  createdByIdx: index("report_creator_idx").on(table.createdBy),
}));

// ============================================================================
// DONATIONS
// ============================================================================

/**
 * Donations table - Track user donations for platform support
 */
export const donations = mysqlTable("donations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"), // Nullable to allow anonymous donations
  amount: int("amount").notNull(), // Amount in cents (e.g., 1000 = $10.00)
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }).unique().notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("donation_user_idx").on(table.userId),
  sessionIdx: index("donation_session_idx").on(table.stripeSessionId),
  createdIdx: index("donation_created_idx").on(table.createdAt),
}));

export type Donation = typeof donations.$inferSelect;
export type InsertDonation = typeof donations.$inferInsert;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;

export type BudgetLineItem = typeof budgetLineItems.$inferSelect;
export type InsertBudgetLineItem = typeof budgetLineItems.$inferInsert;

export type Actual = typeof actuals.$inferSelect;
export type InsertActual = typeof actuals.$inferInsert;

export type Forecast = typeof forecasts.$inferSelect;
export type InsertForecast = typeof forecasts.$inferInsert;

export type BackgroundJob = typeof backgroundJobs.$inferSelect;
export type InsertBackgroundJob = typeof backgroundJobs.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type SavedReport = typeof savedReports.$inferSelect;
export type InsertSavedReport = typeof savedReports.$inferInsert;

// ============================================================================
// PREMIUM FEATURES
// ============================================================================

/**
 * Feature Flags table - Control feature access per organization/user
 */
export const featureFlags = mysqlTable("feature_flags", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  userId: int("user_id"), // Nullable for org-level flags
  featureKey: varchar("feature_key", { length: 100 }).notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("feature_flags_org_idx").on(table.organizationId),
  userIdx: index("feature_flags_user_idx").on(table.userId),
  keyIdx: index("feature_flags_key_idx").on(table.featureKey),
  uniqueKey: index("feature_flags_unique").on(table.organizationId, table.userId, table.featureKey),
}));

/**
 * AI Usage table - Track AI feature usage and costs
 */
export const aiUsage = mysqlTable("ai_usage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  organizationId: int("organization_id").notNull(),
  feature: varchar("feature", { length: 50 }).notNull(), // ai_forecast, ai_commentary, ai_anomaly_detection
  model: varchar("model", { length: 50 }), // gpt-4, claude, manus-forge
  tokensUsed: int("tokens_used"),
  costCents: int("cost_cents"), // Cost in cents
  success: boolean("success").default(true).notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("ai_usage_user_idx").on(table.userId),
  orgIdx: index("ai_usage_org_idx").on(table.organizationId),
  featureIdx: index("ai_usage_feature_idx").on(table.feature),
  createdIdx: index("ai_usage_created_idx").on(table.createdAt),
}));

/**
 * Anomalies table - Track detected financial anomalies
 */
export const anomalies = mysqlTable("anomalies", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  actualId: int("actual_id").notNull(),
  anomalyType: varchar("anomaly_type", { length: 50 }).notNull(), // outlier, trend_break, unusual_pattern, budget_overrun
  severity: mysqlEnum("severity", ["low", "medium", "high"]).notNull(),
  description: text("description").notNull(),
  confidence: int("confidence").notNull(), // 0-100 percentage
  metadata: text("metadata"), // JSON metadata
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  status: mysqlEnum("status", ["new", "reviewed", "false_positive", "confirmed"]).default("new").notNull(),
}, (table) => ({
  orgIdx: index("anomalies_org_idx").on(table.organizationId),
  actualIdx: index("anomalies_actual_idx").on(table.actualId),
  statusIdx: index("anomalies_status_idx").on(table.status),
  severityIdx: index("anomalies_severity_idx").on(table.severity),
}));

/**
 * Saved Commentaries table - Store AI-generated commentaries
 */
export const savedCommentaries = mysqlTable("saved_commentaries", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organization_id").notNull(),
  userId: int("user_id").notNull(),
  reportType: varchar("report_type", { length: 50 }).notNull(), // variance, forecast, kpi
  entityId: int("entity_id"), // Related scenario or forecast ID
  executiveSummary: text("executive_summary").notNull(),
  keyInsights: text("key_insights").notNull(), // JSON array
  recommendations: text("recommendations").notNull(), // JSON array
  riskFactors: text("risk_factors"), // JSON array
  opportunities: text("opportunities"), // JSON array
  model: varchar("model", { length: 50 }).notNull(),
  confidence: int("confidence").notNull(),
  status: mysqlEnum("status", ["draft", "reviewed", "approved", "published"]).default("draft").notNull(),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orgIdx: index("commentaries_org_idx").on(table.organizationId),
  userIdx: index("commentaries_user_idx").on(table.userId),
  typeIdx: index("commentaries_type_idx").on(table.reportType),
  statusIdx: index("commentaries_status_idx").on(table.status),
}));

/**
 * Export Jobs table - Track async export generation
 */
export const exportJobs = mysqlTable("export_jobs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: int("user_id").notNull(),
  organizationId: int("organization_id").notNull(),
  exportType: varchar("export_type", { length: 50 }).notNull(), // csv, excel, pdf
  reportType: varchar("report_type", { length: 50 }).notNull(), // budget, actuals, variance, forecast
  entityId: int("entity_id"), // Related scenario or forecast ID
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  progress: int("progress").default(0).notNull(), // 0-100 percentage
  fileUrl: varchar("file_url", { length: 512 }), // S3 URL or local path
  fileSize: int("file_size"), // File size in bytes
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  userIdx: index("export_jobs_user_idx").on(table.userId),
  orgIdx: index("export_jobs_org_idx").on(table.organizationId),
  statusIdx: index("export_jobs_status_idx").on(table.status),
}));

// ============================================================================
// TYPE EXPORTS FOR NEW TABLES
// ============================================================================

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;

export type AIUsage = typeof aiUsage.$inferSelect;
export type InsertAIUsage = typeof aiUsage.$inferInsert;

export type Anomaly = typeof anomalies.$inferSelect;
export type InsertAnomaly = typeof anomalies.$inferInsert;

export type SavedCommentary = typeof savedCommentaries.$inferSelect;
export type InsertSavedCommentary = typeof savedCommentaries.$inferInsert;

export type ExportJob = typeof exportJobs.$inferSelect;
export type InsertExportJob = typeof exportJobs.$inferInsert;
