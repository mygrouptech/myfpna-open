# Stripe Payment Integration Plan
## MyFPnA Premium - Subscription & Payment Processing

## Executive Summary

This document outlines the comprehensive plan for integrating Stripe payment processing into the MyFPnA Premium platform. The integration will enable subscription tiers, one-time donations, and customer billing management using the Stripe MCP server.

## Stripe MCP Server Capabilities

Based on the available tools, the Stripe MCP server provides:

### Available Tools:
1. **create_customer** - Create new Stripe customers
2. **create_subscription** - Create subscription for customers
3. **update_subscription** - Modify existing subscriptions
4. **cancel_subscription** - Cancel customer subscriptions
5. **create_payment_intent** - Process one-time payments
6. **create_refund** - Issue refunds for charges
7. **create_payment_link** - Generate payment links
8. **create_price** - Create pricing plans
9. **create_product** - Create products/services
10. **create_coupon** - Create discount coupons
11. **search_stripe_resources** - Search for Stripe objects
12. **fetch_stripe_resources** - Retrieve specific objects by ID

### Searchable Resources:
- Customers
- Payment Intents
- Charges
- Invoices
- Prices
- Products
- Subscriptions

## Subscription Tier Structure

### Tier 1: Free (Current Default)
**Price**: $0/month  
**Features**:
- Up to 3 budget scenarios
- Basic forecasting (trend-based only)
- Standard variance analysis
- Export to Excel/CSV
- Email support
- 1 user per organization

**Target Audience**: Individual users, small businesses testing the platform

### Tier 2: Professional
**Price**: $49/month or $490/year (save $98)  
**Features**:
- **Everything in Free, plus:**
- Unlimited budget scenarios
- AI-powered forecasting with confidence scores
- AI variance analysis with explanations
- Anomaly detection alerts
- Custom report templates
- Priority email support
- Up to 5 users per organization
- QuickBooks/Xero integration (future)

**Target Audience**: Growing businesses, finance teams

### Tier 3: Enterprise
**Price**: $199/month or $1,990/year (save $398)  
**Features**:
- **Everything in Professional, plus:**
- Unlimited users
- Advanced AI insights and recommendations
- Natural language query interface
- Custom integrations via API
- Dedicated account manager
- Phone & video support
- SLA guarantee (99.9% uptime)
- Custom training sessions
- White-label options (future)

**Target Audience**: Large enterprises, Fortune 500 companies

### Add-On: One-Time Donation
**Price**: Any amount ($5 minimum)  
**Purpose**: Support platform development  
**Benefits**: 
- Supporter badge on profile
- Early access to new features
- Listed in supporters page (optional)

## Database Schema (Already Exists)

The `organizations` table already has subscription fields:
```sql
CREATE TABLE organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  stripe_customer_id VARCHAR(255),
  subscription_status ENUM('active', 'canceled', 'past_due', 'trialing') DEFAULT 'trialing',
  subscription_tier ENUM('free', 'professional', 'enterprise') DEFAULT 'free',
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

The `donations` table exists for one-time payments:
```sql
CREATE TABLE donations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_payment_intent_id VARCHAR(255),
  status ENUM('pending', 'succeeded', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  message TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE
);
```

## Implementation Architecture

### 1. Stripe Product & Price Setup

**Products to Create**:
1. MyFPnA Professional (Monthly)
2. MyFPnA Professional (Annual)
3. MyFPnA Enterprise (Monthly)
4. MyFPnA Enterprise (Annual)

**Prices to Create**:
- Professional Monthly: $49.00 USD
- Professional Annual: $490.00 USD
- Enterprise Monthly: $199.00 USD
- Enterprise Annual: $1,990.00 USD

### 2. Backend tRPC Procedures

```typescript
// server/routers.ts additions

