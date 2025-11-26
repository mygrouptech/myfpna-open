/**
 * Unit Tests for AI Forecast Generation
 * 
 * Focused tests for core forecasting logic
 */

import { describe, it, expect } from 'vitest';
import { generateTrendForecast, groupByAccount } from './forecastGeneration';
import { BudgetLineItem, Actual } from '../../drizzle/schema';

describe('Forecast Generation - Core Logic', () => {
  describe('generateTrendForecast', () => {
    it('should generate forecasts based on linear trend', () => {
      const historicalData = [
        {
          period: new Date('2025-01-01'),
          amount: 100000, // $1,000
          accountName: 'Revenue',
          category: 'Income',
        },
        {
          period: new Date('2025-02-01'),
          amount: 110000, // $1,100
          accountName: 'Revenue',
          category: 'Income',
        },
        {
          period: new Date('2025-03-01'),
          amount: 120000, // $1,200
          accountName: 'Revenue',
          category: 'Income',
        },
      ];

      const forecasts = generateTrendForecast(historicalData, 3);

      expect(forecasts).toHaveLength(3);
      expect(forecasts[0].methodology).toBe('trend');
      expect(forecasts[0].predictedAmount).toBeGreaterThan(0);
      expect(forecasts[0].confidenceLow).toBeLessThan(forecasts[0].predictedAmount);
      expect(forecasts[0].confidenceHigh).toBeGreaterThan(forecasts[0].predictedAmount);
    });

    it('should handle stable data (no growth)', () => {
      const historicalData = [
        {
          period: new Date('2025-01-01'),
          amount: 100000,
          accountName: 'Rent',
          category: 'Facilities',
        },
        {
          period: new Date('2025-02-01'),
          amount: 100000,
          accountName: 'Rent',
          category: 'Facilities',
        },
        {
          period: new Date('2025-03-01'),
          amount: 100000,
          accountName: 'Rent',
          category: 'Facilities',
        },
      ];

      const forecasts = generateTrendForecast(historicalData, 2);

      expect(forecasts).toHaveLength(2);
      // Should predict similar amounts for stable data
      expect(forecasts[0].predictedAmount).toBeCloseTo(100000, -3000); // Within $30
    });

    it('should handle declining trend', () => {
      const historicalData = [
        {
          period: new Date('2025-01-01'),
          amount: 120000,
          accountName: 'Marketing',
          category: 'Operating Expenses',
        },
        {
          period: new Date('2025-02-01'),
          amount: 110000,
          accountName: 'Marketing',
          category: 'Operating Expenses',
        },
        {
          period: new Date('2025-03-01'),
          amount: 100000,
          accountName: 'Marketing',
          category: 'Operating Expenses',
        },
      ];

      const forecasts = generateTrendForecast(historicalData, 2);

      expect(forecasts).toHaveLength(2);
      // Should predict declining amounts
      expect(forecasts[0].predictedAmount).toBeLessThan(100000);
    });

    it('should ensure non-negative forecasts', () => {
      const historicalData = [
        {
          period: new Date('2025-01-01'),
          amount: 30000,
          accountName: 'Declining Revenue',
          category: 'Income',
        },
        {
          period: new Date('2025-02-01'),
          amount: 20000,
          accountName: 'Declining Revenue',
          category: 'Income',
        },
        {
          period: new Date('2025-03-01'),
          amount: 10000,
          accountName: 'Declining Revenue',
          category: 'Income',
        },
      ];

      const forecasts = generateTrendForecast(historicalData, 5);

      // Even with declining trend, forecasts should not be negative
      forecasts.forEach(f => {
        expect(f.predictedAmount).toBeGreaterThanOrEqual(0);
        expect(f.confidenceLow).toBeGreaterThanOrEqual(0);
      });
    });

    it('should return empty array for empty historical data', () => {
      const forecasts = generateTrendForecast([], 12);
      expect(forecasts).toEqual([]);
    });

    it('should generate correct number of forecast periods', () => {
      const historicalData = [
        {
          period: new Date('2025-01-01'),
          amount: 100000,
          accountName: 'Test',
          category: 'Test',
        },
        {
          period: new Date('2025-02-01'),
          amount: 105000,
          accountName: 'Test',
          category: 'Test',
        },
      ];

      const forecasts6 = generateTrendForecast(historicalData, 6);
      const forecasts12 = generateTrendForecast(historicalData, 12);

      expect(forecasts6).toHaveLength(6);
      expect(forecasts12).toHaveLength(12);
    });

    it('should generate sequential monthly periods', () => {
      const historicalData = [
        {
          period: new Date('2025-01-01'),
          amount: 100000,
          accountName: 'Test',
          category: 'Test',
        },
        {
          period: new Date('2025-02-01'),
          amount: 105000,
          accountName: 'Test',
          category: 'Test',
        },
      ];

      const forecasts = generateTrendForecast(historicalData, 3);

      // Verify periods are sequential months
      expect(forecasts[0].period.getMonth()).toBe(2); // March (0-indexed)
      expect(forecasts[1].period.getMonth()).toBe(3); // April
      expect(forecasts[2].period.getMonth()).toBe(4); // May
    });
  });

  describe('groupByAccount', () => {
    it('should group budget and actuals by account', () => {
      const budgetItems: BudgetLineItem[] = [
        {
          id: 1,
          scenarioId: 1,
          accountName: 'Salaries',
          accountCode: null,
          category: 'Personnel',
          subCategory: null,
          period: new Date('2025-01-01'),
          amount: 100000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          scenarioId: 1,
          accountName: 'Marketing',
          accountCode: null,
          category: 'Operating Expenses',
          subCategory: null,
          period: new Date('2025-01-01'),
          amount: 50000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const actuals: Actual[] = [];

      const grouped = groupByAccount(budgetItems, actuals);

      expect(grouped.size).toBe(2);
      expect(grouped.has('Salaries')).toBe(true);
      expect(grouped.has('Marketing')).toBe(true);
      expect(grouped.get('Salaries')).toHaveLength(1);
    });

    it('should prefer actuals over budget when both exist', () => {
      const budgetItems: BudgetLineItem[] = [
        {
          id: 1,
          scenarioId: 1,
          accountName: 'Salaries',
          accountCode: null,
          category: 'Personnel',
          subCategory: null,
          period: new Date('2025-01-01'),
          amount: 100000,
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
          amount: 105000, // Actual is different from budget
          source: 'Test',
          importedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const grouped = groupByAccount(budgetItems, actuals);

      expect(grouped.size).toBe(1);
      const salariesData = grouped.get('Salaries');
      expect(salariesData).toHaveLength(1);
      expect(salariesData![0].amount).toBe(105000); // Should use actual, not budget
    });

    it('should sort data by period within each account', () => {
      const budgetItems: BudgetLineItem[] = [
        {
          id: 3,
          scenarioId: 1,
          accountName: 'Rent',
          accountCode: null,
          category: 'Facilities',
          subCategory: null,
          period: new Date('2025-03-01'),
          amount: 100000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 1,
          scenarioId: 1,
          accountName: 'Rent',
          accountCode: null,
          category: 'Facilities',
          subCategory: null,
          period: new Date('2025-01-01'),
          amount: 100000,
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
          amount: 100000,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const actuals: Actual[] = [];

      const grouped = groupByAccount(budgetItems, actuals);
      const rentData = grouped.get('Rent');

      expect(rentData).toHaveLength(3);
      // Should be sorted by period
      expect(rentData![0].period.getMonth()).toBe(0); // January
      expect(rentData![1].period.getMonth()).toBe(1); // February
      expect(rentData![2].period.getMonth()).toBe(2); // March
    });

    it('should handle empty inputs', () => {
      const grouped = groupByAccount([], []);
      expect(grouped.size).toBe(0);
    });
  });
});
