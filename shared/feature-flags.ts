/**
 * Feature Flags Configuration
 * 
 * This module defines the feature flags that control the separation between
 * open-source (MIT) and premium (proprietary) features in MyFPnA.
 * 
 * Features are organized by category and can be enabled/disabled based on:
 * - Environment variables (for deployment-time configuration)
 * - User/organization settings (for runtime configuration)
 * - License type (open vs premium)
 */

export type FeatureCategory = 
  | 'core'           // Core FP&A features (available in both)
  | 'ai'             // AI-powered features (premium only)
  | 'export'         // Export features (basic in open, advanced in premium)
  | 'collaboration'  // Collaboration features
  | 'monetization'   // Stripe and donations (premium only)
  | 'analytics';     // Analytics features

export type FeatureFlag = {
  key: string;
  name: string;
  description: string;
  category: FeatureCategory;
  availableIn: 'open' | 'premium' | 'both';
  requiresApiKey?: boolean;
  defaultEnabled: boolean;
};

/**
 * All feature flags in the system
 */
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // ============================================================================
  // CORE FP&A FEATURES (Available in both Open and Premium)
  // ============================================================================
  
  SCENARIO_MANAGEMENT: {
    key: 'scenario_management',
    name: 'Scenario Management',
    description: 'Create, edit, delete, and clone budget scenarios',
    category: 'core',
    availableIn: 'both',
    defaultEnabled: true,
  },
  
  BUDGET_PLANNING: {
    key: 'budget_planning',
    name: 'Budget Planning',
    description: 'Add, edit, and delete budget line items',
    category: 'core',
    availableIn: 'both',
    defaultEnabled: true,
  },
  
  ACTUALS_IMPORT: {
    key: 'actuals_import',
    name: 'Actuals Import',
    description: 'Import actual financial data from CSV',
    category: 'core',
    availableIn: 'both',
    defaultEnabled: true,
  },
  
  VARIANCE_ANALYSIS: {
    key: 'variance_analysis',
    name: 'Variance Analysis',
    description: 'Compare budget vs actuals with variance calculations',
    category: 'core',
    availableIn: 'both',
    defaultEnabled: true,
  },
  
  BASIC_ANALYTICS: {
    key: 'basic_analytics',
    name: 'Basic Analytics',
    description: 'KPI dashboard with basic charts and metrics',
    category: 'analytics',
    availableIn: 'both',
    defaultEnabled: true,
  },
  
  AUDIT_LOGS: {
    key: 'audit_logs',
    name: 'Audit Logs',
    description: 'Track all changes to scenarios and financial data',
    category: 'core',
    availableIn: 'both',
    defaultEnabled: true,
  },
  
  MULTI_USER: {
    key: 'multi_user',
    name: 'Multi-User Support',
    description: 'Multiple users can collaborate on budgets',
    category: 'collaboration',
    availableIn: 'both',
    defaultEnabled: true,
  },
  
  // ============================================================================
  // BASIC FORECASTING (Open-source - StatsForecast)
  // ============================================================================
  
  BASIC_FORECASTING: {
    key: 'basic_forecasting',
    name: 'Basic Forecasting',
    description: 'Statistical forecasting using StatsForecast library',
    category: 'core',
    availableIn: 'open',
    defaultEnabled: true,
  },
  
  // ============================================================================
  // AI FEATURES (Premium only)
  // ============================================================================
  
  AI_FORECASTING: {
    key: 'ai_forecasting',
    name: 'AI Forecasting',
    description: 'AI-powered forecasting using GPT-4, Claude, or Manus Forge',
    category: 'ai',
    availableIn: 'premium',
    requiresApiKey: true,
    defaultEnabled: false,
  },
  
  AI_ANOMALY_DETECTION: {
    key: 'ai_anomaly_detection',
    name: 'AI Anomaly Detection',
    description: 'Automatically detect unusual patterns and budget overruns',
    category: 'ai',
    availableIn: 'premium',
    requiresApiKey: true,
    defaultEnabled: false,
  },
  
  AI_COMMENTARY: {
    key: 'ai_commentary',
    name: 'AI Commentary',
    description: 'Generate executive summaries and insights for variance reports',
    category: 'ai',
    availableIn: 'premium',
    requiresApiKey: true,
    defaultEnabled: false,
  },
  
  // ============================================================================
  // EXPORT FEATURES
  // ============================================================================
  
  CSV_EXPORT: {
    key: 'csv_export',
    name: 'CSV Export',
    description: 'Export data to CSV format',
    category: 'export',
    availableIn: 'both',
    defaultEnabled: true,
  },
  
  EXCEL_EXPORT: {
    key: 'excel_export',
    name: 'Excel Export',
    description: 'Export data to Excel format with formatting',
    category: 'export',
    availableIn: 'premium',
    defaultEnabled: false,
  },
  
  PDF_EXPORT: {
    key: 'pdf_export',
    name: 'PDF Export',
    description: 'Export professional variance reports to PDF',
    category: 'export',
    availableIn: 'premium',
    defaultEnabled: false,
  },
  
  // ============================================================================
  // ADVANCED ANALYTICS (Premium only)
  // ============================================================================
  
  ADVANCED_ANALYTICS: {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Advanced charts, cohort analysis, and what-if scenarios',
    category: 'analytics',
    availableIn: 'premium',
    defaultEnabled: false,
  },
  
  // ============================================================================
  // MONETIZATION (Premium only)
  // ============================================================================
  
  STRIPE_DONATIONS: {
    key: 'stripe_donations',
    name: 'Stripe Donations',
    description: 'Accept one-time and recurring donations via Stripe',
    category: 'monetization',
    availableIn: 'premium',
    requiresApiKey: true,
    defaultEnabled: false,
  },
  
  DONOR_BENEFITS: {
    key: 'donor_benefits',
    name: 'Donor Benefits',
    description: 'Track donor status and provide benefits',
    category: 'monetization',
    availableIn: 'premium',
    defaultEnabled: false,
  },
};

