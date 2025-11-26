# MyFPnA Suite - Deployment Guide

This guide walks you through deploying MyFPnA Suite to production on the Manus platform.

---

## 📋 Pre-Deployment Checklist

### Code & Testing
- ✅ All 25 tests passing (100% pass rate)
- ✅ TypeScript compilation: 0 errors
- ✅ Code pushed to GitHub: `github.com/mygrouptech/myfpna`
- ✅ README, LICENSE, and CONTRIBUTING files added
- ✅ Environment variables documented

### Features Validated
- ✅ Landing page with interactive demo
- ✅ OAuth authentication flow
- ✅ Scenario creation and management
- ✅ Budget line item CRUD operations
- ✅ AI-powered forecasting
- ✅ Analytics and variance tracking
- ✅ Reports and Excel/CSV export
- ✅ Donation system with Stripe integration

---

## 🚀 Deployment Steps

### Step 1: Review Current Checkpoint

The latest checkpoint (`913b8f2a`) includes:
- Enhanced landing page with interactive features
- Complete GitHub documentation
- All tests passing
- Production-ready configuration

### Step 2: Publish via Manus Dashboard

1. **Open the Manus Management UI** (right panel in your interface)
2. **Click the "Publish" button** in the top-right header
3. **Confirm the deployment** when prompted
4. **Wait for deployment to complete** (typically 1-2 minutes)

### Step 3: Verify Production Deployment

After publishing, verify these critical paths:

1. **Landing Page**
   - Visit: `https://myfpna.manus.space`
   - Test: All CTAs, demo toggle, smooth scrolling, FAQ

2. **Authentication**
   - Click "Get Started Free" or "Sign In"
   - Verify OAuth redirect works
   - Confirm successful login and redirect to dashboard

3. **Dashboard**
   - Verify KPI cards display correctly
   - Check quick actions are clickable
   - Confirm recent scenarios load

4. **Scenario Creation**
   - Click "New Scenario" button
   - Fill out form and create test scenario
   - Verify success toast and list refresh

5. **Budget Management**
   - Open a scenario
   - Add budget line items
   - Test edit and delete functionality
   - Verify calculations update correctly

6. **AI Forecasting**
   - Navigate to Forecasting page
   - Generate a forecast
   - Verify results display with confidence scores

7. **Analytics**
   - Navigate to Analytics page
   - Verify charts render correctly
   - Test variance calculations

8. **Donation Flow**
   - Navigate to Donate page
   - Test Stripe checkout (use test card: 4242 4242 4242 4242)
   - Verify success redirect

---

## 🔧 Post-Deployment Configuration

### Custom Domain Setup (Optional)

1. **Navigate to Settings → Domains** in Manus dashboard
2. **Add your custom domain** (e.g., `myfpna.com`)
3. **Update DNS records** as instructed by Manus
4. **Update OAuth callback URL** in Manus app settings:
   - Old: `https://myfpna.manus.space/api/oauth/callback`
   - New: `https://myfpna.com/api/oauth/callback`

### Stripe Production Setup

1. **Claim your Stripe test sandbox** (if not already done):
   - URL: Check project settings for claim link
   - Expires: 2026-01-21

2. **Switch to Stripe production mode** (when ready for real donations):
   - Get production API keys from Stripe dashboard
   - Update environment variables in Manus Settings → Secrets:
     - `STRIPE_SECRET_KEY` → `sk_live_...`
     - `VITE_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
     - `STRIPE_WEBHOOK_SECRET` → `whsec_...` (from production webhook)

3. **Set up production webhook**:
   - Endpoint: `https://myfpna.manus.space/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`

### Analytics Setup (Optional)

If you want to track usage:

1. **Choose an analytics provider** (e.g., Plausible, Umami, Google Analytics)
2. **Get your website ID and endpoint**
3. **Update environment variables** in Manus Settings → Secrets:
   - `VITE_ANALYTICS_WEBSITE_ID`
   - `VITE_ANALYTICS_ENDPOINT`

---

## 📊 Monitoring & Maintenance

### Health Checks

Monitor these indicators regularly:

1. **Application Health**
   - Dev server status (should be "running")
   - TypeScript compilation (should be 0 errors)
   - Test suite (should be 25/25 passing)

2. **Database Health**
   - Check connection in Settings → Database
   - Monitor query performance
   - Review error logs

3. **User Experience**
   - Monitor OAuth login success rate
   - Track scenario creation errors
   - Review forecast generation failures

### Regular Maintenance

**Weekly:**
- Review error logs in Manus dashboard
- Check for failed OAuth attempts
- Monitor donation transactions

