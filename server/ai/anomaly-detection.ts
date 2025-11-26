/**
 * AI Anomaly Detection
 * 
 * Detects unusual patterns and anomalies in financial data.
 * Uses statistical methods and optionally AI for enhanced detection.
 * 
 * Premium feature only.
 */

import type { Actual } from '../../drizzle/schema';
import { invokeLLM } from '../_core/llm';

/**
 * Anomaly detection result
 */
export interface Anomaly {
  actualId: number;
  anomalyType: 'outlier' | 'trend_break' | 'unusual_pattern' | 'budget_overrun';
  severity: 'low' | 'medium' | 'high';
  description: string;
  confidence: number; // 0-100
  detectedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Statistical anomaly detection using Z-score
 */
function detectOutliersZScore(
  actuals: Actual[],
  threshold: number = 3
): Anomaly[] {
  if (actuals.length < 3) {
    return []; // Need at least 3 data points
  }
  
  // Calculate mean and standard deviation
  const amounts = actuals.map(a => a.amount);
  const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) {
    return []; // No variation in data
  }
  
  const anomalies: Anomaly[] = [];
  
  actuals.forEach(actual => {
    const zScore = Math.abs((actual.amount - mean) / stdDev);
    
    if (zScore > threshold) {
      const severity = zScore > 4 ? 'high' : zScore > 3.5 ? 'medium' : 'low';
      const percentDiff = ((actual.amount - mean) / mean * 100).toFixed(1);
      
      anomalies.push({
        actualId: actual.id,
        anomalyType: 'outlier',
        severity,
        description: `Amount ${actual.amount / 100} is ${percentDiff}% ${actual.amount > mean ? 'above' : 'below'} average (Z-score: ${zScore.toFixed(2)})`,
        confidence: Math.min(95, 50 + zScore * 10),
        detectedAt: new Date(),
        metadata: {
          zScore,
          mean: mean / 100,
          stdDev: stdDev / 100,
          threshold,
        },
      });
    }
  });
  
  return anomalies;
}

/**
 * Detect anomalies using Interquartile Range (IQR) method
 */
