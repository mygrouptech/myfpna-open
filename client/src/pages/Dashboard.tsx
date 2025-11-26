import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatPercent, getLoginUrl } from "@/const";
import { TrendingUp, TrendingDown, DollarSign, FileText, Target } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { data: organization } = trpc.organization.get.useQuery(undefined, {
    enabled: !!user,
  });
  
  const { data: scenarios } = trpc.scenario.list.useQuery(undefined, {
    enabled: !!user,
  });
  
  const { data: dashboardData } = trpc.analytics.dashboard.useQuery({}, {
    enabled: !!user,
  });

  if (loading) {
    return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to MyFPnA Suite</CardTitle>
            <CardDescription>
              Enterprise Financial Planning & Analysis Platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In to Continue</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeScenarios = scenarios?.filter(s => s.status === 'active') || [];
  const variance = dashboardData?.variance || 0;
  const variancePercent = dashboardData?.variancePercent || 0;
  const isPositiveVariance = variance >= 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user.name || user.email}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData?.totalBudget || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData?.budgetItemCount || 0} line items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actual Spend</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData?.totalActuals || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardData?.actualsCount || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variance</CardTitle>
              {isPositiveVariance ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isPositiveVariance ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(variance))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatPercent(variancePercent)} {isPositiveVariance ? 'over' : 'under'} budget
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Scenarios</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeScenarios.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {scenarios?.length || 0} total scenarios
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/scenarios">
                <FileText className="h-6 w-6 mb-2" />
                <div className="font-semibold">Create Scenario</div>
                <div className="text-xs text-muted-foreground">Start a new budget or forecast</div>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/analytics">
                <Target className="h-6 w-6 mb-2" />
                <div className="font-semibold">View Analytics</div>
                <div className="text-xs text-muted-foreground">Analyze variance and trends</div>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/forecasting">
                <TrendingUp className="h-6 w-6 mb-2" />
                <div className="font-semibold">AI Forecasting</div>
                <div className="text-xs text-muted-foreground">Generate predictions</div>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Scenarios */}
        {scenarios && scenarios.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Scenarios</CardTitle>
              <CardDescription>Your latest financial planning scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scenarios.slice(0, 5).map((scenario) => (
                  <Link key={scenario.id} href={`/budget/${scenario.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                      <div>
                        <div className="font-medium">{scenario.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {scenario.scenarioType} • {scenario.status}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(scenario.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
