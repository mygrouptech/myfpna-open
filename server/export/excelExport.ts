/**
 * Excel Export Service
 * Generates Excel (.xlsx) files using ExcelJS
 */

import ExcelJS from 'exceljs';
import type { BudgetExportData, ActualExportData, ForecastExportData, ExportMetadata } from './types';

/**
 * Export budgets to Excel format
 */
export async function exportBudgetsToExcel(
  budgets: BudgetExportData[],
  metadata: ExportMetadata
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Budget');
  
  // Add metadata section
  if (metadata.scenarioName) {
    worksheet.addRow(['Scenario:', metadata.scenarioName]);
  }
  if (metadata.organizationName) {
    worksheet.addRow(['Organization:', metadata.organizationName]);
  }
  worksheet.addRow(['Export Date:', metadata.exportDate.toISOString().split('T')[0]]);
  worksheet.addRow([]); // Empty row
  
  // Add headers with styling
  const headerRow = worksheet.addRow([
    'Account Name',
    'Account Code',
    'Category',
    'Sub-Category',
    'Period',
    'Amount'
  ]);
  
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 20;
  
  // Add data rows
  budgets.forEach(budget => {
    worksheet.addRow([
      budget.accountName,
      budget.accountCode || '',
      budget.category || '',
      budget.subCategory || '',
      budget.period.toISOString().split('T')[0],
      budget.amount / 100 // Convert cents to dollars
    ]);
  });
  
  // Format columns
  worksheet.getColumn(1).width = 30; // Account Name
  worksheet.getColumn(2).width = 15; // Account Code
  worksheet.getColumn(3).width = 20; // Category
  worksheet.getColumn(4).width = 20; // Sub-Category
  worksheet.getColumn(5).width = 12; // Period
  worksheet.getColumn(6).width = 15; // Amount
  
  // Format amount column as currency
  const amountColumn = worksheet.getColumn(6);
  amountColumn.numFmt = '$#,##0.00';
  amountColumn.alignment = { horizontal: 'right' };
  
  // Add borders to data range
  const dataStartRow = metadata.scenarioName ? 5 : 4;
  const dataEndRow = dataStartRow + budgets.length;
  
  for (let row = dataStartRow; row <= dataEndRow; row++) {
    for (let col = 1; col <= 6; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
      };
    }
  }
  
  // Add total row
  if (budgets.length > 0) {
    const totalRow = worksheet.addRow([
      '',
      '',
      '',
      '',
      'Total:',
      budgets.reduce((sum, b) => sum + b.amount, 0) / 100
    ]);
    totalRow.font = { bold: true };
    totalRow.getCell(6).numFmt = '$#,##0.00';
  }
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export actuals to Excel format
 */
export async function exportActualsToExcel(
  actuals: ActualExportData[],
  metadata: ExportMetadata
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Actuals');
  
  // Add metadata section
  if (metadata.organizationName) {
    worksheet.addRow(['Organization:', metadata.organizationName]);
  }
  if (metadata.startDate && metadata.endDate) {
    worksheet.addRow(['Period:', `${metadata.startDate.toISOString().split('T')[0]} to ${metadata.endDate.toISOString().split('T')[0]}`]);
  }
  worksheet.addRow(['Export Date:', metadata.exportDate.toISOString().split('T')[0]]);
  worksheet.addRow([]); // Empty row
  
  // Add headers with styling
  const headerRow = worksheet.addRow([
    'Account Name',
    'Account Code',
    'Category',
    'Period',
    'Amount',
    'Notes'
  ]);
  
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' }
  };
  headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 20;
  
  // Add data rows
  actuals.forEach(actual => {
    worksheet.addRow([
      actual.accountName,
      actual.accountCode || '',
      actual.category || '',
      actual.period.toISOString().split('T')[0],
      actual.amount / 100, // Convert cents to dollars
      actual.notes || ''
    ]);
  });
  
  // Format columns
  worksheet.getColumn(1).width = 30; // Account Name
  worksheet.getColumn(2).width = 15; // Account Code
  worksheet.getColumn(3).width = 20; // Category
  worksheet.getColumn(4).width = 12; // Period
  worksheet.getColumn(5).width = 15; // Amount
  worksheet.getColumn(6).width = 40; // Notes
  
  // Format amount column as currency
  const amountColumn = worksheet.getColumn(5);
  amountColumn.numFmt = '$#,##0.00';
  amountColumn.alignment = { horizontal: 'right' };
  
  // Add borders to data range
  const dataStartRow = 5;
  const dataEndRow = dataStartRow + actuals.length;
  
  for (let row = dataStartRow; row <= dataEndRow; row++) {
    for (let col = 1; col <= 6; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
      };
    }
  }
  
  // Add total row
  if (actuals.length > 0) {
    const totalRow = worksheet.addRow([
      '',
      '',
      '',
      'Total:',
      actuals.reduce((sum, a) => sum + a.amount, 0) / 100,
      ''
    ]);
    totalRow.font = { bold: true };
    totalRow.getCell(5).numFmt = '$#,##0.00';
  }
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export forecasts to Excel format
 */
export async function exportForecastsToExcel(
  forecasts: ForecastExportData[],
  metadata: ExportMetadata
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Forecasts');
  
  // Add metadata section
  if (metadata.scenarioName) {
    worksheet.addRow(['Scenario:', metadata.scenarioName]);
  }
  if (metadata.organizationName) {
    worksheet.addRow(['Organization:', metadata.organizationName]);
  }
  worksheet.addRow(['Export Date:', metadata.exportDate.toISOString().split('T')[0]]);
  worksheet.addRow([]); // Empty row
  
  // Add headers with styling
  const headerRow = worksheet.addRow([
    'Forecast Name',
    'Type',
    'Period',
    'Predicted Amount',
    'Confidence %',
    'Methodology'
  ]);
  
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFC000' }
  };
  headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 20;
  
  // Add data rows
  forecasts.forEach(forecast => {
    worksheet.addRow([
      forecast.forecastName,
      forecast.forecastType,
      forecast.period.toISOString().split('T')[0],
      forecast.predictedAmount / 100, // Convert cents to dollars
      forecast.confidence || '',
      forecast.methodology || ''
    ]);
  });
  
  // Format columns
  worksheet.getColumn(1).width = 40; // Forecast Name
  worksheet.getColumn(2).width = 15; // Type
  worksheet.getColumn(3).width = 12; // Period
  worksheet.getColumn(4).width = 18; // Predicted Amount
  worksheet.getColumn(5).width = 12; // Confidence
  worksheet.getColumn(6).width = 30; // Methodology
  
  // Format amount column as currency
  const amountColumn = worksheet.getColumn(4);
  amountColumn.numFmt = '$#,##0.00';
  amountColumn.alignment = { horizontal: 'right' };
  
  // Format confidence column as percentage
  const confidenceColumn = worksheet.getColumn(5);
  confidenceColumn.alignment = { horizontal: 'center' };
  
  // Add borders to data range
  const dataStartRow = metadata.scenarioName ? 5 : 4;
  const dataEndRow = dataStartRow + forecasts.length;
  
  for (let row = dataStartRow; row <= dataEndRow; row++) {
    for (let col = 1; col <= 6; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
      };
    }
  }
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
