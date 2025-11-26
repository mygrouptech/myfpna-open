/**
 * AI-Powered Variance Insights Component
 * 
 * Displays AI-generated variance analysis with natural language explanations
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, AlertCircle } from "lucide-react";
import { formatCurrency, formatPercent } from "@/const";
import { toast } from "sonner";

interface AIVarianceInsightsProps {
  scenarioId: number;
}

export default function AIVarianceInsights({ scenarioId }: AIVarianceInsightsProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const analyzeMutation = trpc.ai.analyzeVariances.useMutation({
    onSuccess: () => {
      toast.success("AI variance analysis complete!");
      setShowDetails(true);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to analyze variances");
    },
  });

  const analysis = analyzeMutation.data;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <TrendingUp className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <CardTitle>AI Variance Insights</CardTitle>
          </div>
          <Button
            onClick={() => analyzeMutation.mutate({ scenarioId })}
            disabled={analyzeMutation.isPending}
            size="sm"
          >
            {analyzeMutation.isPending ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze Variances
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          AI-powered analysis of budget vs actual variances with actionable insights
        </CardDescription>
      </CardHeader>

      {analysis && (
        <CardContent className="space-y-6">
          {/* Executive Summary */}
          <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 p-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div className="font-medium text-purple-900">Executive Summary</div>
                <p className="text-sm text-purple-700">{analysis.summary}</p>
              </div>
            </div>
          </div>

          {/* Overall Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Total Budget</div>
              <div className="text-2xl font-bold">{formatCurrency(analysis.totalBudget / 100)}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Total Actual</div>
              <div className="text-2xl font-bold">{formatCurrency(analysis.totalActual / 100)}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Variance</div>
              <div className={`text-2xl font-bold flex items-center gap-2 ${analysis.totalVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {analysis.totalVariance > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {formatCurrency(Math.abs(analysis.totalVariance) / 100)}
                <span className="text-sm">({formatPercent(Math.abs(analysis.totalVariancePercent) / 100)})</span>
              </div>
            </div>
          </div>

          {/* Key Findings */}
          {analysis.keyFindings.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Key Findings
              </div>
              <ul className="space-y-1">
                {analysis.keyFindings.map((finding, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Insights */}
          {analysis.insights.length > 0 && (
            <div className="space-y-3">
              <div className="font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Detailed Insights ({analysis.insights.length})
              </div>
              
              {analysis.insights.map((insight, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{insight.accountName}</div>
                      <div className="text-sm text-muted-foreground">{insight.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(insight.severity)}>
                        {getSeverityIcon(insight.severity)}
                        <span className="ml-1 capitalize">{insight.severity}</span>
                      </Badge>
                      <Badge variant="outline">
                        {insight.confidence}% confidence
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm">{insight.explanation}</p>

                  {insight.recommendations.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Recommendations:</div>
                      <ul className="space-y-1">
                        {insight.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-600">→</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {insight.riskFactors && insight.riskFactors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <div className="font-medium mb-1">Risk Factors:</div>
                        <ul className="space-y-1">
                          {insight.riskFactors.map((risk, i) => (
                            <li key={i} className="text-sm">• {risk}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {insight.opportunities && insight.opportunities.length > 0 && (
                    <div className="rounded-lg bg-green-50 border-green-200 border p-3">
                      <div className="font-medium text-green-900 mb-1">Opportunities:</div>
                      <ul className="space-y-1">
                        {insight.opportunities.map((opp, i) => (
                          <li key={i} className="text-sm text-green-700">• {opp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Overall Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="rounded-lg border bg-blue-50 border-blue-200 p-4">
              <div className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Overall Recommendations
              </div>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Transparency Notice */}
          <div className="text-xs text-muted-foreground border-t pt-4">
            <p>
              <strong>AI Transparency:</strong> These insights are generated using advanced AI analysis of your financial data. 
              Confidence scores indicate the AI's certainty level. All recommendations should be reviewed by your finance team 
              before taking action.
            </p>
          </div>
        </CardContent>
      )}

      {!analysis && !analyzeMutation.isPending && (
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-300" />
            <p>Click "Analyze Variances" to generate AI-powered insights</p>
            <p className="text-sm mt-2">
              AI will analyze your budget vs actual data and provide actionable recommendations
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
