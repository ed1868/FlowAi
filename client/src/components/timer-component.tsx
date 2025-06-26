import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { showNotification } from "@/lib/notifications";
import { Link } from "wouter";

interface FocusSession {
  id: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  type: string;
  completed: boolean;
}

export default function TimerComponent() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
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
    },
  });

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
      "Session Complete! 🎉",
      `Great job! You've completed your ${sessionDuration}-minute ${sessionType.replace('_', ' ')} session.`,
      "/"
    );

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
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((sessionDuration * 60 - timeRemaining) / (sessionDuration * 60)) * 100;

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Focus Timer</CardTitle>
        <Link href="/timer">
          <Button variant="ghost" size="sm" className="text-apple-blue hover:text-apple-indigo">
            <i className="fas fa-expand-alt"></i>
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          {/* Timer Configuration */}
          <div className="mb-6">
            <div className="flex gap-2 justify-center">
              <Select 
                value={sessionDuration.toString()} 
                onValueChange={(value) => {
                  if (!isRunning) {
                    const duration = parseInt(value);
                    setSessionDuration(duration);
                    setTimeRemaining(duration * 60);
                  }
                }}
              >
                <SelectTrigger className="w-24 glass-button text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25m</SelectItem>
                  <SelectItem value="45">45m</SelectItem>
                  <SelectItem value="90">90m</SelectItem>
                  <SelectItem value="120">120m</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger className="w-28 glass-button text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deep_work">Deep Work</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="relative w-40 h-40 mx-auto mb-6">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 36 36">
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
                <div className="text-2xl font-bold mb-1">{formatTime(timeRemaining)}</div>
                <div className="text-text-tertiary text-xs">
                  {isRunning ? "remaining" : "ready"}
                </div>
                {isRunning && (
                  <div className="text-apple-green text-xs mt-1">
                    {sessionType.replace('_', ' ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center space-x-3 mb-4">
            {!isRunning ? (
              <Button
                onClick={startTimer}
                className="w-12 h-12 bg-apple-green hover:bg-apple-green/80 rounded-full text-white hover:scale-110 transition-transform"
                disabled={createSessionMutation.isPending}
              >
                <i className="fas fa-play"></i>
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                className="w-12 h-12 bg-apple-orange hover:bg-apple-orange/80 rounded-full text-white hover:scale-110 transition-transform"
                disabled={updateSessionMutation.isPending}
              >
                <i className="fas fa-pause"></i>
              </Button>
            )}
            
            <Button
              onClick={resetTimer}
              className="w-12 h-12 bg-apple-red hover:bg-apple-red/80 rounded-full text-white hover:scale-110 transition-transform"
              disabled={updateSessionMutation.isPending}
            >
              <i className="fas fa-stop"></i>
            </Button>
          </div>

          {/* Session Status */}
          <div className="text-center">
            <div className="text-sm text-text-tertiary">
              {isRunning ? (
                <>Running: {sessionType.replace('_', ' ')} session</>
              ) : (
                <>Ready to start {sessionType.replace('_', ' ')} session</>
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
  );
}
