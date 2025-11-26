# MyFPnA Suite - Deployment Guide

This guide provides step-by-step instructions for deploying the MyFPnA Suite application to production.

---

## Prerequisites

Before deploying, ensure you have:

1. **Manus Account** - Sign up at [https://manus.im](https://manus.im)
2. **Manus OAuth Application** - Create an app in the Manus dashboard
3. **Database** - MySQL or TiDB database instance
4. **Stripe Account** (Optional) - For donation functionality
5. **Domain Name** (Optional) - For custom domain deployment

---

## Step 1: Configure Manus OAuth Application

### 1.1 Create OAuth Application

1. Log in to [Manus Dashboard](https://manus.im/dashboard)
2. Navigate to **Applications** → **Create New Application**
3. Fill in application details:
   - **Name:** MyFPnA Suite
   - **Description:** Enterprise FP&A Platform
   - **Type:** Web Application

### 1.2 Configure OAuth Redirect URIs

**CRITICAL:** You must add the correct redirect URI to your Manus OAuth application.

1. In your Manus application settings, find **OAuth Redirect URIs**
2. Add the following URI (replace with your actual domain):
   ```
   https://myfpna.manus.space/api/oauth/callback
   ```
3. For local development, also add:
   ```
   http://localhost:3000/api/oauth/callback
   ```
4. Save the configuration

### 1.3 Note Your Credentials

Copy the following from your Manus application:
- **Application ID** (VITE_APP_ID)
- **Forge API Key** (BUILT_IN_FORGE_API_KEY)
- **Your Open ID** (OWNER_OPEN_ID) - found in your profile

---

## Step 2: Set Up Database

### 2.1 Create Database

Create a MySQL or TiDB database:

```sql
CREATE DATABASE myfpna CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2.2 Note Connection String

Format your database URL:
```
mysql://username:password@host:port/myfpna
```

Example:
```
mysql://admin:SecurePass123@db.example.com:3306/myfpna
```

---

## Step 3: Configure Environment Variables

### 3.1 Copy Environment Template

```bash
cp .env.example .env
```

### 3.2 Fill in Required Variables

Edit `.env` and configure the following:

#### Database Configuration
```env
DATABASE_URL=mysql://username:password@host:port/myfpna
```

#### Authentication
```env
JWT_SECRET=<generate-strong-random-string>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=<your-manus-app-id>
OWNER_OPEN_ID=<your-manus-open-id>
OWNER_NAME=Your Name
```

**Generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

#### Manus APIs
```env
BUILT_IN_FORGE_API_URL=https://forge-api.manus.im
BUILT_IN_FORGE_API_KEY=<your-forge-api-key>
VITE_FRONTEND_FORGE_API_URL=https://forge-api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<your-forge-api-key>
```

#### Application Configuration
```env
VITE_APP_TITLE=MyFPnA Suite - Enterprise FP&A Platform
VITE_APP_LOGO=/logo.svg
APP_URL=https://myfpna.manus.space
```

#### Stripe (Optional)
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Step 4: Install Dependencies

```bash
pnpm install
```

If you don't have pnpm:
```bash
npm install -g pnpm
```

---

## Step 5: Run Database Migrations

```bash
pnpm db:push
```

This will:
1. Generate migration files from schema
2. Apply migrations to your database
3. Create all necessary tables

---

## Step 6: Build for Production

```bash
pnpm build
```

This creates:
- `dist/client/` - Frontend static files
- `dist/index.js` - Backend server bundle

---

## Step 7: Deploy to Manus Platform

### 7.1 Using Manus Dashboard

1. Log in to [Manus Dashboard](https://manus.im/dashboard)
2. Navigate to **Deployments** → **New Deployment**
3. Select your repository or upload files
4. Configure environment variables in the dashboard
5. Click **Deploy**

### 7.2 Using Manus CLI (Alternative)

```bash
# Install Manus CLI
npm install -g @manus/cli

# Login
manus login

# Deploy
manus deploy
```

---

## Step 8: Verify Deployment

### 8.1 Check Health Endpoint

Visit: `https://your-domain.manus.space/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-22T...",
  "version": "1.0.0",
  "environment": "production",
  "database": {
    "status": "connected",
    "message": "Database is accessible"
  },
  "oauth": {
    "configured": true,
    "serverUrl": "configured",
    "appId": "configured"
  },
  "configuration": {
    "status": "ok",
    "missingVariables": []
  }
}
```

### 8.2 Test Authentication Flow

1. Visit your application URL
2. Click "Sign In" or "Get Started"
3. Complete OAuth flow
4. Verify successful login and redirect to dashboard

### 8.3 Test Core Features

- [ ] Create a new scenario
- [ ] Add budget line items
- [ ] Generate AI forecast
- [ ] View analytics dashboard
- [ ] Export data to Excel
- [ ] Test donation flow (if enabled)

---

## Step 9: Configure Custom Domain (Optional)

### 9.1 In Manus Dashboard

1. Navigate to your deployment settings
2. Add custom domain: `fpna.yourdomain.com`
3. Copy the provided DNS records

### 9.2 Update DNS

Add the following records to your DNS provider:

```
CNAME  fpna  your-deployment.manus.space
```

### 9.3 Update Environment Variables

Update `APP_URL` to your custom domain:
```env
APP_URL=https://fpna.yourdomain.com
```

### 9.4 Update OAuth Redirect URI

In Manus OAuth settings, add:
```
https://fpna.yourdomain.com/api/oauth/callback
```

---

## Step 10: Set Up Monitoring

### 10.1 Health Check Monitoring

Use a service like UptimeRobot or Pingdom to monitor:
- `https://your-domain.manus.space/api/ping`
- Check interval: 5 minutes
- Alert on: HTTP status ≠ 200

### 10.2 Error Logging

Monitor application logs in Manus Dashboard:
1. Navigate to your deployment
2. Click **Logs**
3. Set up log alerts for errors

### 10.3 Analytics (Optional)

If using analytics, verify tracking:
```env
VITE_ANALYTICS_WEBSITE_ID=your-id
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
```

---

## Troubleshooting

### OAuth Error: "Redirect URI is not set"

**Solution:**
1. Verify redirect URI is added to Manus OAuth app
2. Ensure `APP_URL` matches your deployment URL
3. Check that `VITE_APP_ID` matches your OAuth app ID

### Database Connection Failed

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check database server is accessible
3. Verify database user has proper permissions
4. Test connection: `mysql -h host -u user -p database`

### Build Errors

**Solution:**
1. Clear node_modules: `rm -rf node_modules`
2. Clear pnpm cache: `pnpm store prune`
3. Reinstall: `pnpm install`
4. Rebuild: `pnpm build`

### Application Not Loading

**Solution:**
1. Check health endpoint: `/api/health`
2. Review logs in Manus Dashboard
3. Verify all environment variables are set
4. Check browser console for errors

---

## Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install dependencies
pnpm install

# Run migrations
pnpm db:push

# Build
pnpm build

# Deploy
# (Use Manus Dashboard or CLI)
```

### Database Backups

Set up automated backups:
1. Use your database provider's backup feature
2. Schedule daily backups
3. Test restore procedure monthly

### Security Updates

- Monitor dependencies: `pnpm audit`
- Update regularly: `pnpm update`
- Review security advisories

---

## Support

- **Documentation:** [README.md](./README.md)
- **Issues:** [GitHub Issues](https://github.com/mygrouptech/myfpna/issues)
- **Email:** info@mygrouptech.com
- **Manus Support:** https://help.manus.im

---

## Checklist

Before going live, verify:

- [ ] OAuth redirect URI configured in Manus dashboard
- [ ] All environment variables set correctly
- [ ] Database migrations applied successfully
- [ ] Health endpoint returns 200 OK
- [ ] Authentication flow works end-to-end
- [ ] Core features tested and working
- [ ] SSL certificate active (HTTPS)
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Documentation updated

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Deployment URL:** _____________  

---

© 2025 MyFPnA Suite. All rights reserved.
