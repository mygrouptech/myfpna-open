# Data Export Implementation Plan

**Date:** November 26, 2025  
**Feature:** Excel/CSV Export for Budgets, Actuals, and Forecasts  
**Risk Level:** 🟢 LOW

---

## 1. Technology Stack

### 1.1 Dependencies

**Primary Library:** `exceljs` (v4.4.0+)
- Most popular and actively maintained Excel library for Node.js
- Supports XLSX format with rich formatting
- Streaming support for large datasets
- 13k+ GitHub stars, actively maintained

**CSV Generation:** Built-in Node.js `csv-stringify` or simple string concatenation
- No additional dependency needed for CSV
- Lightweight and performant

### 1.2 Installation

```bash
pnpm add exceljs
pnpm add -D @types/node  # If not already present
```

---

## 2. Architecture Design

### 2.1 File Structure

```
server/
  export/
    excelExport.ts      # Excel generation logic
    csvExport.ts        # CSV generation logic
    types.ts            # Shared types
  routers.ts            # Add export router
```

### 2.2 Export Flow

```
User clicks "Export" button
  ↓
Frontend: trpc.export.budgets.mutate({ scenarioId, format: 'xlsx' })
  ↓
Backend: Authorization check (organization-level)
  ↓
Backend: Fetch data using existing db helpers
  ↓
Backend: Generate Excel/CSV file in memory
  ↓
Backend: Return base64-encoded file data
  ↓
Frontend: Trigger browser download
  ↓
Backend: Log export in audit trail
```

---

## 3. Implementation Details

### 3.1 Export Service Interface

```typescript
// server/export/types.ts
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
  period: Date;
  amount: number;
}
```

### 3.2 Excel Export Service

```typescript
// server/export/excelExport.ts
import ExcelJS from 'exceljs';

export async function exportBudgetsToExcel(
  budgets: BudgetExportData[],
  metadata: { scenarioName: string; exportDate: Date }
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Budget');
  
  // Add metadata
  worksheet.addRow(['Scenario:', metadata.scenarioName]);
  worksheet.addRow(['Export Date:', metadata.exportDate.toISOString()]);
  worksheet.addRow([]); // Empty row
  
  // Add headers with styling
  const headerRow = worksheet.addRow([
    'Account Name',
    'Account Code',
    'Category',
    'Period',
    'Amount'
  ]);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // Add data rows
  budgets.forEach(budget => {
    worksheet.addRow([
      budget.accountName,
      budget.accountCode || '',
      budget.category || '',
      budget.period.toISOString().split('T')[0],
      budget.amount / 100 // Convert cents to dollars
    ]);
  });
  
  // Format amount column as currency
  const amountColumn = worksheet.getColumn(5);
  amountColumn.numFmt = '$#,##0.00';
  amountColumn.width = 15;
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    if (!column.width) {
      column.width = 20;
    }
  });
  
  // Generate buffer
  return await workbook.xlsx.writeBuffer();
}
```

### 3.3 CSV Export Service

```typescript
// server/export/csvExport.ts
export function exportBudgetsToCSV(
  budgets: BudgetExportData[],
  metadata: { scenarioName: string; exportDate: Date }
): string {
  const rows: string[] = [];
  
  // Add metadata
  rows.push(`Scenario,${metadata.scenarioName}`);
  rows.push(`Export Date,${metadata.exportDate.toISOString()}`);
  rows.push(''); // Empty row
  
  // Add headers
  rows.push('Account Name,Account Code,Category,Period,Amount');
  
  // Add data rows
  budgets.forEach(budget => {
    rows.push([
      escapeCSV(budget.accountName),
      escapeCSV(budget.accountCode || ''),
      escapeCSV(budget.category || ''),
      budget.period.toISOString().split('T')[0],
      (budget.amount / 100).toFixed(2)
    ].join(','));
  });
  
  return rows.join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
```

### 3.4 tRPC Router

