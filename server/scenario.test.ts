import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(role: "admin" | "manager" | "analyst" | "viewer" = "manager"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    organizationId: 1,
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Scenario Management", () => {
  it("should allow managers to create scenarios", async () => {
    const ctx = createTestContext("manager");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scenario.create({
      name: "2024 Annual Budget",
      scenarioType: "budget",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      currency: "USD",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should prevent analysts from creating scenarios", async () => {
    const ctx = createTestContext("analyst");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.scenario.create({
        name: "Test Scenario",
        scenarioType: "budget",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      })
    ).rejects.toThrow("Manager or admin access required");
  });

  it("should allow all authenticated users to list scenarios", async () => {
    const ctx = createTestContext("analyst");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scenario.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Budget Line Items", () => {
  it("should allow managers to create budget line items", async () => {
    const ctx = createTestContext("manager");
    const caller = appRouter.createCaller(ctx);

    // First create a scenario
    const scenario = await caller.scenario.create({
      name: "Test Budget",
      scenarioType: "budget",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    });

    // Then add a line item
    const lineItem = await caller.budget.createLineItem({
      scenarioId: scenario.id,
      accountName: "Marketing Expenses",
      category: "Operating Expenses",
      period: new Date("2024-01-01"),
      amount: 50000, // $500.00 in cents
    });

    expect(lineItem).toHaveProperty("id");
    expect(typeof lineItem.id).toBe("number");
  });

  it("should retrieve budget line items for a scenario", async () => {
    const ctx = createTestContext("analyst");
    const caller = appRouter.createCaller(ctx);

    // Create scenario and line item
    const managerCtx = createTestContext("manager");
    const managerCaller = appRouter.createCaller(managerCtx);
    
    const scenario = await managerCaller.scenario.create({
      name: "Test Budget 2",
      scenarioType: "budget",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    });

    await managerCaller.budget.createLineItem({
      scenarioId: scenario.id,
      accountName: "Sales Revenue",
      period: new Date("2024-01-01"),
      amount: 100000,
    });

    // Retrieve as analyst
    const lineItems = await caller.budget.getLineItems({ scenarioId: scenario.id });
    expect(Array.isArray(lineItems)).toBe(true);
    expect(lineItems.length).toBeGreaterThan(0);
    expect(lineItems[0]).toHaveProperty("accountName");
  });
});

describe("Analytics Dashboard", () => {
  it("should calculate dashboard KPIs correctly", async () => {
    const ctx = createTestContext("analyst");
    const caller = appRouter.createCaller(ctx);

    const dashboard = await caller.analytics.dashboard({});
    
    expect(dashboard).toHaveProperty("totalBudget");
    expect(dashboard).toHaveProperty("totalActuals");
    expect(dashboard).toHaveProperty("variance");
    expect(dashboard).toHaveProperty("variancePercent");
    expect(typeof dashboard.totalBudget).toBe("number");
  });
});

describe("Role-Based Access Control", () => {
  it("should allow admins to approve scenarios", async () => {
    const adminCtx = createTestContext("admin");
    const adminCaller = appRouter.createCaller(adminCtx);
    
    const managerCtx = createTestContext("manager");
    const managerCaller = appRouter.createCaller(managerCtx);

    // Create scenario as manager
    const scenario = await managerCaller.scenario.create({
      name: "Approval Test",
      scenarioType: "budget",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    });

    // Approve as admin
    const result = await adminCaller.scenario.approve({ id: scenario.id });
    expect(result.success).toBe(true);
  });

  it("should prevent managers from approving scenarios", async () => {
    const ctx = createTestContext("manager");
    const caller = appRouter.createCaller(ctx);

    const scenario = await caller.scenario.create({
      name: "Test",
      scenarioType: "budget",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    });

    await expect(
      caller.scenario.approve({ id: scenario.id })
    ).rejects.toThrow("Admin access required");
  });
});
