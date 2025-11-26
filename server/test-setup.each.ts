/**
 * Per-Test Setup
 * 
 * This runs before each test to ensure a clean database state.
 * Only runs if Docker is available.
 */

import { beforeEach } from "vitest";
import { sql } from "drizzle-orm";

/**
 * Clean database before each test
 */
beforeEach(async (context) => {
  // Skip if Docker not available
  if (!globalThis.dockerAvailable) {
    context.skip();
    return;
  }

  const db = globalThis.testDb;
  
  if (!db) {
    throw new Error("[Test] Test database not available");
  }

  // Disable foreign key checks
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

  // Clear all tables
  const tables = [
    'export_jobs',
    'saved_commentaries', 
    'anomalies',
    'ai_usage',
    'feature_flags',
    'saved_reports',
    'background_jobs',
    'audit_logs',
    'forecasts',
    'actuals',
    'budget_line_items',
    'scenarios',
    'users',
    'organizations'
  ];

  for (const table of tables) {
    await db.execute(sql.raw(`TRUNCATE TABLE ${table}`));
  }

  // Re-enable foreign key checks
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);

  // Seed basic test data
  await seedTestData(db);
});

/**
 * Seed basic test data for all tests
 */
async function seedTestData(db: any) {
  const now = new Date();

  // Create test organization
  await db.execute(sql`
    INSERT INTO organizations (id, name, created_at, updated_at)
    VALUES (1, 'Test Organization', ${now}, ${now})
  `);

  // Create test users with different roles
  await db.execute(sql`
    INSERT INTO users (id, openId, organization_id, email, name, loginMethod, role, is_active, createdAt, updatedAt, lastSignedIn)
    VALUES 
      (1, 'test-admin', 1, 'admin@test.com', 'Admin User', 'manus', 'admin', 1, ${now}, ${now}, ${now}),
      (2, 'test-manager', 1, 'manager@test.com', 'Manager User', 'manus', 'manager', 1, ${now}, ${now}, ${now}),
      (3, 'test-analyst', 1, 'analyst@test.com', 'Analyst User', 'manus', 'analyst', 1, ${now}, ${now}, ${now}),
      (4, 'test-viewer', 1, 'viewer@test.com', 'Viewer User', 'manus', 'viewer', 1, ${now}, ${now}, ${now})
  `);
}
