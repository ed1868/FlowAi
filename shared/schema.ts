import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // 'user' or 'admin'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Focus sessions table
export const focusSessions = pgTable("focus_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  plannedDuration: integer("planned_duration"), // in minutes
  actualDuration: integer("actual_duration"), // in minutes (when completed)
  type: varchar("type").default("deep_work"), // 'deep_work', 'study', 'reading', 'writing', 'creative'
  workflow: varchar("workflow").default("standard"), // 'standard', 'pomodoro', 'ultradian', 'flowtime'
  completed: boolean("completed").default(false),
  mood: varchar("mood"), // 'energized', 'focused', 'tired', 'distracted', 'stressed', 'calm'
  setbacks: text("setbacks"), // description of interruptions or challenges
  notes: text("notes"), // general session notes
  productivity: integer("productivity"), // 1-10 scale
  createdAt: timestamp("created_at").defaultNow(),
});

// Journal entries table
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title"),
  content: text("content").notNull(),
  mood: varchar("mood"), // 'great', 'good', 'neutral', 'bad', 'terrible'
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice notes table
export const voiceNotes = pgTable("voice_notes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title"),
  fileName: varchar("file_name").notNull(),
  duration: integer("duration"), // in seconds
  transcription: text("transcription"),
  noteType: varchar("note_type").default("memo"), // 'memo', 'journal_draft', 'thought', 'future_advice'
  mood: varchar("mood"),
  tags: jsonb("tags").$type<string[]>().default([]),
  isConverted: boolean("is_converted").default(false), // if converted to journal entry
  journalEntryId: integer("journal_entry_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice clone management table
export const userVoiceClones = pgTable("user_voice_clones", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  voiceId: varchar("voice_id").notNull(), // ElevenLabs voice ID
  voiceName: varchar("voice_name").notNull(),
  isActive: boolean("is_active").default(false),
  sampleCount: integer("sample_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Habits table
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").default("fas fa-check"),
  color: varchar("color").default("#007AFF"),
  frequency: varchar("frequency").default("daily"), // 'daily', 'weekly'
  targetCount: integer("target_count").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Habit entries table (daily check-ins)
export const habitEntries = pgTable("habit_entries", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  completed: boolean("completed").default(false),
  count: integer("count").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Habit struggles table (hard moments/craving logs)
export const habitStruggles = pgTable("habit_struggles", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  note: text("note").notNull(),
  intensity: integer("intensity").default(5), // 1-10 scale
  triggers: text("triggers"), // comma-separated triggers
  location: varchar("location"),
  mood: varchar("mood"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reset kit rituals table
export const resetRituals = pgTable("reset_rituals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").default("fas fa-spa"),
  duration: integer("duration"), // in minutes
  category: varchar("category").default("wellness"), // 'movement', 'breathing', 'wellness'
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reset ritual completions table
export const resetCompletions = pgTable("reset_completions", {
  id: serial("id").primaryKey(),
  ritualId: integer("ritual_id").notNull().references(() => resetRituals.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  completedAt: timestamp("completed_at").defaultNow(),
});

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionDuration: integer("session_duration").default(90), // in minutes
  breakDuration: integer("break_duration").default(15), // in minutes
  notificationsEnabled: boolean("notifications_enabled").default(true),
  emailNotifications: boolean("email_notifications").default(true),
  theme: varchar("theme").default("dark"),
  timezone: varchar("timezone").default("UTC"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertFocusSessionSchema = createInsertSchema(focusSessions).omit({
  id: true,
  createdAt: true,
}).extend({
  startTime: z.string().transform((str) => new Date(str)),
  endTime: z.string().transform((str) => new Date(str)).optional(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoiceNoteSchema = createInsertSchema(voiceNotes).omit({
  id: true,
  createdAt: true,
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  createdAt: true,
});

export const insertHabitEntrySchema = createInsertSchema(habitEntries).omit({
  id: true,
  createdAt: true,
});

export const insertResetRitualSchema = createInsertSchema(resetRituals).omit({
  id: true,
  createdAt: true,
});

export const insertResetCompletionSchema = createInsertSchema(resetCompletions).omit({
  id: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserVoiceCloneSchema = createInsertSchema(userVoiceClones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHabitStruggleSchema = createInsertSchema(habitStruggles).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type VoiceNote = typeof voiceNotes.$inferSelect;
export type InsertVoiceNote = z.infer<typeof insertVoiceNoteSchema>;
export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type HabitEntry = typeof habitEntries.$inferSelect;
export type InsertHabitEntry = z.infer<typeof insertHabitEntrySchema>;
export type ResetRitual = typeof resetRituals.$inferSelect;
export type InsertResetRitual = z.infer<typeof insertResetRitualSchema>;
export type ResetCompletion = typeof resetCompletions.$inferSelect;
export type InsertResetCompletion = z.infer<typeof insertResetCompletionSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserVoiceClone = typeof userVoiceClones.$inferSelect;
export type InsertUserVoiceClone = z.infer<typeof insertUserVoiceCloneSchema>;
export type HabitStruggle = typeof habitStruggles.$inferSelect;
export type InsertHabitStruggle = z.infer<typeof insertHabitStruggleSchema>;
