import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupBasicAuth, isAuthenticated } from "./basicAuth";
import { analyzeJournalEntries, generateDailyReflection, analyzeVoiceNotes, generateAdviceFromVoiceNotes } from "./openai";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Stripe from "stripe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import {
  insertFocusSessionSchema,
  insertJournalEntrySchema,
  insertVoiceNoteSchema,
  insertHabitSchema,
  insertHabitEntrySchema,
  insertResetRitualSchema,
  insertResetCompletionSchema,
  insertUserPreferencesSchema,
} from "@shared/schema";

// Stripe configuration
let stripe: Stripe | null = null;
try {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  
  if (stripeKey && stripeKey.startsWith('sk_')) {
    stripe = new Stripe(stripeKey);
    console.log('Stripe configured successfully');
  } else {
    console.log('Stripe not configured - payment features disabled');
  }
} catch (error) {
  console.log('Stripe initialization error:', error);
}

// Set up multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `voice-note-${timestamp}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupBasicAuth(app);

  // Test login route
  app.get('/api/test-login', async (req: any, res) => {
    try {
      // Create a mock test user session
      const testUser = {
        claims: {
          sub: "test-user-123",
          email: "test@flow.app",
          first_name: "Test",
          last_name: "User",
          profile_image_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week from now
        },
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
      };

      // Ensure test user exists in storage
      await storage.upsertUser({
        id: testUser.claims.sub,
        email: testUser.claims.email,
        firstName: testUser.claims.first_name,
        lastName: testUser.claims.last_name,
        profileImageUrl: testUser.claims.profile_image_url,
      });

      // Add sample data for test user
      try {
        // Add a sample journal entry
        await storage.createJournalEntry({
          userId: testUser.claims.sub,
          title: "Welcome to Flow!",
          content: "This is a sample journal entry to show how journaling works in Flow. You can write about your thoughts, track your mood, and use tags to organize your entries. Try creating your own entry!",
          mood: "optimistic",
          tags: ["welcome", "demo", "productivity"]
        });

        // Add a sample habit
        await storage.createHabit({
          userId: testUser.claims.sub,
          name: "Morning Meditation",
          description: "10 minutes of mindfulness to start the day",
          frequency: "daily",
          targetCount: 1
        });

        // Add sample user preferences
        await storage.updateUserPreferences(testUser.claims.sub, {
          theme: "dark",
          sessionDuration: 90,
          breakDuration: 15,
          notificationsEnabled: true
        });
      } catch (error) {
        // Don't fail the login if sample data creation fails
        console.log("Note: Sample data creation failed, but test user login continues");
      }

      // Simulate login by setting session
      req.login(testUser, (err: any) => {
        if (err) {
          console.error("Error during test login:", err);
          return res.status(500).json({ message: "Failed to create test session" });
        }
        
        // Always redirect for consistent mobile experience
        // This ensures proper session handling across all devices
        res.redirect('/');
      });
    } catch (error) {
      console.error("Error in test login:", error);
      res.status(500).json({ message: "Failed to create test user" });
    }
  });

  // Signup route for free accounts
  app.post('/api/signup', async (req, res) => {
    try {
      const { firstName, lastName, email, password, plan } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists. Please use a different email or sign in." });
      }
      
      // For demo purposes, create a test user session
      const userId = `user-${Date.now()}`;
      
      // Create user in storage
      await storage.upsertUser({
        id: userId,
        email: email,
        firstName: firstName,
        lastName: lastName,
      });

      // Create mock session for the new user
      const testUser = {
        claims: {
          sub: userId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          profile_image_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
        },
        access_token: "new-user-access-token",
        refresh_token: "new-user-refresh-token",
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
      };

      // Set up session
      (req as any).session.user = testUser;
      (req as any).session.authenticated = true;

      res.json({
        success: true,
        message: "Account created successfully",
        user: {
          id: userId,
          email: email,
          firstName: firstName,
          lastName: lastName,
        }
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      let user = await storage.getUser(userId);
      
      if (!user) {
        // User doesn't exist in storage, create from claims
        user = await storage.upsertUser({
          id: req.user.claims.sub,
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: req.user.claims.profile_image_url,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Focus Sessions API
  app.post('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionData = insertFocusSessionSchema.parse({
        ...req.body,
        userId,
      });
      const session = await storage.createFocusSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(400).json({ message: "Failed to create session" });
    }
  });

  app.patch('/api/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = parseInt(req.params.id);
      const updateData = req.body;
      
      const session = await storage.updateFocusSession(sessionId, userId, updateData);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(400).json({ message: "Failed to update session" });
    }
  });

  app.get('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Journal API
  app.post('/api/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryData = insertJournalEntrySchema.parse({
        ...req.body,
        userId,
      });
      const entry = await storage.createJournalEntry(entryData);
      res.json(entry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(400).json({ message: "Failed to create journal entry" });
    }
  });

  app.get('/api/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getUserJournalEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.patch('/api/journal/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryId = parseInt(req.params.id);
      const updateData = req.body;
      
      const entry = await storage.updateJournalEntry(entryId, userId, updateData);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      res.status(400).json({ message: "Failed to update journal entry" });
    }
  });

  app.delete('/api/journal/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryId = parseInt(req.params.id);
      
      const success = await storage.deleteJournalEntry(entryId, userId);
      if (!success) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      res.status(400).json({ message: "Failed to delete journal entry" });
    }
  });

  // AI Analysis API
  app.get('/api/ai/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getUserJournalEntries(userId);
      
      if (entries.length < 3) {
        return res.json([]);
      }

      const insights = await analyzeJournalEntries(entries);
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  app.post('/api/ai/generate-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getUserJournalEntries(userId);
      
      if (entries.length < 3) {
        return res.status(400).json({ message: "Need at least 3 journal entries for analysis" });
      }

      const insights = await analyzeJournalEntries(entries);
      res.json({ insights, generated: true });
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  app.get('/api/ai/reflection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getUserJournalEntries(userId);
      
      const reflection = await generateDailyReflection(entries);
      res.json({ reflection });
    } catch (error) {
      console.error("Error generating daily reflection:", error);
      res.status(500).json({ message: "Failed to generate daily reflection" });
    }
  });

  // Voice Notes API
  app.post('/api/voice', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const voiceNoteData = insertVoiceNoteSchema.parse({
        userId,
        title: req.body.title || `Voice Note ${new Date().toLocaleDateString()}`,
        fileName: file.filename,
        duration: parseInt(req.body.duration) || 0,
      });

      const voiceNote = await storage.createVoiceNote(voiceNoteData);
      res.json(voiceNote);
    } catch (error) {
      console.error("Error creating voice note:", error);
      res.status(400).json({ message: "Failed to create voice note" });
    }
  });

  app.get('/api/voice', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const voiceNotes = await storage.getUserVoiceNotes(userId);
      res.json(voiceNotes);
    } catch (error) {
      console.error("Error fetching voice notes:", error);
      res.status(500).json({ message: "Failed to fetch voice notes" });
    }
  });

  app.get('/api/voice/:id/audio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const voiceNoteId = parseInt(req.params.id);
      
      const voiceNote = await storage.getVoiceNote(voiceNoteId, userId);
      if (!voiceNote) {
        return res.status(404).json({ message: "Voice note not found" });
      }

      const filePath = path.join(process.cwd(), 'uploads', voiceNote.fileName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Audio file not found" });
      }

      res.sendFile(filePath);
    } catch (error) {
      console.error("Error serving audio file:", error);
      res.status(500).json({ message: "Failed to serve audio file" });
    }
  });

  app.delete('/api/voice/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const voiceNoteId = parseInt(req.params.id);
      
      const success = await storage.deleteVoiceNote(voiceNoteId, userId);
      if (!success) {
        return res.status(404).json({ message: "Voice note not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting voice note:", error);
      res.status(400).json({ message: "Failed to delete voice note" });
    }
  });

  // Habits API
  app.post('/api/habits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const habitData = insertHabitSchema.parse({
        ...req.body,
        userId,
      });
      const habit = await storage.createHabit(habitData);
      res.json(habit);
    } catch (error) {
      console.error("Error creating habit:", error);
      res.status(400).json({ message: "Failed to create habit" });
    }
  });

  app.get('/api/habits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const habits = await storage.getUserHabits(userId);
      res.json(habits);
    } catch (error) {
      console.error("Error fetching habits:", error);
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  app.patch('/api/habits/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const habitId = parseInt(req.params.id);
      const updateData = req.body;
      
      const habit = await storage.updateHabit(habitId, userId, updateData);
      if (!habit) {
        return res.status(404).json({ message: "Habit not found" });
      }
      res.json(habit);
    } catch (error) {
      console.error("Error updating habit:", error);
      res.status(400).json({ message: "Failed to update habit" });
    }
  });

  app.delete('/api/habits/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const habitId = parseInt(req.params.id);
      
      const success = await storage.deleteHabit(habitId, userId);
      if (!success) {
        return res.status(404).json({ message: "Habit not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting habit:", error);
      res.status(400).json({ message: "Failed to delete habit" });
    }
  });

  // Habit Entries API
  app.post('/api/habits/:habitId/entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const habitId = parseInt(req.params.habitId);
      const entryData = insertHabitEntrySchema.parse({
        ...req.body,
        habitId,
        userId,
      });
      const entry = await storage.createHabitEntry(entryData);
      res.json(entry);
    } catch (error) {
      console.error("Error creating habit entry:", error);
      res.status(400).json({ message: "Failed to create habit entry" });
    }
  });

  app.get('/api/habits/:habitId/entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const habitId = parseInt(req.params.habitId);
      const entries = await storage.getHabitEntries(habitId, userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching habit entries:", error);
      res.status(500).json({ message: "Failed to fetch habit entries" });
    }
  });

  // Reset Rituals API
  app.post('/api/reset-rituals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ritualData = insertResetRitualSchema.parse({
        ...req.body,
        userId,
      });
      const ritual = await storage.createResetRitual(ritualData);
      res.json(ritual);
    } catch (error) {
      console.error("Error creating reset ritual:", error);
      res.status(400).json({ message: "Failed to create reset ritual" });
    }
  });

  app.get('/api/reset-rituals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rituals = await storage.getUserResetRituals(userId);
      res.json(rituals);
    } catch (error) {
      console.error("Error fetching reset rituals:", error);
      res.status(500).json({ message: "Failed to fetch reset rituals" });
    }
  });

  app.post('/api/reset-rituals/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ritualId = parseInt(req.params.id);
      const completion = await storage.completeResetRitual(ritualId, userId);
      res.json(completion);
    } catch (error) {
      console.error("Error completing reset ritual:", error);
      res.status(400).json({ message: "Failed to complete reset ritual" });
    }
  });

  // User Preferences API
  app.get('/api/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  app.patch('/api/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;
      const preferences = await storage.updateUserPreferences(userId, updateData);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(400).json({ message: "Failed to update user preferences" });
    }
  });

  // Analytics API
  app.get('/api/analytics/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytics = await storage.getDashboardAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard analytics" });
    }
  });

  app.get('/api/analytics/habits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytics = await storage.getHabitAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching habit analytics:", error);
      res.status(500).json({ message: "Failed to fetch habit analytics" });
    }
  });

  // Voice Notes Routes
  app.get('/api/voice-notes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const voiceNotes = await storage.getUserVoiceNotes(userId);
      res.json(voiceNotes);
    } catch (error) {
      console.error("Error fetching voice notes:", error);
      res.status(500).json({ message: "Failed to fetch voice notes" });
    }
  });

  app.post('/api/voice-notes', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, transcription, noteType, mood, tags } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "Audio file is required" });
      }

      const voiceNoteData = {
        userId,
        title: title || null,
        fileName: req.file.filename,
        transcription: transcription || null,
        noteType: noteType || 'memo',
        mood: mood || null,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        duration: null, // Could be calculated from audio file
      };

      const voiceNote = await storage.createVoiceNote(voiceNoteData);
      res.json(voiceNote);
    } catch (error) {
      console.error("Error creating voice note:", error);
      res.status(400).json({ message: "Failed to create voice note" });
    }
  });

  app.get('/api/voice-notes/:id/audio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const noteId = parseInt(req.params.id);
      const voiceNote = await storage.getVoiceNote(noteId, userId);
      
      if (!voiceNote) {
        return res.status(404).json({ message: "Voice note not found" });
      }

      const filePath = path.join(__dirname, '..', 'uploads', voiceNote.fileName);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).json({ message: "Audio file not found" });
      }
    } catch (error) {
      console.error("Error serving audio:", error);
      res.status(500).json({ message: "Failed to serve audio" });
    }
  });

  app.delete('/api/voice-notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const noteId = parseInt(req.params.id);
      const success = await storage.deleteVoiceNote(noteId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Voice note not found" });
      }
      
      res.json({ message: "Voice note deleted successfully" });
    } catch (error) {
      console.error("Error deleting voice note:", error);
      res.status(500).json({ message: "Failed to delete voice note" });
    }
  });

  app.post('/api/voice-notes/:id/convert-to-journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const noteId = parseInt(req.params.id);
      const voiceNote = await storage.getVoiceNote(noteId, userId);
      
      if (!voiceNote) {
        return res.status(404).json({ message: "Voice note not found" });
      }

      if (voiceNote.noteType !== 'journal_draft') {
        return res.status(400).json({ message: "Only journal draft notes can be converted" });
      }

      // Create journal entry from voice note
      const journalEntryData = {
        userId,
        title: voiceNote.title || "Voice Note Entry",
        content: voiceNote.transcription || "Voice note content",
        mood: voiceNote.mood || null,
        tags: voiceNote.tags || [],
      };

      const journalEntry = await storage.createJournalEntry(journalEntryData);
      
      // Mark voice note as converted
      await storage.updateVoiceNote(noteId, userId, { 
        isConverted: true, 
        journalEntryId: journalEntry.id 
      });

      res.json({ 
        message: "Voice note converted to journal entry", 
        journalEntry 
      });
    } catch (error) {
      console.error("Error converting voice note:", error);
      res.status(500).json({ message: "Failed to convert voice note" });
    }
  });

  // AI Insights for Voice Notes
  app.get('/api/voice-notes/ai-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const voiceNotes = await storage.getUserVoiceNotes(userId);
      
      if (voiceNotes.length === 0) {
        return res.json([]);
      }

      // Generate AI insights using OpenAI
      const insights = await analyzeVoiceNotes(voiceNotes);
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // Voice Clone Routes
  app.get('/api/voice-clones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const voiceClones = await storage.getUserVoiceClones(userId);
      res.json(voiceClones);
    } catch (error) {
      console.error("Error fetching voice clones:", error);
      res.status(500).json({ message: "Failed to fetch voice clones" });
    }
  });

  app.post('/api/voice-clones', isAuthenticated, upload.array('samples', 10), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name } = req.body;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "Audio samples are required" });
      }

      // Create voice clone with ElevenLabs
      const { elevenLabsService } = await import('./elevenlabs');
      
      const audioFiles = req.files.map((file: any) => 
        new File([fs.readFileSync(file.path)], file.filename, { type: file.mimetype })
      );

      const cloneResult = await elevenLabsService.cloneVoice({
        name,
        files: audioFiles,
        description: `Voice clone for user ${userId}`,
      });

      // Save voice clone to database
      const voiceCloneData = {
        userId,
        voiceId: cloneResult.voice_id,
        voiceName: name,
        sampleCount: req.files.length,
        isActive: false,
      };

      const voiceClone = await storage.createUserVoiceClone(voiceCloneData);
      res.json(voiceClone);
    } catch (error) {
      console.error("Error creating voice clone:", error);
      res.status(400).json({ message: "Failed to create voice clone" });
    }
  });

  // Future Me Advice
  app.post('/api/voice-notes/future-me-advice', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const voiceNotes = await storage.getUserVoiceNotes(userId);
      const activeVoiceClone = await storage.getActiveUserVoiceClone(userId);
      
      if (voiceNotes.length === 0) {
        return res.status(400).json({ message: "No voice notes found for analysis" });
      }

      // Generate advice text using OpenAI
      const adviceText = await generateAdviceFromVoiceNotes(voiceNotes);
      
      let audioUrl = null;
      if (activeVoiceClone) {
        try {
          // Generate speech using voice clone
          const { elevenLabsService } = await import('./elevenlabs');
          const audioBuffer = await elevenLabsService.generateSpeech(
            adviceText, 
            activeVoiceClone.voiceId
          );
          
          // Save audio file and create URL
          const audioFileName = `advice-${Date.now()}.mp3`;
          const audioPath = path.join(__dirname, '..', 'uploads', audioFileName);
          fs.writeFileSync(audioPath, audioBuffer);
          audioUrl = `/api/advice-audio/${audioFileName}`;
        } catch (error) {
          console.error("Error generating voice advice:", error);
          // Continue without audio if voice generation fails
        }
      }

      res.json({
        text: adviceText,
        audioUrl,
      });
    } catch (error) {
      console.error("Error generating future me advice:", error);
      res.status(500).json({ message: "Failed to generate advice" });
    }
  });

  // Serve advice audio files
  app.get('/api/advice-audio/:filename', isAuthenticated, async (req: any, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, '..', 'uploads', filename);
      
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).json({ message: "Audio file not found" });
      }
    } catch (error) {
      console.error("Error serving advice audio:", error);
      res.status(500).json({ message: "Failed to serve audio" });
    }
  });

  // Payment Methods API
  app.get('/api/payment-methods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // For demo purposes, return mock payment methods with test card
      const mockPaymentMethods = [
        {
          id: 'pm_test_card',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2030,
          },
          isDefault: true,
        }
      ];

      res.json(mockPaymentMethods);
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  app.post('/api/payment-methods', isAuthenticated, async (req: any, res) => {
    try {
      const { paymentMethodId } = req.body;
      const userId = req.user.claims.sub;

      // For demo purposes, simulate adding a payment method
      const newPaymentMethod = {
        id: paymentMethodId || `pm_${Date.now()}`,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2030,
        },
        isDefault: false,
      };

      res.json(newPaymentMethod);
    } catch (error: any) {
      console.error("Error adding payment method:", error);
      res.status(500).json({ message: "Failed to add payment method" });
    }
  });

  app.delete('/api/payment-methods/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      // For demo purposes, simulate deletion
      res.json({ success: true, message: "Payment method removed" });
    } catch (error: any) {
      console.error("Error removing payment method:", error);
      res.status(500).json({ message: "Failed to remove payment method" });
    }
  });

  app.patch('/api/payment-methods/:id/default', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      // For demo purposes, simulate setting default
      res.json({ success: true, message: "Default payment method updated" });
    } catch (error: any) {
      console.error("Error updating default payment method:", error);
      res.status(500).json({ message: "Failed to update default payment method" });
    }
  });

  // Stripe Payment Routes
  
  // Create subscription with payment intent
  app.post('/api/create-subscription', async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ 
        message: "Payment processing is not configured. Please contact support." 
      });
    }

    try {
      const { planId, userInfo } = req.body;
      
      // Validate userInfo is provided
      if (!userInfo || !userInfo.email) {
        return res.status(400).json({ message: "User information is required" });
      }
      
      // Define subscription plans
      const plans = {
        free: { price: 0, name: "Free Plan" },
        pro: { price: 1200, name: "Flow Pro" }, // $12.00 in cents
        team: { price: 2500, name: "Flow Team" } // $25.00 in cents
      };

      const selectedPlan = plans[planId as keyof typeof plans];
      if (!selectedPlan) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      if (selectedPlan.price === 0) {
        // Free plan - no payment required
        return res.json({ success: true, planId: "free" });
      }

      // Create customer
      const customer = await stripe.customers.create({
        email: userInfo.email,
        name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim(),
        metadata: {
          planId: planId,
        },
      });

      // Create payment intent for subscription
      const paymentIntent = await stripe.paymentIntents.create({
        amount: selectedPlan.price,
        currency: 'usd',
        customer: customer.id,
        metadata: {
          planId: planId,
          customerEmail: userInfo.email,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        customerId: customer.id,
      });

    } catch (error: any) {
      console.error('Stripe subscription error:', error);
      res.status(500).json({ 
        message: "Failed to create subscription", 
        error: error.message 
      });
    }
  });

  // Handle successful payments webhook
  app.post('/api/stripe-webhook', async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe not configured" });
    }

    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      if (endpointSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } else {
        event = req.body;
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log('Payment succeeded:', paymentIntent.id);
          
          // Here you would typically:
          // 1. Create user account in your database
          // 2. Activate their subscription
          // 3. Send welcome email
          
          break;
        case 'customer.subscription.deleted':
          // Handle subscription cancellation
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Create payment intent for one-time payments
  app.post('/api/create-payment-intent', async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ 
        message: "Payment processing is not configured" 
      });
    }

    try {
      const { amount, currency = 'usd' } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error('Payment intent error:', error);
      res.status(500).json({ 
        message: "Failed to create payment intent", 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