```typescript
// server/routers.ts - Add export router
const exportRouter = router({
  budgets: protectedProcedure
    .input(z.object({
      scenarioId: z.number(),
      format: z.enum(['xlsx', 'csv']).default('xlsx'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Authorization check
      const scenario = await db.getScenarioById(input.scenarioId);
      if (!scenario || scenario.organizationId !== ctx.user.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found' });
      }
      
      // Fetch data
      const budgetItems = await db.getBudgetLineItemsByScenario(input.scenarioId);
      
      // Transform to export format
      const exportData: BudgetExportData[] = budgetItems.map(item => ({
        scenarioName: scenario.name,
        accountName: item.accountName,
        accountCode: item.accountCode || undefined,
        category: item.category || undefined,
        period: item.period,
        amount: item.amount,
      }));
      
      // Generate file
      let fileData: Buffer | string;
      let mimeType: string;
      let extension: string;
      
      if (input.format === 'xlsx') {
        fileData = await exportBudgetsToExcel(exportData, {
          scenarioName: scenario.name,
          exportDate: new Date(),
        });
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
      } else {
        fileData = exportBudgetsToCSV(exportData, {
          scenarioName: scenario.name,
          exportDate: new Date(),
        });
        mimeType = 'text/csv';
        extension = 'csv';
      }
      
      // Audit log
      await auditLog(
        ctx.user.id,
        ctx.user.organizationId,
        'export.budgets',
        'scenario',
        input.scenarioId,
        { format: input.format, rowCount: exportData.length }
      );
      
      // Return base64-encoded data
      const base64Data = Buffer.from(fileData).toString('base64');
      const filename = `budget-${scenario.name.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.${extension}`;
      
      return {
        filename,
        data: base64Data,
        mimeType,
      };
    }),
  
  actuals: protectedProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      format: z.enum(['xlsx', 'csv']).default('xlsx'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Similar implementation for actuals
      // ...
    }),
  
  forecasts: protectedProcedure
    .input(z.object({
      scenarioId: z.number(),
      format: z.enum(['xlsx', 'csv']).default('xlsx'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Similar implementation for forecasts
      // ...
    }),
});

// Add to appRouter
export const appRouter = router({
  // ... existing routers
  export: exportRouter,
});
```

### 3.5 Frontend Implementation

```tsx
// client/src/pages/Scenarios.tsx - Add export button
import { Download } from "lucide-react";

function ExportButton({ scenarioId }: { scenarioId: number }) {
  const exportMutation = trpc.export.budgets.useMutation({
    onSuccess: (result) => {
      // Trigger download
      const link = document.createElement('a');
      link.href = `data:${result.mimeType};base64,${result.data}`;
      link.download = result.filename;
      link.click();
      
      toast.success('Budget exported successfully');
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => exportMutation.mutate({ scenarioId, format: 'xlsx' })}
          disabled={exportMutation.isLoading}
        >
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportMutation.mutate({ scenarioId, format: 'csv' })}
          disabled={exportMutation.isLoading}
        >
          Export as CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 4. Testing Strategy

### 4.1 Unit Tests

```typescript
// server/export/excelExport.test.ts
describe('Excel Export', () => {
  it('should generate valid Excel file', async () => {
    const data: BudgetExportData[] = [
      { scenarioName: 'Test', accountName: 'Revenue', period: new Date(), amount: 100000 }
    ];
    const buffer = await exportBudgetsToExcel(data, { scenarioName: 'Test', exportDate: new Date() });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
  
  it('should format currency correctly', async () => {
    // Test currency formatting
  });
  
  it('should include metadata', async () => {
    // Test metadata inclusion
  });
  
  it('should handle empty data', async () => {
    // Test empty dataset
  });
  
  it('should handle large datasets', async () => {
    // Test with 1000+ rows
  });
});
```

### 4.2 Integration Tests

```typescript
// server/export.test.ts
describe('Export Router', () => {
  it('should export budgets for authorized user', async () => {
    // Test successful export
  });
  
  it('should reject unauthorized access', async () => {
    // Test authorization
  });
  
  it('should log export in audit trail', async () => {
    // Test audit logging
  });
  
  it('should handle non-existent scenario', async () => {
    // Test error handling
  });
});
```

**Total Tests:** 15+ test cases

---

## 5. Performance Considerations

### 5.1 Large Dataset Handling

**Limit:** Cap exports at 10,000 rows initially
**Streaming:** Use ExcelJS streaming for datasets >1,000 rows
**Timeout:** Set 60-second timeout for export operations

### 5.2 Memory Management

**Buffer Size:** Excel files ~50KB per 1,000 rows
**Base64 Overhead:** ~33% size increase for base64 encoding
**Max File Size:** Recommend 10MB limit (200,000 rows)

---

## 6. Security Considerations

### 6.1 Authorization

- ✅ Reuse existing organization-level isolation
- ✅ Verify user has access to scenario/data
- ✅ No cross-organization data leakage

### 6.2 Audit Logging

- ✅ Log all exports (user, organization, entity, format, row count)
- ✅ Track export frequency for abuse detection
- ✅ Include timestamp and IP address

### 6.3 Rate Limiting

**Recommendation:** Add rate limiting (10 exports per hour per user)

```typescript
// Future enhancement
const exportRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
});
```

---

## 7. UI/UX Considerations

### 7.1 Export Button Placement

**Scenarios Page:** Export button next to each scenario (budget data)
**Analytics Page:** Export button for actuals data
**Forecasting Page:** Export button for forecast data

### 7.2 Loading States

- Show loading spinner during export generation
- Disable button while exporting
- Show toast notification on success/failure

### 7.3 File Naming Convention

```
budget-{scenario-name}-{timestamp}.xlsx
actuals-{start-date}-to-{end-date}-{timestamp}.csv
forecast-{scenario-name}-{timestamp}.xlsx
```

---

## 8. Implementation Checklist

- [ ] Install `exceljs` dependency
- [ ] Create `server/export/` directory
- [ ] Implement `excelExport.ts`
- [ ] Implement `csvExport.ts`
- [ ] Create `types.ts` for shared interfaces
- [ ] Add `exportRouter` to `server/routers.ts`
- [ ] Implement budget export endpoint
- [ ] Implement actuals export endpoint
- [ ] Implement forecast export endpoint
- [ ] Add export button to Scenarios page
- [ ] Add export button to Analytics page
- [ ] Add export button to Forecasting page
- [ ] Write 15+ comprehensive tests
- [ ] Test with large datasets (1000+ rows)
- [ ] Verify audit logging works
- [ ] Test authorization checks
- [ ] Verify no regressions in existing features
- [ ] Update documentation
- [ ] Create checkpoint

---

## 9. Success Criteria

- ✅ Users can export budgets to Excel/CSV
- ✅ Users can export actuals to Excel/CSV
- ✅ Users can export forecasts to Excel/CSV
- ✅ Files include proper formatting and metadata
- ✅ Currency formatted correctly ($1,234.56)
- ✅ Authorization enforced (organization-level)
- ✅ All exports logged in audit trail
- ✅ 15+ tests passing
- ✅ No performance degradation
- ✅ No regressions in existing features

---

**Implementation Plan Approved By:** Multi-Agent Development Team  
**Risk Level:** 🟢 LOW  
**Estimated Time:** 2 hours  
**Ready to Implement:** ✅ YES
