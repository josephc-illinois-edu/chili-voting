# Chili Cook-Off Voting System

A modern TypeScript voting application with anonymous voting, Google Sheets integration, contestant self-service, photo uploads, QR codes, and real-time results.

## ✨ Features

### Voting
- **Anonymous Voting**: Session-based tracking with device fingerprinting
- **Ballot Stuffing Prevention**: Multiple layers of duplicate vote detection
- **Category Ratings**: Vote on taste, presentation, creativity, and spice balance
- **Mobile-First Design**: Responsive interface optimized for smartphones

### Contestant Features
- **Self-Service Portal**: Contestants can manage their own entries via unique codes
- **Photo Uploads**: Upload and update chili presentation photos
- **Entry Editing**: Update descriptions, ingredients, allergens, and more
- **QR Code Access**: Scan personal QR codes to access entry management

### Admin Features
- **Google Sheets Sync**: Import entries directly from Google Forms responses
- **Entry Management**: Create, edit, and delete chili entries
- **QR Code Generation**: Generate printable QR codes for each entry
- **Results Dashboard**: Real-time voting statistics and leaderboards

### Integration
- **Google Forms Integration**: Seamlessly sync contestant submissions
- **Supabase Backend**: PostgreSQL database with real-time updates
- **Rich Text Support**: TipTap editor for recipes and descriptions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- (Optional) Google Cloud account for Forms integration

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env.local` with the following:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Admin Authentication
ADMIN_SECRET_KEY=your-secure-admin-password
NEXT_PUBLIC_ADMIN_SECRET_KEY=your-secure-admin-password

# Event Configuration
NEXT_PUBLIC_EVENT_NAME="Chili Cook-Off 2025"
NEXT_PUBLIC_EVENT_DATE="November 19, 2025"
NEXT_PUBLIC_EVENT_TIME="11:00 AM – 1:30 PM"
NEXT_PUBLIC_UPLOAD_DEADLINE="2025-11-19T11:00:00"

# Google Sheets Integration (Optional)
GOOGLE_SHEETS_ID=your-spreadsheet-id
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'
# OR
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Set Up Database

1. Create a new Supabase project
2. Run the migration SQL from `migrations/add-contestant-fields.sql`
3. Enable Storage and create a `chili-photos` bucket
4. Configure Storage policies for public read access

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📱 Application Pages

| Route | Description |
|-------|-------------|
| `/` | Main voting interface with chili entries |
| `/results` | Live leaderboard and voting statistics |
| `/vote` | Dedicated voting page |
| `/admin` | Admin panel (requires secret key) |
| `/upload` | Contestant entry code portal |
| `/upload/[code]` | Contestant self-service entry management |

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Session-based + Device Fingerprinting
- **Rich Text**: TipTap Editor
- **QR Codes**: qrcode.js
- **Icons**: Native emoji (no dependencies!)
- **Forms**: Google Forms + Google Sheets API
- **Validation**: Zod

## 📚 Documentation

### Setup Guides
- **[Google Sheets Setup](./docs/setup/GOOGLE_SHEETS_SETUP.md)** - Complete guide for Google Forms integration
- **[Deployment](./docs/setup/DEPLOYMENT.md)** - Deployment instructions for various platforms

### User Guides
- **[Contestant Guide](./docs/guides/CONTESTANT_GUIDE.md)** - Instructions for contestants using self-service

### Technical Documentation
- **[Testing Guide](./docs/technical/TESTING_GUIDE.md)** - Testing procedures and scenarios
- **[Ballot Stuffing Prevention](./docs/technical/BALLOT_STUFFING_PREVENTION.md)** - Security measures

## 🎯 Pre-Event Checklist

- [ ] Configure all environment variables
- [ ] Run database migrations
- [ ] Set up Supabase Storage bucket
- [ ] Import entries from Google Forms (if using)
- [ ] Test voting flow on multiple devices
- [ ] Generate and print QR codes for all entries
- [ ] Test contestant self-service portal
- [ ] Set up results display (projector/TV)
- [ ] Verify upload deadline is configured correctly
- [ ] Brief volunteers on entry codes

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repository to Vercel
3. Add all environment variables
4. Deploy

### Other Platforms

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🔒 Security Features

- Session-based anonymous voting
- Device fingerprinting
- Rate limiting
- Duplicate vote detection
- Admin secret key authentication
- Entry code authentication for contestants
- RLS policies on database
- XSS protection with input sanitization
- Deadline enforcement for uploads/edits

## 🤝 Contestant Workflow

1. Submit Google Form with chili details
2. Admin syncs Google Sheets to import entries
3. System generates unique 6-character entry code
4. Contestant receives QR code (printed or emailed)
5. Contestant scans QR code or enters code at `/upload`
6. Upload photo and edit entry details
7. View live voting results during event

## 🎨 Recent Updates

- Replaced icon library with native emoji (smaller bundle size!)
- Added Google Sheets integration for form imports
- Implemented contestant self-service portal
- Added photo upload capability
- Created rich text editor for recipes
- Enhanced mobile web app capabilities
- Added comprehensive contestant documentation

## 📊 Database Schema

### Tables
- `chili_entries` - Chili entries with metadata
- `votes` - Individual vote records with categories

### Key Fields
- `entry_code` - Unique 6-character code for contestant access
- `contestant_email` - For communication and notifications
- `chili_type` - Classification (traditional, vegetarian, etc.)
- `photo_url` - Link to uploaded presentation photo

## 🐛 Troubleshooting

**Build Errors**: Clear `.next` folder and rebuild
```bash
rm -rf .next && npm run build
```

**Environment Variables**: Restart dev server after changes
```bash
# Kill existing process, then
npm run dev
```

**Database Issues**: Check Supabase connection and RLS policies

**Google Sheets Sync Fails**: Verify service account permissions and credentials

## 📝 License

MIT License - Use freely for your events!

## 🙏 Credits

Built with Next.js, Supabase, and lots of chili.
