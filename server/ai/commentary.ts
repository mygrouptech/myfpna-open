/**
 * AI Commentary Generation
 * 
 * Generates executive summaries, insights, and recommendations
 * for variance analysis reports and financial data.
 * 
 * Premium feature only.
 */

import { invokeLLM } from '../_core/llm';
import type { VarianceRow } from '../export/csv';

/**
 * AI model options for commentary generation
 */
export type AIModel = 'gpt-4' | 'gpt-4.1-mini' | 'claude' | 'manus-forge';

/**
 * Commentary generation result
 */
export interface Commentary {
  executiveSummary: string;
  keyInsights: string[];
  recommendations: string[];
  riskFactors: string[];
  opportunities: string[];
  generatedAt: Date;
  model: string;
  confidence: number;
}

/**
 * Generate AI commentary for variance analysis
 */
export async function generateVarianceCommentary(
  varianceData: VarianceRow[],
  options?: {
    model?: AIModel;
    scenarioName?: string;
    companyContext?: string;
    includeRecommendations?: boolean;
  }
): Promise<Commentary> {
  const model = options?.model || 'gpt-4.1-mini';
  
  // Prepare variance summary for AI
  const totalBudget = varianceData.reduce((sum, row) => sum + row.budgetAmount, 0);
  const totalActual = varianceData.reduce((sum, row) => sum + row.actualAmount, 0);
  const totalVariance = totalActual - totalBudget;
  const totalVariancePercent = (totalVariance / totalBudget) * 100;
  
  // Find top variances
  const topOverruns = varianceData
    .filter(row => row.variance > 0)
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 5);
  
  const topUnderruns = varianceData
    .filter(row => row.variance < 0)
    .sort((a, b) => a.variance - b.variance)
    .slice(0, 5);
  
  // Format data for AI
  const summary = {
    scenarioName: options?.scenarioName || 'Budget Analysis',
    totalBudget: totalBudget / 100,
    totalActual: totalActual / 100,
    totalVariance: totalVariance / 100,
    totalVariancePercent: totalVariancePercent.toFixed(2) + '%',
    topOverruns: topOverruns.map(row => ({
      account: row.accountName,
      category: row.category,
      budget: row.budgetAmount / 100,
      actual: row.actualAmount / 100,
      variance: row.variance / 100,
      variancePercent: row.variancePercent.toFixed(2) + '%',
    })),
    topUnderruns: topUnderruns.map(row => ({
      account: row.accountName,
      category: row.category,
      budget: row.budgetAmount / 100,
      actual: row.actualAmount / 100,
      variance: row.variance / 100,
      variancePercent: row.variancePercent.toFixed(2) + '%',
    })),
  };
  
  const prompt = `You are a senior financial analyst preparing an executive summary for a variance analysis report.

${options?.companyContext ? `Company Context: ${options.companyContext}\n` : ''}

Variance Analysis Summary:
${JSON.stringify(summary, null, 2)}

Please provide a comprehensive analysis including:

1. **Executive Summary** (2-3 sentences): High-level overview of the financial performance
2. **Key Insights** (3-5 bullet points): Most important findings from the variance analysis
3. **Recommendations** (3-5 bullet points): Actionable recommendations for management
4. **Risk Factors** (2-3 bullet points): Areas of concern that need attention
5. **Opportunities** (2-3 bullet points): Positive variances or areas of strength

Guidelines:
- Be concise and professional
- Focus on material variances (>10%)
- Provide specific numbers and percentages
- Avoid jargon, use clear business language
- Be objective and data-driven

Respond in JSON format:
{
  "executiveSummary": "...",
  "keyInsights": ["...", "..."],
  "recommendations": ["...", "..."],
  "riskFactors": ["...", "..."],
  "opportunities": ["...", "..."],
  "confidence": 85
}`;

  try {
    const response = await invokeLLM({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1500,
    });
    
    const content = typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content 
      : JSON.stringify(response.choices[0].message.content);
    const result = JSON.parse(content);
    
    return {
      executiveSummary: result.executiveSummary || 'No summary generated',
      keyInsights: result.keyInsights || [],
      recommendations: options?.includeRecommendations !== false ? (result.recommendations || []) : [],
      riskFactors: result.riskFactors || [],
      opportunities: result.opportunities || [],
      generatedAt: new Date(),
      model: model,
      confidence: result.confidence || 75,
    };
  } catch (error) {
    console.error('AI commentary generation failed:', error);
    throw new Error('Failed to generate AI commentary');
  }
}

/**
 * Generate AI commentary for forecast results
 */
