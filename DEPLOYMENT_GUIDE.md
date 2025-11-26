# MyFPnA Unified Deployment Guide

**Date:** November 25, 2025  
**Version:** 2.0.0 (Unified Build)  
**Supports:** Open-source and Premium deployments

---

## Overview

This unified build supports both **open-source** and **premium** deployments from a single codebase using feature flags. Choose your deployment path based on your license and requirements.

---

## Quick Start

### Open-Source Deployment

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env: Set LICENSE_TYPE=open

# 2. Install dependencies
pnpm install

# 3. Setup database
pnpm db:push

# 4. Build and start
pnpm build
pnpm start
```

### Premium Deployment (Manus Platform)

```bash
# 1. Push to GitHub
git push origin main

# 2. Configure Manus environment variables
# LICENSE_TYPE=premium
# OPENAI_API_KEY=<your-key>
# STRIPE_SECRET_KEY=<your-key>

# 3. Deploy via Manus dashboard
# Click "Publish" button
```

---

## Environment Configuration

### Required Variables (Both Licenses)

```bash
# License Type
LICENSE_TYPE=open  # or 'premium'

# Database
DATABASE_URL=mysql://user:password@localhost:3306/myfpna

# Application
NODE_ENV=production
PORT=3000
APP_URL=https://your-domain.com

# Authentication
MAGIC_LINK_SECRET=<generate-random-secret>
SESSION_SECRET=<generate-random-secret>
```

### Premium-Only Variables

```bash
# AI Services
OPENAI_API_KEY=sk-...

# Stripe (for donations)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Feature Flags
ENABLE_AI_FORECASTING=true
ENABLE_AI_ANOMALY_DETECTION=true
ENABLE_AI_COMMENTARY=true
ENABLE_STRIPE_DONATIONS=true
ENABLE_PDF_EXPORT=true
ENABLE_EXCEL_EXPORT=true
```

---

## Feature Availability Matrix

| Feature | Open | Premium |
|---------|------|---------|
| Scenario Management | ✅ | ✅ |
| Budget Planning | ✅ | ✅ |
| Actuals Import | ✅ | ✅ |
| Variance Analysis | ✅ | ✅ |
| Basic Analytics | ✅ | ✅ |
| CSV Export | ✅ | ✅ |
| Audit Logs | ✅ | ✅ |
| Multi-user | ✅ | ✅ |
| AI Forecasting | ❌ | ✅ |
| AI Anomaly Detection | ❌ | ✅ |
| AI Commentary | ❌ | ✅ |
| Excel Export | ❌ | ✅ |
| PDF Export | ❌ | ✅ |
| Stripe Donations | ❌ | ✅ |

---

## Database Setup

### Create Database

```sql
CREATE DATABASE myfpna CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Run Migrations

```bash
pnpm db:push
```

This creates 15 tables:
- Core: organizations, users, scenarios, budget_line_items, actuals, forecasts
- Features: background_jobs, audit_logs, saved_reports, donations
- Premium: feature_flags, ai_usage, anomalies, saved_commentaries, export_jobs

---

## Deployment Options

### Option 1: Manus Platform (Recommended for Premium)

**Advantages:**
- Automatic deployments
- Built-in database
- Environment variable management
- SSL certificates included
- Monitoring and logs

**Steps:**
1. Push code to GitHub
2. Configure environment variables in Manus dashboard
3. Click "Publish"
4. Access at `https://myfpna.manus.space`

### Option 2: Docker

```bash
# Build image
docker build -t myfpna:latest .

# Run container
docker run -d \
  --name myfpna \
  -p 3000:3000 \
  --env-file .env \
  myfpna:latest
```

### Option 3: PM2 (Node Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name myfpna

# Save configuration
pm2 save

# Setup auto-start
pm2 startup
```

### Option 4: Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/myfpna.service
```

```ini
[Unit]
Description=MyFPnA Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/myfpna-unified
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable myfpna
sudo systemctl start myfpna
```

---

## Verification

### Health Check

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

### Feature Check

```bash
# Check available features
curl http://localhost:3000/api/features
```

### Database Check

```bash
# Open Drizzle Studio
pnpm db:studio
```

Access at `http://localhost:4983`

---

## Troubleshooting

### Issue: Database Connection Failed

```
Error: ECONNREFUSED
```

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check MySQL is running: `sudo systemctl status mysql`
3. Test connection: `mysql -h host -u user -p database`

### Issue: AI Features Not Working

```
Error: OPENAI_API_KEY is not configured
```

**Solutions:**
1. Set `LICENSE_TYPE=premium`
2. Configure `OPENAI_API_KEY`
3. Verify API key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Issue: Build Fails

```
Error: TypeScript compilation failed
```

**Solutions:**
1. Clear cache: `rm -rf node_modules pnpm-lock.yaml dist .vite`
2. Reinstall: `pnpm install`
3. Rebuild: `pnpm build`

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database credentials rotated regularly
- [ ] API keys in secure vault
- [ ] Firewall configured
- [ ] Database backups automated
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Security headers set
- [ ] Dependencies updated

---

## Monitoring

### Application Logs

```bash
# PM2
pm2 logs myfpna

# Docker
docker logs -f myfpna

# Systemd
sudo journalctl -u myfpna -f
```

### Database Performance

```sql
-- Check table sizes
SELECT 
  table_name, 
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'myfpna'
ORDER BY size_mb DESC;
```

### AI Usage Monitoring

```sql
-- Check AI usage by user (last 30 days)
SELECT 
  u.email,
  COUNT(*) as total_calls,
  SUM(cost_cents) / 100 as total_cost_usd
FROM ai_usage au
JOIN users u ON au.user_id = u.id
WHERE au.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.email
ORDER BY total_cost_usd DESC;
```

---

## Backup & Recovery

### Database Backup

```bash
# Backup
mysqldump -u user -p myfpna > backup_$(date +%Y%m%d).sql

# Restore
mysql -u user -p myfpna < backup_20251125.sql
```

### Application Backup

```bash
# Backup environment
cp .env .env.backup

# Backup uploads (if using local storage)
tar -czf uploads_$(date +%Y%m%d).tar.gz uploads/
```

---

## Scaling

### Horizontal Scaling

1. **Load Balancer:** Nginx or HAProxy
2. **Multiple Instances:** Run multiple app instances
3. **Shared Database:** All instances connect to same MySQL
4. **Session Storage:** Use Redis for shared sessions

### Vertical Scaling

1. **Increase Resources:** More CPU/RAM
2. **Database Optimization:** Add indexes, optimize queries
3. **Caching:** Add Redis for frequently accessed data

---

## Support

### Open-Source
- **GitHub Issues:** https://github.com/mygrouptech/myfpna-open/issues
- **Documentation:** See README.md and docs/

### Premium
- **Support:** https://help.manus.im
- **Priority Support:** Available for donors
- **Documentation:** See README.md and docs/

---

**Deployment Guide Version:** 2.0.0  
**Last Updated:** November 25, 2025  
**Unified Build:** Supports both open-source and premium deployments
