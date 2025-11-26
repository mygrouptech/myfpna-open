import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Redirect to frontend with error message
 */
function redirectToErrorPage(res: Response, error: string, description: string) {
  const errorUrl = new URL("/auth/error", process.env.APP_URL || "http://localhost:3000");
  errorUrl.searchParams.set("error", error);
  errorUrl.searchParams.set("description", description);
  res.redirect(302, errorUrl.toString());
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");
    const errorDescription = getQueryParam(req, "error_description");

    // OAuth callback processing

    // If OAuth provider returned an error, log it and redirect to error page
    if (error) {
      console.error("[OAuth] Provider returned error:", { error, errorDescription });
      
      // For specific OAuth errors, provide helpful messages
      if (error === "access_denied") {
        return redirectToErrorPage(
          res,
          "Access Denied",
          "You cancelled the login process. Please try again if you want to access the application."
        );
      }
      
      if (error === "redirect_uri_mismatch" || errorDescription?.includes("redirect")) {
        return redirectToErrorPage(
          res,
          "Configuration Error",
          "The OAuth redirect URI is not configured correctly. Please contact the administrator."
        );
      }

      return redirectToErrorPage(
        res,
        error,
        errorDescription || "An authentication error occurred. Please try again."
      );
    }

    if (!code || !state) {
      console.error("[OAuth] Missing required parameters", { code: !!code, state: !!state });
      return redirectToErrorPage(
        res,
        "Invalid Request",
        "Missing required authentication parameters. Please try logging in again."
      );
    }

    try {
      // Decode state to get original redirect URI
      const decodedRedirectUri = atob(state);

      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        console.error("[OAuth] openId missing from user info");
        return redirectToErrorPage(
          res,
          "Authentication Failed",
          "User information is incomplete. Please try again or contact support."
        );
      }

      // organizationId will be auto-created in upsertUser if not provided
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      return redirectToErrorPage(
        res,
        "Authentication Failed",
        `An error occurred during authentication: ${errorMessage}. Please try again or contact support if the problem persists.`
      );
    }
  });
}
