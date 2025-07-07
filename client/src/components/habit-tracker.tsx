import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

interface Habit {
  id: number;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: string;
  targetCount: number;
  isActive: boolean;
  createdAt: string;
}

interface HabitEntry {
  id: number;
  habitId: number;
  userId: string;
  date: string;
  completed: boolean;
  count: number;
  notes?: string;
  createdAt: string;
}

interface HabitTrackerProps {
  simplified?: boolean;
  onStruggleClick?: (habitId: number) => void;
}

export default function HabitTracker({ simplified = false, onStruggleClick }: HabitTrackerProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user habits
  const { data: habits = [], error: habitsError } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
    enabled: isAuthenticated,
  });

  // Get today's habit entries
  const { data: todayEntries = [], error: entriesError } = useQuery<HabitEntry[]>({
    queryKey: ["/api/habits/today"],
    enabled: isAuthenticated,
    queryFn: async () => {
      // Since we don't have a specific endpoint for today's entries,
      // we'll fetch all entries and filter on the client side
      const response = await fetch("/api/habits", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch habits");
      
      const allHabits = await response.json();
      const today = new Date().toISOString().split('T')[0];
      
      // Get entries for each habit for today
      const allEntries: HabitEntry[] = [];
      
      for (const habit of allHabits) {
        try {
          const entriesResponse = await fetch(`/api/habits/${habit.id}/entries`, { 
            credentials: "include" 
          });
          if (entriesResponse.ok) {
            const entries = await entriesResponse.json();
            const todayEntry = entries.find((entry: HabitEntry) => 
              entry.date.split('T')[0] === today
            );
            if (todayEntry) {
              allEntries.push(todayEntry);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch entries for habit ${habit.id}:`, error);
        }
      }
      
      return allEntries;
    },
  });

  // Handle unauthorized errors
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

    handleError(habitsError);
    handleError(entriesError);
  }, [habitsError, entriesError, toast]);

  // Create habit entry mutation
  const createHabitEntryMutation = useMutation({
    mutationFn: async ({ habitId, entryData }: { habitId: number; entryData: any }) => {
      const response = await apiRequest("POST", `/api/habits/${habitId}/entries`, entryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits/today"] });
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
        description: "Failed to update habit",
        variant: "destructive",
      });
    },
  });

  const toggleHabit = async (habit: Habit) => {
    const today = new Date().toISOString();
    const existingEntry = todayEntries.find(entry => entry.habitId === habit.id);
    
    if (existingEntry) {
      // For simplicity, we'll create a new entry instead of updating
      // In a real app, you'd want to implement an update endpoint
      toast({
        title: "Already completed",
        description: "This habit has already been completed today",
      });
      return;
    }

    createHabitEntryMutation.mutate({
      habitId: habit.id,
      entryData: {
        date: today,
        completed: true,
        count: 1,
      },
    });

    toast({
      title: "Habit completed! 🎉",
      description: `Great job completing "${habit.name}"`,
    });
  };

  const isHabitCompleted = (habitId: number) => {
    return todayEntries.some(entry => entry.habitId === habitId && entry.completed);
  };

  const getHabitStreak = (habit: Habit) => {
    // This is a simplified streak calculation
    // In a real app, you'd calculate this on the server
    return Math.floor(Math.random() * 10) + 1; // Mock streak for now
  };

  if (simplified) {
    return (
      <div className="space-y-3">
        {habits.length > 0 ? (
          habits.slice(0, 3).map((habit) => {
            const completed = isHabitCompleted(habit.id);
            const streak = getHabitStreak(habit);
            
            return (
              <div key={habit.id} className="flex items-center justify-between p-3 glass-button rounded-xl">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleHabit(habit)}
                    disabled={completed || createHabitEntryMutation.isPending}
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                      completed
                        ? "bg-apple-green border-apple-green text-white"
                        : "border-apple-blue hover:border-apple-green"
                    }`}
                  >
                    {completed && <i className="fas fa-check text-xs"></i>}
                  </button>
                  <span className={completed ? "text-text-secondary line-through" : ""}>
                    {habit.name}
                  </span>
                </div>
                <div className={`text-sm ${completed ? "text-apple-green" : "text-apple-blue"}`}>
                  🔥 {streak} days
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4">
            <i className="fas fa-plus-circle text-text-tertiary text-lg mb-2"></i>
            <p className="text-text-tertiary text-sm">No habits yet</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {habits.length > 0 ? (
        habits.map((habit) => {
          const completed = isHabitCompleted(habit.id);
          const streak = getHabitStreak(habit);
          
          return (
            <div key={habit.id} className="flex items-center justify-between p-4 glass-button rounded-xl">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: habit.color + '20' }}
                >
                  <i 
                    className={`${habit.icon} text-xl`}
                    style={{ color: habit.color }}
                  ></i>
                </div>
                <div>
                  <h3 className={`font-medium ${completed ? "line-through text-text-secondary" : ""}`}>
                    {habit.name}
                  </h3>
                  {habit.description && (
                    <p className="text-sm text-text-tertiary">{habit.description}</p>
                  )}
                  <div className="text-xs text-text-tertiary mt-1">
                    {habit.frequency} • Target: {habit.targetCount}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className={`text-sm font-medium ${completed ? "text-apple-green" : "text-apple-blue"}`}>
                    🔥 {streak}
                  </div>
                  <div className="text-xs text-text-tertiary">days</div>
                </div>
                
                {onStruggleClick && (
                  <Button
                    onClick={() => onStruggleClick(habit.id)}
                    variant="ghost"
                    size="sm"
                    className="w-10 h-10 rounded-full border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                    title="Log hard moment"
                  >
                    <i className="fas fa-exclamation text-sm"></i>
                  </Button>
                )}
                
                <Button
                  onClick={() => toggleHabit(habit)}
                  disabled={completed || createHabitEntryMutation.isPending}
                  variant="ghost"
                  size="sm"
                  className={`w-10 h-10 rounded-full ${
                    completed
                      ? "bg-apple-green text-white"
                      : "border-2 border-apple-blue hover:bg-apple-green hover:border-apple-green hover:text-white"
                  }`}
                >
                  {completed ? (
                    <i className="fas fa-check"></i>
                  ) : (
                    <i className="fas fa-plus"></i>
                  )}
                </Button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">
          <i className="fas fa-target text-text-tertiary text-3xl mb-4"></i>
          <h3 className="text-lg font-semibold mb-2">No habits yet</h3>
          <p className="text-text-tertiary mb-4">Create your first habit to start tracking your progress</p>
        </div>
      )}
    </div>
  );
}
