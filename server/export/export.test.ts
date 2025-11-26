/**
 * Export Functionality Test Suite
 * Tests Excel and CSV export for budgets, actuals, and forecasts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { exportBudgetsToExcel, exportActualsToExcel, exportForecastsToExcel } from './excelExport';
import { exportBudgetsToCSV, exportActualsToCSV, exportForecastsToCSV } from './csvExport';
import type { BudgetExportData, ActualExportData, ForecastExportData, ExportMetadata } from './types';
import ExcelJS from 'exceljs';

describe('Budget Export', () => {
  const sampleBudgets: BudgetExportData[] = [
    {
      scenarioName: 'Q1 2024 Budget',
      accountName: 'Engineering Salaries',
      accountCode: 'ENG-001',
      category: 'Personnel',
      subCategory: 'Engineering',
      period: new Date('2024-01-01'),
      amount: 50000000, // $500,000 in cents
    },
    {
      scenarioName: 'Q1 2024 Budget',
      accountName: 'Marketing Spend',
      accountCode: 'MKT-001',
      category: 'Marketing',
      subCategory: 'Digital',
      period: new Date('2024-01-01'),
      amount: 25000000, // $250,000 in cents
    },
  ];

  const metadata: ExportMetadata = {
    scenarioName: 'Q1 2024 Budget',
    exportDate: new Date('2024-01-15'),
  };

  it('should generate valid Excel file for budgets', async () => {
    const buffer = await exportBudgetsToExcel(sampleBudgets, metadata);
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    
    // Verify it's a valid Excel file by parsing it
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet('Budget Export');
    expect(worksheet).toBeDefined();
    
    // Check header row
    const headerRow = worksheet.getRow(5);
    expect(headerRow.getCell(1).value).toBe('Account Name');
    expect(headerRow.getCell(2).value).toBe('Account Code');
  });

  it('should generate valid CSV for budgets', () => {
    const csv = exportBudgetsToCSV(sampleBudgets, metadata);
    
    expect(csv).toContain('Scenario,Q1 2024 Budget');
    expect(csv).toContain('Account Name,Account Code,Category,Sub-Category,Period,Amount');
    expect(csv).toContain('Engineering Salaries,ENG-001,Personnel,Engineering');
    expect(csv).toContain('500000.00'); // Converted from cents
    expect(csv).toContain('Marketing Spend,MKT-001,Marketing,Digital');
    expect(csv).toContain('250000.00');
  });

  it('should handle empty budget data', async () => {
    const buffer = await exportBudgetsToExcel([], metadata);
    expect(buffer).toBeInstanceOf(Buffer);
    
    const csv = exportBudgetsToCSV([], metadata);
    expect(csv).toContain('Account Name,Account Code');
  });

  it('should handle missing optional fields', async () => {
    const minimalBudget: BudgetExportData[] = [{
      scenarioName: 'Test',
      accountName: 'Test Account',
      period: new Date('2024-01-01'),
      amount: 10000,
    }];
    
    const buffer = await exportBudgetsToExcel(minimalBudget, metadata);
    expect(buffer).toBeInstanceOf(Buffer);
    
    const csv = exportBudgetsToCSV(minimalBudget, metadata);
    expect(csv).toContain('Test Account');
  });

  it('should calculate total correctly', () => {
    const csv = exportBudgetsToCSV(sampleBudgets, metadata);
    expect(csv).toContain('750000.00'); // Total of 500k + 250k
  });
});

describe('Actuals Export', () => {
  const sampleActuals: ActualExportData[] = [
    {
      accountName: 'Revenue',
      accountCode: 'REV-001',
      category: 'Income',
      period: new Date('2024-01-01'),
      amount: 100000000, // $1M in cents
      notes: 'January revenue',
    },
    {
      accountName: 'Expenses',
      accountCode: 'EXP-001',
      category: 'Operating',
      period: new Date('2024-01-01'),
      amount: 60000000, // $600k in cents
    },
  ];

  const metadata: ExportMetadata = {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    exportDate: new Date('2024-01-15'),
  };

  it('should generate valid Excel file for actuals', async () => {
    const buffer = await exportActualsToExcel(sampleActuals, metadata);
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet('Actuals Export');
    expect(worksheet).toBeDefined();
  });

  it('should generate valid CSV for actuals', () => {
    const csv = exportActualsToCSV(sampleActuals, metadata);
    
    expect(csv).toContain('Account Name,Account Code,Category,Period,Amount,Notes');
    expect(csv).toContain('Revenue,REV-001,Income');
    expect(csv).toContain('1000000.00');
    expect(csv).toContain('January revenue');
    expect(csv).toContain('Expenses,EXP-001,Operating');
    expect(csv).toContain('600000.00');
  });

  it('should handle CSV escaping for notes with commas', () => {
    const actualsWithCommas: ActualExportData[] = [{
      accountName: 'Test',
      period: new Date('2024-01-01'),
      amount: 10000,
      notes: 'Note with, comma',
    }];
    
    const csv = exportActualsToCSV(actualsWithCommas, { exportDate: new Date() });
    expect(csv).toContain('"Note with, comma"');
  });

  it('should include date range in metadata', () => {
    const csv = exportActualsToCSV(sampleActuals, metadata);
    expect(csv).toContain('Period,2024-01-01 to 2024-12-31');
  });
});

describe('Forecasts Export', () => {
  const sampleForecasts: ForecastExportData[] = [
    {
      scenarioName: 'Q1 2024 Forecast',
      forecastName: 'Revenue Forecast',
      forecastType: 'revenue',
      period: new Date('2024-02-01'),
      predictedAmount: 120000000, // $1.2M in cents
      confidence: 85,
      methodology: 'AI-GPT4',
    },
    {
      scenarioName: 'Q1 2024 Forecast',
      forecastName: 'Expense Forecast',
      forecastType: 'expense',
      period: new Date('2024-02-01'),
      predictedAmount: 70000000, // $700k in cents
      confidence: 78,
      methodology: 'Linear Regression',
    },
  ];

  const metadata: ExportMetadata = {
    scenarioName: 'Q1 2024 Forecast',
    exportDate: new Date('2024-01-15'),
  };

  it('should generate valid Excel file for forecasts', async () => {
    const buffer = await exportForecastsToExcel(sampleForecasts, metadata);
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet('Forecast Export');
    expect(worksheet).toBeDefined();
  });

  it('should generate valid CSV for forecasts', () => {
    const csv = exportForecastsToCSV(sampleForecasts, metadata);
    
    expect(csv).toContain('Forecast Name,Type,Period,Predicted Amount,Confidence %,Methodology');
    expect(csv).toContain('Revenue Forecast,revenue');
    expect(csv).toContain('1200000.00');
    expect(csv).toContain('85');
    expect(csv).toContain('AI-GPT4');
    expect(csv).toContain('Expense Forecast,expense');
    expect(csv).toContain('700000.00');
    expect(csv).toContain('78');
    expect(csv).toContain('Linear Regression');
  });

  it('should handle missing confidence and methodology', () => {
    const minimalForecast: ForecastExportData[] = [{
      scenarioName: 'Test',
      forecastName: 'Test Forecast',
      forecastType: 'revenue',
      period: new Date('2024-01-01'),
      predictedAmount: 10000,
    }];
    
    const csv = exportForecastsToCSV(minimalForecast, { exportDate: new Date() });
    expect(csv).toContain('Test Forecast');
  });
});

describe('Excel Formatting', () => {
  it('should apply proper number formatting to amounts', async () => {
    const sampleBudgets: BudgetExportData[] = [{
      scenarioName: 'Test',
      accountName: 'Test',
      period: new Date('2024-01-01'),
      amount: 123456789, // $1,234,567.89
    }];
    
    const buffer = await exportBudgetsToExcel(sampleBudgets, { exportDate: new Date() });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet('Budget Export');
    const amountCell = worksheet?.getRow(6).getCell(6);
    
    expect(amountCell?.numFmt).toBe('$#,##0.00');
  });

  it('should apply bold formatting to headers', async () => {
    const buffer = await exportBudgetsToExcel([], { exportDate: new Date() });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet('Budget Export');
    const headerRow = worksheet?.getRow(5);
    
    expect(headerRow?.font?.bold).toBe(true);
  });
});

describe('Large Dataset Performance', () => {
  it('should handle 1000+ budget line items efficiently', async () => {
    const largeBudgetDataset: BudgetExportData[] = Array.from({ length: 1000 }, (_, i) => ({
      scenarioName: 'Large Dataset Test',
      accountName: `Account ${i}`,
      accountCode: `ACC-${i.toString().padStart(4, '0')}`,
      category: `Category ${i % 10}`,
      period: new Date(`2024-${(i % 12) + 1}-01`),
      amount: Math.floor(Math.random() * 10000000),
    }));

    const startTime = Date.now();
    const buffer = await exportBudgetsToExcel(largeBudgetDataset, { exportDate: new Date() });
    const endTime = Date.now();

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should handle 1000+ actuals efficiently', () => {
    const largeActualsDataset: ActualExportData[] = Array.from({ length: 1000 }, (_, i) => ({
      accountName: `Account ${i}`,
      period: new Date(`2024-${(i % 12) + 1}-01`),
      amount: Math.floor(Math.random() * 10000000),
    }));

    const startTime = Date.now();
    const csv = exportActualsToCSV(largeActualsDataset, { exportDate: new Date() });
    const endTime = Date.now();

    expect(csv.length).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(2000); // CSV should be faster
  });
});
