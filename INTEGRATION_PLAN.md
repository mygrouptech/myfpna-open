# MyFPnA Unified Integration Plan

**Date:** November 25, 2025  
**Status:** In Progress  
**Goal:** Integrate open and premium features with clear boundaries

---

## Current State Analysis

### Existing Routers (All Implemented)

1. **authRouter** - Authentication and user profile management
2. **organizationRouter** - Organization/tenant management
3. **scenarioRouter** - Budget scenario CRUD operations
4. **budgetRouter** - Budget line item management and bulk import
5. **actualsRouter** - Actual financial data management
6. **forecastRouter** - AI forecasting (currently OpenAI only)
7. **analyticsRouter** - KPI calculations and variance analysis
8. **reportsRouter** - Report generation and management
9. **donationsRouter** - Stripe donation processing

### Feature Classification

#### ✅ Already Implemented (Core - Both Open & Premium)
- Scenario management (CRUD)
- Budget line items (CRUD, bulk import)
- Actuals tracking
- Variance analysis
- Basic analytics dashboard
- Audit logging
- Multi-user/organization support
- Role-based access control

#### ✅ Already Implemented (Premium Only)
- AI forecasting (OpenAI GPT-4)
- Stripe donations
- Background job processing

#### ❌ Missing (Core - Both Open & Premium)
- CSV export functionality
- Real-time collaboration/updates
- Enhanced data validation

#### ❌ Missing (Open Source Only)
- StatsForecast integration (basic forecasting without AI)

#### ❌ Missing (Premium Only)
- AI forecasting with Claude
- AI forecasting with Manus Forge
- AI anomaly detection
- AI commentary generation
- PDF export
- Excel export (partially implemented)
- Feature flag enforcement
- Rate limiting for AI features
- Usage tracking and cost monitoring

---

## Integration Strategy

### Phase 1: Feature Flag Integration ✅ COMPLETE

**Status:** Feature flag system created in `shared/feature-flags.ts`

**What was done:**
- Created comprehensive feature flag definitions
- Implemented license type detection (open vs premium)
- Added feature availability checking
- Created middleware for tRPC procedures

**Next steps:**
- Integrate feature flags into existing routers
- Add feature checks to frontend components

### Phase 2: Complete Missing Core Features

#### 2.1 CSV Export (Both Open & Premium)

**Files to create/modify:**
- `server/export.ts` - Export utilities
- Add `exportRouter` to `server/routers.ts`
- Frontend: Add export buttons to analytics/reports pages

**Implementation:**
```typescript
// Export router procedures:
- exportBudgetToCSV(scenarioId)
- exportActualsToCSV(startDate, endDate)
- exportVarianceToCSV(scenarioId, startDate, endDate)
```

#### 2.2 Enhanced Data Validation

**Files to modify:**
- `server/routers.ts` - Add more comprehensive Zod schemas
- Add validation utilities in `shared/validation.ts`

### Phase 3: Add Open-Source Forecasting

#### 3.1 StatsForecast Integration

**Files to create:**
- `server/forecasting/stats-forecast.ts` - Statistical forecasting
- `server/forecasting/index.ts` - Forecasting facade

**Dependencies to add:**
```bash
pnpm add @statsforecast/statsforecast
```

**Implementation:**
- Wrap StatsForecast library for Node.js
- Add `basicForecast` procedure to forecastRouter
- Make it available when AI keys are not configured

### Phase 4: Enhance Premium AI Features

#### 4.1 Multiple AI Model Support

**Files to modify:**
- `server/_core/llm.ts` - Add Claude and Manus Forge support
- `server/routers.ts` (forecastRouter) - Add model selection

**Implementation:**
```typescript
// Add to forecast procedure:
- model: z.enum(['gpt-4', 'claude', 'manus-forge'])
- Route to appropriate AI service based on selection
```

#### 4.2 AI Anomaly Detection

**Files to create:**
- `server/ai/anomaly-detection.ts` - Anomaly detection logic
- Add `detectAnomalies` procedure to analyticsRouter

**Implementation:**
- Statistical anomaly detection (Z-score, IQR)
- Optional AI-powered detection for premium
- Flag anomalies in actuals table
- Notification system for detected anomalies

#### 4.3 AI Commentary Generation

**Files to create:**
- `server/ai/commentary.ts` - AI commentary generation
- Add `generateCommentary` procedure to reportsRouter

**Implementation:**
```typescript
// Commentary generation:
- Input: variance analysis data
- Output: executive summary, key insights, recommendations
- User workflow: review → edit → approve → finalize
```

#### 4.4 Rate Limiting

**Files to create:**
- `server/middleware/rate-limit.ts` - Rate limiting middleware
- `drizzle/schema.ts` - Add usage tracking table

**Implementation:**
```typescript
// Usage tracking table:
- user_id
- feature (ai_forecast, ai_commentary, etc.)
- usage_count
- period_start
- period_end
- limit

// Middleware:
- Check usage before AI operations
- Increment counter after successful operation
- Throw error if limit exceeded
```

### Phase 5: Premium Export Features

#### 5.1 PDF Export

**Files to create:**
- `server/export/pdf.ts` - PDF generation using puppeteer or pdfkit
- Add `exportToPDF` procedure to reportsRouter

**Dependencies:**
```bash
pnpm add puppeteer pdfkit
```

#### 5.2 Excel Export (Complete)

**Files to modify:**
- `server/export/excel.ts` - Enhance existing Excel export
- Add formatting, charts, multiple sheets

---

## Database Schema Updates

### New Tables Needed

#### 1. Feature Flags (User/Org Level)