export const appRouter = router({
  // ... existing routers

  billing: router({
    // Get current subscription status
    getSubscription: protectedProcedure
      .query(async ({ ctx }) => {
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, ctx.user.organizationId),
        });
        
        if (!org?.stripeSubscriptionId) {
          return { tier: 'free', status: 'trialing' };
        }

        // Fetch from Stripe via MCP
        const subscription = await fetchStripeSubscription(org.stripeSubscriptionId);
        return subscription;
      }),

    // Create checkout session for subscription
    createCheckoutSession: protectedProcedure
      .input(z.object({
        tier: z.enum(['professional', 'enterprise']),
        interval: z.enum(['month', 'year']),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get or create Stripe customer
        // Create payment link via MCP
        // Return checkout URL
      }),

    // Upgrade/downgrade subscription
    updateSubscription: protectedProcedure
      .input(z.object({
        newTier: z.enum(['professional', 'enterprise']),
        interval: z.enum(['month', 'year']),
      }))
      .mutation(async ({ input, ctx }) => {
        // Update subscription via MCP
        // Update database
        // Return new subscription details
      }),

    // Cancel subscription
    cancelSubscription: protectedProcedure
      .mutation(async ({ ctx }) => {
        // Cancel via MCP
        // Update database
        // Return confirmation
      }),

    // Process one-time donation
    createDonation: protectedProcedure
      .input(z.object({
        amount: z.number().min(5),
        currency: z.string().default('USD'),
        message: z.string().optional(),
        isAnonymous: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        // Create payment intent via MCP
        // Save to donations table
        // Return payment link
      }),

    // Get billing history
    getBillingHistory: protectedProcedure
      .query(async ({ ctx }) => {
        // Search invoices via MCP
        // Return formatted history
      }),

    // Get usage metrics (for metering)
    getUsageMetrics: protectedProcedure
      .query(async ({ ctx }) => {
        // Count scenarios, users, AI calls
        // Return usage stats
      }),
  }),
});
```

### 3. Stripe MCP Integration Layer

```typescript
// server/stripe/stripeService.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class StripeService {
  // Create customer
  async createCustomer(params: {
    email: string;
    name: string;
    metadata?: Record<string, string>;
  }): Promise<{ id: string }> {
    const input = JSON.stringify(params);
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call create_customer --server stripe --input '${input}'`
    );
    return JSON.parse(stdout);
  }

  // Create subscription
  async createSubscription(params: {
    customer: string;
    items: Array<{ price: string }>;
    metadata?: Record<string, string>;
  }): Promise<{ id: string; status: string }> {
    const input = JSON.stringify(params);
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call create_subscription --server stripe --input '${input}'`
    );
    return JSON.parse(stdout);
  }

  // Update subscription
  async updateSubscription(params: {
    subscription_id: string;
    items?: Array<{ id: string; price: string }>;
    cancel_at_period_end?: boolean;
  }): Promise<{ id: string; status: string }> {
    const input = JSON.stringify(params);
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call update_subscription --server stripe --input '${input}'`
    );
    return JSON.parse(stdout);
  }

  // Cancel subscription
  async cancelSubscription(params: {
    subscription_id: string;
  }): Promise<{ id: string; status: string }> {
    const input = JSON.stringify(params);
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call cancel_subscription --server stripe --input '${input}'`
    );
    return JSON.parse(stdout);
  }

  // Create payment intent (for donations)
  async createPaymentIntent(params: {
    amount: number; // in cents
    currency: string;
    customer?: string;
    metadata?: Record<string, string>;
  }): Promise<{ id: string; client_secret: string }> {
    const input = JSON.stringify(params);
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call create_payment_intent --server stripe --input '${input}'`
    );
    return JSON.parse(stdout);
  }

  // Create payment link
  async createPaymentLink(params: {
    line_items: Array<{ price: string; quantity: number }>;
    metadata?: Record<string, string>;
  }): Promise<{ url: string }> {
    const input = JSON.stringify(params);
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call create_payment_link --server stripe --input '${input}'`
    );
    return JSON.parse(stdout);
  }

  // Search subscriptions
  async searchSubscriptions(query: string): Promise<any[]> {
    const input = JSON.stringify({
      resource_type: 'subscriptions',
      query: query,
    });
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call search_stripe_resources --server stripe --input '${input}'`
    );
    const result = JSON.parse(stdout);
    return result.data || [];
  }

  // Fetch subscription by ID
  async fetchSubscription(subscriptionId: string): Promise<any> {
    const input = JSON.stringify({ id: subscriptionId });
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call fetch_stripe_resources --server stripe --input '${input}'`
    );
    return JSON.parse(stdout);
  }
}
```

### 4. Feature Access Control

```typescript
// server/middleware/featureAccess.ts

