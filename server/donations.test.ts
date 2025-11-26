import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    organizationId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      get: () => "localhost:3000",
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Donations Feature", () => {
  describe("donations.createCheckoutSession", () => {
    it("should create a checkout session with valid amount", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.donations.createCheckoutSession({
        amount: 1000, // $10.00
      });

      expect(result).toHaveProperty("url");
      expect(result.url).toContain("checkout.stripe.com");
    });

    it("should reject amount below minimum ($1)", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.donations.createCheckoutSession({
          amount: 50, // $0.50 - below minimum
        })
      ).rejects.toThrow();
    });

    it("should reject amount above maximum ($10,000)", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.donations.createCheckoutSession({
          amount: 1500000, // $15,000 - above maximum
        })
      ).rejects.toThrow();
    });
  });

  describe("donations.listUserDonations", () => {
    it("should return empty array for user with no donations", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.donations.listUserDonations();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("donations.listAllDonations (admin only)", () => {
    it("should allow admin to list all donations", async () => {
      const { ctx } = createAuthContext();
      // Make user an admin
      ctx.user!.role = "admin";
      const caller = appRouter.createCaller(ctx);

      const result = await caller.donations.listAllDonations();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should reject non-admin users", async () => {
      const { ctx } = createAuthContext();
      // Ensure user is not admin
      ctx.user!.role = "user";
      const caller = appRouter.createCaller(ctx);

      await expect(caller.donations.listAllDonations()).rejects.toThrow(
        "Admin access required"
      );
    });
  });
});
