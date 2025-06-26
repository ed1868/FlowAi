# Flow - Productivity App

## Overview

Flow is a comprehensive productivity application built with React and Express.js, designed to help users maintain focus through deep work sessions, journaling, voice notes, and habit tracking. The application features a modern glass-morphism UI with Apple-inspired design elements and integrates seamlessly with Replit's authentication system.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Radix UI components with shadcn/ui
- **Styling**: Tailwind CSS with custom Apple-inspired design system
- **Build Tool**: Vite with custom configuration for full-stack development

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **File Uploads**: Multer for voice note audio files

### Key Design Decisions
1. **Monorepo Structure**: Single repository with `client/`, `server/`, and `shared/` directories for code organization
2. **Type Safety**: Shared TypeScript types between frontend and backend via `shared/schema.ts`
3. **Modern UI**: Glass-morphism design with dark theme and Apple-inspired color palette
4. **Real-time Features**: Timer notifications and session tracking

## Key Components

### Authentication System
- **Replit Auth Integration**: Mandatory user authentication using OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **User Management**: Automatic user creation and profile management

### Core Features
1. **Focus Timer**: Customizable deep work sessions with notifications
2. **Journal Entries**: Rich text journaling with mood tracking and tags
3. **Voice Notes**: Audio recording with file upload and playback
4. **Habit Tracking**: Daily habit completion with analytics
5. **Analytics Dashboard**: Progress visualization and statistics

### Database Schema
- **Users**: Profile information and preferences
- **Focus Sessions**: Timer sessions with duration and completion status
- **Journal Entries**: Text content with metadata (mood, tags)
- **Voice Notes**: Audio file references with transcription support
- **Habits**: User-defined habits with tracking data
- **Reset Rituals**: Break activities and completion tracking

## Data Flow

1. **Authentication Flow**: Replit Auth → Express session → Database user lookup
2. **API Requests**: React Query → Express routes → Drizzle ORM → PostgreSQL
3. **File Uploads**: Multer middleware → Local storage → Database file references
4. **Real-time Updates**: Timer events → Browser notifications → Session updates

## External Dependencies

### Database
- **PostgreSQL**: Primary data storage via Neon Database
- **Drizzle ORM**: Type-safe database operations and migrations

### Authentication
- **Replit Auth**: OAuth provider integration
- **OpenID Connect**: Standard authentication protocol

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide Icons**: Icon library for UI elements

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development server and build tool
- **ESBuild**: Production bundling for server code

## Deployment Strategy

### Production Build
- **Client**: Vite builds React app to `dist/public`
- **Server**: ESBuild bundles Express server to `dist/index.js`
- **Static Assets**: Served from build output directory

### Environment Configuration
- **Database**: PostgreSQL connection via `DATABASE_URL`
- **Authentication**: Replit-provided OAuth configuration
- **Sessions**: Secure session secret for production

### Replit Integration
- **Auto-deployment**: Configured for Replit's autoscale deployment
- **Development**: Hot-reload with Vite dev server
- **Database**: Automatic PostgreSQL provisioning

## Changelog

```
Changelog:
- June 26, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```