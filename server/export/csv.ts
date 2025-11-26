/**
 * CSV Export Utilities
 * 
 * Provides CSV export functionality for budgets, actuals, and variance reports.
 * Available in both open-source and premium versions.
 */

import type { BudgetLineItem, Actual } from '../../drizzle/schema';

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: any[], headers: string[]): string {
  if (data.length === 0) {
    return headers.join(',') + '\n';
  }
  
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle dates
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      
      // Handle numbers
      if (typeof value === 'number') {
        return value.toString();
      }
      
      // Handle strings with commas or quotes
      const stringValue = value.toString();
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Format amount from cents to dollars
 */
function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Export budget line items to CSV
 */
export function exportBudgetToCSV(
  lineItems: BudgetLineItem[],
  scenarioName: string
): { filename: string; content: string } {
  const headers = [
    'Account Name',
    'Account Code',
    'Category',
    'Sub Category',
    'Period',
    'Amount',
    'Notes',
  ];
  
  const data = lineItems.map(item => ({
    'Account Name': item.accountName,
    'Account Code': item.accountCode || '',
    'Category': item.category || '',
    'Sub Category': item.subCategory || '',
    'Period': item.period,
    'Amount': formatAmount(item.amount),
    'Notes': item.notes || '',
  }));
  
  const content = arrayToCSV(data, headers);
  const filename = `budget_${scenarioName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  
  return { filename, content };
}

/**
 * Export actuals to CSV
 */
export function exportActualsToCSV(
  actuals: Actual[],
  startDate: Date,
  endDate: Date
): { filename: string; content: string } {
  const headers = [
    'Account Name',
    'Account Code',
    'Category',
    'Period',
    'Amount',
    'Source',
    'Imported At',
  ];
  
  const data = actuals.map(actual => ({
    'Account Name': actual.accountName,
    'Account Code': actual.accountCode || '',
    'Category': actual.category || '',
    'Period': actual.period,
    'Amount': formatAmount(actual.amount),
    'Source': actual.source || 'Manual Entry',
    'Imported At': actual.importedAt || actual.createdAt,
  }));
  
  const content = arrayToCSV(data, headers);
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  const filename = `actuals_${start}_to_${end}.csv`;
  
  return { filename, content };
}

/**
 * Export variance analysis to CSV
 */
export interface VarianceRow {
  accountName: string;
  category?: string;
  period: Date;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
}

export function exportVarianceToCSV(
  varianceData: VarianceRow[],
  scenarioName: string
): { filename: string; content: string } {
  const headers = [
    'Account Name',
    'Category',
    'Period',
    'Budget',
    'Actual',
    'Variance',
    'Variance %',
  ];
  
  const data = varianceData.map(row => ({
    'Account Name': row.accountName,
    'Category': row.category || '',
    'Period': row.period,
    'Budget': formatAmount(row.budgetAmount),
    'Actual': formatAmount(row.actualAmount),
    'Variance': formatAmount(row.variance),
    'Variance %': row.variancePercent.toFixed(2) + '%',
  }));
  
  const content = arrayToCSV(data, headers);
  const filename = `variance_${scenarioName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  
  return { filename, content };
}

/**
 * Export forecast results to CSV
 */
export interface ForecastRow {
  accountName: string;
  period: Date;
  predictedAmount: number;
  confidence?: number;
  methodology: string;
}

export function exportForecastToCSV(
  forecastData: ForecastRow[],
  forecastName: string
): { filename: string; content: string } {
  const headers = [
    'Account Name',
    'Period',
    'Predicted Amount',
    'Confidence',
    'Methodology',
  ];
  
  const data = forecastData.map(row => ({
    'Account Name': row.accountName,
    'Period': row.period,
    'Predicted Amount': formatAmount(row.predictedAmount),
    'Confidence': row.confidence ? row.confidence + '%' : 'N/A',
    'Methodology': row.methodology,
  }));
  
  const content = arrayToCSV(data, headers);
  const filename = `forecast_${forecastName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  
  return { filename, content };
}

/**
 * Parse CSV string to array of objects
 * Used for importing data
 */
export function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
}

/**
 * Validate CSV structure for budget import
 */
export function validateBudgetCSV(data: Record<string, string>[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredHeaders = ['Account Name', 'Period', 'Amount'];
  
  if (data.length === 0) {
    errors.push('CSV is empty');
    return { valid: false, errors };
  }
  
  const headers = Object.keys(data[0]);
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
  }
  
  // Validate each row
  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because of 0-index and header row
    
    if (!row['Account Name']) {
      errors.push(`Row ${rowNum}: Account Name is required`);
    }
    
    if (!row['Period']) {
      errors.push(`Row ${rowNum}: Period is required`);
    } else {
      const date = new Date(row['Period']);
      if (isNaN(date.getTime())) {
        errors.push(`Row ${rowNum}: Invalid date format for Period`);
      }
    }
    
    if (!row['Amount']) {
      errors.push(`Row ${rowNum}: Amount is required`);
    } else {
      const amount = parseFloat(row['Amount']);
      if (isNaN(amount)) {
        errors.push(`Row ${rowNum}: Invalid number format for Amount`);
      }
    }
  });
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate CSV structure for actuals import
 */
export function validateActualsCSV(data: Record<string, string>[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredHeaders = ['Account Name', 'Period', 'Amount'];
  
  if (data.length === 0) {
    errors.push('CSV is empty');
    return { valid: false, errors };
  }
  
  const headers = Object.keys(data[0]);
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
  }
  
  // Validate each row
  data.forEach((row, index) => {
    const rowNum = index + 2;
    
    if (!row['Account Name']) {
      errors.push(`Row ${rowNum}: Account Name is required`);
    }
    
    if (!row['Period']) {
      errors.push(`Row ${rowNum}: Period is required`);
    } else {
      const date = new Date(row['Period']);
      if (isNaN(date.getTime())) {
        errors.push(`Row ${rowNum}: Invalid date format for Period`);
      }
    }
    
    if (!row['Amount']) {
      errors.push(`Row ${rowNum}: Amount is required`);
    } else {
      const amount = parseFloat(row['Amount']);
      if (isNaN(amount)) {
        errors.push(`Row ${rowNum}: Invalid number format for Amount`);
      }
    }
  });
  
  return { valid: errors.length === 0, errors };
}
