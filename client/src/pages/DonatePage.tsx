import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PRESET_AMOUNTS = [
  { label: "$5", value: 500 },
  { label: "$10", value: 1000 },
  { label: "$20", value: 2000 },
  { label: "$50", value: 5000 },
];

export default function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const createCheckoutMutation = trpc.donations.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(`Failed to create checkout session: ${error.message}`);
    },
  });

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    setSelectedAmount(null);
  };

  const handleDonate = () => {
    let amountInCents: number;

    if (isCustom) {
      const customValue = parseFloat(customAmount);
      if (isNaN(customValue) || customValue < 1) {
        toast.error("Please enter a valid amount (minimum $1)");
        return;
      }
      amountInCents = Math.round(customValue * 100);
    } else if (selectedAmount) {
      amountInCents = selectedAmount;
    } else {
      toast.error("Please select or enter an amount");
      return;
    }

    createCheckoutMutation.mutate({ amount: amountInCents });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-4xl py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Support MyFPnA</h1>
          <p className="text-xl text-muted-foreground">
            Help us build the best FP&A platform for everyone
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Why Donate?</CardTitle>
            <CardDescription>
              MyFPnA Suite is currently in beta and supported by donations from users like you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your donation helps us:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Maintain and improve the platform</li>
              <li>Add new features and integrations</li>
              <li>Provide free access to startups and small businesses</li>
              <li>Keep the platform ad-free and privacy-focused</li>
              <li>Support AI-powered forecasting and analytics</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Choose Your Contribution</CardTitle>
            <CardDescription>
              Every amount helps us make MyFPnA better
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset amounts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedAmount === preset.value ? "default" : "outline"}
                  size="lg"
                  onClick={() => handlePresetClick(preset.value)}
                  className="h-20 text-xl font-semibold"
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="space-y-2">
              <Button
                variant={isCustom ? "default" : "outline"}
                onClick={handleCustomClick}
                className="w-full"
              >
                Custom Amount
              </Button>

              {isCustom && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="custom-amount">Enter Amount (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="custom-amount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="25.00"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Donate button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleDonate}
              disabled={createCheckoutMutation.isPending || (!selectedAmount && !isCustom)}
            >
              {createCheckoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Donate Now
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Stripe. Your donation is processed securely and we never see your payment details.
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Thank you for supporting open and accessible financial planning tools! 🙏
          </p>
        </div>
      </div>
    </div>
  );
}
