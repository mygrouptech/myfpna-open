import Stripe from "stripe";
import { ENV } from "./_core/env";

// Initialize Stripe client (only if API key is provided)
const stripe = ENV.stripeSecretKey
  ? new Stripe(ENV.stripeSecretKey, {
      apiVersion: "2025-11-17.clover",
    })
  : null;

/**
 * Create a Stripe Checkout Session for donations
 * @param amount - Amount in cents (e.g., 1000 = $10.00)
 * @param userId - Optional user ID for tracking
 * @returns Checkout session with URL and ID
 */
export async function createDonationCheckoutSession({
  amount,
  userId,
}: {
  amount: number;
  userId?: number;
}): Promise<{ url: string; sessionId: string }> {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.");
  }
  
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "MyFPnA Platform Donation",
            description: "Support the development of MyFPnA Suite",
          },
          unit_amount: amount, // Amount in cents
        },
        quantity: 1,
      },
    ],
    success_url: `${ENV.appUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${ENV.appUrl}/donate`,
    metadata: {
      userId: userId?.toString() || "anonymous",
      type: "donation",
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session: no URL returned");
  }

  return {
    url: session.url,
    sessionId: session.id,
  };
}

/**
 * Verify Stripe webhook signature
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @returns Parsed Stripe event
 */
export function verifyStripeSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.");
  }
  
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      ENV.stripeWebhookSecret
    );
  } catch (err) {
    const error = err as Error;
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

/**
 * Retrieve a checkout session by ID
 * @param sessionId - Stripe session ID
 * @returns Checkout session object
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.");
  }
  
  return await stripe.checkout.sessions.retrieve(sessionId);
}
