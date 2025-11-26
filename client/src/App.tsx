import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Scenarios from "./pages/Scenarios";
import BudgetPlanner from "./pages/BudgetPlanner";
import Forecasting from "./pages/Forecasting";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import DonatePage from "./pages/DonatePage";
import DonationSuccessPage from "./pages/DonationSuccessPage";
import ResourcesPage from "./pages/ResourcesPage";
import AuthError from "./pages/AuthError";
import ProtectedRoute from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path={"/"} component={LandingPage} />

      <Route path={"/donate"} component={DonatePage} />
      <Route path={"/donate/success"} component={DonationSuccessPage} />
      <Route path={"/resources"} component={ResourcesPage} />
      <Route path={"/auth/error"} component={AuthError} />
      
      {/* Protected routes - require authentication */}
      <Route path={"/dashboard"}>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path={"/scenarios"}>
        <ProtectedRoute>
          <Scenarios />
        </ProtectedRoute>
      </Route>
      <Route path={"/budget-planner"}>
        <ProtectedRoute>
          <BudgetPlanner />
        </ProtectedRoute>
      </Route>
      <Route path={"/budget/:scenarioId"}>
        <ProtectedRoute>
          <BudgetPlanner />
        </ProtectedRoute>
      </Route>
      <Route path={"/forecasting"}>
        <ProtectedRoute>
          <Forecasting />
        </ProtectedRoute>
      </Route>
      <Route path={"/analytics"}>
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      </Route>
      <Route path={"/reports"}>
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path={"/settings"}>
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      
      {/* 404 */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
