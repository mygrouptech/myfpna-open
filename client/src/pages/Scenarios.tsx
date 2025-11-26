import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { SCENARIO_STATUS_LABELS, SCENARIO_TYPE_LABELS, formatDate } from "@/const";
import { Plus, FileText, CheckCircle, Archive } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Scenarios() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [scenarioType, setScenarioType] = useState<"budget" | "forecast" | "actual" | "what_if">("budget");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const utils = trpc.useUtils();
  const { data: scenarios, isLoading } = trpc.scenario.list.useQuery();
  
  const createMutation = trpc.scenario.create.useMutation({
    onSuccess: () => {
      utils.scenario.list.invalidate();
      setIsCreateOpen(false);
      setName("");
      setStartDate("");
      setEndDate("");
      toast.success("Scenario created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create scenario");
    },
  });

  const handleCreate = () => {
    if (!name || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      name,
      scenarioType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
  };

  if (!user) {
    return <DashboardLayout><div className="p-8">Please sign in</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scenarios</h1>
            <p className="text-muted-foreground mt-1">
              Manage your budget and forecast scenarios
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Scenario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Scenario</DialogTitle>
                <DialogDescription>
                  Set up a new financial planning scenario
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Scenario Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., 2024 Annual Budget"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={scenarioType} onValueChange={(v: any) => setScenarioType(v)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="forecast">Forecast</SelectItem>
                      <SelectItem value="actual">Actual</SelectItem>
                      <SelectItem value="what_if">What-If Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Scenario"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading scenarios...</div>
        ) : scenarios && scenarios.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      scenario.status === 'approved' ? 'bg-green-100 text-green-800' :
                      scenario.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      scenario.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {SCENARIO_STATUS_LABELS[scenario.status]}
                    </div>
                  </div>
                  <CardTitle className="mt-4">{scenario.name}</CardTitle>
                  <CardDescription>
                    {SCENARIO_TYPE_LABELS[scenario.scenarioType]} • {scenario.currency}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Period:</span>
                      <span className="font-medium">
                        {formatDate(scenario.startDate)} - {formatDate(scenario.endDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(scenario.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button asChild className="flex-1" size="sm">
                      <Link href={`/budget/${scenario.id}`}>
                        Open
                      </Link>
                    </Button>
                    <ExportButton 
                      type="budgets" 
                      scenarioId={scenario.id}
                      size="sm"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scenarios yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first scenario to start planning
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Scenario
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
