import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Test user credentials
const TEST_USER = {
  username: "test",
  password: "testing",
  user: {
    id: "test-user-123",
    email: "test@flow.app",
    firstName: "Test",
    lastName: "User",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=test"
  }
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "flow-app-development-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function setupBasicAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;

    if (username === TEST_USER.username && password === TEST_USER.password) {
      // Store user in session
      (req.session as any).user = TEST_USER.user;
      res.json({ success: true, user: TEST_USER.user });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Could not log out" });
      }
      res.json({ success: true });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/user", (req, res) => {
    const user = (req.session as any)?.user;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Quick test login endpoint (for backward compatibility)
  app.get("/api/test-login", async (req, res) => {
    (req.session as any).user = TEST_USER.user;
    res.redirect("/");
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  const user = (req.session as any)?.user;
  if (user) {
    (req as any).user = { claims: { sub: user.id } };
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};