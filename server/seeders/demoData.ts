/**
 * Demo Data Generator for MyFPnA Premium
 * 
 * Generates realistic financial scenarios for demonstration purposes
 * Based on industry benchmarks and real company financial patterns
 */

import { getDb } from '../db';
import { organizations, scenarios, budgetLineItems, actuals, forecasts } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// Company profile templates based on research
const COMPANY_PROFILES = [
  {
    name: 'TechCorp Solutions',
    industry: 'Technology SaaS',
    annualRevenue: 50_000_000, // $50M
    growthRate: 0.30, // 30% YoY
    grossMargin: 0.78, // 78%
    employees: 200,
    description: 'Cloud-based enterprise software company',
  },
  {
    name: 'RetailMart Inc',
    industry: 'Retail',
    annualRevenue: 500_000_000, // $500M
    growthRate: 0.05, // 5% YoY
    grossMargin: 0.32, // 32%
    employees: 5000,
    description: 'Multi-location retail chain',
  },
  {
    name: 'ManuFab Industries',
    industry: 'Manufacturing',
    annualRevenue: 200_000_000, // $200M
    growthRate: 0.08, // 8% YoY
    grossMargin: 0.38, // 38%
    employees: 1000,
    description: 'Industrial equipment manufacturer',
  },
  {
    name: 'HealthPlus Services',
    industry: 'Healthcare',
    annualRevenue: 150_000_000, // $150M
    growthRate: 0.12, // 12% YoY
    grossMargin: 0.42, // 42%
    employees: 800,
    description: 'Healthcare services provider',
  },
  {
    name: 'FinServe Group',
    industry: 'Financial Services',
    annualRevenue: 80_000_000, // $80M
    growthRate: 0.15, // 15% YoY
    grossMargin: 0.65, // 65% (net margin ~28%)
    employees: 350,
    description: 'Financial advisory and wealth management',
  },
];

// Budget line item templates by industry
const LINE_ITEM_TEMPLATES = {
  'Technology SaaS': {
    revenue: [
      { name: 'Subscription Revenue', category: 'Revenue', percentage: 0.85 },
      { name: 'Professional Services', category: 'Revenue', percentage: 0.12 },
      { name: 'Other Revenue', category: 'Revenue', percentage: 0.03 },
    ],
    expenses: [
      { name: 'Cost of Revenue', category: 'COGS', percentage: 0.22 },
      { name: 'Sales & Marketing', category: 'Operating Expenses', percentage: 0.45 },
      { name: 'Research & Development', category: 'Operating Expenses', percentage: 0.20 },
      { name: 'General & Administrative', category: 'Operating Expenses', percentage: 0.12 },
      { name: 'Depreciation & Amortization', category: 'Operating Expenses', percentage: 0.03 },
    ],
  },
  'Retail': {
    revenue: [
      { name: 'Product Sales', category: 'Revenue', percentage: 0.92 },
      { name: 'Services Revenue', category: 'Revenue', percentage: 0.05 },
      { name: 'Other Income', category: 'Revenue', percentage: 0.03 },
    ],
    expenses: [
      { name: 'Cost of Goods Sold', category: 'COGS', percentage: 0.68 },
      { name: 'Store Operations', category: 'Operating Expenses', percentage: 0.15 },
      { name: 'Marketing & Advertising', category: 'Operating Expenses', percentage: 0.08 },
      { name: 'General & Administrative', category: 'Operating Expenses', percentage: 0.06 },
      { name: 'Depreciation', category: 'Operating Expenses', percentage: 0.02 },
    ],
  },
  'Manufacturing': {
    revenue: [
      { name: 'Product Sales', category: 'Revenue', percentage: 0.88 },
      { name: 'Maintenance Services', category: 'Revenue', percentage: 0.10 },
      { name: 'Other Revenue', category: 'Revenue', percentage: 0.02 },
    ],
    expenses: [
      { name: 'Raw Materials', category: 'COGS', percentage: 0.42 },
      { name: 'Direct Labor', category: 'COGS', percentage: 0.20 },
      { name: 'Manufacturing Overhead', category: 'Operating Expenses', percentage: 0.15 },
      { name: 'Sales & Marketing', category: 'Operating Expenses', percentage: 0.08 },
      { name: 'R&D', category: 'Operating Expenses', percentage: 0.05 },
      { name: 'General & Administrative', category: 'Operating Expenses', percentage: 0.08 },
    ],
  },
  'Healthcare': {
    revenue: [
      { name: 'Patient Services', category: 'Revenue', percentage: 0.75 },
      { name: 'Insurance Reimbursements', category: 'Revenue', percentage: 0.20 },
      { name: 'Other Revenue', category: 'Revenue', percentage: 0.05 },
    ],
    expenses: [
      { name: 'Medical Supplies', category: 'COGS', percentage: 0.28 },
      { name: 'Staff Salaries & Benefits', category: 'COGS', percentage: 0.30 },
      { name: 'Facility Operations', category: 'Operating Expenses', percentage: 0.18 },
      { name: 'Administrative', category: 'Operating Expenses', percentage: 0.12 },
      { name: 'Marketing', category: 'Operating Expenses', percentage: 0.04 },
      { name: 'Depreciation', category: 'Operating Expenses', percentage: 0.03 },
    ],
  },
  'Financial Services': {
    revenue: [
      { name: 'Advisory Fees', category: 'Revenue', percentage: 0.60 },
      { name: 'Asset Management Fees', category: 'Revenue', percentage: 0.30 },
      { name: 'Other Fees & Commissions', category: 'Revenue', percentage: 0.10 },
    ],
    expenses: [
      { name: 'Compensation & Benefits', category: 'Operating Expenses', percentage: 0.45 },
      { name: 'Technology & Data', category: 'Operating Expenses', percentage: 0.12 },
      { name: 'Marketing & Business Development', category: 'Operating Expenses', percentage: 0.10 },
      { name: 'Compliance & Legal', category: 'Operating Expenses', percentage: 0.08 },
      { name: 'General & Administrative', category: 'Operating Expenses', percentage: 0.10 },
    ],
  },
};

