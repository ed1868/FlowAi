# Flow - Productivity Station

A comprehensive productivity platform that empowers personal growth through intelligent habit tracking, adaptive learning, and engaging user experiences. Flow combines advanced technologies to create a holistic personal development ecosystem with enhanced data capture and intuitive interaction design.

## ✨ Features

### 🎯 Deep Work Timer
- 90-minute focus sessions with customizable workflows
- Multiple timer modes: Standard, Pomodoro, Ultradian, and Flowtime
- Session tracking with mood and productivity insights
- Break management and interruption logging

### 📝 Smart Journaling
- Rich text journaling with mood tracking
- Tag-based organization system
- Calendar integration for entry browsing
- Reflection prompts and guided writing

### 🎤 Voice Notes with AI
- Audio recording with playback controls
- AI-powered transcription
- Voice cloning integration (ElevenLabs)
- Convert voice notes to journal entries

### 📈 Habit Tracking
- Visual progress tracking with milestone rewards
- Streak management and break logging
- Detailed struggle history and pattern recognition
- Goal setting with personal meaning and feelings

### 🧘 Reset Rituals
- Mindful break activities and wellness practices
- Customizable ritual library
- Trigger tracking and completion history
- Category-based organization (movement, breathing, wellness)

### 📊 Analytics & Insights
- Progress visualization and statistics
- Habit performance analytics
- Session productivity trends
- Personal growth tracking

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **Radix UI** with shadcn/ui components
- **Tailwind CSS** with Apple-inspired design system
- **Vite** for fast development and building

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Replit Auth** with OpenID Connect
- **Express Sessions** with PostgreSQL store
- **Multer** for file uploads

### External Services
- **OpenAI API** for AI-powered features
- **ElevenLabs API** for voice cloning
- **Stripe** for subscription management
- **Neon Database** for PostgreSQL hosting

## 🏗️ Architecture

```
Flow/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   └── pages/        # Application pages
├── server/                # Express backend
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Database operations
│   ├── db.ts            # Database connection
│   └── replitAuth.ts    # Authentication setup
├── shared/               # Shared types and schemas
│   └── schema.ts        # Database schema and types
└── uploads/             # File storage directory
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Required API keys (see Environment Variables)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd flow
npm install
```

2. **Set up environment variables:**
Create a `.env` file with the following variables:
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication (provided by Replit)
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
SESSION_SECRET=your-session-secret

# API Keys
OPENAI_API_KEY=your-openai-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Stripe (optional)
STRIPE_SECRET_KEY=your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY=your-stripe-public-key
```

3. **Initialize the database:**
```bash
npm run db:push
```

4. **Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📊 Database Schema

### Core Tables
- **users** - User profiles and authentication
- **habits** - Habit definitions and progress tracking
- **habit_entries** - Daily habit completions
- **habit_struggles** - Difficulty moments and triggers
- **focus_sessions** - Deep work timer sessions
- **journal_entries** - Written reflections and thoughts
- **voice_notes** - Audio recordings and transcriptions
- **reset_rituals** - Mindful break activities

### Key Relationships
- Users have many habits, sessions, and journal entries
- Habits track streaks, breaks, and struggle patterns
- Voice notes can be converted to journal entries
- Reset rituals help manage habit breaks and resets

## 🎨 Design System

Flow uses an Apple-inspired design language with:
- **Glass-morphism** effects with backdrop blur
- **Dark theme** with carefully selected color palette
- **Responsive design** optimized for mobile and desktop
- **Smooth animations** and micro-interactions
- **Accessibility-first** component architecture

### Color Palette
- Apple Blue: `#007AFF`
- Apple Green: `#34C759`
- Apple Orange: `#FF9500`
- Apple Pink: `#FF2D92`
- Apple Purple: `#AF52DE`

## 🔐 Authentication

Flow uses Replit's OpenID Connect authentication system:
- Automatic user provisioning
- Secure session management
- Profile data synchronization
- Multi-domain support

## 📱 Mobile Support

- **Responsive design** adapts to all screen sizes
- **Touch-optimized** interactions and gestures
- **Progressive Web App** capabilities
- **Mobile-first** navigation patterns

## 🚀 Deployment

### Replit Deployment
1. Push your code to the Replit repository
2. Configure environment variables in Replit Secrets
3. Use the "Deploy" button for automatic deployment
4. Your app will be available at `your-repl-name.replit.app`

### Manual Deployment
1. **Build the application:**
```bash
npm run build
```

2. **Deploy to your hosting platform:**
- Frontend builds to `dist/public`
- Server builds to `dist/index.js`
- Configure environment variables on your platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📋 API Documentation

### Authentication Endpoints
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Start login flow
- `GET /api/logout` - End user session

### Habit Management
- `GET /api/habits` - List user habits
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/entries` - Log habit completion

### Focus Sessions
- `GET /api/sessions` - List focus sessions
- `POST /api/sessions` - Start new session
- `PUT /api/sessions/:id` - Update session

### Journal & Voice Notes
- `GET /api/journal` - List journal entries
- `POST /api/journal` - Create journal entry
- `GET /api/voice-notes` - List voice notes
- `POST /api/voice-notes` - Upload voice note

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with love using Replit's development platform
- UI components powered by Radix UI and shadcn/ui
- Icons from Lucide React and FontAwesome
- Inspired by Apple's Human Interface Guidelines

---

**Flow** - Where productivity meets mindfulness. Start your journey today.