export function checkFeatureAccess(
  feature: string,
  tier: 'free' | 'professional' | 'enterprise'
): boolean {
  const features = {
    free: [
      'basic_scenarios',
      'trend_forecasting',
      'standard_variance',
      'excel_export',
    ],
    professional: [
      'unlimited_scenarios',
      'ai_forecasting',
      'ai_variance',
      'anomaly_detection',
      'custom_reports',
      'multi_user',
    ],
    enterprise: [
      'unlimited_users',
      'advanced_ai',
      'natural_language',
      'custom_integrations',
      'priority_support',
      'sla_guarantee',
    ],
  };

  // Free tier gets free features
  if (tier === 'free') {
    return features.free.includes(feature);
  }

  // Professional gets free + professional
  if (tier === 'professional') {
    return [...features.free, ...features.professional].includes(feature);
  }

  // Enterprise gets everything
  if (tier === 'enterprise') {
    return [...features.free, ...features.professional, ...features.enterprise].includes(feature);
  }

  return false;
}

// tRPC middleware for feature gating
export const featureGatedProcedure = (feature: string) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, ctx.user.organizationId),
    });

    if (!org) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
    }

    const hasAccess = checkFeatureAccess(feature, org.subscriptionTier);

    if (!hasAccess) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `This feature requires ${feature} subscription`,
      });
    }

    return next({ ctx });
  });
```

### 5. UI Components

```typescript
// client/src/pages/Billing.tsx
// Subscription management page

// client/src/components/PricingTable.tsx
// Display pricing tiers

// client/src/components/UpgradeModal.tsx
// Prompt to upgrade when hitting limits

// client/src/components/BillingHistory.tsx
// Show invoices and payment history

// client/src/components/DonationWidget.tsx
// One-time donation interface
```

## User Flows

### Flow 1: New User Signs Up (Free Tier)
1. User completes OAuth sign-in
2. Organization created with `subscription_tier='free'` and `subscription_status='trialing'`
3. User lands on dashboard
4. Banner shows: "You're on the Free plan. Upgrade for unlimited scenarios and AI features."

### Flow 2: User Upgrades to Professional
1. User clicks "Upgrade" button
2. PricingTable modal shows tier comparison
3. User selects Professional Monthly ($49/month)
4. System creates/retrieves Stripe customer
5. System generates payment link via MCP
6. User redirected to Stripe checkout
7. After payment, webhook updates organization:
   - `subscription_tier='professional'`
   - `subscription_status='active'`
   - `stripe_subscription_id='sub_xxx'`
8. User gains access to professional features

### Flow 3: User Cancels Subscription
1. User goes to Settings → Billing
2. User clicks "Cancel Subscription"
3. Confirmation modal: "Your subscription will remain active until [end date]"
4. System calls `cancel_subscription` via MCP
5. Database updated: `subscription_status='canceled'`
6. At period end, tier reverts to 'free'

### Flow 4: User Makes Donation
1. User clicks "Support Us" in navigation
2. Donation widget shows suggested amounts ($5, $10, $25, custom)
3. User enters amount and optional message
4. System creates payment intent via MCP
5. User completes payment
6. Donation recorded in database
7. Thank you page with supporter badge

## Webhook Handling

Stripe webhooks notify the application of events:

### Critical Events to Handle:
1. **customer.subscription.created** - New subscription created
2. **customer.subscription.updated** - Subscription changed
3. **customer.subscription.deleted** - Subscription canceled
4. **invoice.payment_succeeded** - Payment successful
5. **invoice.payment_failed** - Payment failed
6. **payment_intent.succeeded** - One-time payment succeeded
7. **payment_intent.payment_failed** - One-time payment failed

### Webhook Endpoint:
```typescript
// server/webhooks/stripe.ts

