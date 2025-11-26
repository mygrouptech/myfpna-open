import type { Express, Request, Response } from "express";
import { ENV } from "./env";
import * as db from "../db";

/**
 * Health check endpoint for monitoring and deployment verification
 */
export function registerHealthRoutes(app: Express) {
  app.get("/api/health", async (req: Request, res: Response) => {
    const checks: Record<string, any> = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: ENV.isProduction ? "production" : "development",
    };

    let overallStatus = 200;

    // Check database connectivity
    try {
      await db.getUserByOpenId("health-check-test");
      checks.database = { status: "connected", message: "Database is accessible" };
    } catch (error) {
      checks.database = { 
        status: "error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      };
      overallStatus = 503;
    }

    // Check OAuth configuration
    checks.oauth = {
      configured: !!(ENV.oAuthServerUrl && ENV.appId),
      serverUrl: ENV.oAuthServerUrl ? "configured" : "missing",
      appId: ENV.appId ? "configured" : "missing",
    };

    if (!checks.oauth.configured) {
      overallStatus = 503;
    }

    // Check required environment variables
    const requiredVars = [
      "DATABASE_URL",
      "JWT_SECRET",
      "OAUTH_SERVER_URL",
      "VITE_APP_ID",
      "OWNER_OPEN_ID",
    ];

    const missingVars = requiredVars.filter(
      (varName) => !process.env[varName]
    );

    checks.configuration = {
      status: missingVars.length === 0 ? "ok" : "incomplete",
      missingVariables: missingVars,
    };

    if (missingVars.length > 0) {
      overallStatus = 503;
    }

    // Set overall status
    if (overallStatus !== 200) {
      checks.status = "degraded";
    }

    res.status(overallStatus).json(checks);
  });

  // Simple ping endpoint for basic uptime monitoring
  app.get("/api/ping", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
}
