import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import HabitTracker from "@/components/habit-tracker";
import StruggleHistory from "@/components/struggle-history";

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

interface HabitStruggle {
  id: number;
  habitId: number;
  userId: string;
  note: string;
  intensity: number;
  triggers?: string;
  location?: string;
  mood?: string;
  createdAt: string;
}

interface ResetRitual {
  id: number;
  name: string;
  description?: string;
  icon: string;
  duration?: number;
  category: string;
  isDefault: boolean;
  createdAt: string;
}

const defaultHabits = [
  { name: "Morning Meditation", icon: "fas fa-om", color: "#34C759", category: "wellness" },
  { name: "Exercise", icon: "fas fa-dumbbell", color: "#FF9500", category: "fitness" },
  { name: "Read", icon: "fas fa-book", color: "#007AFF", category: "learning" },
  { name: "Drink Water", icon: "fas fa-tint", color: "#5AC8FA", category: "health" },
  { name: "No Smoking", icon: "fas fa-ban", color: "#FF3B30", category: "health" },
  { name: "Journaling", icon: "fas fa-pen", color: "#AF52DE", category: "reflection" },
];

const defaultRituals = [
  { name: "Deep Breathing", icon: "fas fa-wind", duration: 5, category: "breathing", description: "4-7-8 breathing technique" },
  { name: "Quick Walk", icon: "fas fa-walking", duration: 10, category: "movement", description: "Fresh air break" },
  { name: "Neck Stretch", icon: "fas fa-arrows-alt", duration: 3, category: "movement", description: "Relieve tension" },
  { name: "Hydrate", icon: "fas fa-glass-water", duration: 1, category: "wellness", description: "Drink a glass of water" },
  { name: "Eye Rest", icon: "fas fa-eye", duration: 2, category: "wellness", description: "20-20-20 rule" },
  { name: "Energizing Music", icon: "fas fa-music", duration: 5, category: "wellness", description: "Listen to upbeat songs" },
];