export async function generateForecastCommentary(
  forecastData: Array<{
    accountName: string;
    period: Date;
    predictedAmount: number;
    confidence?: number;
  }>,
  historicalData: Array<{
    accountName: string;
    period: Date;
    amount: number;
  }>,
  options?: {
    model?: AIModel;
    forecastName?: string;
    companyContext?: string;
  }
): Promise<Commentary> {
  const model = options?.model || 'gpt-4.1-mini';
  
  // Calculate forecast trends
  const totalForecast = forecastData.reduce((sum, row) => sum + row.predictedAmount, 0);
  const totalHistorical = historicalData.reduce((sum, row) => sum + row.amount, 0);
  const growthRate = ((totalForecast - totalHistorical) / totalHistorical) * 100;
  
  const summary = {
    forecastName: options?.forecastName || 'Financial Forecast',
    totalForecast: totalForecast / 100,
    totalHistorical: totalHistorical / 100,
    growthRate: growthRate.toFixed(2) + '%',
    forecastPeriods: forecastData.length,
    avgConfidence: forecastData.reduce((sum, row) => sum + (row.confidence || 0), 0) / forecastData.length,
  };
  
  const prompt = `You are a senior financial analyst reviewing a financial forecast.

${options?.companyContext ? `Company Context: ${options.companyContext}\n` : ''}

Forecast Summary:
${JSON.stringify(summary, null, 2)}

Please provide a comprehensive analysis including:

1. **Executive Summary** (2-3 sentences): Overview of the forecast and key trends
2. **Key Insights** (3-5 bullet points): Most important findings from the forecast
3. **Recommendations** (3-5 bullet points): Strategic recommendations based on the forecast
4. **Risk Factors** (2-3 bullet points): Potential risks or uncertainties
5. **Opportunities** (2-3 bullet points): Growth opportunities or positive trends

Respond in JSON format:
{
  "executiveSummary": "...",
  "keyInsights": ["...", "..."],
  "recommendations": ["...", "..."],
  "riskFactors": ["...", "..."],
  "opportunities": ["...", "..."],
  "confidence": 85
}`;

  try {
    const response = await invokeLLM({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1500,
    });
    
    const content = typeof response.choices[0].message.content === 'string' 
      ? response.choices[0].message.content 
      : JSON.stringify(response.choices[0].message.content);
    const result = JSON.parse(content);
    
    return {
      executiveSummary: result.executiveSummary || 'No summary generated',
      keyInsights: result.keyInsights || [],
      recommendations: result.recommendations || [],
      riskFactors: result.riskFactors || [],
      opportunities: result.opportunities || [],
      generatedAt: new Date(),
      model: model,
      confidence: result.confidence || 75,
    };
  } catch (error) {
    console.error('AI forecast commentary generation failed:', error);
    throw new Error('Failed to generate AI forecast commentary');
  }
}

/**
 * Generate AI commentary for KPI dashboard
 */
export async function generateKPICommentary(
  kpis: Record<string, number>,
  previousPeriodKPIs?: Record<string, number>,
  options?: {
    model?: AIModel;
    companyContext?: string;
  }
): Promise<Commentary> {
  const model = options?.model || 'gpt-4.1-mini';
  
  // Calculate KPI changes
  const kpiChanges: Record<string, { current: number; previous?: number; change?: number; changePercent?: number }> = {};
  
  Object.entries(kpis).forEach(([key, value]) => {
    const previous = previousPeriodKPIs?.[key];
    kpiChanges[key] = {
      current: value,
      previous,
      change: previous !== undefined ? value - previous : undefined,
      changePercent: previous !== undefined && previous !== 0 ? ((value - previous) / previous) * 100 : undefined,
    };
  });
  
  const prompt = `You are a senior financial analyst reviewing key performance indicators (KPIs).

${options?.companyContext ? `Company Context: ${options.companyContext}\n` : ''}

KPI Summary:
${JSON.stringify(kpiChanges, null, 2)}

Please provide a brief analysis including:

1. **Executive Summary** (1-2 sentences): Overall performance assessment
2. **Key Insights** (2-3 bullet points): Most important KPI trends
3. **Recommendations** (2-3 bullet points): Actions to improve performance
4. **Risk Factors** (1-2 bullet points): Areas of concern
5. **Opportunities** (1-2 bullet points): Positive trends to leverage

Respond in JSON format:
{
  "executiveSummary": "...",
  "keyInsights": ["...", "..."],
  "recommendations": ["...", "..."],
  "riskFactors": ["...", "..."],
  "opportunities": ["...", "..."],
  "confidence": 85
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
    
    return {
      executiveSummary: result.executiveSummary || 'No summary generated',
      keyInsights: result.keyInsights || [],
      recommendations: result.recommendations || [],
      riskFactors: result.riskFactors || [],
      opportunities: result.opportunities || [],
      generatedAt: new Date(),
      model: model,
      confidence: result.confidence || 75,
    };
  } catch (error) {
    console.error('AI KPI commentary generation failed:', error);
    throw new Error('Failed to generate AI KPI commentary');
  }
}

/**
 * Format commentary as markdown
 */
export function formatCommentaryAsMarkdown(commentary: Commentary): string {
  let markdown = `# Financial Analysis Commentary\n\n`;
  markdown += `*Generated on ${commentary.generatedAt.toLocaleDateString()} using ${commentary.model}*\n\n`;
  markdown += `---\n\n`;
  
  markdown += `## Executive Summary\n\n`;
  markdown += `${commentary.executiveSummary}\n\n`;
  
  if (commentary.keyInsights.length > 0) {
    markdown += `## Key Insights\n\n`;
    commentary.keyInsights.forEach(insight => {
      markdown += `- ${insight}\n`;
    });
    markdown += `\n`;
  }
  
  if (commentary.recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    commentary.recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });
    markdown += `\n`;
  }
  
  if (commentary.riskFactors.length > 0) {
    markdown += `## Risk Factors\n\n`;
    commentary.riskFactors.forEach(risk => {
      markdown += `- ${risk}\n`;
    });
    markdown += `\n`;
  }
  
  if (commentary.opportunities.length > 0) {
    markdown += `## Opportunities\n\n`;
    commentary.opportunities.forEach(opp => {
      markdown += `- ${opp}\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `---\n\n`;
  markdown += `*Confidence Score: ${commentary.confidence}%*\n`;
  
  return markdown;
}