function detectOutliersIQR(actuals: Actual[]): Anomaly[] {
  if (actuals.length < 4) {
    return [];
  }
  
  const amounts = actuals.map(a => a.amount).sort((a, b) => a - b);
  const q1Index = Math.floor(amounts.length * 0.25);
  const q3Index = Math.floor(amounts.length * 0.75);
  
  const q1 = amounts[q1Index];
  const q3 = amounts[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const anomalies: Anomaly[] = [];
  
  actuals.forEach(actual => {
    if (actual.amount < lowerBound || actual.amount > upperBound) {
      const severity = 
        actual.amount < q1 - 3 * iqr || actual.amount > q3 + 3 * iqr ? 'high' :
        actual.amount < q1 - 2 * iqr || actual.amount > q3 + 2 * iqr ? 'medium' : 'low';
      
      anomalies.push({
        actualId: actual.id,
        anomalyType: 'outlier',
        severity,
        description: `Amount ${actual.amount / 100} is outside normal range [${lowerBound / 100}, ${upperBound / 100}]`,
        confidence: 85,
        detectedAt: new Date(),
        metadata: {
          q1: q1 / 100,
          q3: q3 / 100,
          iqr: iqr / 100,
          lowerBound: lowerBound / 100,
          upperBound: upperBound / 100,
        },
      });
    }
  });
  
  return anomalies;
}

/**
 * Detect trend breaks (sudden changes in direction)
 */
function detectTrendBreaks(actuals: Actual[]): Anomaly[] {
  if (actuals.length < 4) {
    return [];
  }
  
  // Sort by period
  const sorted = [...actuals].sort((a, b) => 
    new Date(a.period).getTime() - new Date(b.period).getTime()
  );
  
  const anomalies: Anomaly[] = [];
  
  for (let i = 2; i < sorted.length; i++) {
    const prev2 = sorted[i - 2].amount;
    const prev1 = sorted[i - 1].amount;
    const current = sorted[i].amount;
    
    // Calculate direction changes
    const trend1 = prev1 - prev2;
    const trend2 = current - prev1;
    
    // Detect significant direction change
    if (Math.sign(trend1) !== Math.sign(trend2) && Math.abs(trend2) > Math.abs(trend1) * 1.5) {
      const severity = Math.abs(trend2) > Math.abs(trend1) * 3 ? 'high' : 'medium';
      
      anomalies.push({
        actualId: sorted[i].id,
        anomalyType: 'trend_break',
        severity,
        description: `Significant trend reversal detected: ${trend1 > 0 ? 'upward' : 'downward'} trend changed to ${trend2 > 0 ? 'upward' : 'downward'}`,
        confidence: 75,
        detectedAt: new Date(),
        metadata: {
          previousTrend: trend1 / 100,
          currentTrend: trend2 / 100,
        },
      });
    }
  }
  
  return anomalies;
}

/**
 * Detect budget overruns
 */
export async function detectBudgetOverruns(
  actuals: Actual[],
  budgetLineItems: Array<{ accountName: string; period: Date; amount: number }>
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  
  // Group actuals by account and period
  const actualsByAccountPeriod = new Map<string, Actual>();
  actuals.forEach(actual => {
    const key = `${actual.accountName}_${actual.period.toISOString()}`;
    actualsByAccountPeriod.set(key, actual);
  });
  
  // Compare with budget
  budgetLineItems.forEach(budget => {
    const key = `${budget.accountName}_${budget.period.toISOString()}`;
    const actual = actualsByAccountPeriod.get(key);
    
    if (actual) {
      const variance = actual.amount - budget.amount;
      const variancePercent = (variance / budget.amount) * 100;
      
      // Flag significant overruns
      if (variancePercent > 20) {
        const severity = variancePercent > 50 ? 'high' : variancePercent > 35 ? 'medium' : 'low';
        
        anomalies.push({
          actualId: actual.id,
          anomalyType: 'budget_overrun',
          severity,
          description: `Budget overrun of ${variancePercent.toFixed(1)}% (Budget: ${budget.amount / 100}, Actual: ${actual.amount / 100})`,
          confidence: 95,
          detectedAt: new Date(),
          metadata: {
            budgetAmount: budget.amount / 100,
            actualAmount: actual.amount / 100,
            variance: variance / 100,
            variancePercent,
          },
        });
      }
    }
  });
  
  return anomalies;
}

/**
 * AI-powered anomaly detection (Premium feature)
 * Uses LLM to analyze patterns and provide insights
 */
export async function detectAnomaliesWithAI(
  actuals: Actual[],
  context?: {
    accountName?: string;
    category?: string;
    historicalData?: Actual[];
  }
): Promise<Anomaly[]> {
  if (actuals.length < 3) {
    return [];
  }
  
  // Prepare data for AI analysis
  const dataPoints = actuals.map(a => ({
    date: a.period.toISOString().split('T')[0],
    amount: a.amount / 100,
    account: a.accountName,
    category: a.category,
  }));
  
  const prompt = `You are a financial analyst specializing in anomaly detection. Analyze the following financial data and identify any anomalies, unusual patterns, or concerns.

Data to analyze:
${JSON.stringify(dataPoints, null, 2)}

${context?.historicalData ? `Historical context (previous periods):
${JSON.stringify(context.historicalData.slice(0, 10).map(a => ({
  date: a.period.toISOString().split('T')[0],
  amount: a.amount / 100,
})), null, 2)}` : ''}

Please identify:
1. Outliers (values significantly different from the norm)
2. Trend breaks (sudden changes in direction)
3. Unusual patterns (seasonality breaks, unexpected spikes/drops)
4. Potential data quality issues

For each anomaly found, provide:
- Type: outlier, trend_break, unusual_pattern, or data_quality
- Severity: low, medium, or high
- Description: Clear explanation of the anomaly
- Confidence: 0-100 (how confident you are)

Respond in JSON format:
{
  "anomalies": [
    {
      "index": 0,
      "type": "outlier",
      "severity": "high",
      "description": "...",
      "confidence": 90
    }
  ]
}`;

  try {
    const response = await invokeLLM({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1000,
    });
    
    const content = typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content 
      : JSON.stringify(response.choices[0].message.content);
    const result = JSON.parse(content);
    const anomalies: Anomaly[] = [];
    
    if (result.anomalies && Array.isArray(result.anomalies)) {
      result.anomalies.forEach((aiAnomaly: any) => {
        const index = aiAnomaly.index;
        if (index >= 0 && index < actuals.length) {
          anomalies.push({
            actualId: actuals[index].id,
            anomalyType: aiAnomaly.type || 'unusual_pattern',
            severity: aiAnomaly.severity || 'medium',
            description: aiAnomaly.description || 'AI detected anomaly',
            confidence: aiAnomaly.confidence || 70,
            detectedAt: new Date(),
            metadata: {
              aiGenerated: true,
              model: 'gpt-4.1-mini',
            },
          });
        }
      });
    }
    
    return anomalies;
  } catch (error) {
    console.error('AI anomaly detection failed:', error);
    return [];
  }
}

/**
 * Main anomaly detection function
 * Combines multiple detection methods
 */
export async function detectAnomalies(
  actuals: Actual[],
  options?: {
    useAI?: boolean;
    budgetLineItems?: Array<{ accountName: string; period: Date; amount: number }>;
    historicalData?: Actual[];
  }
): Promise<Anomaly[]> {
  const allAnomalies: Anomaly[] = [];
  
  // Statistical detection methods
  const zScoreAnomalies = detectOutliersZScore(actuals);
  const iqrAnomalies = detectOutliersIQR(actuals);
  const trendBreaks = detectTrendBreaks(actuals);
  
  allAnomalies.push(...zScoreAnomalies, ...iqrAnomalies, ...trendBreaks);
  
  // Budget overrun detection
  if (options?.budgetLineItems) {
    const overruns = await detectBudgetOverruns(actuals, options.budgetLineItems);
    allAnomalies.push(...overruns);
  }
  
  // AI-powered detection (if enabled)
  if (options?.useAI) {
    const aiAnomalies = await detectAnomaliesWithAI(actuals, {
      historicalData: options.historicalData,
    });
    allAnomalies.push(...aiAnomalies);
  }
  
  // Deduplicate anomalies (same actualId)
  const uniqueAnomalies = new Map<number, Anomaly>();
  allAnomalies.forEach(anomaly => {
    const existing = uniqueAnomalies.get(anomaly.actualId);
    if (!existing || anomaly.confidence > existing.confidence) {
      uniqueAnomalies.set(anomaly.actualId, anomaly);
    }
  });
  
  return Array.from(uniqueAnomalies.values())
    .sort((a, b) => {
      // Sort by severity (high first) then confidence
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      return severityDiff !== 0 ? severityDiff : b.confidence - a.confidence;
    });
}