**Monthly:**
- Review and update dependencies: `pnpm update`
- Run full test suite: `pnpm test`
- Check for TypeScript errors: `pnpm tsc --noEmit`
- Review GitHub issues and PRs

**Quarterly:**
- Update Node.js version if needed
- Review and optimize database queries
- Audit security dependencies: `pnpm audit`
- Update documentation

---

## 🐛 Troubleshooting

### OAuth Issues

**Problem:** "Redirect URI not set" error

**Solution:**
1. Verify callback URL in Manus app settings
2. Ensure it matches: `https://your-domain.com/api/oauth/callback`
3. Clear browser cookies and try again

**Problem:** Users stuck in OAuth loop

**Solution:**
1. Check JWT_SECRET is set correctly
2. Verify session cookie is being set (check browser DevTools)
3. Ensure HTTPS is enabled

### Database Issues

**Problem:** "Database connection failed"

**Solution:**
1. Check DATABASE_URL is correct
2. Verify database server is running
3. Check firewall rules allow connection
4. Test connection in Settings → Database

### Stripe Issues

**Problem:** "Invalid API key"

**Solution:**
1. Verify STRIPE_SECRET_KEY is set
2. Check you're using correct environment (test vs. production)
3. Regenerate API key in Stripe dashboard if needed

**Problem:** Webhook signature verification failed

**Solution:**
1. Verify STRIPE_WEBHOOK_SECRET matches webhook in Stripe dashboard
2. Check webhook endpoint URL is correct
3. Test webhook with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

---

## 🔒 Security Best Practices

### Production Checklist

- ✅ Use HTTPS for all connections
- ✅ Enable secure session cookies (httpOnly, secure, sameSite)
- ✅ Rotate JWT_SECRET regularly
- ✅ Use environment variables for all secrets (never commit to Git)
- ✅ Enable CORS only for trusted domains
- ✅ Implement rate limiting on API endpoints
- ✅ Sanitize user inputs
- ✅ Use parameterized queries (Drizzle ORM handles this)
- ✅ Keep dependencies up to date
- ✅ Monitor for security vulnerabilities: `pnpm audit`

### Secrets Management

**Never commit these to Git:**
- Database credentials
- API keys (Stripe, OpenAI, etc.)
- JWT secrets
- OAuth secrets

**Always use Manus Settings → Secrets** to manage environment variables in production.

---

## 📈 Performance Optimization

### Frontend

1. **Enable production build optimizations** (already configured):
   - Code splitting
   - Tree shaking
   - Minification
   - Asset compression

2. **Optimize images**:
   - Use WebP format
   - Add width/height attributes
   - Lazy load below-the-fold images

3. **Cache static assets**:
   - Already configured in `client/public/`
   - Use content hashing for cache busting

### Backend

1. **Database query optimization**:
   - Add indexes on frequently queried columns
   - Use `select()` to fetch only needed columns
   - Implement pagination for large datasets

2. **API response caching**:
   - Cache forecast results (they don't change frequently)
   - Cache analytics calculations
   - Use TanStack Query's built-in caching

3. **Rate limiting**:
   - Implement rate limits on expensive operations (AI forecasting)
   - Use Redis for distributed rate limiting (if scaling)

---

## 🎯 Success Metrics

Track these KPIs to measure success:

### User Engagement
- Daily/Monthly Active Users (DAU/MAU)
- Scenarios created per user
- Forecasts generated per user
- Average session duration
- Return user rate

### Feature Adoption
- % users using AI forecasting
- % users exporting reports
- % users making donations
- Average donation amount

### Technical Health
- Page load time (target: < 2s)
- API response time (target: < 500ms)
- Error rate (target: < 1%)
- Uptime (target: > 99.9%)

---

## 📞 Support & Resources

### Documentation
- **README:** Setup and installation guide
- **CONTRIBUTING:** Development guidelines
- **This Guide:** Deployment and maintenance

### Getting Help
- **GitHub Issues:** Report bugs and request features
- **GitHub Discussions:** Ask questions and share ideas
- **Email:** info@mygrouptech.com

### Useful Links
- **Live App:** https://myfpna.manus.space
- **GitHub Repo:** https://github.com/mygrouptech/myfpna
- **Manus Platform:** https://manus.im
- **Stripe Dashboard:** https://dashboard.stripe.com

---

## ✅ Deployment Complete!

Congratulations! Your MyFPnA Suite is now live and ready to help finance teams with their FP&A needs.

**What's Next?**

1. Share the app with your target users
2. Gather feedback and iterate
3. Monitor usage and performance
4. Plan next features based on user needs

**Happy Planning! 🎉**
