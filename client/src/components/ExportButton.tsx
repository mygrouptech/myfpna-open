/**
 * Export Button Component
 * Provides Excel/CSV export functionality for budgets, actuals, and forecasts
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  type: 'budgets' | 'actuals' | 'forecasts';
  scenarioId?: number;
  startDate?: Date;
  endDate?: Date;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ExportButton({
  type,
  scenarioId,
  startDate,
  endDate,
  variant = 'outline',
  size = 'sm',
  className,
}: ExportButtonProps) {
  const exportBudgetsMutation = trpc.export.budgets.useMutation({
    onSuccess: (result) => {
      // Trigger download
      const link = document.createElement('a');
      link.href = `data:${result.mimeType};base64,${result.data}`;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Export completed successfully');
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const exportActualsMutation = trpc.export.actuals.useMutation({
    onSuccess: (result) => {
      // Trigger download
      const link = document.createElement('a');
      link.href = `data:${result.mimeType};base64,${result.data}`;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Export completed successfully');
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const exportForecastsMutation = trpc.export.forecasts.useMutation({
    onSuccess: (result) => {
      // Trigger download
      const link = document.createElement('a');
      link.href = `data:${result.mimeType};base64,${result.data}`;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Export completed successfully');
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const handleExport = (format: 'xlsx' | 'csv') => {
    if (type === 'budgets') {
      if (!scenarioId) {
        toast.error('Scenario ID is required for budget export');
        return;
      }
      exportBudgetsMutation.mutate({ scenarioId, format });
    } else if (type === 'actuals') {
      exportActualsMutation.mutate({ startDate, endDate, format });
    } else if (type === 'forecasts') {
      if (!scenarioId) {
        toast.error('Scenario ID is required for forecast export');
        return;
      }
      exportForecastsMutation.mutate({ scenarioId, format });
    }
  };

  const isLoading = 
    exportBudgetsMutation.isPending || 
    exportActualsMutation.isPending || 
    exportForecastsMutation.isPending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
          disabled={isLoading}
        >
          <Download className="h-4 w-4 mr-2" />
          {isLoading ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('xlsx')}
          disabled={isLoading}
        >
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isLoading}
        >
          Export as CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