import { Router } from 'express';
import { db } from '@/server/db';

const router = Router();

router.post('/webhooks/stripe', async (req, res) => {
  const event = req.body;

  switch (event.type) {
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    // ... other events
  }

  res.json({ received: true });
});

async function handleSubscriptionUpdated(subscription: any) {
  // Update organization subscription status
  await db.update(organizations)
    .set({
      subscriptionStatus: subscription.status,
      subscriptionTier: getTierFromPriceId(subscription.items.data[0].price.id),
      stripeSubscriptionId: subscription.id,
    })
    .where(eq(organizations.stripeCustomerId, subscription.customer));
}
```

## Testing Strategy

### Test Scenarios:
1. ✅ Create Stripe customer on user registration
2. ✅ Subscribe to Professional monthly plan
3. ✅ Subscribe to Professional annual plan
4. ✅ Subscribe to Enterprise monthly plan
5. ✅ Subscribe to Enterprise annual plan
6. ✅ Upgrade from Professional to Enterprise
7. ✅ Downgrade from Enterprise to Professional
8. ✅ Cancel subscription (remains active until period end)
9. ✅ Process one-time donation
10. ✅ Handle failed payment (retry logic)
11. ✅ Feature access control (free vs pro vs enterprise)
12. ✅ Usage limit enforcement (scenarios, users, AI calls)

### Test Cards (Stripe Test Mode):
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Requires authentication: 4000 0025 0000 3155

## Implementation Roadmap

### Week 1: Foundation
- [ ] Set up Stripe account and get API keys
- [ ] Create products and prices in Stripe dashboard
- [ ] Implement StripeService class with MCP integration
- [ ] Add tRPC billing procedures
- [ ] Test customer creation

### Week 2: Subscription Flow
- [ ] Implement subscription creation
- [ ] Build PricingTable UI component
- [ ] Implement checkout flow
- [ ] Add webhook endpoint
- [ ] Test subscription lifecycle

### Week 3: Feature Gating
- [ ] Implement feature access control middleware
- [ ] Add usage limit checks
- [ ] Build UpgradeModal component
- [ ] Test feature restrictions
- [ ] Add billing history page

### Week 4: Donations & Polish
- [ ] Implement donation flow
- [ ] Build DonationWidget component
- [ ] Add supporter badges
- [ ] Comprehensive testing
- [ ] Documentation

## Security Considerations

1. **API Key Protection**: Never expose Stripe secret keys in frontend
2. **Webhook Verification**: Verify webhook signatures to prevent spoofing
3. **PCI Compliance**: Use Stripe Checkout (never handle card data directly)
4. **Rate Limiting**: Prevent abuse of payment endpoints
5. **Audit Logging**: Log all subscription changes
6. **Refund Policy**: Clear refund policy in Terms of Service

## Success Metrics

1. **Conversion Rate**: % of free users who upgrade to paid
2. **Monthly Recurring Revenue (MRR)**: Total subscription revenue
3. **Churn Rate**: % of subscribers who cancel monthly
4. **Average Revenue Per User (ARPU)**: MRR / total users
5. **Lifetime Value (LTV)**: Average revenue per customer over lifetime
6. **Payment Success Rate**: % of payments that succeed

## Next Steps

1. ⏭️ Set up Stripe account and create products/prices
2. ⏭️ Implement StripeService class
3. ⏭️ Add tRPC billing procedures
4. ⏭️ Build pricing table UI
5. ⏭️ Test subscription flow end-to-end
6. ⏭️ Implement webhook handling
7. ⏭️ Add feature gating middleware
8. ⏭️ Comprehensive testing with test cards

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-26  
**Author**: Multi-Agent Development Team (Payment Integration Specialist)
