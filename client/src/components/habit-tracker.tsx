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
  durationValue: number;
  durationType: string;
  currentStreak: number;
  goalMeaning?: string;
  goalFeeling?: string;
  progress?: string;
  isCompleted?: boolean;
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
  onBreakHabit?: (habitId: number) => void;
}

export default function HabitTracker({ simplified = false, onStruggleClick, onBreakHabit }: HabitTrackerProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user habits
  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ["/api/habits"],
    enabled: isAuthenticated,
  });

  // Get today's habit entries
  const { data: todayEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/habits/today"],
    enabled: isAuthenticated,
  });

  // Create habit entry mutation
  const createHabitEntryMutation = useMutation({
    mutationFn: async (habitId: number) => {
      const today = new Date().toISOString().split('T')[0];
      return await apiRequest("POST", "/api/habits/entries", {
        habitId,
        date: today,
        completed: true,
        count: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits/today"] });
      toast({
        title: "Great job!",
        description: "Habit completed for today",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      console.error("Error creating habit entry:", error);
      toast({
        title: "Error",
        description: "Failed to complete habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleHabit = async (habit: Habit) => {
    try {
      await createHabitEntryMutation.mutateAsync(habit.id);
    } catch (error) {
      console.error("Failed to toggle habit:", error);
    }
  };

  const isHabitCompleted = (habitId: number): boolean => {
    return todayEntries.some((entry: HabitEntry) => 
      entry.habitId === habitId && entry.completed
    );
  };

  const getHabitProgress = (habit: Habit) => {
    const createdDate = new Date(habit.createdAt);
    const today = new Date();
    
    if (habit.frequency === 'daily') {
      const daysSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const targetDays = habit.durationValue;
      return {
        current: Math.min(daysSinceCreated, targetDays),
        total: targetDays,
        type: `${targetDays > 1 ? 'days' : 'day'}`
      };
    } else if (habit.frequency === 'weekly') {
      const weeksSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
      const targetWeeks = habit.durationValue;
      return {
        current: Math.min(weeksSinceCreated, targetWeeks),
        total: targetWeeks,
        type: `${targetWeeks > 1 ? 'weeks' : 'week'}`
      };
    }
    
    return { current: 0, total: habit.durationValue, type: 'days' };
  };

  if (!isAuthenticated) {
    return null;
  }

  if (habitsLoading || entriesLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-button rounded-xl p-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-text-tertiary/20 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-4 bg-text-tertiary/20 rounded w-32 mb-2"></div>
                <div className="h-3 bg-text-tertiary/20 rounded w-24"></div>
              </div>
              <div className="w-10 h-10 bg-text-tertiary/20 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {habits.length > 0 ? (
        habits.map((habit: Habit) => {
          const completed = isHabitCompleted(habit.id);
          const progress = getHabitProgress(habit);
          
          return (
            <div key={habit.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 glass-button rounded-xl gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: habit.color + '20' }}
                >
                  <i 
                    className={`${habit.icon} text-lg sm:text-xl`}
                    style={{ color: habit.color }}
                  ></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-sm sm:text-base truncate ${completed ? "line-through text-text-secondary" : ""}`}>
                    {habit.name}
                  </h3>
                  {habit.description && (
                    <p className="text-xs sm:text-sm text-text-tertiary truncate">{habit.description}</p>
                  )}
                  <div className="text-xs text-text-tertiary mt-1">
                    {habit.frequency} • Target: {habit.targetCount}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                <div className="text-center">
                  <div className={`text-sm font-medium ${completed ? "text-apple-green" : "text-apple-blue"}`}>
                    {progress.current}/{progress.total}
                  </div>
                  <div className="text-xs text-text-tertiary">{progress.type}</div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {onStruggleClick && (
                    <Button
                      onClick={() => onStruggleClick(habit.id)}
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                      title="Log hard moment"
                    >
                      <i className="fas fa-exclamation text-xs sm:text-sm"></i>
                    </Button>
                  )}
                  
                  {onBreakHabit && (
                    <Button
                      onClick={() => onBreakHabit(habit.id)}
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                      title="I broke my habit"
                    >
                      <i className="fas fa-times text-xs sm:text-sm"></i>
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => toggleHabit(habit)}
                    disabled={completed || createHabitEntryMutation.isPending}
                    variant="ghost"
                    size="sm"
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
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