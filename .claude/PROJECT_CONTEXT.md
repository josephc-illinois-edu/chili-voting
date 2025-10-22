# Project Context: Chili Cook-Off Voting System

## Overview
Anonymous voting web app for chili cook-off events with real-time results and QR code generation.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + Real-time subscriptions)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Testing**: Playwright

## Project Structure
```
app/
  ├── page.tsx           # Home/Main voting interface
  ├── vote/page.tsx      # Voting form for specific chili
  ├── results/page.tsx   # Live leaderboard
  ├── admin/page.tsx     # Admin panel (QR codes, entry management)
  └── layout.tsx         # Root layout

lib/
  ├── supabase.ts        # Supabase client initialization
  ├── session.ts         # Session-based vote tracking
  ├── qr-generator.ts    # QR code generation
  └── admin-auth.ts      # Simple admin authentication

types/
  └── database.ts        # TypeScript interfaces for DB schema

database/
  └── *.sql              # Database policies and fixes
```

## Core Features
1. **Anonymous Voting**: Session-based (no login), one vote per chili per session
2. **Multi-Category Ratings**: Taste, presentation, creativity, spice balance (1-5 stars)
3. **Real-time Results**: Live leaderboard updates via Supabase subscriptions
4. **QR Code System**: Generate printable QR codes for each chili entry
5. **Mobile-First**: Responsive design optimized for phones

## Database Schema

### Tables
- **chili_entries**: Chili details (name, contestant, recipe, ingredients, allergens, spice_level)
- **votes**: Individual votes with category ratings and comments
- **voter_sessions**: Tracks which chilis each session has voted for

### Key Fields
- ChiliEntry: id, name, contestant_name, vote_count, total_score, average_rating
- Vote: chili_id, session_id, overall_rating, category ratings (taste/presentation/creativity/spice_balance)
- VoterSession: session_id, voted_chilis[] array

## User Flows
1. **Voter**: Visit home → Select chili (QR/browse) → Rate categories → Submit → View results
2. **Admin**: Access /admin → Add entries → Generate QR codes → Print for event

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## NPM Scripts
- `npm run dev` - Development server (port 3000)
- `npm run build` - Production build
- `npm test` - Run Playwright tests
- `npm run lint` - ESLint check

## Current Branch
- **main**: Production-ready code
- **mobile-fix**: Current working branch for mobile optimizations

## Key Implementation Details
- Session IDs stored in localStorage to prevent duplicate votes
- Real-time updates using Supabase subscriptions
- Row-Level Security (RLS) policies on database
- Simple password-based admin auth (no complex user system)
- Star rating system (1-5) for all categories

## Known Focus Areas
- Mobile responsiveness and UX optimization
- Real-time leaderboard updates
- QR code generation and printing
- Anonymous session management
