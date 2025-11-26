import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";

import { registerHealthRoutes } from "./health";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { verifyStripeSignature } from "../stripe";
import * as donationsDb from "../donations-db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook endpoint - MUST come before body parser
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const signature = req.headers["stripe-signature"];
      
      if (!signature || typeof signature !== "string") {
        console.error("[Stripe Webhook] Missing signature");
        return res.status(400).send("Missing signature");
      }
      
      try {
        const event = verifyStripeSignature(req.body, signature);
        
        // Handle checkout.session.completed event
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as any;
          
          // Check if donation already exists (idempotency)
          const existing = await donationsDb.getDonationBySessionId(session.id);
          if (existing) {
            return res.json({ received: true });
          }
          
          // Create donation record
          await donationsDb.createDonation({
            userId: session.metadata?.userId && session.metadata.userId !== "anonymous" 
              ? parseInt(session.metadata.userId) 
              : null,
            amount: session.amount_total || 0,
            currency: session.currency || "usd",
            stripeSessionId: session.id,
            stripeCustomerId: session.customer || null,
            stripePaymentIntentId: session.payment_intent || null,
          });
        }
        
        res.json({ received: true });
      } catch (err) {
        const error = err as Error;
        console.error("[Stripe Webhook] Error:", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
      }
    }
  );
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Health check endpoints
  registerHealthRoutes(app);
  
  
  // OAuth callback under /api/oauth/callback (legacy)
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  server.listen(port, () => {
    if (process.env.NODE_ENV === "development") {
      console.log(`Server running on http://localhost:${port}/`);
    }
  });
}

startServer().catch(console.error);
