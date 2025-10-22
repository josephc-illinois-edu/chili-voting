# Testing Guide - Chili Voting App

## How the App Works

### Flow Diagram
```
Admin Panel → Create Chilis → Generate QR Codes
     ↓
Voters Scan QR → Vote Page → Submit Ratings
     ↓
Results Page → Real-time Leaderboard
```

### Components

#### 1. Admin Panel (`/admin`)
- **Password**: Set in `.env.local` as `NEXT_PUBLIC_ADMIN_PASSWORD`
- **Features**:
  - Add/delete chili entries
  - Generate QR codes for each chili
  - Print tent cards with QR codes
  - View all entries

#### 2. Vote Page (`/vote?chili=<id>`)
- **Access**: Via QR code scan or direct link
- **Features**:
  - Shows chili details (name, contestant, description, spice level)
  - 5-star ratings for:
    - Overall Rating
    - Taste
    - Presentation
    - Creativity
    - Spice Balance
  - Optional comments field
  - Duplicate vote prevention (per session)

#### 3. Results Page (`/results`)
- **Features**:
  - Live leaderboard sorted by average rating
  - Medal icons for top 3
  - Real-time updates (toggle ON/OFF)
  - Statistics: total entries, total votes, avg votes/entry
  - Shows vote count for each entry

## Manual Testing Steps

### Test 1: Create Chili Entry
1. Navigate to http://localhost:3001/admin
2. Enter password (default: `chili2025!`)
3. Click "Add New Chili"
4. Fill form:
   - Chili Name: "Test Entry 1"
   - Contestant: "Test Chef"
   - Description: "A delicious test chili"
   - Spice Level: 3 (medium)
5. Click "Add Chili"
6. **Expected**: Entry appears in admin table

### Test 2: Vote for Chili
1. Navigate to http://localhost:3001/
2. Find "Test Entry 1" in list
3. Click "Vote" button
4. Fill all required ratings (1-5 stars each)
5. Add optional comment: "Great flavor!"
6. Click "Submit Vote"
7. **Expected**: Success alert, redirect to home

### Test 3: View Results
1. Navigate to http://localhost:3001/results
2. **Expected**:
   - "Test Entry 1" appears in list
   - Shows your rating (e.g., "4.5")
   - Shows "1 votes"
   - Statistics show 1 total vote

### Test 4: Duplicate Vote Prevention
1. Navigate to http://localhost:3001/
2. Click "Vote" on same chili again
3. **Expected**: "You've already voted!" message

### Test 5: QR Code Generation
1. In admin panel, click "Generate QR Codes"
2. **Expected**: Modal shows QR codes for all entries
3. Click "Print All Cards"
4. **Expected**: Opens printable page with tent cards

### Test 6: Real-time Updates
1. Open http://localhost:3001/results in Browser 1
2. Open http://localhost:3001/ in Browser 2 (incognito)
3. Vote for a chili in Browser 2
4. **Expected**: Results update automatically in Browser 1

## Verification Commands

### Check Database Contents
```bash
npx tsx scripts/check-database.ts
```

This shows:
- How many chili entries exist
- How many votes exist
- Vote breakdown per chili
- Average ratings

### Run Automated Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/01-qr-voting.spec.ts
npm test -- tests/02-admin-auth.spec.ts
```

## Common Issues & Solutions

### Issue: "No votes found" after voting
**Possible causes**:
1. RLS policy blocking insert
2. Vote submission failed silently
3. Session/localStorage issue

**Solution**:
1. Check browser console for errors
2. Verify Supabase connection in `.env.local`
3. Run: `npx tsx scripts/check-database.ts`
4. Check Supabase dashboard → Table Editor → votes table

### Issue: "You've already voted" but I haven't
**Cause**: Session data persisted in localStorage

**Solution**:
1. Open browser DevTools (F12)
2. Application → Local Storage → http://localhost:3001
3. Delete `chili_voting_session` key
4. Refresh page and try again

### Issue: Results not updating in real-time
**Possible causes**:
1. Real-time toggle is OFF
2. Supabase realtime not enabled
3. Network connection issue

**Solution**:
1. Check toggle button shows "Real-time: ON"
2. Verify Supabase project has Realtime enabled
3. Check browser console for subscription errors

### Issue: QR codes not working
**Possible causes**:
1. Wrong base URL in production
2. Chili ID doesn't exist
3. Network issue

**Solution**:
1. Verify URL format: `/vote?chili=<valid-uuid>`
2. Check chili exists in database
3. Test direct link before printing QR codes

## Production Deployment Checklist

- [ ] Set `NEXT_PUBLIC_ADMIN_PASSWORD` in Vercel environment variables
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` in Vercel
- [ ] Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- [ ] Test admin login in production
- [ ] Create test chili entry in production
- [ ] Vote for test entry in production
- [ ] Verify results appear correctly
- [ ] Test QR code generation with production URL
- [ ] Print and test physical QR codes
- [ ] Enable Supabase Realtime in production database
- [ ] Test real-time updates in production

## Database Schema

### Table: `chili_entries`
```sql
- id (uuid, primary key)
- name (text)
- contestant_name (text)
- description (text)
- spice_level (int, 1-5)
- created_at (timestamp)
```

### Table: `votes`
```sql
- id (uuid, primary key)
- chili_id (uuid, foreign key)
- session_id (text)
- overall_rating (int, 1-5)
- taste_rating (int, 1-5)
- presentation_rating (int, 1-5)
- creativity_rating (int, 1-5)
- spice_balance_rating (int, 1-5)
- comments (text, optional)
- created_at (timestamp)
```

## Troubleshooting Data

If you need to reset test data:

```sql
-- In Supabase SQL Editor

-- Delete all test votes
DELETE FROM votes WHERE chili_id IN (
  SELECT id FROM chili_entries WHERE name LIKE 'Test%'
);

-- Delete all test chilis
DELETE FROM chili_entries WHERE name LIKE 'Test%';

-- View current data
SELECT * FROM chili_entries;
SELECT * FROM votes;
```
