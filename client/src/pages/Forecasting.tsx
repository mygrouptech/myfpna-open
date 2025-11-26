import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/const";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "sonner";

export default function Forecasting() {
  const { user } = useAuth();
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [forecastPeriods, setForecastPeriods] = useState("12");
  const [isGenerating, setIsGenerating] = useState(false);

  const utils = trpc.useUtils();
  
  const { data: scenarios } = trpc.scenario.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: forecasts } = trpc.forecast.list.useQuery(
    { scenarioId: selectedScenarioId! },
    { enabled: !!user && selectedScenarioId !== null }
  );

  const { data: lineItems } = trpc.budget.getLineItems.useQuery(
    { scenarioId: selectedScenarioId! },
    { enabled: !!user && selectedScenarioId !== null }
  );

  const generateMutation = trpc.forecast.generate.useMutation({
    onSuccess: () => {
      utils.forecast.list.invalidate({ scenarioId: selectedScenarioId! });
      setIsGenerating(false);
      toast.success("Forecast generated successfully");
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error(error.message || "Failed to generate forecast");
    },
  });

  const handleGenerate = async () => {
    if (!selectedScenarioId) {
      toast.error("Please select a scenario");
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate({
      scenarioId: selectedScenarioId,
      periods: parseInt(forecastPeriods),
    });
  };

  if (!user) {
    return <DashboardLayout><div className="p-8">Please sign in</div></DashboardLayout>;
  }

  // Prepare forecast chart data
  const forecastChartData = forecasts?.map((forecast) => ({
    period: new Date(forecast.period).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    forecast: forecast.predictedAmount / 100,
    confidence: forecast.confidence || 0,
  })) || [];

  // Prepare combined budget + forecast data
  const combinedData = [
    ...(lineItems?.slice(0, 12).map((item) => ({
      period: new Date(item.period).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      budget: item.amount / 100,
      forecast: null,
      type: 'historical',
    })) || []),
    ...(forecasts?.map((forecast) => ({
      period: new Date(forecast.period).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      budget: null,
      forecast: forecast.predictedAmount / 100,
      type: 'forecast',
    })) || []),
  ];

  const totalForecast = forecasts?.reduce((sum, f) => sum + f.predictedAmount, 0) || 0;
  const avgConfidence = forecasts && forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + (f.confidence || 0), 0) / forecasts.length
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI Forecasting
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate intelligent financial forecasts powered by AI
            </p>
          </div>
        </div>

        {/* Forecast Generator */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Generate New Forecast</CardTitle>
            <CardDescription>
              Use AI to predict future financial performance based on historical data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="scenario">Scenario</Label>
                <Select
                  value={selectedScenarioId?.toString() || ""}
                  onValueChange={(v) => setSelectedScenarioId(parseInt(v))}
                >
                  <SelectTrigger id="scenario">
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

              <div>
                <Label htmlFor="periods">Forecast Periods (Months)</Label>
                <Input
                  id="periods"
                  type="number"
                  min="1"
                  max="24"
                  value={forecastPeriods}
                  onChange={(e) => setForecastPeriods(e.target.value)}
                />
              </div>

              <div className="flex items-end gap-2">
                <Button 
                  onClick={handleGenerate} 
                  disabled={!selectedScenarioId || isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Forecast
                    </>
                  )}
                </Button>
                
                {selectedScenarioId && forecasts && forecasts.length > 0 && (
                  <ExportButton 
                    type="forecasts" 
                    scenarioId={selectedScenarioId}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {!selectedScenarioId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Scenario</h3>
              <p className="text-muted-foreground">
                Choose a scenario above to view and generate forecasts
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Forecast Summary */}
            {forecasts && forecasts.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Forecast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalForecast)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {forecasts.length} periods
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      {avgConfidence.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      AI prediction confidence
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Forecast Period</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{forecasts.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      months ahead
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Forecast Visualization */}
            {forecasts && forecasts.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Forecast Projection</CardTitle>
                  <CardDescription>
                    AI-generated forecast based on historical trends and patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={combinedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="budget" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        name="Historical Budget"
                        connectNulls={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        name="AI Forecast"
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Forecasts Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate your first AI-powered forecast using the form above
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Forecast Details Table */}
            {forecasts && forecasts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Forecast Details</CardTitle>
                  <CardDescription>Detailed breakdown of forecast periods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecasts.map((forecast) => (
                      <div 
                        key={forecast.id} 
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <div className="font-medium">{formatDate(forecast.period)}</div>
                          <div className="text-sm text-muted-foreground">
                            Confidence: {forecast.confidence?.toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{formatCurrency(forecast.predictedAmount)}</div>
                          <div className="text-xs text-muted-foreground">
                            {forecast.forecastType}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