// Generate realistic variance (budget vs actuals)
function generateVariance(): number {
  const rand = Math.random();
  
  // 70% within ±5%
  if (rand < 0.70) {
    return (Math.random() * 10 - 5) / 100; // -5% to +5%
  }
  
  // 20% within ±5-15%
  if (rand < 0.90) {
    const sign = Math.random() < 0.5 ? -1 : 1;
    return sign * (5 + Math.random() * 10) / 100; // -15% to -5% or +5% to +15%
  }
  
  // 10% outliers >15%
  const sign = Math.random() < 0.5 ? -1 : 1;
  return sign * (15 + Math.random() * 15) / 100; // -30% to -15% or +15% to +30%
}

// Generate monthly amounts with seasonality
function generateMonthlyAmounts(annualAmount: number, hasSeasonality: boolean = true): number[] {
  const baseMonthly = annualAmount / 12;
  const months: number[] = [];
  
  // Seasonality factors (Q4 typically highest for many businesses)
  const seasonalityFactors = hasSeasonality
    ? [0.85, 0.80, 0.90, 0.95, 0.95, 1.00, 1.00, 1.05, 1.05, 1.10, 1.15, 1.20]
    : Array(12).fill(1.0);
  
  for (let i = 0; i < 12; i++) {
    months.push(Math.round(baseMonthly * seasonalityFactors[i]));
  }
  
  return months;
}

/**
 * Generate demo data for a specific organization
 */