/**
 * License types
 */
export type LicenseType = 'open' | 'premium';

/**
 * Get the current license type from environment
 */
export function getLicenseType(): LicenseType {
  const license = process.env.LICENSE_TYPE || process.env.MYFPNA_LICENSE || 'open';
  return license.toLowerCase() === 'premium' ? 'premium' : 'open';
}

/**
 * Check if a feature is available for the current license
 */
export function isFeatureAvailable(featureKey: string, license?: LicenseType): boolean {
  const currentLicense = license || getLicenseType();
  const feature = FEATURE_FLAGS[featureKey];
  
  if (!feature) {
    console.warn(`Unknown feature flag: ${featureKey}`);
    return false;
  }
  
  // Feature available in both licenses
  if (feature.availableIn === 'both') {
    return true;
  }
  
  // Feature matches current license
  if (feature.availableIn === currentLicense) {
    return true;
  }
  
  return false;
}

/**
 * Check if a feature requires an API key
 */
export function requiresApiKey(featureKey: string): boolean {
  const feature = FEATURE_FLAGS[featureKey];
  return feature?.requiresApiKey || false;
}

/**
 * Get all features available for a license type
 */
export function getAvailableFeatures(license?: LicenseType): FeatureFlag[] {
  const currentLicense = license || getLicenseType();
  
  return Object.values(FEATURE_FLAGS).filter(
    feature => feature.availableIn === 'both' || feature.availableIn === currentLicense
  );
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: FeatureCategory, license?: LicenseType): FeatureFlag[] {
  return getAvailableFeatures(license).filter(feature => feature.category === category);
}

/**
 * Check if user has access to a feature based on their organization settings
 */
export function hasFeatureAccess(
  featureKey: string,
  userSettings?: {
    isDonor?: boolean;
    subscriptionTier?: string;
    enabledFeatures?: string[];
  }
): boolean {
  // First check if feature is available in current license
  if (!isFeatureAvailable(featureKey)) {
    return false;
  }
  
  const feature = FEATURE_FLAGS[featureKey];
  
  // If feature is in open license, always available
  if (feature.availableIn === 'open' || feature.availableIn === 'both') {
    return true;
  }
  
  // For premium features, check user settings
  if (userSettings?.enabledFeatures?.includes(featureKey)) {
    return true;
  }
  
  // Check if user is a donor (for donation-based premium features)
  if (feature.category === 'ai' && userSettings?.isDonor) {
    return true;
  }
  
  return false;
}

/**
 * Feature flag middleware for tRPC procedures
 */
export function requireFeature(featureKey: string) {
  return (opts: { ctx: any }) => {
    if (!isFeatureAvailable(featureKey)) {
      throw new Error(`Feature '${featureKey}' is not available in this license`);
    }
    return opts;
  };
}
