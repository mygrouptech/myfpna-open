export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "MyFPnA Suite";

// Use CDN URL for professional logo (shield + growth chart design)
export const APP_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/100327013/ZxeapymFcErkANZU.png";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// Currency formatting helper
export function formatCurrency(amountInCents: number, currency: string = "USD"): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Date formatting helper
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Percentage formatting helper
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Role display names
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  analyst: 'Analyst',
  viewer: 'Viewer',
};

// Scenario status labels
export const SCENARIO_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
  approved: 'Approved',
};

// Scenario type labels
export const SCENARIO_TYPE_LABELS: Record<string, string> = {
  budget: 'Budget',
  forecast: 'Forecast',
  actual: 'Actual',
  what_if: 'What-If Analysis',
};
