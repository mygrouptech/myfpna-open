# MyFPnA Suite - Enterprise FP&A Platform

> **Financial Planning & Analysis Powered by AI**

A comprehensive, free-to-use FP&A platform that helps finance teams create budgets, generate AI-powered forecasts, and analyze variances with enterprise-grade tools.

🌐 **Live Demo:** [https://myfpna.manus.space](https://myfpna.manus.space)  
📚 **Documentation:** [Resources Page](https://myfpna.manus.space/resources)  
🚀 **Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)  
🔧 **OAuth Fix Guide:** [OAUTH_FIX_GUIDE.md](./OAUTH_FIX_GUIDE.md)

---

## ✨ Features

### Core FP&A Capabilities
- **Scenario Planning** - Create and compare multiple budget scenarios
- **AI-Powered Forecasting** - Generate intelligent predictions using OpenAI
- **Variance Analysis** - Track budget vs. actuals in real-time
- **Interactive Analytics** - Visualize data with charts and KPI dashboards
- **Reports & Export** - Export to Excel/CSV for stakeholder presentations
- **Budget Line Items** - Detailed line-item management with categories

### Platform Features
- **Free to Use** - Donation-based model, no credit card required
- **Secure Authentication** - Manus OAuth integration
- **Multi-Currency Support** - USD, EUR, GBP, and more
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Updates** - Instant calculations and updates
- **Data Privacy** - Your data belongs to you, export anytime

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22.x or higher
- pnpm package manager
- MySQL/TiDB database
- Manus account (for OAuth)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mygrouptech/myfpna.git
   cd myfpna
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   
   ```env
   # Database
   DATABASE_URL=mysql://user:password@host:port/database
   
   # Authentication
   JWT_SECRET=your-jwt-secret-key
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://auth.manus.im
   VITE_APP_ID=your-manus-app-id
   OWNER_OPEN_ID=your-owner-open-id
   OWNER_NAME=Your Name
   
   # Manus Built-in APIs
   BUILT_IN_FORGE_API_URL=https://forge-api.manus.im
   BUILT_IN_FORGE_API_KEY=your-forge-api-key
   VITE_FRONTEND_FORGE_API_URL=https://forge-api.manus.im
   VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-key
   
   # Stripe (Optional - for donations)
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   
   # App Configuration
   VITE_APP_TITLE=MyFPnA Suite - Enterprise FP&A Platform
   VITE_APP_LOGO=/logo.svg
   
   # Analytics (Optional)
   VITE_ANALYTICS_WEBSITE_ID=your-analytics-id
   VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
   ```

4. **Set up the database**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:3000`

---

## 📁 Project Structure

```
fpna-suite-rebuild/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page-level components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and tRPC client
│   │   ├── App.tsx        # Routes and layout
│   │   └── main.tsx       # Application entry point
│   └── index.html         # HTML template
├── server/                # Backend Express + tRPC
│   ├── _core/            # Framework core (OAuth, context, etc.)
│   ├── routers.ts        # tRPC API procedures
│   └── db.ts             # Database query helpers
├── drizzle/              # Database schema and migrations
│   └── schema.ts         # Table definitions
├── shared/               # Shared types and constants
├── storage/              # S3 storage helpers
└── package.json          # Dependencies and scripts
```

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI components
- **Wouter** - Routing
- **tRPC** - Type-safe API client
- **TanStack Query** - Data fetching and caching
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Backend
- **Express 4** - Web server
- **tRPC 11** - Type-safe API
- **Drizzle ORM** - Database ORM
- **MySQL/TiDB** - Database
- **Manus OAuth** - Authentication
- **OpenAI API** - AI forecasting
- **Stripe** - Payment processing (donations)

### Development
- **Vite** - Build tool
- **Vitest** - Testing framework
- **pnpm** - Package manager
- **ESLint** - Code linting
- **TypeScript** - Type checking

---

## 🧪 Testing

Run the test suite:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

---

## 📦 Building for Production

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Preview the production build**
   ```bash
   pnpm preview
   ```

3. **Deploy to Manus**
   
   The application is designed to be deployed on the Manus platform. Use the Manus dashboard to publish your application with one click.

---

## 🔐 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL/TiDB connection string | `mysql://user:pass@host:port/db` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | Manus OAuth frontend URL | `https://auth.manus.im` |
| `VITE_APP_ID` | Manus application ID | `abc123...` |
| `OWNER_OPEN_ID` | Owner's Manus Open ID | `user-123...` |
| `OWNER_NAME` | Owner's display name | `John Doe` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key for donations | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | - |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | - |
| `VITE_ANALYTICS_WEBSITE_ID` | Analytics website ID | - |
| `VITE_ANALYTICS_ENDPOINT` | Analytics endpoint URL | - |

---

## 🎨 Customization

### Branding

Update the app logo and title in `client/src/const.ts`:

```typescript
export const APP_TITLE = "MyFPnA Suite - Enterprise FP&A Platform";
export const APP_LOGO = "/logo.svg";
```

### Theme Colors

Modify the color palette in `client/src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... more colors */
}
```

### Features

Enable or disable features by modifying the feature flags in the codebase or by commenting out routes in `client/src/App.tsx`.

---

## 📊 Database Schema

The application uses the following main tables:

- **users** - User accounts and authentication
- **scenarios** - Budget and forecast scenarios
- **budget_line_items** - Individual budget line items
- **actuals** - Actual transaction data
- **forecasts** - AI-generated forecasts
- **donations** - Donation records (optional)

See `drizzle/schema.ts` for the complete schema definition.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep commits atomic and well-described

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💖 Support the Project

MyFPnA Suite is free to use and open source. If you find it valuable, consider supporting the project:

- **Donate** - Visit the [Donate page](https://myfpna.manus.space/donate) to make a contribution
- **Star the repo** - Give us a ⭐ on GitHub
- **Share** - Tell others about MyFPnA Suite
- **Contribute** - Submit bug reports, feature requests, or pull requests

---

## 📞 Contact & Support

- **Issues** - [GitHub Issues](https://github.com/mygrouptech/myfpna/issues)
- **Discussions** - [GitHub Discussions](https://github.com/mygrouptech/myfpna/discussions)
- **Email** - info@mygrouptech.com
- **Resources** - [Help Center](https://myfpna.manus.space/resources)

---

## 🙏 Acknowledgments

Built with:
- [Manus Platform](https://manus.im) - Hosting and OAuth
- [OpenAI](https://openai.com) - AI forecasting capabilities
- [Stripe](https://stripe.com) - Payment processing
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [tRPC](https://trpc.io) - Type-safe APIs

---

## 📈 Roadmap

- [ ] Multi-user collaboration and team workspaces
- [ ] Advanced forecasting models (ARIMA, Prophet)
- [ ] Custom report builder
- [ ] Mobile apps (iOS/Android)
- [ ] Integration with accounting software (QuickBooks, Xero)
- [ ] Automated budget alerts and notifications
- [ ] Multi-language support
- [ ] Advanced role-based access control

---

**Made with ❤️ by MyGroup Solutions**

© 2025 MyFPnA Suite - Enterprise FP&A Platform. Built with ❤️ by finance teams.
