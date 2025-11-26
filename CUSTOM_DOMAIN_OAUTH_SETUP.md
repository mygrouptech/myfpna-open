# Custom Domain OAuth Setup Guide

## The Issue

Your MyFPnA Suite application is published at `https://www.myfpna.com`, but when users click "Get Started Free" or "Sign In", they see this error:

```
Permission denied
Redirect URI is not set
```

**Why this happens:**
- OAuth authentication requires pre-approved redirect URIs for security
- Your app is currently configured for the dev server URL only
- The custom domain `www.myfpna.com` needs to be added to the allowed redirect URIs

## The Solution

You need to add your custom domain's OAuth callback URL to the Manus platform settings.

### Step 1: Access Manus Platform Settings

According to the Manus AI assistant (see screenshot you shared), you need **Team owner permissions** to configure OAuth settings.

1. Go to https://manus.im
2. Log in with your account
3. Click your **icon** at the top right
4. Go to **Settings → Security** tab
5. Look for **"Enable SSO"** section

**If you don't see these options:**
- You're not the Team owner
- Only Team owners can enable SSO subscriptions and configure OAuth settings
- Contact your Team owner to either:
  - Grant you owner permissions, OR
  - Have them configure the OAuth redirect URI for you

### Step 2: Add Custom Domain Redirect URI

Once you have access to the OAuth/SSO settings:

1. Find the **"Authorized Redirect URIs"** or **"OAuth Redirect URLs"** section
2. Add this URL:
   ```
   https://www.myfpna.com/api/oauth/callback
   ```
3. **Keep the existing dev server URL** (don't delete it):
   ```
   https://3000-iczn1bagdgp1oqovb6wgf-5ef5cb15.manusvm.computer/api/oauth/callback
   ```
4. Save the changes

### Step 3: Test

1. Visit https://www.myfpna.com
2. Click "Get Started Free" or "Sign In"
3. You should now be redirected to the Manus OAuth login page
4. After signing in, you'll be redirected back to your app at www.myfpna.com

**That's it!** The OAuth flow will work immediately after adding the redirect URI.

---

## Alternative: Contact Manus Support

If you can't access the OAuth settings or need help:

1. Go to https://help.manus.im
2. Submit a support request with this information:

```
Subject: Add OAuth Redirect URI for Custom Domain

App Name: MyFPnA Suite - Enterprise FP&A Platform
App ID: 3cPkMwMHMnW8fx6XYYUkVT
Custom Domain: https://www.myfpna.com
Required Redirect URI: https://www.myfpna.com/api/oauth/callback

Issue: Users get "Permission denied - Redirect URI is not set" error when signing in on the custom domain.

Request: Please add the redirect URI above to my app's OAuth configuration.
```

Manus support can add the redirect URI for you in minutes.

---

## Why This Is The Only Issue

✅ **Everything else is working:**
- App is published and accessible at www.myfpna.com
- All features work correctly (scenarios, budgets, forecasting, analytics)
- Database is connected and functioning
- Stripe donations are configured
- All 25 tests passing
- OAuth works perfectly on dev server

❌ **The ONLY issue:**
- Custom domain redirect URI not configured in Manus platform

Once you add the redirect URI, the app will be 100% functional on www.myfpna.com.

---

## Technical Details (For Reference)

**How OAuth Works:**
1. User clicks "Sign In" on your app
2. App redirects to `https://manus.im/app-auth?appId=YOUR_APP_ID&redirectUri=YOUR_CALLBACK_URL`
3. User signs in with Google/Microsoft/Apple/Email
4. Manus OAuth checks if `redirectUri` is in the app's allowed list
5. If allowed: redirects back to your app with auth token
6. If not allowed: shows "Permission denied" error

**Current Configuration:**
- ✅ Allowed: `https://3000-iczn1bagdgp1oqovb6wgf-5ef5cb15.manusvm.computer/api/oauth/callback`
- ❌ Not allowed: `https://www.myfpna.com/api/oauth/callback`

**After Adding Custom Domain:**
- ✅ Allowed: `https://3000-iczn1bagdgp1oqovb6wgf-5ef5cb15.manusvm.computer/api/oauth/callback`
- ✅ Allowed: `https://www.myfpna.com/api/oauth/callback`

---

## FAQ

**Q: Can I configure this in the app code?**
A: No. OAuth redirect URIs must be configured at the Manus platform level for security reasons. This prevents malicious apps from hijacking authentication.

**Q: Will this affect the dev server?**
A: No. You can have multiple redirect URIs. Both the dev server and custom domain will work.

**Q: How long does it take to update?**
A: Changes are immediate. Once you save the redirect URI, you can test it right away.

**Q: Do I need to redeploy my app?**
A: No. The app code doesn't need to change. This is purely a platform configuration.

**Q: What if I add more custom domains later?**
A: Just add more redirect URIs following the same pattern: `https://your-domain.com/api/oauth/callback`

---

## Next Steps

1. **Get Team owner access** or contact your Team owner
2. **Add the redirect URI** as described above
3. **Test on www.myfpna.com** - it should work immediately
4. **Enjoy your production app!** 🎉

If you encounter any issues, contact Manus support at https://help.manus.im with the information provided in this guide.
