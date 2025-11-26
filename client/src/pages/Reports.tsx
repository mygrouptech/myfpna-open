import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, formatPercent } from "@/const";
import { useState } from "react";
import { FileDown, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

export default function Reports() {
  const { user } = useAuth();
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: scenarios } = trpc.scenario.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: scenario } = trpc.scenario.get.useQuery(
    { id: selectedScenarioId! },
    { enabled: !!user && selectedScenarioId !== null }
  );

  const { data: lineItems } = trpc.budget.getLineItems.useQuery(
    { scenarioId: selectedScenarioId! },
    { enabled: !!user && selectedScenarioId !== null }
  );

  const { data: actuals } = trpc.actuals.list.useQuery(
    { scenarioId: selectedScenarioId! },
    { enabled: !!user && selectedScenarioId !== null }
  );

  const { data: forecasts } = trpc.forecast.list.useQuery(
    { scenarioId: selectedScenarioId! },
    { enabled: !!user && selectedScenarioId !== null }
  );

  if (!user) {
    return <DashboardLayout><div className="p-8">Please sign in</div></DashboardLayout>;
  }

  const exportToExcel = (reportType: string) => {
    if (!selectedScenarioId || !scenario) {
      toast.error("Please select a scenario first");
      return;
    }

    setIsExporting(true);

    try {
      const wb = XLSX.utils.book_new();

      if (reportType === 'budget' && lineItems) {
        const budgetData = lineItems.map(item => ({
          'Account Name': item.accountName,
          'Category': item.category || 'N/A',
          'Period': formatDate(item.period),
          'Amount': item.amount / 100,
          'Notes': item.notes || '',
        }));
        const ws = XLSX.utils.json_to_sheet(budgetData);
        XLSX.utils.book_append_sheet(wb, ws, 'Budget');
      }

      if (reportType === 'variance' && lineItems && actuals) {
        const varianceData = lineItems.map(item => {
          const actual = actuals.find(a => 
            new Date(a.period).getMonth() === new Date(item.period).getMonth()
          );
          const actualAmount = actual ? actual.amount : 0;
          const variance = actualAmount - item.amount;
          const variancePercent = item.amount > 0 ? (variance / item.amount) * 100 : 0;

          return {
            'Account': item.accountName,
            'Period': formatDate(item.period),
            'Budget': item.amount / 100,
            'Actual': actualAmount / 100,
            'Variance': variance / 100,
            'Variance %': variancePercent.toFixed(2) + '%',
          };
        });
        const ws = XLSX.utils.json_to_sheet(varianceData);
        XLSX.utils.book_append_sheet(wb, ws, 'Variance Analysis');
      }

      if (reportType === 'forecast' && forecasts) {
        const forecastData = forecasts.map(f => ({
          'Period': formatDate(f.period),
          'Forecast Amount': f.predictedAmount / 100,
          'Confidence': (f.confidence || 0).toFixed(1) + '%',
          'Type': f.forecastType,
        }));
        const ws = XLSX.utils.json_to_sheet(forecastData);
        XLSX.utils.book_append_sheet(wb, ws, 'Forecast');
      }

      if (reportType === 'comprehensive') {
        if (lineItems) {
          const budgetWs = XLSX.utils.json_to_sheet(lineItems.map(item => ({
            'Account': item.accountName,
            'Category': item.category || 'N/A',
            'Period': formatDate(item.period),
            'Amount': item.amount / 100,
          })));
          XLSX.utils.book_append_sheet(wb, budgetWs, 'Budget');
        }

        if (actuals) {
          const actualsWs = XLSX.utils.json_to_sheet(actuals.map(a => ({
            'Account': a.accountName,
            'Period': formatDate(a.period),
            'Amount': a.amount / 100,
            'Source': a.source || 'N/A',
          })));
          XLSX.utils.book_append_sheet(wb, actualsWs, 'Actuals');
        }

        if (forecasts) {
          const forecastWs = XLSX.utils.json_to_sheet(forecasts.map(f => ({
            'Period': formatDate(f.period),
            'Amount': f.predictedAmount / 100,
            'Confidence': f.confidence || 0,
          })));
          XLSX.utils.book_append_sheet(wb, forecastWs, 'Forecast');
        }
      }

      const fileName = `${scenario.name}_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(`Report exported: ${fileName}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = (reportType: string) => {
    if (!selectedScenarioId || !scenario) {
      toast.error("Please select a scenario first");
      return;
    }

    setIsExporting(true);

    try {
      let csvContent = '';
      let fileName = '';

      if (reportType === 'budget' && lineItems) {
        csvContent = 'Account Name,Category,Period,Amount,Notes\n';
        lineItems.forEach(item => {
          csvContent += `"${item.accountName}","${item.category || 'N/A'}","${formatDate(item.period)}",${item.amount / 100},"${item.notes || ''}"\n`;
        });
        fileName = `${scenario.name}_budget_${new Date().toISOString().split('T')[0]}.csv`;
      }

      if (reportType === 'variance' && lineItems && actuals) {
        csvContent = 'Account,Period,Budget,Actual,Variance,Variance %\n';
        lineItems.forEach(item => {
          const actual = actuals.find(a => 
            new Date(a.period).getMonth() === new Date(item.period).getMonth()
          );
          const actualAmount = actual ? actual.amount : 0;
          const variance = actualAmount - item.amount;
          const variancePercent = item.amount > 0 ? (variance / item.amount) * 100 : 0;
          csvContent += `"${item.accountName}","${formatDate(item.period)}",${item.amount / 100},${actualAmount / 100},${variance / 100},${variancePercent.toFixed(2)}%\n`;
        });
        fileName = `${scenario.name}_variance_${new Date().toISOString().split('T')[0]}.csv`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();

      toast.success(`Report exported: ${fileName}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate summary metrics
  const totalBudget = lineItems?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalActuals = actuals?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const variance = totalActuals - totalBudget;
  const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Generate and export comprehensive financial reports
            </p>
          </div>

          <div className="w-64">
            <Select
              value={selectedScenarioId?.toString() || ""}
              onValueChange={(v) => setSelectedScenarioId(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                {scenarios?.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id.toString()}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedScenarioId && scenario && (
          <>
            {/* Report Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{scenario.name}</CardTitle>
                <CardDescription>
                  {scenario.scenarioType} • {formatDate(scenario.startDate)} - {formatDate(scenario.endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Budget</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Actuals</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalActuals)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Variance</div>
                    <div className={`text-2xl font-bold ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(variance))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Variance %</div>
                    <div className={`text-2xl font-bold ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPercent(Math.abs(variancePercent))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <FileSpreadsheet className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle className="text-lg">Budget Report</CardTitle>
                  <CardDescription>Complete budget breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    onClick={() => exportToExcel('budget')} 
                    disabled={isExporting || !lineItems || lineItems.length === 0}
                    className="w-full"
                    variant="outline"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                    Export Excel
                  </Button>
                  <Button 
                    onClick={() => exportToCSV('budget')} 
                    disabled={isExporting || !lineItems || lineItems.length === 0}
                    className="w-full"
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <FileSpreadsheet className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg">Variance Report</CardTitle>
                  <CardDescription>Budget vs actuals analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    onClick={() => exportToExcel('variance')} 
                    disabled={isExporting || !lineItems || !actuals}
                    className="w-full"
                    variant="outline"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                    Export Excel
                  </Button>
                  <Button 
                    onClick={() => exportToCSV('variance')} 
                    disabled={isExporting || !lineItems || !actuals}
                    className="w-full"
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <FileSpreadsheet className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">Forecast Report</CardTitle>
                  <CardDescription>AI-generated forecasts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    onClick={() => exportToExcel('forecast')} 
                    disabled={isExporting || !forecasts || forecasts.length === 0}
                    className="w-full"
                    variant="outline"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                    Export Excel
                  </Button>
                  <Button 
                    disabled={true}
                    className="w-full"
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-2 border-primary/20">
                <CardHeader>
                  <FileSpreadsheet className="h-8 w-8 text-orange-600 mb-2" />
                  <CardTitle className="text-lg">Full Report</CardTitle>
                  <CardDescription>All data in one file</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    onClick={() => exportToExcel('comprehensive')} 
                    disabled={isExporting}
                    className="w-full"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                    Export Excel
                  </Button>
                  <Button 
                    disabled={true}
                    className="w-full"
                    variant="outline"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Data Preview */}
            {lineItems && lineItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Preview</CardTitle>
                  <CardDescription>Sample of budget line items ({lineItems.length} total)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lineItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <div className="font-medium">{item.accountName}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.category || 'Uncategorized'} • {formatDate(item.period)}
                          </div>
                        </div>
                        <div className="font-bold">{formatCurrency(item.amount)}</div>
                      </div>
                    ))}
                    {lineItems.length > 5 && (
                      <div className="text-center text-sm text-muted-foreground pt-2">
                        ... and {lineItems.length - 5} more items
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!selectedScenarioId && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Scenario</h3>
              <p className="text-muted-foreground">
                Choose a scenario from the dropdown above to generate reports
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
