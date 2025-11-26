import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getLoginUrl } from "@/const";

export default function AuthError() {
  const [, setLocation] = useLocation();
  
  // Get error details from URL params
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error") || "Authentication Error";
  const description = params.get("description") || "An error occurred during authentication. Please try again.";

  const handleRetry = () => {
    window.location.href = getLoginUrl();
  };

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Authentication Failed</CardTitle>
          <CardDescription>
            We encountered an issue while trying to sign you in
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error}</AlertTitle>
            <AlertDescription className="mt-2">
              {description}
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-semibold">What you can do:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Try signing in again</li>
              <li>Clear your browser cookies and cache</li>
              <li>Try a different browser</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button 
            onClick={handleRetry} 
            className="flex-1"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button 
            onClick={handleGoHome} 
            className="flex-1"
            variant="outline"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
