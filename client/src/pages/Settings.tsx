import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ROLE_LABELS } from "@/const";
import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Building2, Users, Bell, Shield, Database } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState("");

  const utils = trpc.useUtils();
  
  const { data: organization } = trpc.organization.get.useQuery(undefined, {
    enabled: !!user,
  });
  
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
    }
  }, [organization]);

  const updateOrgMutation = trpc.organization.update.useMutation({
    onSuccess: () => {
      utils.organization.get.invalidate();
      toast.success("Organization updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update organization");
    },
  });

  const handleUpdateOrg = () => {
    if (!orgName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    updateOrgMutation.mutate({ name: orgName });
  };

  if (!user) {
    return <DashboardLayout><div className="p-8">Please sign in</div></DashboardLayout>;
  }

  const isAdmin = user.role === 'admin';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization, users, and preferences
          </p>
        </div>

        <Tabs defaultValue="organization" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="organization">
              <Building2 className="h-4 w-4 mr-2" />
              Organization
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Users className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="demo-data">
              <Database className="h-4 w-4 mr-2" />
              Demo Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>
                  Manage your organization information and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={!isAdmin}
                  />
                  {!isAdmin && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Only administrators can modify organization settings
                    </p>
                  )}
                </div>

                {organization && (
                  <>
                    <div>
                      <Label>Subscription Status</Label>
                      <div className="mt-1 px-3 py-2 bg-muted rounded-md">
                        {organization.subscriptionStatus || 'Active'}
                      </div>
                    </div>

                    <div>
                      <Label>Created</Label>
                      <div className="mt-1 px-3 py-2 bg-muted rounded-md">
                        {new Date(organization.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </>
                )}

                {isAdmin && (
                  <Button 
                    onClick={handleUpdateOrg}
                    disabled={updateOrgMutation.isPending}
                  >
                    {updateOrgMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible actions for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                    <div>
                      <div className="font-medium text-red-900">Delete Organization</div>
                      <div className="text-sm text-red-700">
                        Permanently delete your organization and all associated data
                      </div>
                    </div>
                    <Button variant="destructive" disabled>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your personal account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <div className="mt-1 px-3 py-2 bg-muted rounded-md">
                    {user.name || 'Not set'}
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <div className="mt-1 px-3 py-2 bg-muted rounded-md">
                    {user.email || 'Not set'}
                  </div>
                </div>

                <div>
                  <Label>Role</Label>
                  <div className="mt-1 px-3 py-2 bg-muted rounded-md">
                    {ROLE_LABELS[user.role] || user.role}
                  </div>
                </div>

                <div>
                  <Label>Login Method</Label>
                  <div className="mt-1 px-3 py-2 bg-muted rounded-md">
                    {user.loginMethod || 'Not set'}
                  </div>
                </div>

                <div>
                  <Label>Last Sign In</Label>
                  <div className="mt-1 px-3 py-2 bg-muted rounded-md">
                    {new Date(user.lastSignedIn).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    Enable
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Active Sessions</div>
                    <div className="text-sm text-muted-foreground">
                      Manage devices where you're currently signed in
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    View
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">API Keys</div>
                    <div className="text-sm text-muted-foreground">
                      Generate API keys for programmatic access
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what updates you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Budget Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified when budgets exceed thresholds
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Forecast Updates</div>
                    <div className="text-sm text-muted-foreground">
                      Receive notifications when new forecasts are generated
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Scenario Approvals</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified when scenarios require approval
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Weekly Reports</div>
                    <div className="text-sm text-muted-foreground">
                      Receive weekly summary of financial performance
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demo-data" className="space-y-4">
            <DemoDataTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function DemoDataTab() {
  const utils = trpc.useUtils();
  
  const generateMutation = trpc.demoData.generate.useMutation({
    onSuccess: (data) => {
      utils.scenario.list.invalidate();
      toast.success(`Demo data generated successfully! Created scenario: ${data.scenarioName}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate demo data");
    },
  });

  const clearMutation = trpc.demoData.clear.useMutation({
    onSuccess: () => {
      utils.scenario.list.invalidate();
      toast.success("Demo data cleared successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to clear demo data");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Data Generator</CardTitle>
        <CardDescription>
          Generate realistic financial scenarios for testing and demonstration purposes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-blue-50 border-blue-200 p-4">
          <div className="flex gap-3">
            <Database className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-medium text-blue-900">What is Demo Data?</div>
              <div className="text-sm text-blue-700">
                Demo data includes realistic financial scenarios based on industry benchmarks from companies like:
              </div>
              <ul className="text-sm text-blue-700 list-disc list-inside ml-2 mt-2 space-y-1">
                <li><strong>TechCorp Solutions</strong> - Technology SaaS ($50M revenue, 30% growth)</li>
                <li><strong>RetailMart Inc</strong> - Retail ($500M revenue, 5% growth)</li>
                <li><strong>ManuFab Industries</strong> - Manufacturing ($200M revenue, 8% growth)</li>
                <li><strong>HealthPlus Services</strong> - Healthcare ($150M revenue, 12% growth)</li>
                <li><strong>FinServe Group</strong> - Financial Services ($80M revenue, 15% growth)</li>
              </ul>
              <div className="text-sm text-blue-700 mt-3">
                Each scenario includes 12 months of budget data, actual results with realistic variances, and AI-powered forecasts for the next year.
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">Generate Demo Data</div>
            <div className="text-sm text-muted-foreground">
              Create a complete financial scenario with budget, actuals, and forecasts
            </div>
          </div>
          <Button 
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? "Generating..." : "Generate"}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg border-orange-200 bg-orange-50">
          <div>
            <div className="font-medium text-orange-900">Clear All Demo Data</div>
            <div className="text-sm text-orange-700">
              Remove all scenarios, budgets, actuals, and forecasts from your organization
            </div>
          </div>
          <Button 
            variant="destructive"
            onClick={() => {
              if (confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
                clearMutation.mutate();
              }
            }}
            disabled={clearMutation.isPending}
          >
            {clearMutation.isPending ? "Clearing..." : "Clear All"}
          </Button>
        </div>

        <div className="rounded-lg border bg-muted p-4">
          <div className="text-sm text-muted-foreground">
            <strong>Note:</strong> Demo data is generated based on your organization ID and cycles through different industry profiles. Each time you generate demo data, you'll get a different company profile with realistic financial metrics.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
