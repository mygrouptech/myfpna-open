/**
 * AI-Powered Forecast Generation Service
 * 
 * Generates financial forecasts using multiple methodologies:
 * - Trend-based forecasting (time series analysis)
 * - AI-powered predictions with confidence intervals
 * - Driver-based forecasting (optional)
 */

import { invokeLLM } from '../_core/llm';
import { BudgetLineItem, Actual } from '../../drizzle/schema';

export interface HistoricalDataPoint {
  period: Date;
  amount: number;
  accountName: string;
  category: string;
}

export interface ForecastDataPoint {
  period: Date;
  predictedAmount: number;
  confidenceLow: number;
  confidenceHigh: number;
  methodology: 'trend' | 'ai' | 'driver';
}

export interface AccountForecast {
  accountName: string;
  category: string;
  forecasts: ForecastDataPoint[];
  confidence: number; // 0-100
  methodology: string;
  assumptions: string[];
  risks: string[];
}

export interface ForecastResult {
  summary: string;
  totalForecast: number;
  forecastPeriodStart: Date;
  forecastPeriodEnd: Date;
  accountForecasts: AccountForecast[];
  overallConfidence: number;
  keyAssumptions: string[];
  risks: string[];
  opportunities: string[];
}

/**
 * Calculate simple linear trend
 */
function calculateLinearTrend(dataPoints: number[]): { slope: number; intercept: number } {
  const n = dataPoints.length;
  if (n < 2) return { slope: 0, intercept: dataPoints[0] || 0 };
  
  const xValues = Array.from({ length: n }, (_, i) => i);
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = dataPoints.reduce((sum, y) => sum + y, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (dataPoints[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  
  return { slope, intercept };
}

/**
 * Calculate standard deviation for confidence intervals
 */
function calculateStdDev(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Generate trend-based forecast
 */
export function generateTrendForecast(
  historicalData: HistoricalDataPoint[],
  forecastPeriods: number
): ForecastDataPoint[] {
  if (historicalData.length === 0) return [];
  
  // Extract amounts and calculate trend
  const amounts = historicalData.map(d => d.amount);
  const { slope, intercept } = calculateLinearTrend(amounts);
  const stdDev = calculateStdDev(amounts);
  
  // Generate forecasts
  const forecasts: ForecastDataPoint[] = [];
  const lastPeriod = historicalData[historicalData.length - 1].period;
  
  for (let i = 1; i <= forecastPeriods; i++) {
    const predictedAmount = intercept + slope * (historicalData.length + i - 1);
    
    // Confidence interval (±1.96 std dev for 95% confidence)
    const confidenceRange = 1.96 * stdDev * Math.sqrt(1 + 1 / historicalData.length);
    
    const forecastPeriod = new Date(lastPeriod);
    forecastPeriod.setMonth(forecastPeriod.getMonth() + i);
    
    forecasts.push({
      period: forecastPeriod,
      predictedAmount: Math.max(0, Math.round(predictedAmount)), // Ensure non-negative
      confidenceLow: Math.max(0, Math.round(predictedAmount - confidenceRange)),
      confidenceHigh: Math.round(predictedAmount + confidenceRange),
      methodology: 'trend',
    });
  }
  
  return forecasts;
}

/**
 * Group historical data by account
 */
export function groupByAccount(
  budgetItems: BudgetLineItem[],
  actuals: Actual[]
): Map<string, HistoricalDataPoint[]> {
  const accountMap = new Map<string, HistoricalDataPoint[]>();
  
  // Combine budget and actuals (prefer actuals when available)
  const dataMap = new Map<string, HistoricalDataPoint>();
  
  // Add budget data
  for (const item of budgetItems) {
    const key = `${item.accountName}-${item.period.toISOString()}`;
    dataMap.set(key, {
      period: item.period,
      amount: item.amount,
      accountName: item.accountName,
      category: item.category || 'Uncategorized',
    });
  }
  
  // Override with actuals where available
  for (const actual of actuals) {
    const key = `${actual.accountName}-${actual.period.toISOString()}`;
    dataMap.set(key, {
      period: actual.period,
      amount: actual.amount,
      accountName: actual.accountName,
      category: actual.category || 'Uncategorized',
    });
  }
  
  // Group by account
  for (const dataPoint of Array.from(dataMap.values())) {
    if (!accountMap.has(dataPoint.accountName)) {
      accountMap.set(dataPoint.accountName, []);
    }
    accountMap.get(dataPoint.accountName)!.push(dataPoint);
  }
  
  // Group by account
  for (const data of Array.from(accountMap.values())) {
    data.sort((a: HistoricalDataPoint, b: HistoricalDataPoint) => a.period.getTime() - b.period.getTime());
  } 
  return accountMap;
}

/**
 * Generate AI-enhanced forecast with insights
 */
export async function generateAIForecast(
  historicalData: HistoricalDataPoint[],
  forecastPeriods: number,
  organizationContext?: string
): Promise<AccountForecast> {
  if (historicalData.length === 0) {
    throw new Error('No historical data available for forecasting');
  }
  
  const accountName = historicalData[0].accountName;
  const category = historicalData[0].category;
  
  // First, generate trend-based forecast
  const trendForecasts = generateTrendForecast(historicalData, forecastPeriods);
  
  // Prepare data for AI analysis
  const historicalSummary = historicalData.slice(-12).map(d => ({
    period: d.period.toISOString().split('T')[0],
    amount: `$${(d.amount / 100).toLocaleString()}`,
  }));
  
  const trendSummary = trendForecasts.map(f => ({
    period: f.period.toISOString().split('T')[0],
    predicted: `$${(f.predictedAmount / 100).toLocaleString()}`,
  }));
  
  try {
    // Call AI for enhanced analysis
    const prompt = `You are a financial forecasting expert analyzing ${accountName} (${category}) for ${organizationContext || 'a company'}.

Historical Data (last 12 months):
${JSON.stringify(historicalSummary, null, 2)}

Trend-Based Forecast (next ${forecastPeriods} months):
${JSON.stringify(trendSummary, null, 2)}

Provide an enhanced forecast analysis in JSON format:
{
  "summary": "2-3 sentence summary of forecast and key trends",
  "confidence": 75,
  "methodology": "Brief description of forecasting approach used",
  "assumptions": ["assumption 1", "assumption 2", "assumption 3"],
  "risks": ["risk factor 1", "risk factor 2"],
  "opportunities": ["opportunity 1 if applicable"]
}

Guidelines:
- Confidence should be 60-95 based on data quality and trend stability
- Assumptions should be specific and testable
- Risks should identify potential downside scenarios
- Opportunities should highlight potential upside scenarios
- Keep all text concise and actionable`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an expert financial forecasting analyst. Provide structured forecast analysis in JSON format.' },
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'forecast_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              confidence: { type: 'number' },
              methodology: { type: 'string' },
              assumptions: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } },
              opportunities: { type: 'array', items: { type: 'string' } },
            },
            required: ['summary', 'confidence', 'methodology', 'assumptions', 'risks'],
            additionalProperties: false,
          },
        },
      },
    });
    
    const messageContent = response.choices[0].message.content;
    const contentString = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
    const aiAnalysis = JSON.parse(contentString || '{}');
    
    return {
      accountName,
      category,
      forecasts: trendForecasts,
      confidence: Math.min(95, Math.max(60, aiAnalysis.confidence || 75)),
      methodology: aiAnalysis.methodology || 'Trend-based linear regression with AI-enhanced insights',
      assumptions: aiAnalysis.assumptions || [],
      risks: aiAnalysis.risks || [],
    };
    
  } catch (error) {
    console.error('[AI Forecast] Error:', error);
    
    // Fallback to trend-based forecast without AI insights
    const avgAmount = historicalData.reduce((sum, d) => sum + d.amount, 0) / historicalData.length;
    const stdDev = calculateStdDev(historicalData.map(d => d.amount));
    const coefficientOfVariation = avgAmount > 0 ? (stdDev / avgAmount) * 100 : 50;
    
    // Confidence based on data stability (lower CV = higher confidence)
    const confidence = Math.max(60, Math.min(90, 90 - coefficientOfVariation));
    
    return {
      accountName,
      category,
      forecasts: trendForecasts,
      confidence: Math.round(confidence),
      methodology: 'Trend-based linear regression',
      assumptions: [
        'Historical trends will continue',
        'No major business changes',
        'Economic conditions remain stable',
      ],
      risks: [
        'Market volatility may impact forecast accuracy',
        'Unexpected business changes could alter trends',
      ],
    };
  }
}

