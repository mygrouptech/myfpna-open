/**
 * AI-Powered Variance Analysis Service
 * 
 * Analyzes budget vs actual variances and generates natural language explanations
 * with confidence scores and actionable insights.
 */

import { invokeLLM } from '../_core/llm';
import { BudgetLineItem, Actual } from '../../drizzle/schema';

export interface VarianceItem {
  accountName: string;
  category: string;
  period: Date;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
}

export interface VarianceInsight {
  accountName: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  confidence: number; // 0-100
  recommendations: string[];
  riskFactors?: string[];
  opportunities?: string[];
}

export interface VarianceAnalysisResult {
  summary: string;
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  totalVariancePercent: number;
  insights: VarianceInsight[];
  keyFindings: string[];
  recommendations: string[];
}

/**
 * Calculate variance between budget and actuals
 */
export function calculateVariances(
  budgetItems: BudgetLineItem[],
  actuals: Actual[]
): VarianceItem[] {
  const actualsMap = new Map<string, number>();
  
  // Group actuals by account + period
  for (const actual of actuals) {
    const key = `${actual.accountName}-${actual.period.toISOString()}`;
    const existing = actualsMap.get(key) || 0;
    actualsMap.set(key, existing + actual.amount);
  }
  
  // Calculate variances
  const variances: VarianceItem[] = [];
  
  for (const budget of budgetItems) {
    const key = `${budget.accountName}-${budget.period.toISOString()}`;
    const actualAmount = actualsMap.get(key) || 0;
    const variance = actualAmount - budget.amount;
    const variancePercent = budget.amount !== 0 ? (variance / budget.amount) * 100 : 0;
    
    variances.push({
      accountName: budget.accountName,
      category: budget.category || 'Uncategorized',
      period: budget.period,
      budgetAmount: budget.amount,
      actualAmount,
      variance,
      variancePercent,
    });
  }
  
  return variances;
}

/**
 * Aggregate variances by account (sum across all periods)
 */
export function aggregateVariancesByAccount(variances: VarianceItem[]): VarianceItem[] {
  const accountMap = new Map<string, VarianceItem>();
  
  for (const variance of variances) {
    const existing = accountMap.get(variance.accountName);
    
    if (existing) {
      existing.budgetAmount += variance.budgetAmount;
      existing.actualAmount += variance.actualAmount;
      existing.variance += variance.variance;
      existing.variancePercent = existing.budgetAmount !== 0
        ? (existing.variance / existing.budgetAmount) * 100
        : 0;
    } else {
      accountMap.set(variance.accountName, { ...variance });
    }
  }
  
  return Array.from(accountMap.values());
}

/**
 * Determine variance severity based on percentage
 */
function getVarianceSeverity(variancePercent: number): 'low' | 'medium' | 'high' {
  const absPercent = Math.abs(variancePercent);
  
  if (absPercent < 5) return 'low';
  if (absPercent < 15) return 'medium';
  return 'high';
}

/**
 * Generate AI-powered variance insights
 */
