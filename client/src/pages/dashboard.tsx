import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import TimerComponent from "@/components/timer-component";
import HabitTracker from "@/components/habit-tracker";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import { 
  Flame, 
  Target, 
  PenTool, 
  Mic, 
  Leaf, 
  TrendingUp, 
  Plus, 
  ExternalLink 
} from "lucide-react";

interface DashboardAnalytics {
  todayStats: {
    sessionsToday: number;
    focusTime: string;
    journalEntries: number;
    habitsCompleted: number;
  };
  streak: number;
  goalsCompleted: number;
  totalGoals: number;
  recentJournalEntries: Array<{
    id: number;
    content: string;
    createdAt: string;
  }>;
  weeklyProgress: Array<{
    day: string;
    hours: number;
  }>;
}

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: analytics, isLoading: analyticsLoading, error } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
    enabled: isAuthenticated,
  });

  if (authLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-1">
        <Card className="glass-card rounded-3xl p-8">
          <CardContent className="p-0">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue mx-auto"></div>
            <p className="text-text-secondary mt-4">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userDisplayName = 'User';

  return (
    <div className="min-h-screen bg-dark-1 text-text-primary pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, <span className="gradient-text">{userDisplayName}</span>
            </h1>
            <p className="text-text-secondary">Ready for another productive day?</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <Badge variant="secondary" className="glass-button px-4 py-2">
              <Flame className="text-apple-orange mr-2" size={16} />
              {analytics?.streak || 0} day streak
            </Badge>
            <Badge variant="secondary" className="glass-button px-4 py-2">
              <Target className="text-apple-green mr-2" size={16} />
              {analytics?.goalsCompleted || 0}/{analytics?.totalGoals || 5} goals
            </Badge>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Timer Section */}
          <div className="lg:col-span-1">
            <TimerComponent />
          </div>

          {/* Quick Actions & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Progress */}
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Today's Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-apple-blue">
                      {analytics?.todayStats.sessionsToday || 0}
                    </div>
                    <div className="text-sm text-text-tertiary">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-apple-green">
                      {analytics?.todayStats.focusTime || "0h 0m"}
                    </div>
                    <div className="text-sm text-text-tertiary">Focus Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-apple-orange">
                      {analytics?.todayStats.journalEntries || 0}
                    </div>
                    <div className="text-sm text-text-tertiary">Journal Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {analytics?.todayStats.habitsCompleted || 0}
                    </div>
                    <div className="text-sm text-text-tertiary">Habits Done</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/journal">
                    <Button variant="ghost" className="glass-button p-4 rounded-xl text-center hover:scale-105 transition-transform w-full h-auto flex flex-col">
                      <PenTool className="text-apple-orange mb-2" size={24} />
                      <span className="text-sm">Journal</span>
                    </Button>
                  </Link>
                  <Link href="/voice-notes">
                    <Button variant="ghost" className="glass-button p-4 rounded-xl text-center hover:scale-105 transition-transform w-full h-auto flex flex-col">
                      <Mic className="text-apple-green mb-2" size={24} />
                      <span className="text-sm">Voice Note</span>
                    </Button>
                  </Link>
                  <Link href="/habits">
                    <Button variant="ghost" className="glass-button p-4 rounded-xl text-center hover:scale-105 transition-transform w-full h-auto flex flex-col">
                      <Leaf className="text-apple-blue mb-2" size={24} />
                      <span className="text-sm">Reset Kit</span>
                    </Button>
                  </Link>
                  <Link href="/analytics">
                    <Button variant="ghost" className="glass-button p-4 rounded-xl text-center hover:scale-105 transition-transform w-full h-auto flex flex-col">
                      <TrendingUp className="text-purple-400 mb-2" size={24} />
                      <span className="text-sm">Analytics</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity & Habits */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Today's Habits */}
          <Card className="glass-card rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Today's Habits</CardTitle>
              <Link href="/habits">
                <Button variant="ghost" size="sm" className="text-apple-blue hover:text-apple-indigo">
                  <Plus size={16} />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <HabitTracker simplified />
            </CardContent>
          </Card>

          {/* Recent Journal Entries */}
          <Card className="glass-card rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Thoughts</CardTitle>
              <Link href="/journal">
                <Button variant="ghost" size="sm" className="text-apple-blue hover:text-apple-indigo">
                  <ExternalLink size={16} />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.recentJournalEntries && analytics.recentJournalEntries.length > 0 ? (
                  analytics.recentJournalEntries.map((entry) => (
                    <div key={entry.id} className="p-4 glass-button rounded-xl">
                      <div className="text-sm text-text-tertiary mb-2">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                      <p className="text-text-secondary leading-relaxed line-clamp-3">
                        {entry.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <PenTool className="text-text-tertiary mx-auto mb-4" size={32} />
                    <p className="text-text-tertiary">No journal entries yet</p>
                    <Link href="/journal">
                      <Button variant="outline" size="sm" className="mt-2">
                        Start Writing
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
