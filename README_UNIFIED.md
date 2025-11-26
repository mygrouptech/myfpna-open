# MyFPnA - Financial Planning & Analysis Platform

**Version:** 2.0.0 (Unified Build)  
**Date:** November 25, 2025  
**License:** Dual (MIT for open-source / Proprietary for premium)

---

## Overview

MyFPnA is a comprehensive Financial Planning & Analysis (FP&A) platform that helps finance teams manage budgets, track actuals, analyze variances, and generate forecasts. Available in both **open-source** and **premium** versions from a single unified codebase.

---

## Features

### Core Features (Both Open & Premium)

✅ **Scenario Management**
- Create and manage multiple budget scenarios
- Approval workflows
- Scenario comparison

✅ **Budget Planning**
- Line-item budget creation
- Bulk CSV import
- Account hierarchy support
- Period-based budgeting

✅ **Actuals Tracking**
- Import actual financial data
- Manual entry and bulk import
- Historical data management

✅ **Variance Analysis**
- Budget vs actuals comparison
- Variance calculations (amount and percentage)
- Drill-down capabilities

✅ **Analytics Dashboard**
- KPI calculations
- Trend analysis
- Visual charts and graphs

✅ **Export & Reporting**
- CSV export
- Custom report builder
- Saved report templates

✅ **Multi-User & Multi-Tenant**
- Organization support
- Role-based access control (Admin, Manager, Analyst, Viewer)
- Audit logging

### Premium Features Only

🚀 **AI-Powered Forecasting**
- GPT-4 integration for intelligent forecasts
- Multiple forecasting methodologies
- Confidence scoring

🔍 **AI Anomaly Detection**
- Statistical anomaly detection (Z-score, IQR)
- AI-powered pattern recognition
- Budget overrun alerts
- Trend break detection

💬 **AI Commentary Generation**
- Executive summaries
- Key insights and recommendations
- Risk factors and opportunities
- Multi-model support (GPT-4, Claude, Manus Forge)

📊 **Advanced Export**
- Excel export with formatting
- PDF report generation
- Scheduled exports

💳 **Monetization**
- Stripe donation integration
- Donor tier management
- Usage tracking

---

## Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Query** - Data fetching
- **Radix UI** - Component library
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization

### Backend
- **Express** - Web server
- **tRPC** - Type-safe API
- **Drizzle ORM** - Database ORM
- **MySQL** - Database
- **Stripe** - Payment processing
- **OpenAI** - AI features

### Infrastructure
- **pnpm** - Package manager
- **Manus Runtime** - Deployment platform
- **Docker** - Containerization

---

## Quick Start

### Prerequisites

- Node.js 22.x or higher
- pnpm 9.x or higher
- MySQL 8.0+ or PostgreSQL 14+

### Installation

```bash
# Clone repository
git clone https://github.com/mygrouptech/myfpna-unified.git
cd myfpna-unified

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
pnpm db:push

# Start development server
pnpm dev
```

Access at `http://localhost:3000`

---

## Configuration

### Open-Source Configuration

```bash
LICENSE_TYPE=open
DATABASE_URL=mysql://user:password@localhost:3306/myfpna
MAGIC_LINK_SECRET=<your-secret>
SESSION_SECRET=<your-secret>
```

### Premium Configuration

```bash
LICENSE_TYPE=premium
DATABASE_URL=mysql://user:password@localhost:3306/myfpna
MAGIC_LINK_SECRET=<your-secret>
SESSION_SECRET=<your-secret>
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

See `.env.example` for complete configuration options.

---

## Project Structure

```
myfpna-unified/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities
│   │   └── main.tsx        # Entry point
│   └── public/             # Static assets
├── server/                 # Express backend
│   ├── _core/              # Manus runtime core
│   ├── ai/                 # AI features
│   │   ├── anomaly-detection.ts
│   │   └── commentary.ts
│   ├── export/             # Export utilities
│   │   └── csv.ts
│   ├── routers.ts          # tRPC routers
│   ├── db.ts               # Database operations
│   └── stripe.ts           # Stripe integration
├── shared/                 # Shared code
│   ├── feature-flags.ts    # Feature flag system
│   ├── const.ts            # Constants
│   └── types.ts            # Type definitions
├── drizzle/                # Database
│   ├── schema.ts           # Database schema
│   └── *.sql               # Migrations
├── .env.example            # Environment template
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
└── drizzle.config.ts       # Drizzle configuration
```

---

## Development

### Available Scripts

```bash
# Development
pnpm dev          # Start dev server with HMR
pnpm build        # Build for production
pnpm start        # Start production server
pnpm preview      # Preview production build

# Database
pnpm db:push      # Generate and apply migrations
pnpm db:studio    # Open Drizzle Studio