/**
 * Generate comprehensive forecast for all accounts
 */
export async function generateComprehensiveForecast(
  budgetItems: BudgetLineItem[],
  actuals: Actual[],
  forecastPeriods: number,
  organizationContext?: string
): Promise<ForecastResult> {
  const accountData = groupByAccount(budgetItems, actuals);
  
  if (accountData.size === 0) {
    throw new Error('No historical data available for forecasting');
  }
  
  // Generate forecasts for each account
  const accountForecasts: AccountForecast[] = [];
  
  for (const [accountName, historicalData] of Array.from(accountData.entries())) {
    // Only forecast accounts with at least 3 data points
    if (historicalData.length >= 3) {
      const forecast = await generateAIForecast(historicalData, forecastPeriods, organizationContext);
      accountForecasts.push(forecast);
    }
  }
  
  if (accountForecasts.length === 0) {
    throw new Error('Insufficient historical data for forecasting (need at least 3 months per account)');
  }
  
  // Calculate total forecast
  const totalForecast = accountForecasts.reduce((sum, af) => {
    const accountTotal = af.forecasts.reduce((s, f) => s + f.predictedAmount, 0);
    return sum + accountTotal;
  }, 0);
  
  // Calculate overall confidence (weighted average)
  const overallConfidence = Math.round(
    accountForecasts.reduce((sum, af) => sum + af.confidence, 0) / accountForecasts.length
  );
  
  // Aggregate assumptions and risks
  const allAssumptions = new Set<string>();
  const allRisks = new Set<string>();
  const allOpportunities = new Set<string>();
  
  for (const forecast of accountForecasts) {
    forecast.assumptions.forEach(a => allAssumptions.add(a));
    forecast.risks.forEach(r => allRisks.add(r));
  }
  
  // Determine forecast period
  const firstForecast = accountForecasts[0].forecasts[0];
  const lastForecast = accountForecasts[0].forecasts[accountForecasts[0].forecasts.length - 1];
  
  return {
    summary: `Generated ${forecastPeriods}-month forecast for ${accountForecasts.length} accounts with ${overallConfidence}% overall confidence. Total forecasted amount: $${(totalForecast / 100).toLocaleString()}.`,
    totalForecast,
    forecastPeriodStart: firstForecast.period,
    forecastPeriodEnd: lastForecast.period,
    accountForecasts,
    overallConfidence,
    keyAssumptions: Array.from(allAssumptions).slice(0, 5),
    risks: Array.from(allRisks).slice(0, 5),
    opportunities: Array.from(allOpportunities).slice(0, 3),
  };
}
