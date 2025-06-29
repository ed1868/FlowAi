import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, TrendingUp, Heart, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { JournalEntry } from "@shared/schema";

interface FlowAIProps {
  entries: JournalEntry[];
}

interface AIInsight {
  category: "mood" | "productivity" | "growth" | "patterns";
  title: string;
  insight: string;
  recommendation: string;
  confidence: number;
}

const categoryIcons = {
  mood: Heart,
  productivity: Target,
  growth: TrendingUp,
  patterns: Sparkles
};

const categoryColors = {
  mood: "bg-pink-500/20 border-pink-500/50",
  productivity: "bg-blue-500/20 border-blue-500/50", 
  growth: "bg-green-500/20 border-green-500/50",
  patterns: "bg-purple-500/20 border-purple-500/50"
};

export default function FlowAI({ entries }: FlowAIProps) {
  const [lastAnalysisCount, setLastAnalysisCount] = useState(0);

  // Fetch AI insights
  const { data: insights = [], isLoading, refetch } = useQuery<AIInsight[]>({
    queryKey: ["/api/ai/insights"],
    enabled: entries.length > 0,
  });

  // Generate new insights
  const generateInsightsMutation = useMutation({
    mutationFn: () => apiRequest("/api/ai/generate-insights", {
      method: "POST",
    }),
    onSuccess: () => {
      setLastAnalysisCount(entries.length);
      refetch();
    },
  });

  const hasNewEntries = entries.length > lastAnalysisCount;
  const canAnalyze = entries.length >= 3; // Need minimum entries for meaningful analysis

  if (!canAnalyze) {
    return (
      <Card className="glass-card border-glass-border">
        <CardContent className="p-8 text-center">
          <Sparkles className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">FlowAI Analysis</h3>
          <p className="text-gray-400 mb-4">
            Write at least 3 journal entries to unlock personalized AI insights about your patterns, mood trends, and growth opportunities.
          </p>
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-sm">
              {entries.length}/3 entries needed
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <CardTitle className="text-white">FlowAI Insights</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generateInsightsMutation.mutate()}
              disabled={generateInsightsMutation.isPending}
              className="glass-button border-glass-border text-white hover:bg-white/10"
            >
              {generateInsightsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {hasNewEntries ? "Analyze New Entries" : "Refresh Analysis"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {hasNewEntries && insights.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/20 border border-blue-500/50">
              <p className="text-sm text-blue-300">
                You have {entries.length - lastAnalysisCount} new entries since your last analysis. 
                Click "Analyze New Entries" for updated insights.
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/5 rounded w-full mb-1" />
                  <div className="h-3 bg-white/5 rounded w-5/6" />
                </div>
              ))}
            </div>
          ) : insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight, index) => {
                const Icon = categoryIcons[insight.category];
                return (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${categoryColors[insight.category]}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-white mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-white">{insight.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(insight.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">{insight.insight}</p>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-sm text-blue-300 font-medium">💡 Recommendation:</p>
                          <p className="text-sm text-gray-300 mt-1">{insight.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">
                No insights generated yet. Click "Refresh Analysis" to get AI-powered insights about your journal entries.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="glass-card border-glass-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{entries.length}</div>
              <p className="text-xs text-gray-400">Total Entries</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{insights.length}</div>
              <p className="text-xs text-gray-400">AI Insights</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {insights.length > 0 ? Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length * 100) : 0}%
              </div>
              <p className="text-xs text-gray-400">Avg Confidence</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}