# Quality
pnpm check        # TypeScript type checking
pnpm lint         # Lint code
pnpm format       # Format code
pnpm test         # Run tests
```

### Database Schema

The application uses 15 tables:

**Core Tables:**
- `organizations` - Multi-tenant support
- `users` - User accounts
- `scenarios` - Budget scenarios
- `budget_line_items` - Budget data
- `actuals` - Actual financial data
- `forecasts` - AI forecasts

**Feature Tables:**
- `background_jobs` - Async job tracking
- `audit_logs` - Audit trail
- `saved_reports` - Custom reports
- `donations` - Stripe donations

**Premium Tables:**
- `feature_flags` - Feature access control
- `ai_usage` - AI usage tracking
- `anomalies` - Detected anomalies
- `saved_commentaries` - AI commentaries
- `export_jobs` - Export job tracking

---

## API Documentation

### Authentication

All API routes require authentication except:
- `/api/auth/login` - Magic link login
- `/api/oauth/callback` - OAuth callback
- `/api/stripe/webhook` - Stripe webhook

### tRPC Routers

**authRouter**
- `me` - Get current user
- `logout` - Logout user
- `updateProfile` - Update user profile

**scenarioRouter**
- `list` - List scenarios
- `get` - Get scenario by ID
- `create` - Create scenario
- `update` - Update scenario
- `approve` - Approve scenario
- `delete` - Delete scenario

**budgetRouter**
- `getLineItems` - Get budget line items
- `createLineItem` - Create line item
- `bulkImport` - Bulk import from CSV
- `updateLineItem` - Update line item

**actualsRouter**
- `list` - List actuals
- `create` - Create actual
- `bulkImport` - Bulk import from CSV
- `update` - Update actual

**forecastRouter** (Premium)
- `list` - List forecasts
- `create` - Generate forecast with AI
- `get` - Get forecast by ID

**analyticsRouter**
- `getKPIs` - Get KPI calculations
- `getVarianceAnalysis` - Get variance analysis
- `getTrends` - Get trend analysis

**reportsRouter**
- `list` - List saved reports
- `create` - Create report
- `get` - Get report by ID
- `delete` - Delete report

**donationsRouter** (Premium)
- `createCheckoutSession` - Create Stripe checkout
- `handleWebhook` - Handle Stripe webhook

---

## Feature Flags

The application uses a feature flag system to control access to features based on license type.

### Usage

```typescript
import { isFeatureAvailable, getLicenseType } from '@/shared/feature-flags';

// Check license type
const license = getLicenseType(); // 'open' | 'premium'

// Check feature availability
if (isFeatureAvailable('ai_forecasting')) {
  // Show AI forecasting UI
}

// Get all available features
const features = getAvailableFeatures(license);
```

### Feature Keys

- `ai_forecasting` - AI-powered forecasting
- `ai_anomaly_detection` - AI anomaly detection
- `ai_commentary` - AI commentary generation
- `excel_export` - Excel export
- `pdf_export` - PDF export
- `stripe_donations` - Stripe donations
- `advanced_analytics` - Advanced analytics

---

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy to Manus

```bash
# 1. Push to GitHub
git push origin main

# 2. Configure environment in Manus dashboard
# 3. Click "Publish" button
```

### Quick Deploy with Docker

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

---

## Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test auth.logout.test.ts

# Watch mode
pnpm test --watch
```

### Test Coverage

Current test coverage:
- Authentication: ✅
- Donations: ✅
- Forecasting: ✅
- Scenarios: ✅

Target: 80%+ coverage

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Run type checking: `pnpm check`
6. Commit changes: `git commit -m "Add my feature"`
7. Push to branch: `git push origin feature/my-feature`
8. Open a Pull Request

---

## Security

### Reporting Vulnerabilities

Please report security vulnerabilities to: security@myfpna.com

Do not open public issues for security vulnerabilities.

### Security Features

- ✅ HTTPS required in production
- ✅ Secure session cookies
- ✅ CSRF protection
- ✅ SQL injection protection (Drizzle ORM)
- ✅ XSS protection (React)
- ✅ Rate limiting
- ✅ Audit logging

---

## License

### Open-Source Version

MIT License - See [LICENSE](./LICENSE)

### Premium Version

Proprietary License - Contact info@myfpna.com for licensing

---

## Support

### Open-Source
- **GitHub Issues:** https://github.com/mygrouptech/myfpna-open/issues
- **Documentation:** This README and docs/
- **Community:** GitHub Discussions

### Premium
- **Support:** https://help.manus.im
- **Email:** support@myfpna.com
- **Priority Support:** Available for donors

---

## Roadmap

### Q1 2026
- [ ] Real-time collaboration
- [ ] Mobile responsive improvements
- [ ] Multiple AI model support (Claude, Manus Forge)
- [ ] Advanced analytics features

### Q2 2026
- [ ] API webhooks
- [ ] Custom integrations
- [ ] Advanced reporting
- [ ] Data import from accounting systems

### Q3 2026
- [ ] Mobile apps (iOS, Android)
- [ ] Offline mode
- [ ] Advanced forecasting models
- [ ] Machine learning insights

---

## Acknowledgments

Built with:
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [tRPC](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://www.radix-ui.com)
- [Manus Platform](https://manus.im)

---

## Contact

- **Website:** https://myfpna.com
- **Email:** info@myfpna.com
- **GitHub:** https://github.com/mygrouptech/myfpna-unified
- **Twitter:** @myfpna

---

**Made with ❤️ by the MyFPnA Team**

**Last Updated:** November 25, 2025
