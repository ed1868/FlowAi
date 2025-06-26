import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { requestNotificationPermission, showNotification } from "@/lib/notifications";

interface FocusSession {
  id: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  type: string;
  completed: boolean;
}

export default function Timer() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(90 * 60); // 90 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState("deep_work");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(90);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Get user preferences
  const { data: preferences } = useQuery({
    queryKey: ["/api/preferences"],
    enabled: isAuthenticated,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest("POST", "/api/sessions", sessionData);
      return response.json();
    },
    onSuccess: (session: FocusSession) => {
      setCurrentSessionId(session.id);
      toast({
        title: "Session Started",
        description: `${sessionDuration}-minute ${sessionType.replace('_', ' ')} session has begun!`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
      });
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, updateData }: { sessionId: number; updateData: any }) => {
      const response = await apiRequest("PATCH", `/api/sessions/${sessionId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to update session",
        variant: "destructive",
      });
    },
  });

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Update timer duration when preferences change
  useEffect(() => {
    if (preferences?.sessionDuration && !isRunning) {
      const duration = preferences.sessionDuration;
      setSessionDuration(duration);
      setTimeRemaining(duration * 60);
    }
  }, [preferences, isRunning]);

  // Timer effect
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Session completed
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    
    if (currentSessionId && startTimeRef.current) {
      const endTime = new Date();
      const actualDuration = Math.floor((endTime.getTime() - startTimeRef.current.getTime()) / 1000 / 60);
      
      updateSessionMutation.mutate({
        sessionId: currentSessionId,
        updateData: {
          endTime: endTime.toISOString(),
          duration: actualDuration,
          completed: true,
        },
      });
    }

    // Show notification
    showNotification(
      "Session Complete!",
      `Great job! You've completed your ${sessionDuration}-minute ${sessionType.replace('_', ' ')} session.`,
      "/timer"
    );

    toast({
      title: "Session Complete! 🎉",
      description: `Great job! You've completed your ${sessionDuration}-minute session.`,
    });

    // Reset for next session
    setCurrentSessionId(null);
    setTimeRemaining(sessionDuration * 60);
  };

  const startTimer = () => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to start a session",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    startTimeRef.current = new Date();
    
    // Create new session
    createSessionMutation.mutate({
      startTime: new Date().toISOString(),
      type: sessionType,
    });
  };

  const pauseTimer = () => {
    setIsRunning(false);
    
    if (currentSessionId && startTimeRef.current) {
      const pauseTime = new Date();
      const duration = Math.floor((pauseTime.getTime() - startTimeRef.current.getTime()) / 1000 / 60);
      
      updateSessionMutation.mutate({
        sessionId: currentSessionId,
        updateData: {
          endTime: pauseTime.toISOString(),
          duration,
          completed: false,
        },
      });
    }

    toast({
      title: "Session Paused",
      description: "Your session has been paused. You can resume anytime.",
    });
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeRemaining(sessionDuration * 60);
    
    if (currentSessionId) {
      updateSessionMutation.mutate({
        sessionId: currentSessionId,
        updateData: {
          endTime: new Date().toISOString(),
          completed: false,
        },
      });
      setCurrentSessionId(null);
    }

    toast({
      title: "Session Reset",
      description: "Timer has been reset. Start when you're ready!",
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((sessionDuration * 60 - timeRemaining) / (sessionDuration * 60)) * 100;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-1">
        <Card className="glass-card rounded-3xl p-8">
          <CardContent className="p-0">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue mx-auto"></div>
            <p className="text-text-secondary mt-4">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-1 text-text-primary pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Focus Timer</h1>
          <p className="text-xl text-text-secondary">
            Deep work sessions designed for maximum productivity
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Timer Display */}
          <Card className="glass-card rounded-3xl p-8">
            <CardContent className="p-0">
              <div className="text-center">
                {/* Timer Configuration */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Select value={sessionDuration.toString()} onValueChange={(value) => {
                      if (!isRunning) {
                        const duration = parseInt(value);
                        setSessionDuration(duration);
                        setTimeRemaining(duration * 60);
                      }
                    }}>
                      <SelectTrigger className="w-32 glass-button">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                        <SelectItem value="120">120 min</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sessionType} onValueChange={setSessionType}>
                      <SelectTrigger className="w-40 glass-button">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deep_work">Deep Work</SelectItem>
                        <SelectItem value="break">Break</SelectItem>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Circular Progress */}
                <div className="relative w-64 h-64 mx-auto mb-8">
                  <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-dark-3"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-apple-blue progress-ring"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={`${progressPercentage}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">{formatTime(timeRemaining)}</div>
                      <div className="text-text-tertiary text-sm">
                        {isRunning ? "remaining" : "ready"}
                      </div>
                      {isRunning && (
                        <div className="text-apple-green text-xs mt-1">
                          {sessionType.replace('_', ' ')} session
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timer Controls */}
                <div className="flex justify-center space-x-4 mb-6">
                  {!isRunning ? (
                    <Button
                      onClick={startTimer}
                      className="w-16 h-16 bg-apple-green hover:bg-apple-green/80 rounded-full text-white hover:scale-110 transition-transform"
                      disabled={createSessionMutation.isPending}
                    >
                      <i className="fas fa-play text-xl"></i>
                    </Button>
                  ) : (
                    <Button
                      onClick={pauseTimer}
                      className="w-16 h-16 bg-apple-orange hover:bg-apple-orange/80 rounded-full text-white hover:scale-110 transition-transform"
                      disabled={updateSessionMutation.isPending}
                    >
                      <i className="fas fa-pause text-xl"></i>
                    </Button>
                  )}
                  
                  <Button
                    onClick={resetTimer}
                    className="w-16 h-16 bg-apple-red hover:bg-apple-red/80 rounded-full text-white hover:scale-110 transition-transform"
                    disabled={updateSessionMutation.isPending}
                  >
                    <i className="fas fa-stop text-xl"></i>
                  </Button>
                </div>

                {/* Session Status */}
                <div className="text-center">
                  <div className="text-sm text-text-tertiary">
                    {isRunning ? (
                      <>Running: {sessionType.replace('_', ' ')} session</>
                    ) : (
                      <>Ready to start your {sessionType.replace('_', ' ')} session</>
                    )}
                  </div>
                  {currentSessionId && (
                    <div className="text-xs text-apple-blue mt-1">
                      Session #{currentSessionId}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Tips & Progress */}
          <div className="space-y-6">
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Session Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-apple-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="fas fa-lightbulb text-white text-xs"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Eliminate Distractions</h4>
                      <p className="text-text-secondary text-sm">Turn off notifications and close unnecessary tabs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-apple-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="fas fa-target text-white text-xs"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Set Clear Intention</h4>
                      <p className="text-text-secondary text-sm">Define what you want to accomplish this session</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-apple-orange rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="fas fa-water text-white text-xs"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Stay Hydrated</h4>
                      <p className="text-text-secondary text-sm">Keep water nearby and take small sips when needed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Session Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-brain text-apple-blue"></i>
                      <span className="text-sm">Deep Work</span>
                    </div>
                    <span className="text-text-tertiary text-xs">90 min</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-coffee text-apple-orange"></i>
                      <span className="text-sm">Break</span>
                    </div>
                    <span className="text-text-tertiary text-xs">15 min</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-clipboard-list text-apple-green"></i>
                      <span className="text-sm">Planning</span>
                    </div>
                    <span className="text-text-tertiary text-xs">25 min</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-search text-purple-400"></i>
                      <span className="text-sm">Review</span>
                    </div>
                    <span className="text-text-tertiary text-xs">45 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
