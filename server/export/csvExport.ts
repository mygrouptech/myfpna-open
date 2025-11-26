/**
 * CSV Export Service
 * Generates CSV files with proper escaping
 */

import type { BudgetExportData, ActualExportData, ForecastExportData, ExportMetadata } from './types';

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSV(value: string | number | undefined): string {
  if (value === undefined || value === null) {
    return '';
  }
  
  const str = String(value);
  
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Export budgets to CSV format
 */
export function exportBudgetsToCSV(
  budgets: BudgetExportData[],
  metadata: ExportMetadata
): string {
  const rows: string[] = [];
  
  // Add metadata section
  if (metadata.scenarioName) {
    rows.push(`Scenario,${escapeCSV(metadata.scenarioName)}`);
  }
  if (metadata.organizationName) {
    rows.push(`Organization,${escapeCSV(metadata.organizationName)}`);
  }
  rows.push(`Export Date,${metadata.exportDate.toISOString().split('T')[0]}`);
  rows.push(''); // Empty row
  
  // Add headers
  rows.push('Account Name,Account Code,Category,Sub-Category,Period,Amount');
  
  // Add data rows
  budgets.forEach(budget => {
    rows.push([
      escapeCSV(budget.accountName),
      escapeCSV(budget.accountCode),
      escapeCSV(budget.category),
      escapeCSV(budget.subCategory),
      budget.period.toISOString().split('T')[0],
      (budget.amount / 100).toFixed(2) // Convert cents to dollars
    ].join(','));
  });
  
  // Add total row
  if (budgets.length > 0) {
    const total = budgets.reduce((sum, b) => sum + b.amount, 0) / 100;
    rows.push(`,,,,Total,${total.toFixed(2)}`);
  }
  
  return rows.join('\n');
}

/**
 * Export actuals to CSV format
 */
export function exportActualsToCSV(
  actuals: ActualExportData[],
  metadata: ExportMetadata
): string {
  const rows: string[] = [];
  
  // Add metadata section
  if (metadata.organizationName) {
    rows.push(`Organization,${escapeCSV(metadata.organizationName)}`);
  }
  if (metadata.startDate && metadata.endDate) {
    rows.push(`Period,${metadata.startDate.toISOString().split('T')[0]} to ${metadata.endDate.toISOString().split('T')[0]}`);
  }
  rows.push(`Export Date,${metadata.exportDate.toISOString().split('T')[0]}`);
  rows.push(''); // Empty row
  
  // Add headers
  rows.push('Account Name,Account Code,Category,Period,Amount,Notes');
  
  // Add data rows
  actuals.forEach(actual => {
    rows.push([
      escapeCSV(actual.accountName),
      escapeCSV(actual.accountCode),
      escapeCSV(actual.category),
      actual.period.toISOString().split('T')[0],
      (actual.amount / 100).toFixed(2), // Convert cents to dollars
      escapeCSV(actual.notes)
    ].join(','));
  });
  
  // Add total row
  if (actuals.length > 0) {
    const total = actuals.reduce((sum, a) => sum + a.amount, 0) / 100;
    rows.push(`,,,Total,${total.toFixed(2)},`);
  }
  
  return rows.join('\n');
}

/**
 * Export forecasts to CSV format
 */
export function exportForecastsToCSV(
  forecasts: ForecastExportData[],
  metadata: ExportMetadata
): string {
  const rows: string[] = [];
  
  // Add metadata section
  if (metadata.scenarioName) {
    rows.push(`Scenario,${escapeCSV(metadata.scenarioName)}`);
  }
  if (metadata.organizationName) {
    rows.push(`Organization,${escapeCSV(metadata.organizationName)}`);
  }
  rows.push(`Export Date,${metadata.exportDate.toISOString().split('T')[0]}`);
  rows.push(''); // Empty row
  
  // Add headers
  rows.push('Forecast Name,Type,Period,Predicted Amount,Confidence %,Methodology');
  
  // Add data rows
  forecasts.forEach(forecast => {
    rows.push([
      escapeCSV(forecast.forecastName),
      escapeCSV(forecast.forecastType),
      forecast.period.toISOString().split('T')[0],
      (forecast.predictedAmount / 100).toFixed(2), // Convert cents to dollars
      forecast.confidence !== undefined ? forecast.confidence.toString() : '',
      escapeCSV(forecast.methodology)
    ].join(','));
  });
  
  return rows.join('\n');
}