export async function generateDemoDataForOrg(organizationId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }
  
  console.log(`[DemoData] Generating demo data for organization ${organizationId}...`);
  
  // Get organization details
  const orgResults = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1);
  const org = orgResults[0];
  
  if (!org) {
    throw new Error(`Organization ${organizationId} not found`);
  }
  
  // Select a company profile (cycle through profiles based on org ID)
  const profileIndex = organizationId % COMPANY_PROFILES.length;
  const profile = COMPANY_PROFILES[profileIndex];
  
  console.log(`[DemoData] Using profile: ${profile.name} (${profile.industry})`);
  
  // Create scenario: Annual Operating Plan (AOP)
  const currentYear = new Date().getFullYear();
  const scenarioData = {
    organizationId,
    name: `${currentYear} Annual Operating Plan - ${profile.name}`,
    description: `Annual budget for ${profile.name}, a ${profile.industry} company with ${profile.employees} employees and $${(profile.annualRevenue / 1_000_000).toFixed(0)}M in annual revenue.`,
    scenarioType: 'budget' as const,
    status: 'active' as const,
    currency: 'USD',
    startDate: new Date(`${currentYear}-01-01`),
    endDate: new Date(`${currentYear}-12-31`),
    createdBy: userId,
  };
  
  const scenarioResult = await db.insert(scenarios).values(scenarioData);
  const scenarioId = Number(scenarioResult[0].insertId);
  console.log(`[DemoData] Created scenario ID: ${scenarioId}`);
  
  // Get line item templates for this industry
  const templates = LINE_ITEM_TEMPLATES[profile.industry as keyof typeof LINE_ITEM_TEMPLATES];
  
  // Generate revenue line items
  for (const template of templates.revenue) {
    const annualAmount = Math.round(profile.annualRevenue * template.percentage);
    const monthlyAmounts = generateMonthlyAmounts(annualAmount, true);
    
    // Create budget line items (one per month)
    for (let month = 0; month < 12; month++) {
      const period = new Date(currentYear, month, 1);
      
      await db.insert(budgetLineItems).values({
        scenarioId,
        accountName: template.name,
        category: template.category,
        period,
        amount: monthlyAmounts[month],
      });
    }
    
    // Generate actuals with variance
    const variance = generateVariance();
    const actualAnnual = Math.round(annualAmount * (1 + variance));
    const actualMonthly = generateMonthlyAmounts(actualAnnual, true);
    
    for (let month = 0; month < 12; month++) {
      const period = new Date(currentYear, month, 1);
      
      await db.insert(actuals).values({
        organizationId,
        accountName: template.name,
        category: template.category,
        period,
        amount: actualMonthly[month],
        source: 'Demo Data',
      });
    }
    
    // Generate forecast for next year
    const forecastGrowth = profile.growthRate;
    const forecastAnnual = Math.round(annualAmount * (1 + forecastGrowth));
    const forecastMonthly = generateMonthlyAmounts(forecastAnnual, true);
    
    for (let month = 0; month < 12; month++) {
      const period = new Date(currentYear + 1, month, 1);
      
      await db.insert(forecasts).values({
        organizationId,
        scenarioId,
        name: template.name,
        forecastType: 'revenue',
        period,
        predictedAmount: forecastMonthly[month],
        confidence: Math.round(75 + Math.random() * 15), // 75-90% confidence
        methodology: 'AI-Trend',
        aiInsights: JSON.stringify({
          growthRate: (forecastGrowth * 100).toFixed(1) + '%',
          seasonality: 'Q4 typically strongest',
          confidence: 'High',
        }),
        createdBy: userId,
      });
    }
  }
  
  // Generate expense line items
  for (const template of templates.expenses) {
    const annualAmount = Math.round(profile.annualRevenue * template.percentage);
    const monthlyAmounts = generateMonthlyAmounts(annualAmount, template.category === 'COGS');
    
    // Create budget line items (one per month)
    for (let month = 0; month < 12; month++) {
      const period = new Date(currentYear, month, 1);
      
      await db.insert(budgetLineItems).values({
        scenarioId,
        accountName: template.name,
        category: template.category,
        period,
        amount: monthlyAmounts[month],
      });
    }
    
    // Generate actuals with variance
    const variance = generateVariance();
    const actualAnnual = Math.round(annualAmount * (1 + variance));
    const actualMonthly = generateMonthlyAmounts(actualAnnual, template.category === 'COGS');
    
    for (let month = 0; month < 12; month++) {
      const period = new Date(currentYear, month, 1);
      
      await db.insert(actuals).values({
        organizationId,
        accountName: template.name,
        category: template.category,
        period,
        amount: actualMonthly[month],
        source: 'Demo Data',
      });
    }
    
    // Generate forecast for next year
    const forecastGrowth = template.category === 'COGS' ? profile.growthRate : profile.growthRate * 0.8; // Expenses grow slower
    const forecastAnnual = Math.round(annualAmount * (1 + forecastGrowth));
    const forecastMonthly = generateMonthlyAmounts(forecastAnnual, template.category === 'COGS');
    
    for (let month = 0; month < 12; month++) {
      const period = new Date(currentYear + 1, month, 1);
      
      await db.insert(forecasts).values({
        organizationId,
        scenarioId,
        name: template.name,
        forecastType: 'expense',
        period,
        predictedAmount: forecastMonthly[month],
        confidence: Math.round(70 + Math.random() * 20), // 70-90% confidence
        methodology: 'AI-Trend',
        aiInsights: JSON.stringify({
          growthRate: (forecastGrowth * 100).toFixed(1) + '%',
          efficiency: 'Operational improvements expected',
          confidence: 'Medium-High',
        }),
        createdBy: userId,
      });
    }
  }
  
  console.log(`[DemoData] Demo data generation complete for ${profile.name}`);
  
  return {
    success: true,
    profile,
    scenarioId,
    scenarioName: scenarioData.name,
  };
}

/**
 * Clear all demo data for an organization
 */
export async function clearDemoData(organizationId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection not available');
  }
  
  console.log(`[DemoData] Clearing demo data for organization ${organizationId}...`);
  
  // Get all scenarios for this organization
  const orgScenarios = await db.select().from(scenarios).where(eq(scenarios.organizationId, organizationId));
  
  for (const scenario of orgScenarios) {
    // Delete budget line items
    await db.delete(budgetLineItems).where(eq(budgetLineItems.scenarioId, scenario.id));
    
    // Delete forecasts
    await db.delete(forecasts).where(eq(forecasts.scenarioId, scenario.id));
    
    // Delete scenario
    await db.delete(scenarios).where(eq(scenarios.id, scenario.id));
  }
  
  // Delete actuals
  await db.delete(actuals).where(eq(actuals.organizationId, organizationId));
  
  console.log(`[DemoData] Demo data cleared for organization ${organizationId}`);
  
  return { success: true };
}
