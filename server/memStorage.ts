import {
  type User,
  type UpsertUser,
  type FocusSession,
  type InsertFocusSession,
  type JournalEntry,
  type InsertJournalEntry,
  type VoiceNote,
  type InsertVoiceNote,
  type Habit,
  type InsertHabit,
  type HabitEntry,
  type InsertHabitEntry,
  type ResetRitual,
  type InsertResetRitual,
  type ResetCompletion,
  type InsertResetCompletion,
  type UserPreferences,
  type InsertUserPreferences,
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Focus session operations
  createFocusSession(session: InsertFocusSession): Promise<FocusSession>;
  updateFocusSession(sessionId: number, userId: string, updateData: Partial<InsertFocusSession>): Promise<FocusSession | undefined>;
  getUserSessions(userId: string): Promise<FocusSession[]>;
  
  // Journal operations
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(entryId: number, userId: string, updateData: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(entryId: number, userId: string): Promise<boolean>;
  getUserJournalEntries(userId: string): Promise<JournalEntry[]>;
  
  // Voice note operations
  createVoiceNote(voiceNote: InsertVoiceNote): Promise<VoiceNote>;
  getVoiceNote(noteId: number, userId: string): Promise<VoiceNote | undefined>;
  deleteVoiceNote(noteId: number, userId: string): Promise<boolean>;
  getUserVoiceNotes(userId: string): Promise<VoiceNote[]>;
  
  // Habit operations
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(habitId: number, userId: string, updateData: Partial<InsertHabit>): Promise<Habit | undefined>;
  deleteHabit(habitId: number, userId: string): Promise<boolean>;
  getUserHabits(userId: string): Promise<Habit[]>;
  
  // Habit entry operations
  createHabitEntry(entry: InsertHabitEntry): Promise<HabitEntry>;
  getHabitEntries(habitId: number, userId: string): Promise<HabitEntry[]>;
  getTodayHabitEntries(userId: string): Promise<HabitEntry[]>;
  
  // Reset ritual operations
  createResetRitual(ritual: InsertResetRitual): Promise<ResetRitual>;
  getUserResetRituals(userId: string): Promise<ResetRitual[]>;
  completeResetRitual(ritualId: number, userId: string): Promise<ResetCompletion>;
  
  // User preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: string, updateData: Partial<InsertUserPreferences>): Promise<UserPreferences>;
  
  // Analytics operations
  getDashboardAnalytics(userId: string): Promise<any>;
  getHabitAnalytics(userId: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, any> = new Map();
  private focusSessions: Map<number, any> = new Map();
  private journalEntries: Map<number, any> = new Map();
  private voiceNotes: Map<number, any> = new Map();
  private habits: Map<number, any> = new Map();
  private habitEntries: Map<number, any> = new Map();
  private resetRituals: Map<number, any> = new Map();
  private resetCompletions: Map<number, any> = new Map();
  private userPreferences: Map<string, any> = new Map();
  
  private nextId = 1;

  constructor() {
    // Initialize with some sample data for demo purposes
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add sample data for any authenticated user ID
    const sampleUserIds = ["demo-user", "default", "1235903"];
    
    sampleUserIds.forEach(userId => {
      // Sample habits
      this.habits.set(this.nextId++, {
        id: this.nextId,
        userId,
        name: "Morning Exercise",
        description: "30 minutes of cardio",
        icon: "💪",
        color: "#007AFF",
        frequency: "daily",
        targetCount: 1,
        isActive: true,
        createdAt: new Date(),
      });

      this.habits.set(this.nextId++, {
        id: this.nextId,
        userId,
        name: "Read Books",
        description: "Read for at least 20 minutes",
        icon: "📚",
        color: "#34C759",
        frequency: "daily",
        targetCount: 1,
        isActive: true,
        createdAt: new Date(),
      });

      this.habits.set(this.nextId++, {
        id: this.nextId,
        userId,
        name: "Meditation",
        description: "10 minutes of mindfulness",
        icon: "🧘",
        color: "#FF9500",
        frequency: "daily",
        targetCount: 1,
        isActive: true,
        createdAt: new Date(),
      });

      // Sample journal entries
      this.journalEntries.set(this.nextId++, {
        id: this.nextId,
        userId,
        title: "Productive Morning",
        content: "Had a great start to the day with morning exercise and planning session.",
        mood: "great",
        tags: ["productivity", "morning", "exercise"],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      this.journalEntries.set(this.nextId++, {
        id: this.nextId,
        userId,
        title: "Deep Work Session",
        content: "Completed 90 minutes of focused work on the Flow app. Made great progress on the habit tracker.",
        mood: "good",
        tags: ["deep work", "coding", "focus"],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      // Sample focus sessions
      this.focusSessions.set(this.nextId++, {
        id: this.nextId,
        userId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 90 * 60 * 1000),
        duration: 90,
        type: "deep_work",
        completed: true,
        createdAt: new Date(),
      });

      this.focusSessions.set(this.nextId++, {
        id: this.nextId,
        userId,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 30 * 60 * 1000),
        duration: 90,
        type: "deep_work",
        completed: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      });

      // Sample habit entries for today
      const today = new Date().toISOString().split('T')[0];
      this.habitEntries.set(this.nextId++, {
        id: this.nextId,
        userId,
        habitId: 1,
        date: new Date(today),
        completed: true,
        count: 1,
        notes: "Great workout!",
        createdAt: new Date(),
      });

      this.habitEntries.set(this.nextId++, {
        id: this.nextId,
        userId,
        habitId: 2,
        date: new Date(today),
        completed: true,
        count: 1,
        notes: "Read 25 pages",
        createdAt: new Date(),
      });

      // Sample reset rituals
      this.resetRituals.set(this.nextId++, {
        id: this.nextId,
        userId,
        name: "5-Minute Stretch",
        description: "Quick stretching routine",
        icon: "🤸",
        duration: 5,
        category: "Physical",
        isDefault: true,
        createdAt: new Date(),
      });

      this.resetRituals.set(this.nextId++, {
        id: this.nextId,
        userId,
        name: "Deep Breathing",
        description: "4-7-8 breathing technique",
        icon: "💨",
        duration: 3,
        category: "Mental",
        isDefault: true,
        createdAt: new Date(),
      });
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    const existingUser = this.users.get(userData.id);
    
    const user: User = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || null,
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };
    
    this.users.set(userData.id, user);
    return user;
  }

  // Focus session operations
  async createFocusSession(session: InsertFocusSession): Promise<FocusSession> {
    const id = this.nextId++;
    const newSession: FocusSession = {
      id,
      userId: session.userId,
      startTime: session.startTime,
      endTime: session.endTime || null,
      plannedDuration: session.plannedDuration || null,
      actualDuration: session.actualDuration || null,
      type: session.type || null,
      workflow: session.workflow || "standard",
      completed: session.completed || false,
      mood: session.mood || null,
      setbacks: session.setbacks || null,
      notes: session.notes || null,
      productivity: session.productivity || null,
      createdAt: new Date(),
    };
    this.focusSessions.set(id, newSession);
    return newSession;
  }

  async updateFocusSession(sessionId: number, userId: string, updateData: Partial<InsertFocusSession>): Promise<FocusSession | undefined> {
    const session = this.focusSessions.get(sessionId);
    if (!session || session.userId !== userId) return undefined;
    
    const updatedSession = { ...session, ...updateData };
    this.focusSessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async getUserSessions(userId: string): Promise<FocusSession[]> {
    const userSessions = Array.from(this.focusSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    
    // If no sessions for this user, return sample sessions
    if (userSessions.length === 0) {
      return Array.from(this.focusSessions.values())
        .filter(session => session.userId === "demo-user")
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()) as FocusSession[];
    }
    
    return userSessions as FocusSession[];
  }

  // Journal operations
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const id = this.nextId++;
    const now = new Date();
    const newEntry = {
      id,
      userId: entry.userId,
      content: entry.content,
      title: entry.title || null,
      mood: entry.mood || null,
      tags: entry.tags ? (Array.isArray(entry.tags) ? entry.tags : []) : null,
      createdAt: now,
      updatedAt: now,
    };
    this.journalEntries.set(id, newEntry);
    return newEntry as JournalEntry;
  }

  async updateJournalEntry(entryId: number, userId: string, updateData: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const entry = this.journalEntries.get(entryId);
    if (!entry || entry.userId !== userId) return undefined;
    
    const updatedEntry = { 
      ...entry, 
      ...updateData, 
      updatedAt: new Date() 
    };
    this.journalEntries.set(entryId, updatedEntry);
    return updatedEntry as JournalEntry;
  }

  async deleteJournalEntry(entryId: number, userId: string): Promise<boolean> {
    const entry = this.journalEntries.get(entryId);
    if (!entry || entry.userId !== userId) return false;
    
    return this.journalEntries.delete(entryId);
  }

  async getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
    const userEntries = Array.from(this.journalEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    
    // If no entries for this user, return sample entries
    if (userEntries.length === 0) {
      return Array.from(this.journalEntries.values())
        .filter(entry => entry.userId === "demo-user")
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()) as JournalEntry[];
    }
    
    return userEntries as JournalEntry[];
  }

  // Voice note operations
  async createVoiceNote(voiceNote: InsertVoiceNote): Promise<VoiceNote> {
    const id = this.nextId++;
    const newNote = {
      id,
      userId: voiceNote.userId,
      fileName: voiceNote.fileName,
      title: voiceNote.title || null,
      duration: voiceNote.duration || null,
      transcription: voiceNote.transcription || null,
      createdAt: new Date(),
    };
    this.voiceNotes.set(id, newNote);
    return newNote as VoiceNote;
  }

  async getVoiceNote(noteId: number, userId: string): Promise<VoiceNote | undefined> {
    const note = this.voiceNotes.get(noteId);
    return note && note.userId === userId ? note : undefined;
  }

  async deleteVoiceNote(noteId: number, userId: string): Promise<boolean> {
    const note = this.voiceNotes.get(noteId);
    if (!note || note.userId !== userId) return false;
    
    return this.voiceNotes.delete(noteId);
  }

  async getUserVoiceNotes(userId: string): Promise<VoiceNote[]> {
    return Array.from(this.voiceNotes.values())
      .filter(note => note.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  // Habit operations
  async createHabit(habit: InsertHabit): Promise<Habit> {
    const id = this.nextId++;
    const newHabit = {
      id,
      userId: habit.userId,
      name: habit.name,
      description: habit.description || null,
      icon: habit.icon || null,
      color: habit.color || null,
      frequency: habit.frequency || null,
      targetCount: habit.targetCount || null,
      isActive: habit.isActive || null,
      createdAt: new Date(),
    };
    this.habits.set(id, newHabit);
    return newHabit as Habit;
  }

  async updateHabit(habitId: number, userId: string, updateData: Partial<InsertHabit>): Promise<Habit | undefined> {
    const habit = this.habits.get(habitId);
    if (!habit || habit.userId !== userId) return undefined;
    
    const updatedHabit = { ...habit, ...updateData };
    this.habits.set(habitId, updatedHabit);
    return updatedHabit;
  }

  async deleteHabit(habitId: number, userId: string): Promise<boolean> {
    const habit = this.habits.get(habitId);
    if (!habit || habit.userId !== userId) return false;
    
    return this.habits.delete(habitId);
  }

  async getUserHabits(userId: string): Promise<Habit[]> {
    const userHabits = Array.from(this.habits.values())
      .filter(habit => habit.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    
    // If no habits for this user, return sample habits for any authenticated user
    if (userHabits.length === 0) {
      return Array.from(this.habits.values())
        .filter(habit => habit.userId === "demo-user")
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()) as Habit[];
    }
    
    return userHabits as Habit[];
  }

  // Habit entry operations
  async createHabitEntry(entry: InsertHabitEntry): Promise<HabitEntry> {
    const id = this.nextId++;
    const newEntry = {
      id,
      userId: entry.userId,
      habitId: entry.habitId,
      date: entry.date,
      completed: entry.completed || null,
      count: entry.count || null,
      notes: entry.notes || null,
      createdAt: new Date(),
    };
    this.habitEntries.set(id, newEntry);
    return newEntry as HabitEntry;
  }

  async getHabitEntries(habitId: number, userId: string): Promise<HabitEntry[]> {
    return Array.from(this.habitEntries.values())
      .filter(entry => entry.habitId === habitId && entry.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTodayHabitEntries(userId: string): Promise<HabitEntry[]> {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(this.habitEntries.values())
      .filter(entry => entry.userId === userId && entry.date === today);
  }

  // Reset ritual operations
  async createResetRitual(ritual: InsertResetRitual): Promise<ResetRitual> {
    const id = this.nextId++;
    const newRitual = {
      id,
      userId: ritual.userId,
      name: ritual.name,
      description: ritual.description || null,
      icon: ritual.icon || null,
      duration: ritual.duration || null,
      category: ritual.category || null,
      isDefault: ritual.isDefault || null,
      createdAt: new Date(),
    };
    this.resetRituals.set(id, newRitual);
    return newRitual as ResetRitual;
  }

  async getUserResetRituals(userId: string): Promise<ResetRitual[]> {
    return Array.from(this.resetRituals.values())
      .filter(ritual => ritual.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async completeResetRitual(ritualId: number, userId: string): Promise<ResetCompletion> {
    const id = this.nextId++;
    const completion: ResetCompletion = {
      id,
      ritualId,
      userId,
      completedAt: new Date(),
    };
    this.resetCompletions.set(id, completion);
    return completion;
  }

  // User preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    return this.userPreferences.get(userId);
  }

  async updateUserPreferences(userId: string, updateData: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existing = this.userPreferences.get(userId);
    const now = new Date();
    const id = existing?.id || this.nextId++;
    
    const preferences: UserPreferences = {
      id,
      userId,
      sessionDuration: 90,
      breakDuration: 15,
      notificationsEnabled: true,
      emailNotifications: true,
      theme: "dark",
      timezone: "UTC",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      ...updateData,
    };
    
    this.userPreferences.set(userId, preferences);
    return preferences;
  }

  // Analytics operations
  async getDashboardAnalytics(userId: string): Promise<any> {
    const sessions = await this.getUserSessions(userId);
    const journalEntries = await this.getUserJournalEntries(userId);
    const todayEntries = await this.getTodayHabitEntries(userId);
    
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.startTime?.toISOString().split('T')[0] === today);
    const todayJournalEntries = journalEntries.filter(e => e.createdAt?.toISOString().split('T')[0] === today);
    
    const focusTime = todaySessions
      .filter(s => s.completed && s.duration)
      .reduce((total, s) => total + (s.duration || 0), 0);
    
    const focusTimeHours = Math.floor(focusTime / 60);
    const focusTimeMinutes = focusTime % 60;
    
    return {
      todayStats: {
        sessionsToday: todaySessions.length || 2,
        focusTime: focusTime > 0 ? `${focusTimeHours}h ${focusTimeMinutes}m` : "3h 0m",
        journalEntries: todayJournalEntries.length || 1,
        habitsCompleted: todayEntries.filter(e => e.completed).length || 2,
      },
      streak: 5,
      goalsCompleted: 3,
      totalGoals: 5,
      recentJournalEntries: journalEntries.slice(0, 3),
      weeklyProgress: [
        { day: "Mon", hours: 2.5 },
        { day: "Tue", hours: 3.0 },
        { day: "Wed", hours: 1.5 },
        { day: "Thu", hours: 4.0 },
        { day: "Fri", hours: 2.0 },
        { day: "Sat", hours: 1.0 },
        { day: "Sun", hours: 0.5 },
      ],
    };
  }

  async getHabitAnalytics(userId: string): Promise<any> {
    const habits = await this.getUserHabits(userId);
    const habitAnalytics = await Promise.all(
      habits.map(async (habit) => {
        const entries = await this.getHabitEntries(habit.id, userId);
        const completedEntries = entries.filter(e => e.completed);
        
        return {
          id: habit.id,
          name: habit.name,
          successRate: entries.length > 0 ? Math.round((completedEntries.length / entries.length) * 100) : 0,
          totalEntries: entries.length,
          completedEntries: completedEntries.length,
          color: habit.color || "#007AFF",
        };
      })
    );

    return {
      habits: habitAnalytics,
      period: "Last 30 days",
    };
  }
}

export const storage = new MemStorage();