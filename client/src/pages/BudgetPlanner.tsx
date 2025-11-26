import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/const";
import { Plus, Download, Upload, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function BudgetPlanner() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/budget/:scenarioId");
  const scenarioId = params?.scenarioId ? parseInt(params.scenarioId) : 0;
  
  const { data: scenarios } = trpc.scenario.list.useQuery(undefined, {
    enabled: !!user,
  });
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  
  const [accountName, setAccountName] = useState("");
  const [category, setCategory] = useState("");
  const [period, setPeriod] = useState("");
  const [amount, setAmount] = useState("");

  const utils = trpc.useUtils();
  const { data: scenario } = trpc.scenario.get.useQuery({ id: scenarioId }, {
    enabled: !!user && scenarioId > 0,
  });
  
  const { data: lineItems, isLoading } = trpc.budget.getLineItems.useQuery({ scenarioId }, {
    enabled: !!user && scenarioId > 0,
  });

  const createMutation = trpc.budget.createLineItem.useMutation({
    onSuccess: () => {
      utils.budget.getLineItems.invalidate({ scenarioId });
      setIsAddOpen(false);
      resetForm();
      toast.success("Line item added successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add line item");
    },
  });

  const updateMutation = trpc.budget.updateLineItem.useMutation({
    onSuccess: () => {
      utils.budget.getLineItems.invalidate({ scenarioId });
      setIsEditOpen(false);
      setEditingItem(null);
      resetForm();
      toast.success("Line item updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update line item");
    },
  });

  const deleteMutation = trpc.budget.deleteLineItem.useMutation({
    onSuccess: () => {
      utils.budget.getLineItems.invalidate({ scenarioId });
      setIsDeleteOpen(false);
      setDeletingItem(null);
      toast.success("Line item deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete line item");
    },
  });

  const resetForm = () => {
    setAccountName("");
    setCategory("");
    setPeriod("");
    setAmount("");
  };

  const handleAdd = () => {
    if (!accountName || !period || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate date is within scenario period
    if (scenario) {
      const periodDate = new Date(period);
      const startDate = new Date(scenario.startDate);
      const endDate = new Date(scenario.endDate);
      
      if (periodDate < startDate || periodDate > endDate) {
        toast.error(`Period must be between ${formatDate(startDate)} and ${formatDate(endDate)}`);
        return;
      }
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    if (amountInCents < 0) {
      toast.error("Amount cannot be negative");
      return;
    }
    
    createMutation.mutate({
      scenarioId,
      accountName,
      category: category || undefined,
      period: new Date(period),
      amount: amountInCents,
    });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setAccountName(item.accountName);
    setCategory(item.category || "");
    setPeriod(new Date(item.period).toISOString().split('T')[0]);
    setAmount((item.amount / 100).toString());
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!accountName || !period || !amount || !editingItem) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate date is within scenario period
    if (scenario) {
      const periodDate = new Date(period);
      const startDate = new Date(scenario.startDate);
      const endDate = new Date(scenario.endDate);
      
      if (periodDate < startDate || periodDate > endDate) {
        toast.error(`Period must be between ${formatDate(startDate)} and ${formatDate(endDate)}`);
        return;
      }
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    if (amountInCents < 0) {
      toast.error("Amount cannot be negative");
      return;
    }
    
    updateMutation.mutate({
      id: editingItem.id,
      accountName,
      category: category || undefined,
      period: new Date(period),
      amount: amountInCents,
    });
  };

  const handleDelete = (item: any) => {
    setDeletingItem(item);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteMutation.mutate({ id: deletingItem.id });
    }
  };

  if (!user) {
    return <DashboardLayout><div className="p-8">Please sign in</div></DashboardLayout>;
  }

  if (scenarioId === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Select a Scenario</h2>
            <p className="text-muted-foreground">Choose a scenario to manage its budget line items</p>
          </div>
          <Select onValueChange={(value) => setLocation(`/budget/${value}`)}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select scenario" />
            </SelectTrigger>
            <SelectContent>
              {scenarios?.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </DashboardLayout>
    );
  }

  if (!scenario) {
    return <DashboardLayout><div className="p-8">Loading scenario...</div></DashboardLayout>;
  }

  const totalBudget = lineItems?.reduce((sum, item) => sum + item.amount, 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{scenario.name}</h1>
            <p className="text-muted-foreground mt-1">
              {scenario.scenarioType} • {formatDate(scenario.startDate)} - {formatDate(scenario.endDate)}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Budget Line Item</DialogTitle>
                  <DialogDescription>
                    Add a new line item to this scenario
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g., Marketing Expenses"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category (Optional)</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Operating Expenses"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="period">Period</Label>
                    <Input
                      id="period"
                      type="date"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adding..." : "Add Line Item"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
            <CardDescription>Total budget across all line items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {lineItems?.length || 0} line items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Line Items</CardTitle>
            <CardDescription>Detailed breakdown of budget allocations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading line items...</div>
            ) : lineItems && lineItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.accountName}</TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell>{formatDate(item.period)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No line items yet. Click "Add Line Item" to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget Line Item</DialogTitle>
            <DialogDescription>
              Update the line item details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-accountName">Account Name</Label>
              <Input
                id="edit-accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., Marketing Expenses"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-category">Category (Optional)</Label>
              <Input
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Operating Expenses"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-period">Period</Label>
              <Input
                id="edit-period"
                type="date"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); setEditingItem(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Line Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the line item "{deletingItem?.accountName}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsDeleteOpen(false); setDeletingItem(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