```sql
CREATE TABLE feature_flags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  user_id INT NULL,
  feature_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (organization_id),
  INDEX (user_id),
  INDEX (feature_key)
);
```

#### 2. AI Usage Tracking

```sql
CREATE TABLE ai_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  organization_id INT NOT NULL,
  feature VARCHAR(50) NOT NULL,
  model VARCHAR(50),
  tokens_used INT,
  cost_cents INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id),
  INDEX (organization_id),
  INDEX (created_at)
);
```

#### 3. Anomalies

```sql
CREATE TABLE anomalies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  actual_id INT NOT NULL,
  anomaly_type VARCHAR(50) NOT NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL,
  description TEXT,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  status ENUM('new', 'reviewed', 'false_positive', 'confirmed') DEFAULT 'new',
  INDEX (organization_id),
  INDEX (actual_id),
  INDEX (status)
);
```

### Schema Modifications

#### Update users table (for premium features)

```sql
ALTER TABLE users
ADD COLUMN is_donor BOOLEAN DEFAULT FALSE,
ADD COLUMN donor_tier VARCHAR(50) NULL,
ADD COLUMN donor_since TIMESTAMP NULL,
ADD COLUMN ai_forecast_limit INT DEFAULT 10,
ADD COLUMN ai_forecast_used INT DEFAULT 0,
ADD COLUMN ai_forecast_reset_at TIMESTAMP NULL;
```

---

## File Organization

### Current Structure
```
myfpna-unified/
├── client/          # React frontend
├── server/          # Express + tRPC backend
│   ├── _core/       # Manus runtime core
│   ├── routers.ts   # All API routes
│   ├── db.ts        # Database operations
│   ├── stripe.ts    # Stripe integration
│   └── ...
├── shared/          # Shared types and utilities
├── drizzle/         # Database schema and migrations
└── ...
```

### Proposed Additions
```
myfpna-unified/
├── server/
│   ├── ai/                    # NEW: AI features
│   │   ├── anomaly-detection.ts
│   │   ├── commentary.ts
│   │   └── models.ts
│   ├── export/                # NEW: Export utilities
│   │   ├── csv.ts
│   │   ├── excel.ts
│   │   └── pdf.ts
│   ├── forecasting/           # NEW: Forecasting
│   │   ├── stats-forecast.ts
│   │   ├── ai-forecast.ts
│   │   └── index.ts
│   ├── middleware/            # NEW: Middleware
│   │   ├── rate-limit.ts
│   │   └── feature-flags.ts
│   └── ...
├── shared/
│   ├── feature-flags.ts       # ✅ CREATED
│   └── ...
```

---

## Implementation Priority

### High Priority (Complete First)
1. ✅ Feature flag system
2. ⏳ CSV export (core feature)
3. ⏳ Multiple AI models (Claude, Manus Forge)
4. ⏳ AI anomaly detection
5. ⏳ AI commentary generation

### Medium Priority
6. ⏳ StatsForecast integration
7. ⏳ Rate limiting
8. ⏳ Usage tracking
9. ⏳ PDF export
10. ⏳ Enhanced Excel export

### Low Priority (Can defer)
11. Real-time collaboration
12. Advanced notifications
13. Enhanced data validation

---

## Testing Strategy

### Unit Tests
- Feature flag logic
- Export utilities
- AI model integration
- Rate limiting logic

### Integration Tests
- End-to-end forecasting workflows
- Export generation and download
- Anomaly detection pipeline
- Commentary generation and approval

### Feature Flag Tests
- Open license: Verify premium features are blocked
- Premium license: Verify all features are accessible
- API key missing: Verify AI features gracefully degrade

---

## Deployment Strategy

### Open Source Deployment
1. Set `LICENSE_TYPE=open` in environment
2. No AI API keys required
3. StatsForecast for basic forecasting
4. CSV export only
5. No Stripe integration

### Premium Deployment
1. Set `LICENSE_TYPE=premium` in environment
2. Configure AI API keys (OpenAI, Anthropic, Manus Forge)
3. Configure Stripe keys
4. All features enabled
5. Rate limiting active

### Environment Variables
See `.env.example` for complete configuration

---

## Risk Mitigation

### Backward Compatibility
- ✅ All existing code preserved
- ✅ No breaking changes to existing APIs
- ✅ Feature flags allow gradual rollout

### Testing
- ✅ Existing tests continue to pass
- ⏳ Add tests for new features
- ⏳ Integration tests for feature flags

### Performance
- ✅ No changes to existing query patterns
- ⏳ Add indexes for new tables
- ⏳ Monitor AI API latency

---

## Success Criteria

### Functional
- ✅ Feature flag system working
- ⏳ All core features work in both licenses
- ⏳ Premium features only accessible with premium license
- ⏳ AI features work with all three models
- ⏳ Export features generate valid files

### Non-Functional
- ⏳ 80%+ test coverage
- ⏳ API response < 200ms (P95)
- ⏳ No breaking changes to existing functionality
- ⏳ Clear separation between open/premium code

### Documentation
- ⏳ Feature flag usage documented
- ⏳ API documentation updated
- ⏳ Deployment guides for both licenses
- ⏳ Migration guide from existing setup

---

## Next Steps

1. **Immediate:** Integrate feature flags into existing routers
2. **Today:** Implement CSV export
3. **This week:** Add Claude and Manus Forge support
4. **This week:** Implement AI anomaly detection
5. **This week:** Implement AI commentary generation
6. **Next week:** Add rate limiting and usage tracking
7. **Next week:** Complete PDF export
8. **Final:** Comprehensive testing and validation
