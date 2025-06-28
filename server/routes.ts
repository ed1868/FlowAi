import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./memStorage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
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
  await setupAuth(app);

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

  const httpServer = createServer(app);
  return httpServer;
}
