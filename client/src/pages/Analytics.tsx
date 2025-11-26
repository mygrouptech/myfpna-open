import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatPercent } from "@/const";
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const { user } = useAuth();
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);

  const { data: scenarios } = trpc.scenario.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: lineItems } = trpc.budget.getLineItems.useQuery(
    { scenarioId: selectedScenarioId! },
    { enabled: !!user && selectedScenarioId !== null }
  );

  const { data: actuals } = trpc.actuals.list.useQuery(
    { scenarioId: selectedScenarioId! },
    { enabled: !!user && selectedScenarioId !== null }
  );

  if (!user) {
    return <DashboardLayout><div className="p-8">Please sign in</div></DashboardLayout>;
  }

  // Prepare variance trend data
  const varianceTrendData = lineItems?.slice(0, 12).map((item, index) => {
    const actual = actuals?.find(a => 
      new Date(a.period).getMonth() === new Date(item.period).getMonth()
    );
    
    return {
      name: new Date(item.period).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      budget: item.amount / 100,
      actual: actual ? actual.amount / 100 : 0,
      variance: actual ? (actual.amount - item.amount) / 100 : -item.amount / 100,
    };
  }) || [];

  // Prepare category breakdown data
  const categoryMap = new Map<string, number>();
  lineItems?.forEach(item => {
    const category = item.category || 'Uncategorized';
    categoryMap.set(category, (categoryMap.get(category) || 0) + item.amount);
  });
  
  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value: value / 100,
  }));

  // Calculate variance metrics
  const totalBudget = lineItems?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalActuals = actuals?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const variance = totalActuals - totalBudget;
  const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;
  const isOverBudget = variance > 0;

  // Prepare monthly comparison data
  const monthlyData = lineItems?.slice(0, 12).map((item) => {
    const actual = actuals?.find(a => 
      new Date(a.period).getMonth() === new Date(item.period).getMonth()
    );
    
    return {
      month: new Date(item.period).toLocaleDateString('en-US', { month: 'short' }),
      budget: item.amount / 100,
      actual: actual ? actual.amount / 100 : 0,
    };
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive financial analysis and insights
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

        {!selectedScenarioId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Scenario</h3>
              <p className="text-muted-foreground">
                Choose a scenario from the dropdown above to view analytics
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Variance Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lineItems?.length || 0} line items
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Actuals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalActuals)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {actuals?.length || 0} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Variance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold flex items-center gap-2 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {isOverBudget ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    {formatCurrency(Math.abs(variance))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPercent(Math.abs(variancePercent))} {isOverBudget ? 'over' : 'under'} budget
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Budget vs Actuals Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actuals Trend</CardTitle>
                <CardDescription>Monthly comparison of budgeted vs actual spending</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                      <Legend />
                      <Line type="monotone" dataKey="budget" stroke="#3b82f6" strokeWidth={2} name="Budget" />
                      <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No data available for this scenario
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Variance Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Variance Analysis</CardTitle>
                <CardDescription>Positive values indicate over-budget, negative values indicate under-budget</CardDescription>
              </CardHeader>
              <CardContent>
                {varianceTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={varianceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                      <Legend />
                      <Bar dataKey="variance" fill="#3b82f6" name="Variance">
                        {varianceTrendData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.variance >= 0 ? '#ef4444' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No variance data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Budget by Category</CardTitle>
                <CardDescription>Distribution of budget across categories</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-3">
                      {categoryData.map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(category.value * 100)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
