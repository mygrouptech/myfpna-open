# OAuth Redirect URI Configuration - Quick Fix Guide

## Problem

Users encounter "Permission denied - Redirect URI is not set" error when trying to log in or create an account.

## Root Cause

The OAuth redirect URI is not registered in the Manus OAuth application settings. When users attempt to authenticate, the OAuth provider (Manus) rejects the redirect because the URI is not in the allowed list.

---

## Solution: Configure Redirect URI in Manus Dashboard

### Step 1: Access Manus Dashboard

1. Go to [https://manus.im/dashboard](https://manus.im/dashboard)
2. Log in with your Manus account

### Step 2: Find Your Application

1. Navigate to **Applications** or **OAuth Applications**
2. Locate your **MyFPnA Suite** application
3. Click on it to open settings

### Step 3: Add Redirect URI

1. Find the **OAuth Redirect URIs** or **Allowed Redirect URIs** section
2. Click **Add URI** or **Add Redirect URI**
3. Enter the following URI:

   ```
   https://myfpna.manus.space/api/oauth/callback
   ```

4. If you're also testing locally, add:

   ```
   http://localhost:3000/api/oauth/callback
   ```

5. Click **Save** or **Update**

### Step 4: Verify Configuration

1. Ensure the redirect URI exactly matches your deployment URL
2. Check for typos or extra spaces
3. Verify the protocol (https:// vs http://)
4. Confirm the path is `/api/oauth/callback`

---

## How to Find Your Deployment URL

Your redirect URI should be in this format:
```
{YOUR_DEPLOYMENT_URL}/api/oauth/callback
```

Examples:
- Manus subdomain: `https://myfpna.manus.space/api/oauth/callback`
- Custom domain: `https://fpna.yourdomain.com/api/oauth/callback`
- Local development: `http://localhost:3000/api/oauth/callback`

---

## Verification Steps

After configuring the redirect URI:

### 1. Test Authentication Flow

1. Open your application in a browser
2. Click "Sign In" or "Get Started"
3. You should be redirected to Manus OAuth page
4. Complete the login
5. You should be redirected back to your application successfully

### 2. Check for Errors

If you still see errors:
- Clear browser cookies and cache
- Try in an incognito/private window
- Check browser console for errors (F12 → Console tab)

### 3. Verify Environment Variables

Ensure these environment variables are correctly set:

```env
VITE_APP_ID=<your-manus-app-id>
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OAUTH_SERVER_URL=https://api.manus.im
APP_URL=https://myfpna.manus.space
```

---

## Common Mistakes

### ❌ Wrong: Missing /api/oauth/callback
```
https://myfpna.manus.space
```

### ✅ Correct: Include full path
```
https://myfpna.manus.space/api/oauth/callback
```

---

### ❌ Wrong: Trailing slash
```
https://myfpna.manus.space/api/oauth/callback/
```

### ✅ Correct: No trailing slash
```
https://myfpna.manus.space/api/oauth/callback
```

---

### ❌ Wrong: HTTP instead of HTTPS (production)
```
http://myfpna.manus.space/api/oauth/callback
```

### ✅ Correct: HTTPS for production
```
https://myfpna.manus.space/api/oauth/callback
```

---

## Still Having Issues?

### Check Application Logs

1. Go to Manus Dashboard → Your Deployment → Logs
2. Look for OAuth-related errors
3. Check for messages like:
   - `[OAuth] Provider returned error`
   - `[OAuth] Callback received`
   - `redirect_uri_mismatch`

### Verify APP_ID Matches

1. In Manus Dashboard, copy your Application ID
2. Compare with `VITE_APP_ID` in your environment variables
3. They must match exactly

### Test Health Endpoint

Visit: `https://myfpna.manus.space/api/health`

Check the `oauth` section:
```json
{
  "oauth": {
    "configured": true,
    "serverUrl": "configured",
    "appId": "configured"
  }
}
```

If any value is `false` or `"missing"`, update your environment variables.

---

## Contact Support

If you've followed all steps and still have issues:

1. **GitHub Issues:** [mygrouptech/myfpna/issues](https://github.com/mygrouptech/myfpna/issues)
2. **Manus Support:** [https://help.manus.im](https://help.manus.im)
3. **Email:** info@mygrouptech.com

Include:
- Screenshot of the error
- Your deployment URL
- Screenshot of OAuth redirect URI configuration
- Health endpoint response

---

## Quick Reference

| Setting | Value |
|---------|-------|
| Redirect URI | `https://myfpna.manus.space/api/oauth/callback` |
| OAuth Portal URL | `https://auth.manus.im` |
| OAuth Server URL | `https://api.manus.im` |
| Callback Path | `/api/oauth/callback` |

---

**Last Updated:** November 22, 2025  
**Status:** Critical Fix Required
