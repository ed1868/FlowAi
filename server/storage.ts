import {
  users,
  focusSessions,
  journalEntries,
  voiceNotes,
  habits,
  habitEntries,
  resetRituals,
  resetCompletions,
  userPreferences,
  userVoiceClones,
  type User,
  type UpsertUser,
  type FocusSession,
  type InsertFocusSession,
  type JournalEntry,
  type InsertJournalEntry,
  type VoiceNote,
  type InsertVoiceNote,
  type UserVoiceClone,
  type InsertUserVoiceClone,
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
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Focus session operations
  async createFocusSession(session: InsertFocusSession): Promise<FocusSession> {
    const [newSession] = await db
      .insert(focusSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateFocusSession(sessionId: number, userId: string, updateData: Partial<InsertFocusSession>): Promise<FocusSession | undefined> {
    const [updatedSession] = await db
      .update(focusSessions)
      .set(updateData)
      .where(and(eq(focusSessions.id, sessionId), eq(focusSessions.userId, userId)))
      .returning();
    return updatedSession;
  }

  async getUserSessions(userId: string): Promise<FocusSession[]> {
    return await db
      .select()
      .from(focusSessions)
      .where(eq(focusSessions.userId, userId))
      .orderBy(desc(focusSessions.createdAt));
  }

  // Journal operations
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const insertData = {
      userId: entry.userId,
      content: entry.content,
      title: entry.title || null,
      mood: entry.mood || null,
      tags: entry.tags || null,
    };
    
    const [newEntry] = await db
      .insert(journalEntries)
      .values(insertData)
      .returning();
    return newEntry;
  }

  async updateJournalEntry(entryId: number, userId: string, updateData: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const setData: any = { updatedAt: new Date() };
    
    if (updateData.content !== undefined) setData.content = updateData.content;
    if (updateData.title !== undefined) setData.title = updateData.title;
    if (updateData.mood !== undefined) setData.mood = updateData.mood;
    if (updateData.tags !== undefined) setData.tags = updateData.tags;
    
    const [updatedEntry] = await db
      .update(journalEntries)
      .set(setData)
      .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
      .returning();
    return updatedEntry;
  }

  async deleteJournalEntry(entryId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(journalEntries)
      .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
  }

  // Voice note operations
  async createVoiceNote(voiceNote: InsertVoiceNote): Promise<VoiceNote> {
    const [newVoiceNote] = await db
      .insert(voiceNotes)
      .values(voiceNote)
      .returning();
    return newVoiceNote;
  }

  async getVoiceNote(noteId: number, userId: string): Promise<VoiceNote | undefined> {
    const [voiceNote] = await db
      .select()
      .from(voiceNotes)
      .where(and(eq(voiceNotes.id, noteId), eq(voiceNotes.userId, userId)));
    return voiceNote;
  }

  async deleteVoiceNote(noteId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(voiceNotes)
      .where(and(eq(voiceNotes.id, noteId), eq(voiceNotes.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getUserVoiceNotes(userId: string): Promise<VoiceNote[]> {
    return await db
      .select()
      .from(voiceNotes)
      .where(eq(voiceNotes.userId, userId))
      .orderBy(desc(voiceNotes.createdAt));
  }

  // Habit operations
  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db
      .insert(habits)
      .values(habit)
      .returning();
    return newHabit;
  }

  async updateHabit(habitId: number, userId: string, updateData: Partial<InsertHabit>): Promise<Habit | undefined> {
    const [updatedHabit] = await db
      .update(habits)
      .set(updateData)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .returning();
    return updatedHabit;
  }

  async deleteHabit(habitId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getUserHabits(userId: string): Promise<Habit[]> {
    return await db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, userId), eq(habits.isActive, true)))
      .orderBy(desc(habits.createdAt));
  }

  // Habit entry operations
  async createHabitEntry(entry: InsertHabitEntry): Promise<HabitEntry> {
    const [newEntry] = await db
      .insert(habitEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async getHabitEntries(habitId: number, userId: string): Promise<HabitEntry[]> {
    return await db
      .select()
      .from(habitEntries)
      .where(and(eq(habitEntries.habitId, habitId), eq(habitEntries.userId, userId)))
      .orderBy(desc(habitEntries.date));
  }

  async getTodayHabitEntries(userId: string): Promise<HabitEntry[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select()
      .from(habitEntries)
      .where(
        and(
          eq(habitEntries.userId, userId),
          gte(habitEntries.date, today),
          lte(habitEntries.date, tomorrow)
        )
      );
  }

  // Reset ritual operations
  async createResetRitual(ritual: InsertResetRitual): Promise<ResetRitual> {
    const [newRitual] = await db
      .insert(resetRituals)
      .values(ritual)
      .returning();
    return newRitual;
  }

  async getUserResetRituals(userId: string): Promise<ResetRitual[]> {
    return await db
      .select()
      .from(resetRituals)
      .where(eq(resetRituals.userId, userId))
      .orderBy(desc(resetRituals.createdAt));
  }

  async completeResetRitual(ritualId: number, userId: string): Promise<ResetCompletion> {
    const [completion] = await db
      .insert(resetCompletions)
      .values({
        ritualId,
        userId,
        completedAt: new Date(),
      })
      .returning();
    return completion;
  }

  // User preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    
    if (!preferences) {
      // Create default preferences
      const [newPreferences] = await db
        .insert(userPreferences)
        .values({ userId })
        .returning();
      return newPreferences;
    }
    
    return preferences;
  }

  async updateUserPreferences(userId: string, updateData: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const [updatedPreferences] = await db
      .update(userPreferences)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return updatedPreferences;
  }

  // Analytics operations
  async getDashboardAnalytics(userId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's stats
    const [todaySessionsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, userId),
          gte(focusSessions.startTime, today),
          lte(focusSessions.startTime, tomorrow)
        )
      );

    const [todayFocusTimeResult] = await db
      .select({ totalMinutes: sql<number>`COALESCE(SUM(duration), 0)` })
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, userId),
          eq(focusSessions.completed, true),
          gte(focusSessions.startTime, today),
          lte(focusSessions.startTime, tomorrow)
        )
      );

    const [todayJournalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          gte(journalEntries.createdAt, today),
          lte(journalEntries.createdAt, tomorrow)
        )
      );

    const [todayHabitsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(habitEntries)
      .where(
        and(
          eq(habitEntries.userId, userId),
          eq(habitEntries.completed, true),
          gte(habitEntries.date, today),
          lte(habitEntries.date, tomorrow)
        )
      );

    // Get recent journal entries
    const recentJournalEntries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(3);

    // Calculate streak (simplified - consecutive days with at least one completed session)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const completedSessionsByDay = await db
      .select({
        date: sql<string>`DATE(start_time)`,
        count: sql<number>`count(*)`
      })
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, userId),
          eq(focusSessions.completed, true),
          gte(focusSessions.startTime, weekAgo)
        )
      )
      .groupBy(sql`DATE(start_time)`)
      .orderBy(sql`DATE(start_time) DESC`);

    let streak = 0;
    const todayDateString = today.toISOString().split('T')[0];
    const yesterdayDateString = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Check if there's activity today or yesterday to start the streak
    const hasActivityToday = completedSessionsByDay.some(day => day.date === todayDateString);
    const hasActivityYesterday = completedSessionsByDay.some(day => day.date === yesterdayDateString);

    if (hasActivityToday || hasActivityYesterday) {
      for (let i = 0; i < completedSessionsByDay.length; i++) {
        const expectedDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (completedSessionsByDay[i]?.date === expectedDate) {
          streak++;
        } else {
          break;
        }
      }
    }

    const totalMinutes = todayFocusTimeResult.totalMinutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const focusTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return {
      todayStats: {
        sessionsToday: todaySessionsResult.count || 0,
        focusTime,
        journalEntries: todayJournalResult.count || 0,
        habitsCompleted: todayHabitsResult.count || 0,
      },
      streak,
      goalsCompleted: Math.min(todayHabitsResult.count || 0, 5),
      totalGoals: 5,
      recentJournalEntries: recentJournalEntries.map(entry => ({
        id: entry.id,
        content: entry.content.substring(0, 150) + (entry.content.length > 150 ? '...' : ''),
        createdAt: entry.createdAt.toISOString(),
      })),
      weeklyProgress: [], // Simplified for now
    };
  }

  async getHabitAnalytics(userId: string): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userHabitsData = await db
      .select()
      .from(habits)
      .where(eq(habits.userId, userId));

    const habitAnalytics = await Promise.all(
      userHabitsData.map(async (habit) => {
        const entries = await db
          .select()
          .from(habitEntries)
          .where(
            and(
              eq(habitEntries.habitId, habit.id),
              eq(habitEntries.userId, userId),
              gte(habitEntries.date, thirtyDaysAgo)
            )
          );

        const completedEntries = entries.filter(entry => entry.completed);
        const successRate = entries.length > 0 ? Math.round((completedEntries.length / entries.length) * 100) : 0;

        return {
          id: habit.id,
          name: habit.name,
          successRate,
          totalEntries: entries.length,
          completedEntries: completedEntries.length,
          color: habit.color,
        };
      })
    );

    return {
      habits: habitAnalytics,
      period: '30 days',
    };
  }
}

export const storage = new DatabaseStorage();
