import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home } from "lucide-react";
import { Link } from "wouter";

export default function DonationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
      <div className="container max-w-2xl px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-3xl">Thank You for Your Support!</CardTitle>
            <CardDescription className="text-lg">
              Your donation has been successfully processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Your generous contribution helps us continue building and improving MyFPnA Suite
              for everyone. We're grateful for your support in making financial planning tools
              accessible to all.
            </p>

            <div className="bg-muted/50 rounded-lg p-6 space-y-2">
              <p className="text-sm font-medium">What happens next?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ You'll receive a receipt via email</li>
                <li>✓ Your donation is recorded in your account</li>
                <li>✓ Continue using all MyFPnA features</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Questions about your donation? Contact us at support@myfpna.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
