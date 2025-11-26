/**
 * Unit Tests for AI Variance Analysis
 * 
 * Focused tests for core business logic without requiring full database setup
 */

import { describe, it, expect } from 'vitest';
import { calculateVariances, aggregateVariancesByAccount } from './varianceAnalysis';
import { BudgetLineItem, Actual } from '../../drizzle/schema';

describe('Variance Analysis - Core Logic', () => {
  describe('calculateVariances', () => {
    it('should calculate variance correctly when actuals match budget', () => {
      const budgetItems: BudgetLineItem[] = [
        {
          id: 1,
          scenarioId: 1,
          accountName: 'Salaries',
          accountCode: null,
          category: 'Personnel',
          subCategory: null,
          period: new Date('2025-01-01'),
          amount: 100000, // $1,000 in cents
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const actuals: Actual[] = [
        {
          id: 1,
          organizationId: 1,
          accountName: 'Salaries',
          accountCode: null,
          category: 'Personnel',
          period: new Date('2025-01-01'),
          amount: 100000, // $1,000 in cents
          source: 'Test',
          importedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const variances = calculateVariances(budgetItems, actuals);

      expect(variances).toHaveLength(1);
      expect(variances[0].variance).toBe(0);
      expect(variances[0].variancePercent).toBe(0);
    });

    it('should calculate positive variance when actuals exceed budget', () => {
      const budgetItems: BudgetLineItem[] = [
        {
          id: 1,
          scenarioId: 1,
          accountName: 'Marketing',
          accountCode: null,
          category: 'Operating Expenses',
          subCategory: null,
          period: new Date('2025-01-01'),
          amount: 100000, // $1,000
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const actuals: Actual[] = [
        {
          id: 1,
          organizationId: 1,
          accountName: 'Marketing',
          accountCode: null,
          category: 'Operating Expenses',
          period: new Date('2025-01-01'),
          amount: 120000, // $1,200 (20% over budget)
          source: 'Test',
          importedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const variances = calculateVariances(budgetItems, actuals);

      expect(variances).toHaveLength(1);
      expect(variances[0].variance).toBe(20000); // $200 over
      expect(variances[0].variancePercent).toBeCloseTo(20, 1);
    });

    it('should calculate negative variance when actuals are under budget', () => {
      const budgetItems: BudgetLineItem[] = [
        {
          id: 1,
          scenarioId: 1,
          accountName: 'Travel',
          accountCode: null,
          category: 'Operating Expenses',
          subCategory: null,
          period: new Date('2025-01-01'),
          amount: 50000, // $500
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const actuals: Actual[] = [
        {
          id: 1,
          organizationId: 1,
          accountName: 'Travel',
          accountCode: null,
          category: 'Operating Expenses',
          period: new Date('2025-01-01'),
          amount: 40000, // $400 (20% under budget)
          source: 'Test',
          importedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const variances = calculateVariances(budgetItems, actuals);

      expect(variances).toHaveLength(1);
      expect(variances[0].variance).toBe(-10000); // $100 under
      expect(variances[0].variancePercent).toBeCloseTo(-20, 1);
    });

    it('should handle missing actuals (treat as zero)', () => {
      const budgetItems: BudgetLineItem[] = [
        {
          id: 1,
          scenarioId: 1,
          accountName: 'New Project',
          accountCode: null,
          category: 'Projects',
          subCategory: null,
          period: new Date('2025-01-01'),
          amount: 100000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const actuals: Actual[] = []; // No actuals

      const variances = calculateVariances(budgetItems, actuals);

      expect(variances).toHaveLength(1);
      expect(variances[0].actualAmount).toBe(0);
      expect(variances[0].variance).toBe(-100000);
      expect(variances[0].variancePercent).toBe(-100);
    });

    it('should handle multiple periods for the same account', () => {
      const budgetItems: BudgetLineItem[] = [
        {
          id: 1,
          scenarioId: 1,
          accountName: 'Rent',
          accountCode: null,
          category: 'Facilities',
          subCategory: null,
          period: new Date('2025-01-01'),
          amount: 500000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          scenarioId: 1,
          accountName: 'Rent',
          accountCode: null,
          category: 'Facilities',
          subCategory: null,
          period: new Date('2025-02-01'),
          amount: 500000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const actuals: Actual[] = [
        {
          id: 1,
          organizationId: 1,
          accountName: 'Rent',
          accountCode: null,
          category: 'Facilities',
          period: new Date('2025-01-01'),
          amount: 500000,
          source: 'Test',
          importedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          organizationId: 1,
          accountName: 'Rent',
          accountCode: null,
          category: 'Facilities',
          period: new Date('2025-02-01'),
          amount: 510000, // Slightly over in Feb
          source: 'Test',
          importedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const variances = calculateVariances(budgetItems, actuals);

      expect(variances).toHaveLength(2);
      expect(variances[0].variance).toBe(0); // Jan on budget
      expect(variances[1].variance).toBe(10000); // Feb over by $100
    });
  });

  describe('aggregateVariancesByAccount', () => {
    it('should aggregate variances across multiple periods', () => {
      const variances = [
        {
          accountName: 'Salaries',
          category: 'Personnel',
          period: new Date('2025-01-01'),
          budgetAmount: 100000,
          actualAmount: 105000,
          variance: 5000,
          variancePercent: 5,
        },
        {
          accountName: 'Salaries',
          category: 'Personnel',
          period: new Date('2025-02-01'),
          budgetAmount: 100000,
          actualAmount: 110000,
          variance: 10000,
          variancePercent: 10,
        },
      ];

      const aggregated = aggregateVariancesByAccount(variances);

      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].accountName).toBe('Salaries');
      expect(aggregated[0].budgetAmount).toBe(200000); // Sum of both periods
      expect(aggregated[0].actualAmount).toBe(215000); // Sum of both periods
      expect(aggregated[0].variance).toBe(15000); // Sum of variances
      expect(aggregated[0].variancePercent).toBeCloseTo(7.5, 1); // Recalculated percentage
    });

    it('should handle multiple accounts separately', () => {
      const variances = [
        {
          accountName: 'Salaries',
          category: 'Personnel',
          period: new Date('2025-01-01'),
          budgetAmount: 100000,
          actualAmount: 105000,
          variance: 5000,
          variancePercent: 5,
        },
        {
          accountName: 'Marketing',
          category: 'Operating Expenses',
          period: new Date('2025-01-01'),
          budgetAmount: 50000,
          actualAmount: 45000,
          variance: -5000,
          variancePercent: -10,
        },
      ];

      const aggregated = aggregateVariancesByAccount(variances);

      expect(aggregated).toHaveLength(2);
      
      const salaries = aggregated.find(v => v.accountName === 'Salaries');
      const marketing = aggregated.find(v => v.accountName === 'Marketing');
      
      expect(salaries).toBeDefined();
      expect(marketing).toBeDefined();
      expect(salaries!.variance).toBe(5000);
      expect(marketing!.variance).toBe(-5000);
    });

    it('should preserve category information', () => {
      const variances = [
        {
          accountName: 'Cloud Services',
          category: 'Technology',
          period: new Date('2025-01-01'),
          budgetAmount: 100000,
          actualAmount: 120000,
          variance: 20000,
          variancePercent: 20,
        },
      ];

      const aggregated = aggregateVariancesByAccount(variances);

      expect(aggregated[0].category).toBe('Technology');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero budget amounts gracefully', () => {
      const budgetItems: BudgetLineItem[] = [
        {
          id: 1,
          scenarioId: 1,
          accountName: 'Contingency',
          accountCode: null,
          category: 'Reserve',
          subCategory: null,
          period: new Date('2025-01-01'),
          amount: 0,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const actuals: Actual[] = [
        {
          id: 1,
          organizationId: 1,
          accountName: 'Contingency',
          accountCode: null,
          category: 'Reserve',
          period: new Date('2025-01-01'),
          amount: 10000,
          source: 'Test',
          importedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const variances = calculateVariances(budgetItems, actuals);

      expect(variances).toHaveLength(1);
      expect(variances[0].variancePercent).toBe(0); // Avoid division by zero
    });

    it('should handle empty budget and actuals arrays', () => {
      const variances = calculateVariances([], []);
      expect(variances).toEqual([]);
    });

    it('should handle large numbers correctly (no overflow)', () => {
      const budgetItems: BudgetLineItem[] = [
        {
          id: 1,
          scenarioId: 1,
          accountName: 'Revenue',
          accountCode: null,
          category: 'Income',
          subCategory: null,
          period: new Date('2025-01-01'),
          amount: 10000000000, // $100M in cents
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const actuals: Actual[] = [
        {
          id: 1,
          organizationId: 1,
          accountName: 'Revenue',
          accountCode: null,
          category: 'Income',
          period: new Date('2025-01-01'),
          amount: 11000000000, // $110M in cents
          source: 'Test',
          importedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const variances = calculateVariances(budgetItems, actuals);

      expect(variances[0].variance).toBe(1000000000); // $10M variance
      expect(variances[0].variancePercent).toBeCloseTo(10, 1);
    });
  });
});