export async function generateVarianceInsights(
  variances: VarianceItem[],
  organizationContext?: string
): Promise<VarianceAnalysisResult> {
  // Aggregate by account
  const aggregated = aggregateVariancesByAccount(variances);
  
  // Calculate totals
  const totalBudget = aggregated.reduce((sum, v) => sum + v.budgetAmount, 0);
  const totalActual = aggregated.reduce((sum, v) => sum + v.actualAmount, 0);
  const totalVariance = totalActual - totalBudget;
  const totalVariancePercent = totalBudget !== 0 ? (totalVariance / totalBudget) * 100 : 0;
  
  // Filter significant variances (>5% or >$10,000)
  const significantVariances = aggregated.filter(v => 
    Math.abs(v.variancePercent) > 5 || Math.abs(v.variance) > 1000000 // $10,000 in cents
  );
  
  // Sort by absolute variance amount (most significant first)
  significantVariances.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  
  // Take top 10 most significant variances for AI analysis
  const topVariances = significantVariances.slice(0, 10);
  
  if (topVariances.length === 0) {
    return {
      summary: "All line items are within expected variance thresholds (<5%). No significant deviations detected.",
      totalBudget,
      totalActual,
      totalVariance,
      totalVariancePercent,
      insights: [],
      keyFindings: ["Budget performance is on track with minimal variances."],
      recommendations: ["Continue monitoring monthly actuals for early detection of trends."],
    };
  }
  
  // Prepare data for AI analysis
  const varianceData = topVariances.map(v => ({
    account: v.accountName,
    category: v.category,
    budgeted: `$${(v.budgetAmount / 100).toLocaleString()}`,
    actual: `$${(v.actualAmount / 100).toLocaleString()}`,
    variance: `$${(v.variance / 100).toLocaleString()}`,
    variancePercent: `${v.variancePercent.toFixed(1)}%`,
  }));
  
  // Call AI for analysis
  const prompt = `You are a financial analyst reviewing budget vs actual variances for ${organizationContext || 'a company'}.

Analyze the following variances and provide insights:

${JSON.stringify(varianceData, null, 2)}

Total Budget: $${(totalBudget / 100).toLocaleString()}
Total Actual: $${(totalActual / 100).toLocaleString()}
Total Variance: $${(totalVariance / 100).toLocaleString()} (${totalVariancePercent.toFixed(1)}%)

Provide a structured analysis in JSON format with the following structure:
{
  "summary": "2-3 sentence executive summary of overall budget performance",
  "insights": [
    {
      "accountName": "exact account name from data",
      "explanation": "Natural language explanation of why this variance occurred (1-2 sentences)",
      "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
      "riskFactors": ["risk factor 1 if variance is negative"],
      "opportunities": ["opportunity 1 if variance is positive"]
    }
  ],
  "keyFindings": ["key finding 1", "key finding 2", "key finding 3"],
  "recommendations": ["overall recommendation 1", "overall recommendation 2"]
}

Guidelines:
- Be specific and actionable
- Focus on business impact, not just numbers
- Identify patterns across categories
- Suggest concrete next steps
- Use professional financial language
- Keep explanations concise (1-2 sentences each)`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an expert financial analyst specializing in budget variance analysis. Provide clear, actionable insights in JSON format.' },
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'variance_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              insights: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    accountName: { type: 'string' },
                    explanation: { type: 'string' },
                    recommendations: { type: 'array', items: { type: 'string' } },
                    riskFactors: { type: 'array', items: { type: 'string' } },
                    opportunities: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['accountName', 'explanation', 'recommendations'],
                  additionalProperties: false,
                },
              },
              keyFindings: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
            },
            required: ['summary', 'insights', 'keyFindings', 'recommendations'],
            additionalProperties: false,
          },
        },
      },
    });
    
    const messageContent = response.choices[0].message.content;
    const contentString = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
    const aiAnalysis = JSON.parse(contentString || '{}');
    
    // Enrich insights with severity and confidence
    const enrichedInsights: VarianceInsight[] = aiAnalysis.insights.map((insight: any) => {
      const variance = topVariances.find(v => v.accountName === insight.accountName);
      const severity = variance ? getVarianceSeverity(variance.variancePercent) : 'medium';
      
      // Confidence based on variance magnitude and data quality
      const confidence = variance
        ? Math.min(95, 70 + Math.min(25, Math.abs(variance.variancePercent) / 2))
        : 75;
      
      return {
        accountName: insight.accountName,
        category: variance?.category || 'Unknown',
        severity,
        explanation: insight.explanation,
        confidence: Math.round(confidence),
        recommendations: insight.recommendations || [],
        riskFactors: insight.riskFactors,
        opportunities: insight.opportunities,
      };
    });
    
    return {
      summary: aiAnalysis.summary,
      totalBudget,
      totalActual,
      totalVariance,
      totalVariancePercent,
      insights: enrichedInsights,
      keyFindings: aiAnalysis.keyFindings || [],
      recommendations: aiAnalysis.recommendations || [],
    };
    
  } catch (error) {
    console.error('[AI Variance Analysis] Error:', error);
    
    // Fallback to rule-based analysis if AI fails
    const fallbackInsights: VarianceInsight[] = topVariances.map(v => ({
      accountName: v.accountName,
      category: v.category,
      severity: getVarianceSeverity(v.variancePercent),
      explanation: v.variance > 0
        ? `Actual spending exceeded budget by $${(Math.abs(v.variance) / 100).toLocaleString()} (${Math.abs(v.variancePercent).toFixed(1)}%).`
        : `Actual spending was under budget by $${(Math.abs(v.variance) / 100).toLocaleString()} (${Math.abs(v.variancePercent).toFixed(1)}%).`,
      confidence: 60,
      recommendations: v.variance > 0
        ? ['Review spending patterns', 'Adjust future budgets', 'Identify cost drivers']
        : ['Investigate underspending', 'Reallocate budget if needed', 'Update forecast'],
    }));
    
    return {
      summary: `Overall budget variance is ${totalVariancePercent.toFixed(1)}% (${totalVariance > 0 ? 'over' : 'under'} budget by $${(Math.abs(totalVariance) / 100).toLocaleString()}). ${topVariances.length} significant variances detected.`,
      totalBudget,
      totalActual,
      totalVariance,
      totalVariancePercent,
      insights: fallbackInsights,
      keyFindings: [
        `Total variance: $${(Math.abs(totalVariance) / 100).toLocaleString()} (${Math.abs(totalVariancePercent).toFixed(1)}%)`,
        `${topVariances.filter(v => v.variance > 0).length} accounts over budget`,
        `${topVariances.filter(v => v.variance < 0).length} accounts under budget`,
      ],
      recommendations: [
        'Review significant variances with department heads',
        'Update rolling forecasts based on actual trends',
        'Consider budget reallocation for next period',
      ],
    };
  }
}
