# Chili Cook-Off Voting System

A TypeScript-based Single Page Application with anonymous voting, QR code integration, and real-time results using Supabase and Next.js.

## Quick Start

### 1. Configure Environment Variables

Edit `.env.local` and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Get these from your Supabase project Settings → API.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Features

- **Anonymous Voting**: No login required, session-based tracking
- **Real-time Results**: Live leaderboard with auto-refresh
- **QR Code Generation**: Printable QR codes for each chili entry
- **Mobile-Friendly**: Responsive design optimized for phones
- **Category Ratings**: Vote on taste, presentation, creativity, and spice balance

## Pages

- `/` - Main voting interface
- `/results` - Live leaderboard
- `/admin` - Admin panel for managing entries and generating QR codes

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Real-time)
- Lucide React Icons
- QRCode.js

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import repository to Vercel
3. Add environment variables
4. Deploy

## Database Schema

See the documentation for the complete database setup script.

## Event Day Checklist

- [ ] Test voting flow
- [ ] Generate and print QR codes
- [ ] Set up results display
- [ ] Brief volunteers

## License

MIT License - Use freely for your events!