export default function Habits() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<"habits" | "rituals">("habits");
  const [isHabitDialogOpen, setIsHabitDialogOpen] = useState(false);
  const [isRitualDialogOpen, setIsRitualDialogOpen] = useState(false);
  const [isStruggleDialogOpen, setIsStruggleDialogOpen] = useState(false);
  const [isBreakDialogOpen, setIsBreakDialogOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [breakReason, setBreakReason] = useState("");
  
  // New state for habit details dialog
  const [isHabitDetailsOpen, setIsHabitDetailsOpen] = useState(false);
  const [habitToView, setHabitToView] = useState<Habit | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editHabitForm, setEditHabitForm] = useState<any>({});
  
  // Habit form state
  const [habitForm, setHabitForm] = useState({
    name: "",
    description: "",
    icon: "fas fa-check",
    color: "#007AFF",
    frequency: "daily",
    targetCount: 1,
    durationValue: 30,
    durationType: "days",
    goalMeaning: "",
    goalFeeling: "",
  });
  
  // Ritual form state
  const [ritualForm, setRitualForm] = useState({
    name: "",
    description: "",
    icon: "fas fa-spa",
    duration: 5,
    category: "wellness",
  });

  // Struggle form state
  const [struggleForm, setStruggleForm] = useState({
    note: "",
    intensity: 5,
    triggers: "",
    location: "",
    mood: "",
  });

  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Get current location function
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get address
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const location = data.city ? `${data.city}, ${data.countryName}` : `${data.locality || 'Unknown'}, ${data.countryName}`;
            
            setStruggleForm(prev => ({
              ...prev,
              location
            }));
          } else {
            // Fallback to coordinates
            setStruggleForm(prev => ({
              ...prev,
              location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            }));
          }
        } catch (error) {
          // Fallback to coordinates
          const { latitude, longitude } = position.coords;
          setStruggleForm(prev => ({
            ...prev,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          }));
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Location access denied",
          description: "Please enable location access or enter manually",
          variant: "destructive",
        });
      }
    );
  };

  // Get habits
  const { data: habits = [], isLoading: habitsLoading, error: habitsError } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
    enabled: isAuthenticated,
  });

  // Get reset rituals
  const { data: rituals = [], isLoading: ritualsLoading, error: ritualsError } = useQuery<ResetRitual[]>({
    queryKey: ["/api/reset-rituals"],
    enabled: isAuthenticated,
  });

  // Get habit struggles for selected habit
  const { data: habitStruggles = [] } = useQuery({
    queryKey: ["/api/habits", habitToView?.id, "struggles"],
    queryFn: async () => {
      const response = await fetch(`/api/habits/${habitToView?.id}/struggles`);
      if (!response.ok) {
        throw new Error('Failed to fetch struggles');
      }
      return response.json();
    },
    enabled: isAuthenticated && !!habitToView?.id,
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

    handleError(habitsError);
    handleError(ritualsError);
  }, [habitsError, ritualsError, toast]);

  // Create habit mutation
  const createHabitMutation = useMutation({
    mutationFn: async (habitData: any) => {
      const response = await apiRequest("POST", "/api/habits", habitData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setIsHabitDialogOpen(false);
      resetHabitForm();
      toast({
        title: "Habit Created",
        description: "Your new habit has been added successfully!",
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
        description: "Failed to create habit",
        variant: "destructive",
      });
    },
  });

  // Create ritual mutation
  const createRitualMutation = useMutation({
    mutationFn: async (ritualData: any) => {
      const response = await apiRequest("POST", "/api/reset-rituals", ritualData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reset-rituals"] });
      setIsRitualDialogOpen(false);
      resetRitualForm();
      toast({
        title: "Ritual Created",
        description: "Your new reset ritual has been added successfully!",
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
        description: "Failed to create ritual",
        variant: "destructive",
      });
    },
  });

  // Complete ritual mutation
  const completeRitualMutation = useMutation({
    mutationFn: async (ritualId: number) => {
      const response = await apiRequest("POST", `/api/reset-rituals/${ritualId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ritual Completed! 🎉",
        description: "Great job taking care of yourself!",
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
        description: "Failed to complete ritual",
        variant: "destructive",
      });
    },
  });

  // Create struggle mutation
  const createStruggleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/habits/${selectedHabitId}/struggles`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Struggle logged",
        description: "Your hard moment has been recorded. You can do this!",
      });
      setIsStruggleDialogOpen(false);
      resetStruggleForm();
      queryClient.invalidateQueries({ queryKey: ["/api/habits", selectedHabitId, "struggles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
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
        description: "Failed to log struggle",
        variant: "destructive",
      });
    },
  });

  // Create habit break mutation
  const createHabitBreakMutation = useMutation({
    mutationFn: async (data: { habitId: number; reason?: string }) => {
      const response = await apiRequest("POST", `/api/habits/${data.habitId}/breaks`, {
        reason: data.reason,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Habit break recorded",
        description: "It's okay to stumble. Your counter has been reset and you can start fresh!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
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
        description: "Failed to record habit break",
        variant: "destructive",
      });
    },
  });

  const resetHabitForm = () => {
    setHabitForm({
      name: "",
      description: "",
      icon: "fas fa-check",
      color: "#007AFF",
      frequency: "daily",
      targetCount: 1,
      durationValue: 30,
      durationType: "days",
      goalMeaning: "",
      goalFeeling: "",
    });
  };

  const resetRitualForm = () => {
    setRitualForm({
      name: "",
      description: "",
      icon: "fas fa-spa",
      duration: 5,
      category: "wellness",
    });
  };

  const resetStruggleForm = () => {
    setStruggleForm({
      note: "",
      intensity: 5,
      triggers: "",
      location: "",
      mood: "",
    });
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitForm.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your habit",
        variant: "destructive",
      });
      return;
    }
    createHabitMutation.mutate(habitForm);
  };

  const handleCreateRitual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ritualForm.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your ritual",
        variant: "destructive",
      });
      return;
    }
    createRitualMutation.mutate(ritualForm);
  };

  const addDefaultHabit = (defaultHabit: any) => {
    createHabitMutation.mutate({
      ...defaultHabit,
      frequency: "daily",
      targetCount: 1,
      durationValue: 30,
      durationType: "days",
      goalMeaning: "",
      goalFeeling: "",
    });
  };

  const addDefaultRitual = (defaultRitual: any) => {
    createRitualMutation.mutate(defaultRitual);
  };

  const handleCreateStruggle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!struggleForm.note.trim()) {
      toast({
        title: "Note Required",
        description: "Please describe what you're going through",
        variant: "destructive",
      });
      return;
    }
    createStruggleMutation.mutate(struggleForm);
  };

  const openStruggleDialog = (habitId: number) => {
    setSelectedHabitId(habitId);
    setIsStruggleDialogOpen(true);
  };

  const handleBreakHabit = (habitId: number) => {
    const habit = habits.find(h => h.id === habitId);
    setSelectedHabit(habit || null);
    setSelectedHabitId(habitId);
    setIsBreakDialogOpen(true);
  };

  const confirmBreakHabit = () => {
    if (selectedHabitId) {
      createHabitBreakMutation.mutate({ 
        habitId: selectedHabitId, 
        reason: breakReason || undefined 
      });
      setIsBreakDialogOpen(false);
      setBreakReason("");
      setSelectedHabit(null);
      setSelectedHabitId(null);
    }
  };

  // Update habit mutation
  const updateHabitMutation = useMutation({
    mutationFn: async (habitData: any) => {
      return await apiRequest("PATCH", `/api/habits/${habitToView?.id}`, habitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Success",
        description: "Habit updated successfully!",
      });
      setIsEditMode(false);
      setIsHabitDetailsOpen(false);
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
      console.error("Error updating habit:", error);
      toast({
        title: "Error",
        description: "Failed to update habit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle habit click to view details
  const handleHabitClick = (habit: Habit) => {
    setHabitToView(habit);
    setEditHabitForm({
      name: habit.name,
      description: habit.description || "",
      frequency: habit.frequency,
      targetCount: habit.targetCount,
      durationValue: habit.durationValue,
      durationType: habit.durationType,
      icon: habit.icon,
      color: habit.color,
      goalMeaning: habit.goalMeaning || "",
      goalFeeling: habit.goalFeeling || "",
    });
    setIsHabitDetailsOpen(true);
    setIsEditMode(false);
  };

  // Handle habit update
  const handleUpdateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateHabitMutation.mutateAsync(editHabitForm);
  };

  // Check if habit goal date is reached
  const isHabitGoalReached = (habit: Habit): boolean => {
    const createdDate = new Date(habit.createdAt);
    const today = new Date();
    
    if (habit.frequency === 'daily') {
      const daysSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return daysSinceCreated >= habit.durationValue;
    } else if (habit.frequency === 'weekly') {
      const weeksSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
      return weeksSinceCreated >= habit.durationValue;
    }
    
    return false;
  };

  if (authLoading || habitsLoading || ritualsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-1">
        <Card className="glass-card rounded-3xl p-8">
          <CardContent className="p-0">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue mx-auto"></div>
            <p className="text-text-secondary mt-4">Loading habits...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-1 text-text-primary pt-16 md:pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4 gradient-text">Habits & Rituals</h1>
          <p className="text-base sm:text-lg md:text-xl text-text-secondary px-4">
            Build lasting habits and create mindful reset rituals
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="glass-card rounded-2xl p-1 flex w-full max-w-xs sm:max-w-sm">
            <Button
              variant="ghost"
              onClick={() => setActiveTab("habits")}
              className={`flex-1 px-3 sm:px-6 py-2 rounded-xl transition-colors text-sm sm:text-base ${
                activeTab === "habits"
                  ? "bg-apple-blue text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <i className="fas fa-chart-line mr-1 sm:mr-2"></i>
              <span>Habits</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("rituals")}
              className={`flex-1 px-3 sm:px-6 py-2 rounded-xl transition-colors text-sm sm:text-base ${
                activeTab === "rituals"
                  ? "bg-apple-blue text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <i className="fas fa-spa mr-1 sm:mr-2"></i>
              <span className="hidden sm:inline">Reset Rituals</span>
              <span className="sm:hidden">Rituals</span>
            </Button>
          </div>
        </div>

        {activeTab === "habits" ? (
          <div className="space-y-6 md:space-y-8">
            {/* Today's Habits */}
            <Card className="glass-card rounded-2xl">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold">Today's Habits</CardTitle>
                <Dialog open={isHabitDialogOpen} onOpenChange={setIsHabitDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-apple-blue hover:bg-apple-blue/80 text-white w-full sm:w-auto">
                      <i className="fas fa-plus mr-2"></i>
                      Add Habit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-none max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="gradient-text text-center">Create New Habit</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateHabit} className="space-y-4">
                      <div>
                        <Input
                          placeholder="Habit name"
                          value={habitForm.name}
                          onChange={(e) => setHabitForm(prev => ({ ...prev, name: e.target.value }))}
                          className="glass-button border-none focus:ring-2 focus:ring-apple-blue"
                        />
                      </div>
                      <div>
                        <Textarea
                          placeholder="Description (optional)"
                          value={habitForm.description}
                          onChange={(e) => setHabitForm(prev => ({ ...prev, description: e.target.value }))}
                          className="glass-button border-none focus:ring-2 focus:ring-apple-blue"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-text-secondary mb-1 block">Frequency</label>
                          <Select value={habitForm.frequency} onValueChange={(value) => setHabitForm(prev => ({ ...prev, frequency: value }))}>
                            <SelectTrigger className="glass-button border-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-text-secondary mb-1 block">Target count</label>
                          <Input
                            type="number"
                            placeholder="1"
                            value={habitForm.targetCount}
                            onChange={(e) => setHabitForm(prev => ({ ...prev, targetCount: parseInt(e.target.value) || 1 }))}
                            className="glass-button border-none focus:ring-2 focus:ring-apple-blue"
                            min="1"
                          />
                        </div>
                      </div>
                      
                      {/* Duration Selection */}
                      <div>
                        <label className="text-sm text-text-secondary block mb-2">Habit Duration Goal</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Input
                              type="number"
                              placeholder="Duration"
                              value={habitForm.durationValue}
                              onChange={(e) => setHabitForm(prev => ({ ...prev, durationValue: parseInt(e.target.value) || 1 }))}
                              className="glass-button border-none focus:ring-2 focus:ring-apple-blue"
                              min="1"
                            />
                          </div>
                          <div>
                            <Select value={habitForm.durationType} onValueChange={(value) => setHabitForm(prev => ({ ...prev, durationType: value }))}>
                              <SelectTrigger className="glass-button border-none">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="weeks">Weeks</SelectItem>
                                <SelectItem value="months">Months</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <p className="text-xs text-text-tertiary mt-1">
                          Track progress like "5/30 days" or "2/8 weeks"
                        </p>
                      </div>
                      
                      {/* Goal Meaning Section */}
                      <div className="space-y-4 p-4 glass-button rounded-xl">
                        <div className="text-center">
                          <i className="fas fa-heart text-apple-pink text-xl mb-2"></i>
                          <h4 className="font-medium text-text-primary">What This Goal Means to You</h4>
                          <p className="text-xs text-text-tertiary">Understanding your 'why' makes habits stick</p>
                        </div>
                        <div>
                          <Textarea
                            placeholder="What would achieving this habit mean to you? (e.g., 'I'll feel more confident and healthy')"
                            value={habitForm.goalMeaning}
                            onChange={(e) => setHabitForm(prev => ({ ...prev, goalMeaning: e.target.value }))}
                            className="glass-button border-none focus:ring-2 focus:ring-apple-pink"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Textarea
                            placeholder="How would you feel when you achieve this? (e.g., 'Proud, energized, accomplished')"
                            value={habitForm.goalFeeling}
                            onChange={(e) => setHabitForm(prev => ({ ...prev, goalFeeling: e.target.value }))}
                            className="glass-button border-none focus:ring-2 focus:ring-apple-pink"
                            rows={2}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          className="flex-1 bg-apple-blue hover:bg-apple-blue/80 text-white"
                          disabled={createHabitMutation.isPending}
                        >
                          Create Habit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsHabitDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <HabitTracker 
                  onStruggleClick={openStruggleDialog} 
                  onBreakHabit={handleBreakHabit}
                  onHabitClick={handleHabitClick}
                  isHabitGoalReached={isHabitGoalReached}
                />
              </CardContent>
            </Card>

            {/* Quick Add Habits */}
            {habits.length === 0 && (
              <Card className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Popular Habits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {defaultHabits.map((habit, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        onClick={() => addDefaultHabit(habit)}
                        className="glass-button p-3 sm:p-4 h-auto flex flex-col items-center justify-center space-y-2 hover:scale-105 transition-transform text-center"
                        disabled={createHabitMutation.isPending}
                      >
                        <div 
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: habit.color + '20' }}
                        >
                          <i 
                            className={`${habit.icon} text-lg sm:text-xl`}
                            style={{ color: habit.color }}
                          ></i>
                        </div>
                        <span className="text-xs sm:text-sm font-medium line-clamp-2">{habit.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {habit.category}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {/* Reset Rituals */}
            <Card className="glass-card rounded-2xl">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-lg font-semibold">Reset Rituals</CardTitle>
                <Dialog open={isRitualDialogOpen} onOpenChange={setIsRitualDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-apple-blue hover:bg-apple-blue/80 text-white w-full sm:w-auto">
                      <i className="fas fa-plus mr-2"></i>
                      Add Ritual
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-none">
                    <DialogHeader>
                      <DialogTitle className="gradient-text">Create New Ritual</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateRitual} className="space-y-4">
                      <div>
                        <Input
                          placeholder="Ritual name"
                          value={ritualForm.name}
                          onChange={(e) => setRitualForm(prev => ({ ...prev, name: e.target.value }))}
                          className="glass-button border-none focus:ring-2 focus:ring-apple-blue"
                        />
                      </div>
                      <div>
                        <Textarea
                          placeholder="Description (optional)"
                          value={ritualForm.description}
                          onChange={(e) => setRitualForm(prev => ({ ...prev, description: e.target.value }))}
                          className="glass-button border-none focus:ring-2 focus:ring-apple-blue"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Select value={ritualForm.category} onValueChange={(value) => setRitualForm(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger className="glass-button border-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="breathing">Breathing</SelectItem>
                              <SelectItem value="movement">Movement</SelectItem>
                              <SelectItem value="wellness">Wellness</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Input
                            type="number"
                            placeholder="Duration (minutes)"
                            value={ritualForm.duration}
                            onChange={(e) => setRitualForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 5 }))}
                            className="glass-button border-none focus:ring-2 focus:ring-apple-blue"
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          className="flex-1 bg-apple-blue hover:bg-apple-blue/80 text-white"
                          disabled={createRitualMutation.isPending}
                        >
                          Create Ritual
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsRitualDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rituals.length > 0 ? (
                    rituals.map((ritual) => (
                      <div key={ritual.id} className="flex items-center justify-between p-4 glass-button rounded-xl">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-apple-blue to-apple-indigo rounded-xl flex items-center justify-center">
                            <i className={`${ritual.icon} text-white`}></i>
                          </div>
                          <div>
                            <h3 className="font-medium">{ritual.name}</h3>
                            <div className="text-sm text-text-tertiary">
                              {ritual.description} • {ritual.duration} minutes
                            </div>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {ritual.category}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => completeRitualMutation.mutate(ritual.id)}
                          className="bg-apple-green hover:bg-apple-green/80 text-white"
                          disabled={completeRitualMutation.isPending}
                        >
                          <i className="fas fa-check mr-2"></i>
                          Complete
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-spa text-text-tertiary text-3xl mb-4"></i>
                      <h3 className="text-lg font-semibold mb-2">No rituals yet</h3>
                      <p className="text-text-tertiary">Create your first reset ritual to refresh between sessions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Add Rituals */}
            {rituals.length === 0 && (
              <Card className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Popular Reset Rituals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {defaultRituals.map((ritual, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        onClick={() => addDefaultRitual(ritual)}
                        className="glass-button p-4 h-auto flex flex-col items-center justify-center space-y-2 hover:scale-105 transition-transform"
                        disabled={createRitualMutation.isPending}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-apple-blue to-apple-indigo rounded-xl flex items-center justify-center">
                          <i className={`${ritual.icon} text-white`}></i>
                        </div>
                        <span className="text-sm font-medium">{ritual.name}</span>
                        <div className="text-xs text-text-tertiary text-center">
                          <div>{ritual.duration} minutes</div>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {ritual.category}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Struggle Dialog */}
      <Dialog open={isStruggleDialogOpen} onOpenChange={setIsStruggleDialogOpen}>
        <DialogContent className="glass-card border-none max-w-md">
          <DialogHeader>
            <DialogTitle className="gradient-text">Log Hard Moment</DialogTitle>
            <p className="text-text-secondary text-sm">
              Record what you're going through right now. This helps identify patterns and triggers.
            </p>
          </DialogHeader>
          <form onSubmit={handleCreateStruggle} className="space-y-4">
            <div>
              <Textarea
                placeholder="What's going on right now? (e.g., 'really feel like smoking a cig right now at 3:17')"
                value={struggleForm.note}
                onChange={(e) => setStruggleForm(prev => ({ ...prev, note: e.target.value }))}
                className="glass-button border-none focus:ring-2 focus:ring-orange-400"
                rows={4}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-secondary block mb-2">Intensity (1-10)</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={struggleForm.intensity}
                  onChange={(e) => setStruggleForm(prev => ({ ...prev, intensity: parseInt(e.target.value) }))}
                  className="glass-button border-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary block mb-2">Current mood</label>
                <Select value={struggleForm.mood} onValueChange={(value) => setStruggleForm(prev => ({ ...prev, mood: value }))}>
                  <SelectTrigger className="glass-button border-none">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stressed">Stressed</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                    <SelectItem value="bored">Bored</SelectItem>
                    <SelectItem value="frustrated">Frustrated</SelectItem>
                    <SelectItem value="sad">Sad</SelectItem>
                    <SelectItem value="angry">Angry</SelectItem>
                    <SelectItem value="lonely">Lonely</SelectItem>
                    <SelectItem value="tired">Tired</SelectItem>
                    <SelectItem value="overwhelmed">Overwhelmed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-text-secondary block mb-2">Location (optional)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Where are you? (e.g., office, home, car)"
                  value={struggleForm.location}
                  onChange={(e) => setStruggleForm(prev => ({ ...prev, location: e.target.value }))}
                  className="glass-button border-none focus:ring-2 focus:ring-orange-400 flex-1"
                />
                <Button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  variant="ghost"
                  size="sm"
                  className="px-3 py-2 glass-button text-apple-blue hover:text-apple-blue/80 hover:bg-apple-blue/10 border-none"
                  title="Get current location"
                >
                  {isGettingLocation ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-location-crosshairs"></i>
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm text-text-secondary block mb-2">Triggers (optional)</label>
              <Input
                placeholder="What might have triggered this? (e.g., work stress, argument)"
                value={struggleForm.triggers}
                onChange={(e) => setStruggleForm(prev => ({ ...prev, triggers: e.target.value }))}
                className="glass-button border-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={createStruggleMutation.isPending}
                className="flex-1 bg-orange-400 hover:bg-orange-500 text-white"
              >
                {createStruggleMutation.isPending ? "Logging..." : "Log Struggle"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsStruggleDialogOpen(false);
                  resetStruggleForm();
                }}
                className="flex-1 glass-button border-glass text-text-secondary hover:text-text-primary"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Break Habit Dialog */}
      <Dialog open={isBreakDialogOpen} onOpenChange={setIsBreakDialogOpen}>
        <DialogContent className="glass-card border-none max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <div className="text-center space-y-4 sm:space-y-6">
            {/* Header with broken heart icon */}
            <div className="space-y-2 sm:space-y-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                <i className="fas fa-heart-broken text-xl sm:text-2xl text-red-400"></i>
              </div>
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-semibold text-text-primary">
                  Breaking Your Habit
                </DialogTitle>
              </DialogHeader>
            </div>

            {/* Reminder of their goal */}
            {selectedHabit && (selectedHabit.goalMeaning || selectedHabit.goalFeeling) && (
              <div className="p-4 bg-apple-pink/10 rounded-xl space-y-2">
                <div className="text-sm text-text-secondary">
                  <i className="fas fa-quote-left text-apple-pink mr-1"></i>
                  Remember what this meant to you:
                </div>
                {selectedHabit.goalMeaning && (
                  <p className="text-sm text-text-primary italic">
                    "{selectedHabit.goalMeaning}"
                  </p>
                )}
                {selectedHabit.goalFeeling && (
                  <p className="text-sm text-apple-pink">
                    You wanted to feel: {selectedHabit.goalFeeling}
                  </p>
                )}
              </div>
            )}

            {/* Reason input */}
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                It's okay to stumble. What happened? (This helps you learn and grow)
              </p>
              <Textarea
                placeholder="What led to this? Be honest with yourself..."
                value={breakReason}
                onChange={(e) => setBreakReason(e.target.value)}
                className="glass-button border-none focus:ring-2 focus:ring-red-400 text-center"
                rows={3}
              />
            </div>

            {/* Action buttons */}
            <div className="space-y-2 sm:space-y-3">
              <Button
                onClick={confirmBreakHabit}
                disabled={createHabitBreakMutation.isPending}
                className="w-full bg-red-500 hover:bg-red-600 text-white text-sm sm:text-base py-2 sm:py-3"
              >
                {createHabitBreakMutation.isPending ? "Recording..." : "Reset & Start Fresh"}
              </Button>
              <Button
                onClick={() => {
                  setIsBreakDialogOpen(false);
                  setBreakReason("");
                  setSelectedHabit(null);
                  setSelectedHabitId(null);
                }}
                variant="ghost"
                className="w-full text-text-secondary hover:text-text-primary text-sm sm:text-base py-2 sm:py-3"
              >
                Never Mind, Keep Going
              </Button>
            </div>

            {/* Encouraging message */}
            <div className="text-xs text-text-tertiary bg-apple-green/10 p-3 rounded-lg">
              <i className="fas fa-seedling text-apple-green mr-1"></i>
              Every reset is a chance to grow stronger. You've got this! 🌱
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Habit Details Dialog */}
      <Dialog open={isHabitDetailsOpen} onOpenChange={setIsHabitDetailsOpen}>
        <DialogContent className="glass-card rounded-2xl border-white/10 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" aria-describedby="habit-details-description">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {habitToView && (
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: habitToView.color + '20' }}
                  >
                    <i 
                      className={`${habitToView.icon} text-xl`}
                      style={{ color: habitToView.color }}
                    ></i>
                  </div>
                )}
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {isEditMode ? "Edit Habit" : habitToView?.name}
                  </DialogTitle>
                  {!isEditMode && habitToView?.description && (
                    <p className="text-sm text-text-secondary">{habitToView.description}</p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => setIsEditMode(!isEditMode)}
                variant="ghost"
                size="sm"
                className="text-apple-blue hover:text-apple-blue/80"
              >
                <i className={`fas ${isEditMode ? "fa-times" : "fa-edit"} mr-2`}></i>
                {isEditMode ? "Cancel" : "Edit"}
              </Button>
            </div>
          </DialogHeader>
          <div id="habit-details-description" className="sr-only">
            View and edit habit details, including struggle history and settings
          </div>

          <div className="space-y-6">
            {isEditMode ? (
              <form onSubmit={handleUpdateHabit} className="space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <i className="fas fa-info-circle text-apple-blue"></i>
                    <h3 className="text-lg font-semibold text-text-primary">Basic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">Habit Name</label>
                      <input
                        type="text"
                        value={editHabitForm.name}
                        onChange={(e) => setEditHabitForm({...editHabitForm, name: e.target.value})}
                        className="w-full glass-input rounded-lg p-3 h-12 text-sm focus:ring-2 focus:ring-apple-blue transition-all"
                        placeholder="Enter habit name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">Frequency</label>
                      <select
                        value={editHabitForm.frequency}
                        onChange={(e) => setEditHabitForm({...editHabitForm, frequency: e.target.value})}
                        className="w-full glass-input rounded-lg p-3 h-12 text-sm focus:ring-2 focus:ring-apple-blue transition-all"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Description</label>
                    <textarea
                      value={editHabitForm.description}
                      onChange={(e) => setEditHabitForm({...editHabitForm, description: e.target.value})}
                      className="w-full glass-input rounded-lg p-3 h-24 text-sm resize-none focus:ring-2 focus:ring-apple-blue transition-all"
                      placeholder="Describe your habit and why it matters to you..."
                    />
                  </div>
                </div>

                {/* Duration & Goals Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <i className="fas fa-target text-apple-blue"></i>
                    <h3 className="text-lg font-semibold text-text-primary">Duration & Goals</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">Duration Goal</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editHabitForm.durationValue}
                          onChange={(e) => setEditHabitForm({...editHabitForm, durationValue: parseInt(e.target.value)})}
                          className="flex-1 glass-input rounded-lg p-3 h-12 text-sm focus:ring-2 focus:ring-apple-blue transition-all"
                          min="1"
                          placeholder="30"
                          required
                        />
                        <select
                          value={editHabitForm.durationType}
                          onChange={(e) => setEditHabitForm({...editHabitForm, durationType: e.target.value})}
                          className="glass-input rounded-lg p-3 h-12 text-sm focus:ring-2 focus:ring-apple-blue transition-all w-24"
                        >
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">Daily Target</label>
                      <input
                        type="number"
                        value={editHabitForm.targetCount}
                        onChange={(e) => setEditHabitForm({...editHabitForm, targetCount: parseInt(e.target.value)})}
                        className="w-full glass-input rounded-lg p-3 h-12 text-sm focus:ring-2 focus:ring-apple-blue transition-all"
                        min="1"
                        placeholder="1"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-apple-blue hover:bg-apple-blue/90 text-white h-12 font-medium transition-all"
                    disabled={updateHabitMutation.isPending}
                  >
                    {updateHabitMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <i className="fas fa-spinner fa-spin"></i>
                        Updating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <i className="fas fa-save"></i>
                        Update Habit
                      </div>
                    )}
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    variant="ghost"
                    className="flex-1 sm:flex-none sm:w-auto text-text-secondary hover:text-text-primary hover:bg-white/5 h-12 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <i className="fas fa-times"></i>
                      Cancel
                    </div>
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Habit Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-button rounded-lg p-4">
                    <div className="text-sm text-text-secondary">Frequency</div>
                    <div className="font-medium capitalize">{habitToView?.frequency}</div>
                  </div>
                  <div className="glass-button rounded-lg p-4">
                    <div className="text-sm text-text-secondary">Target Count</div>
                    <div className="font-medium">{habitToView?.targetCount}</div>
                  </div>
                  <div className="glass-button rounded-lg p-4">
                    <div className="text-sm text-text-secondary">Duration</div>
                    <div className="font-medium">{habitToView?.durationValue} {habitToView?.durationType}</div>
                  </div>
                  <div className="glass-button rounded-lg p-4">
                    <div className="text-sm text-text-secondary">Current Streak</div>
                    <div className="font-medium">{habitToView?.currentStreak} days</div>
                  </div>
                </div>

                {/* Goal Meaning & Feeling */}
                {(habitToView?.goalMeaning || habitToView?.goalFeeling) && (
                  <div className="space-y-3">
                    {habitToView?.goalMeaning && (
                      <div className="glass-button rounded-lg p-4">
                        <div className="text-sm text-text-secondary mb-2">Why this matters to you</div>
                        <div className="text-sm">{habitToView.goalMeaning}</div>
                      </div>
                    )}
                    {habitToView?.goalFeeling && (
                      <div className="glass-button rounded-lg p-4">
                        <div className="text-sm text-text-secondary mb-2">How you'll feel when accomplished</div>
                        <div className="text-sm">{habitToView.goalFeeling}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Struggle History */}
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <i className="fas fa-history mr-2 text-orange-400"></i>
                    Struggle History
                  </h3>
                  {habitToView && (
                    <StruggleHistory habitId={habitToView.id} />
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
