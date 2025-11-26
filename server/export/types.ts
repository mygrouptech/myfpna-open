/**
 * Data Export Types
 * Shared interfaces for Excel and CSV export functionality
 */

export interface ExportOptions {
  format: 'xlsx' | 'csv';
  includeMetadata?: boolean;
}

export interface ExportResult {
  filename: string;
  data: string; // base64-encoded
  mimeType: string;
}

export interface BudgetExportData {
  scenarioName: string;
  accountName: string;
  accountCode?: string;
  category?: string;
  subCategory?: string;
  period: Date;
  amount: number; // in cents
}

export interface ActualExportData {
  accountName: string;
  accountCode?: string;
  category?: string;
  period: Date;
  amount: number; // in cents
  notes?: string;
}

export interface ForecastExportData {
  scenarioName: string;
  forecastName: string;
  forecastType: string;
  period: Date;
  predictedAmount: number; // in cents
  confidence?: number;
  methodology?: string;
}

export interface ExportMetadata {
  exportDate: Date;
  organizationName?: string;
  scenarioName?: string;
  startDate?: Date;
  endDate?: Date;
}
