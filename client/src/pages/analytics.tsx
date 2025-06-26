import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

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
  weeklyProgress: Array<{
    day: string;
    hours: number;
  }>;
}

interface HabitAnalytics {
  habits: Array<{
    id: number;
    name: string;
    successRate: number;
    totalEntries: number;
    completedEntries: number;
    color: string;
  }>;
  period: string;
}

export default function Analytics() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Get dashboard analytics
  const { data: dashboardAnalytics, isLoading: dashboardLoading, error: dashboardError } = useQuery<DashboardAnalytics>({
    queryKey: ["/api/analytics/dashboard"],
    enabled: isAuthenticated,
  });

  // Get habit analytics
  const { data: habitAnalytics, isLoading: habitLoading, error: habitError } = useQuery<HabitAnalytics>({
    queryKey: ["/api/analytics/habits"],
    enabled: isAuthenticated,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    const handleError = (error: any) => {
      if (error && isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    };

    handleError(dashboardError);
    handleError(habitError);
  }, [dashboardError, habitError, toast]);

  if (authLoading || dashboardLoading || habitLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-1">
        <Card className="glass-card rounded-3xl p-8">
          <CardContent className="p-0">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue mx-auto"></div>
            <p className="text-text-secondary mt-4">Loading analytics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mockWeeklyData = [
    { day: "Mon", hours: 2.5 },
    { day: "Tue", hours: 4.2 },
    { day: "Wed", hours: 1.8 },
    { day: "Thu", hours: 5.3 },
    { day: "Fri", hours: 3.7 },
    { day: "Sat", hours: 0 },
    { day: "Sun", hours: 0 },
  ];

  const maxHours = Math.max(...mockWeeklyData.map(d => d.hours));

  return (
    <div className="min-h-screen bg-dark-1 text-text-primary pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Analytics</h1>
          <p className="text-xl text-text-secondary">
            Insights into your productivity patterns and progress
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-card rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-apple-blue mb-2">
                  {dashboardAnalytics?.todayStats.sessionsToday || 0}
                </div>
                <div className="text-text-tertiary text-sm">Sessions Today</div>
                <div className="text-apple-blue text-xs mt-1">
                  +{Math.max(0, (dashboardAnalytics?.todayStats.sessionsToday || 0) - 1)} from yesterday
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-apple-green mb-2">
                  {dashboardAnalytics?.todayStats.focusTime || "0m"}
                </div>
                <div className="text-text-tertiary text-sm">Focus Time</div>
                <div className="text-apple-green text-xs mt-1">
                  +2.3h from last week
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-apple-orange mb-2">
                  {dashboardAnalytics?.streak || 0}
                </div>
                <div className="text-text-tertiary text-sm">Day Streak</div>
                <div className="text-apple-orange text-xs mt-1">
                  Personal best!
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {dashboardAnalytics?.todayStats.habitsCompleted || 0}
                </div>
                <div className="text-text-tertiary text-sm">Habits Completed</div>
                <div className="text-purple-400 text-xs mt-1">
                  {dashboardAnalytics?.goalsCompleted || 0}/{dashboardAnalytics?.totalGoals || 5} daily goals
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Progress Chart */}
          <Card className="glass-card rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">This Week's Focus Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2">
                {mockWeeklyData.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-apple-blue rounded-t transition-all duration-300 hover:bg-apple-indigo"
                      style={{ 
                        height: `${maxHours > 0 ? (day.hours / maxHours) * 100 : 0}%`,
                        minHeight: day.hours > 0 ? '8px' : '4px'
                      }}
                    ></div>
                    <div className="text-xs text-text-tertiary mt-2">{day.day}</div>
                    <div className="text-xs text-text-secondary">
                      {day.hours > 0 ? `${day.hours}h` : "—"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center text-sm text-text-tertiary">
                Total: 17.5 hours • Average: 3.5h per active day
              </div>
            </CardContent>
          </Card>

          {/* Habit Success Rates */}
          <Card className="glass-card rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Habit Success Rate (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {habitAnalytics?.habits && habitAnalytics.habits.length > 0 ? (
                <div className="space-y-6">
                  {habitAnalytics.habits.map((habit) => (
                    <div key={habit.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: habit.color }}
                          ></div>
                          <span className="font-medium">{habit.name}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-text-tertiary">
                            {habit.completedEntries}/{habit.totalEntries} days
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`${
                              habit.successRate >= 80 
                                ? "text-apple-green" 
                                : habit.successRate >= 60 
                                ? "text-apple-orange" 
                                : "text-apple-red"
                            }`}
                          >
                            {habit.successRate}%
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={habit.successRate} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-chart-bar text-text-tertiary text-3xl mb-4"></i>
                  <h3 className="text-lg font-semibold mb-2">No habit data yet</h3>
                  <p className="text-text-tertiary">
                    Start tracking habits to see your success patterns
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Productivity Insights */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Peak Performance Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-apple-green rounded-full"></div>
                      <span className="text-sm">9:00 AM - 11:00 AM</span>
                    </div>
                    <Badge variant="secondary" className="text-apple-green">
                      Best
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-apple-blue rounded-full"></div>
                      <span className="text-sm">2:00 PM - 4:00 PM</span>
                    </div>
                    <Badge variant="secondary" className="text-apple-blue">
                      Good
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-apple-orange rounded-full"></div>
                      <span className="text-sm">7:00 PM - 9:00 PM</span>
                    </div>
                    <Badge variant="secondary" className="text-apple-orange">
                      Fair
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 glass-button rounded-xl">
                    <div className="w-8 h-8 bg-apple-green rounded-full flex items-center justify-center">
                      <i className="fas fa-trophy text-white text-xs"></i>
                    </div>
                    <div>
                      <div className="text-sm font-medium">7-Day Streak</div>
                      <div className="text-xs text-text-tertiary">Completed daily goals</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 glass-button rounded-xl">
                    <div className="w-8 h-8 bg-apple-blue rounded-full flex items-center justify-center">
                      <i className="fas fa-clock text-white text-xs"></i>
                    </div>
                    <div>
                      <div className="text-sm font-medium">90-Minute Focus</div>
                      <div className="text-xs text-text-tertiary">Completed full session</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 glass-button rounded-xl">
                    <div className="w-8 h-8 bg-apple-orange rounded-full flex items-center justify-center">
                      <i className="fas fa-pen text-white text-xs"></i>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Journal Entry</div>
                      <div className="text-xs text-text-tertiary">Daily reflection completed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Summary */}
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">This Week's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-apple-blue mb-1">
                    17.5
                  </div>
                  <div className="text-sm text-text-tertiary">Total Hours</div>
                  <div className="text-xs text-apple-blue mt-1">+2.3h from last week</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-apple-green mb-1">
                    92
                  </div>
                  <div className="text-sm text-text-tertiary">Avg Session (min)</div>
                  <div className="text-xs text-apple-green mt-1">Perfect range!</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-apple-orange mb-1">
                    85%
                  </div>
                  <div className="text-sm text-text-tertiary">Goal Completion</div>
                  <div className="text-xs text-apple-orange mt-1">Excellent progress!</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
