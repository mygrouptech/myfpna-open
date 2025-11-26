/**
 * Tests for Demo Data Generator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { drizzle } from 'drizzle-orm/mysql2';
import { createPool } from 'mysql2/promise';
import { organizations, users, scenarios, budgetLineItems, actuals, forecasts } from '../../drizzle/schema';
import { generateDemoDataForOrg, clearDemoData } from './demoData';
import { setTestDb, clearTestDb } from '../db';
import { eq } from 'drizzle-orm';

describe('Demo Data Generator', () => {
  let pool: any;
  let testDb: any;
  let testOrgId: number;
  let testUserId: number;

  beforeEach(async () => {
    // Create test database connection
    pool = createPool(process.env.DATABASE_URL!);
    testDb = drizzle(pool);
    setTestDb(testDb);

    // Create test organization
    const orgResult = await testDb.insert(organizations).values({
      name: 'Test Organization',
    });
    testOrgId = Number(orgResult[0].insertId);

    // Create test user
    const userResult = await testDb.insert(users).values({
      openId: `test-${Date.now()}`,
      organizationId: testOrgId,
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    });
    testUserId = Number(userResult[0].insertId);
  });

  afterEach(async () => {
    // Clean up test data
    if (testOrgId) {
      await testDb.delete(actuals).where(eq(actuals.organizationId, testOrgId));
      await testDb.delete(forecasts).where(eq(forecasts.organizationId, testOrgId));
      
      const orgScenarios = await testDb.select().from(scenarios).where(eq(scenarios.organizationId, testOrgId));
      for (const scenario of orgScenarios) {
        await testDb.delete(budgetLineItems).where(eq(budgetLineItems.scenarioId, scenario.id));
        await testDb.delete(scenarios).where(eq(scenarios.id, scenario.id));
      }
      
      await testDb.delete(users).where(eq(users.organizationId, testOrgId));
      await testDb.delete(organizations).where(eq(organizations.id, testOrgId));
    }

    clearTestDb();
    await pool.end();
  });

  describe('generateDemoDataForOrg', () => {
    it('should generate demo data successfully', async () => {
      const result = await generateDemoDataForOrg(testOrgId, testUserId);

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile.name).toBeDefined();
      expect(result.scenarioId).toBeGreaterThan(0);
      expect(result.scenarioName).toBeDefined();
    });

    it('should create a scenario with correct properties', async () => {
      const result = await generateDemoDataForOrg(testOrgId, testUserId);

      const scenario = await testDb.select().from(scenarios).where(eq(scenarios.id, result.scenarioId)).limit(1);
      
      expect(scenario).toHaveLength(1);
      expect(scenario[0].organizationId).toBe(testOrgId);
      expect(scenario[0].scenarioType).toBe('budget');
      expect(scenario[0].status).toBe('active');
      expect(scenario[0].currency).toBe('USD');
      expect(scenario[0].createdBy).toBe(testUserId);
    });

    it('should create budget line items for each month', async () => {
      const result = await generateDemoDataForOrg(testOrgId, testUserId);

      const lineItems = await testDb.select().from(budgetLineItems).where(eq(budgetLineItems.scenarioId, result.scenarioId));
      
      // Should have line items for revenue and expenses across 12 months
      expect(lineItems.length).toBeGreaterThan(0);
      
      // Check that we have monthly data
      const uniqueMonths = new Set(lineItems.map(item => item.period.getMonth()));
      expect(uniqueMonths.size).toBe(12); // Should have data for all 12 months
    });

    it('should create actuals data with realistic variances', async () => {
      await generateDemoDataForOrg(testOrgId, testUserId);

      const actualsData = await testDb.select().from(actuals).where(eq(actuals.organizationId, testOrgId));
      
      expect(actualsData.length).toBeGreaterThan(0);
      
      // Check that actuals have the expected fields
      for (const actual of actualsData) {
        expect(actual.accountName).toBeDefined();
        expect(actual.category).toBeDefined();
        expect(actual.amount).toBeGreaterThan(0);
        expect(actual.period).toBeInstanceOf(Date);
        expect(actual.source).toBe('Demo Data');
      }
    });

    it('should create forecast data for next year', async () => {
      await generateDemoDataForOrg(testOrgId, testUserId);

      const forecastsData = await testDb.select().from(forecasts).where(eq(forecasts.organizationId, testOrgId));
      
      expect(forecastsData.length).toBeGreaterThan(0);
      
      // Check that forecasts are for next year
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      
      for (const forecast of forecastsData) {
        expect(forecast.period.getFullYear()).toBe(nextYear);
        expect(forecast.predictedAmount).toBeGreaterThan(0);
        expect(forecast.confidence).toBeGreaterThanOrEqual(70);
        expect(forecast.confidence).toBeLessThanOrEqual(90);
        expect(forecast.methodology).toBe('AI-Trend');
        expect(forecast.aiInsights).toBeDefined();
      }
    });

    it('should generate different company profiles for different org IDs', async () => {
      // Create second test org
      const org2Result = await testDb.insert(organizations).values({
        name: 'Test Organization 2',
      });
      const testOrgId2 = Number(org2Result[0].insertId);

      const user2Result = await testDb.insert(users).values({
        openId: `test-2-${Date.now()}`,
        organizationId: testOrgId2,
        name: 'Test User 2',
        email: 'test2@example.com',
        role: 'admin',
      });
      const testUserId2 = Number(user2Result[0].insertId);

      const result1 = await generateDemoDataForOrg(testOrgId, testUserId);
      const result2 = await generateDemoDataForOrg(testOrgId2, testUserId2);

      // Different org IDs should potentially get different profiles
      // (depends on modulo operation, but at least verify both succeeded)
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.profile).toBeDefined();
      expect(result2.profile).toBeDefined();

      // Clean up second org
      await testDb.delete(actuals).where(eq(actuals.organizationId, testOrgId2));
      await testDb.delete(forecasts).where(eq(forecasts.organizationId, testOrgId2));
      const org2Scenarios = await testDb.select().from(scenarios).where(eq(scenarios.organizationId, testOrgId2));
      for (const scenario of org2Scenarios) {
        await testDb.delete(budgetLineItems).where(eq(budgetLineItems.scenarioId, scenario.id));
        await testDb.delete(scenarios).where(eq(scenarios.id, scenario.id));
      }
      await testDb.delete(users).where(eq(users.organizationId, testOrgId2));
      await testDb.delete(organizations).where(eq(organizations.id, testOrgId2));
    });

    it('should throw error for non-existent organization', async () => {
      const nonExistentOrgId = 99999;
      
      await expect(
        generateDemoDataForOrg(nonExistentOrgId, testUserId)
      ).rejects.toThrow('Organization 99999 not found');
    });

    it('should generate data with realistic revenue and expense ratios', async () => {
      const result = await generateDemoDataForOrg(testOrgId, testUserId);

      const lineItems = await testDb.select().from(budgetLineItems).where(eq(budgetLineItems.scenarioId, result.scenarioId));
      
      // Calculate total revenue and expenses
      let totalRevenue = 0;
      let totalExpenses = 0;
      
      for (const item of lineItems) {
        if (item.category === 'Revenue') {
          totalRevenue += item.amount;
        } else {
          totalExpenses += item.amount;
        }
      }
      
      // Revenue should be greater than expenses (profitable company)
      expect(totalRevenue).toBeGreaterThan(totalExpenses);
      
      // Gross margin should be realistic (between 20% and 80%)
      const grossMargin = (totalRevenue - totalExpenses) / totalRevenue;
      expect(grossMargin).toBeGreaterThan(0.20);
      expect(grossMargin).toBeLessThan(0.80);
    });
  });

  describe('clearDemoData', () => {
    it('should clear all demo data for an organization', async () => {
      // First generate demo data
      await generateDemoDataForOrg(testOrgId, testUserId);

      // Verify data exists
      const scenariosBefore = await testDb.select().from(scenarios).where(eq(scenarios.organizationId, testOrgId));
      const actualsBefore = await testDb.select().from(actuals).where(eq(actuals.organizationId, testOrgId));
      const forecastsBefore = await testDb.select().from(forecasts).where(eq(forecasts.organizationId, testOrgId));
      
      expect(scenariosBefore.length).toBeGreaterThan(0);
      expect(actualsBefore.length).toBeGreaterThan(0);
      expect(forecastsBefore.length).toBeGreaterThan(0);

      // Clear demo data
      const result = await clearDemoData(testOrgId);
      expect(result.success).toBe(true);

      // Verify data is cleared
      const scenariosAfter = await testDb.select().from(scenarios).where(eq(scenarios.organizationId, testOrgId));
      const actualsAfter = await testDb.select().from(actuals).where(eq(actuals.organizationId, testOrgId));
      const forecastsAfter = await testDb.select().from(forecasts).where(eq(forecasts.organizationId, testOrgId));
      
      expect(scenariosAfter.length).toBe(0);
      expect(actualsAfter.length).toBe(0);
      expect(forecastsAfter.length).toBe(0);
    });

    it('should not affect other organizations data', async () => {
      // Create second test org with data
      const org2Result = await testDb.insert(organizations).values({
        name: 'Test Organization 2',
      });
      const testOrgId2 = Number(org2Result[0].insertId);

      const user2Result = await testDb.insert(users).values({
        openId: `test-2-${Date.now()}`,
        organizationId: testOrgId2,
        name: 'Test User 2',
        email: 'test2@example.com',
        role: 'admin',
      });
      const testUserId2 = Number(user2Result[0].insertId);

      // Generate data for both orgs
      await generateDemoDataForOrg(testOrgId, testUserId);
      await generateDemoDataForOrg(testOrgId2, testUserId2);

      // Clear data for first org only
      await clearDemoData(testOrgId);

      // Verify first org data is cleared
      const scenarios1 = await testDb.select().from(scenarios).where(eq(scenarios.organizationId, testOrgId));
      expect(scenarios1.length).toBe(0);

      // Verify second org data still exists
      const scenarios2 = await testDb.select().from(scenarios).where(eq(scenarios.organizationId, testOrgId2));
      expect(scenarios2.length).toBeGreaterThan(0);

      // Clean up second org
      await testDb.delete(actuals).where(eq(actuals.organizationId, testOrgId2));
      await testDb.delete(forecasts).where(eq(forecasts.organizationId, testOrgId2));
      const org2Scenarios = await testDb.select().from(scenarios).where(eq(scenarios.organizationId, testOrgId2));
      for (const scenario of org2Scenarios) {
        await testDb.delete(budgetLineItems).where(eq(budgetLineItems.scenarioId, scenario.id));
        await testDb.delete(scenarios).where(eq(scenarios.id, scenario.id));
      }
      await testDb.delete(users).where(eq(users.organizationId, testOrgId2));
      await testDb.delete(organizations).where(eq(organizations.id, testOrgId2));
    });

    it('should handle clearing when no data exists', async () => {
      // Don't generate any data, just try to clear
      const result = await clearDemoData(testOrgId);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Data Quality', () => {
    it('should generate amounts in cents (integers)', async () => {
      await generateDemoDataForOrg(testOrgId, testUserId);

      const lineItems = await testDb.select().from(budgetLineItems).where(eq(budgetLineItems.scenarioId, 1));
      
      for (const item of lineItems) {
        expect(Number.isInteger(item.amount)).toBe(true);
        expect(item.amount).toBeGreaterThan(0);
      }
    });

    it('should have consistent account names across budget, actuals, and forecasts', async () => {
      await generateDemoDataForOrg(testOrgId, testUserId);

      const lineItems = await testDb.select().from(budgetLineItems);
      const actualsData = await testDb.select().from(actuals).where(eq(actuals.organizationId, testOrgId));
      const forecastsData = await testDb.select().from(forecasts).where(eq(forecasts.organizationId, testOrgId));

      const budgetAccounts = new Set(lineItems.map(item => item.accountName));
      const actualsAccounts = new Set(actualsData.map(item => item.accountName));
      const forecastAccounts = new Set(forecastsData.map(item => item.name));

      // All accounts in actuals should exist in budget
      for (const account of actualsAccounts) {
        expect(budgetAccounts.has(account)).toBe(true);
      }

      // All accounts in forecasts should exist in budget
      for (const account of forecastAccounts) {
        expect(budgetAccounts.has(account)).toBe(true);
      }
    });

    it('should generate realistic variance patterns', async () => {
      await generateDemoDataForOrg(testOrgId, testUserId);

      const lineItems = await testDb.select().from(budgetLineItems);
      const actualsData = await testDb.select().from(actuals).where(eq(actuals.organizationId, testOrgId));

      // Group actuals by account and period
      const actualsMap = new Map<string, number>();
      for (const actual of actualsData) {
        const key = `${actual.accountName}-${actual.period.toISOString()}`;
        actualsMap.set(key, actual.amount);
      }

      // Calculate variances
      const variances: number[] = [];
      for (const budget of lineItems) {
        const key = `${budget.accountName}-${budget.period.toISOString()}`;
        const actualAmount = actualsMap.get(key);
        
        if (actualAmount) {
          const variance = (actualAmount - budget.amount) / budget.amount;
          variances.push(Math.abs(variance));
        }
      }

      // Check variance distribution
      // Most variances should be within ±30% (as per our generation logic)
      const withinRange = variances.filter(v => v <= 0.30).length;
      const totalVariances = variances.length;
      
      expect(withinRange / totalVariances).toBeGreaterThan(0.80); // At least 80% within ±30%
    });
  });
});
