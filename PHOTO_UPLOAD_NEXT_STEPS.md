# 📸 Photo Upload Feature - Next Steps

## ⚡ Immediate Actions (Required)

### 1️⃣ Database Migration (5 minutes)

Open Supabase SQL Editor and run:

```sql
-- Add new fields
ALTER TABLE chili_entries
ADD COLUMN IF NOT EXISTS entry_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMPTZ;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_chili_entries_entry_code ON chili_entries(entry_code);
```

**Verify:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'chili_entries'
AND column_name IN ('entry_code', 'photo_url', 'photo_uploaded_at');
```

---

### 2️⃣ Supabase Storage Bucket (5 minutes)

1. **Go to:** Supabase Dashboard → Storage
2. **Click:** "New bucket"
3. **Configure:**
   - Name: `chili-photos`
   - Public bucket: ✅ YES
   - Click "Create bucket"

4. **Set policies** (SQL Editor):

```sql
-- Allow public read
CREATE POLICY "Public read access for chili photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'chili-photos');

-- Allow uploads
CREATE POLICY "Allow authenticated uploads to chili-photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chili-photos' AND
  auth.role() = 'authenticated'
);

-- Allow updates
CREATE POLICY "Allow photo updates in chili-photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'chili-photos')
WITH CHECK (bucket_id = 'chili-photos');

-- Allow deletions
CREATE POLICY "Allow photo deletions in chili-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'chili-photos');
```

---

### 3️⃣ Generate Entry Codes (2 minutes)

If you already have entries in the database:

```bash
npx tsx scripts/generate-entry-codes.ts
```

This will assign codes like `CHILI-7X2M` to all existing entries.

**Verify in admin panel:**
- Go to `/admin`
- You should see codes next to each entry

---

### 4️⃣ Environment Variable in Vercel (2 minutes)

The `EVENT_DATE` is already in `.env.local`, but you need to add it to Vercel:

1. Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. **Add New:**
   - Name: `EVENT_DATE`
   - Value: `2025-11-19T12:00:00-06:00`
   - Environment: **Production**, **Preview**, **Development** (all 3)
3. **Click:** "Save"

---

### 5️⃣ Deploy (5 minutes)

```bash
# Check everything builds
npm run build

# Commit and push
git add .
git commit -m "Add photo upload feature with entry codes and deadline enforcement"
git push
```

Vercel will auto-deploy. Watch the deployment logs.

---

## ✅ Testing Checklist

After deployment, test these flows:

### Test Upload Page

1. **Get a code from admin:**
   - Visit `/admin` (login)
   - Copy an entry code (e.g., `CHILI-7X2M`)

2. **Test upload flow:**
   - Visit `/upload`
   - Enter code
   - Should show entry details
   - Upload a test photo
   - Verify success message
   - Check photo appears in entry view

3. **Test deadline countdown:**
   - Should show time remaining until deadline
   - Colors should change based on urgency

4. **Test entry editing:**
   - Click "Edit" button
   - Modify entry details
   - Click "Save"
   - Verify changes persist

### Test Admin Panel

1. **Visit `/admin`**
2. **Check statistics:**
   - Should show "X With Photos" stat
3. **Check entry list:**
   - Entries with photos should have 📸 badge
   - Entry codes should be visible
   - "View Upload Page" links should work

### Test Results Page

1. **Visit `/results`**
2. **Check photos:**
   - Entries with photos should show thumbnails
   - Click photo to open lightbox
   - Lightbox should show full-size image
   - Click X or background to close

---

## 📱 Share with Entrants

Once everything is working, you can share codes with contestants:

### Option 1: Individual Messages

```
Hi [Name]!

Your chili entry is registered. Upload a photo by noon on Nov 19:

📸 Go to: https://your-site.vercel.app/upload
🔑 Your code: CHILI-XXXX

You can update your photo anytime before the deadline!
```

### Option 2: Direct Link

Just send them the direct link with their code:
```
https://your-site.vercel.app/upload/CHILI-XXXX
```

---

## 🎯 Current State

### ✅ Completed
- Database schema with photo fields
- Entry code generation system
- Photo upload API with validation
- Mobile-first upload interface
- Camera/gallery integration
- Photo preview and upload
- Entry editing functionality
- Deadline enforcement
- Countdown timer
- Admin panel with codes & photo status
- Results page with photo display
- Lightbox viewer for full-size photos
- Fully responsive design
- WCAG accessibility compliance

### ⏳ Not Implemented (Optional)
- Email confirmation with codes
- QR code generation
- Auto-send codes after Google Form submission
- Reminder emails before deadline

These can be added later if needed (estimated 2-3 hours).

---

## 🆘 If Something Goes Wrong

### Build fails
```bash
npm run build
```
Check the error message. Common issues:
- Missing dependency: `npm install`
- TypeScript error: Check the file mentioned
- Syntax error: Review recent changes

### Photo upload fails
1. Check Supabase Storage bucket exists
2. Verify RLS policies are set
3. Check Vercel logs for errors
4. Test locally: `npm run dev`

### Entry codes not showing
1. Run migration script: `npx tsx scripts/generate-entry-codes.ts`
2. Check admin panel after running

### Deadline not working
1. Verify `EVENT_DATE` in Vercel env vars
2. Format must be: `YYYY-MM-DDTHH:mm:ss-TZ`
3. Redeploy after changing env vars

---

## 📚 Documentation

- **Full setup guide:** `PHOTO_UPLOAD_SETUP_GUIDE.md`
- **Database setup:** `database/SUPABASE_STORAGE_SETUP.md`
- **Google Forms integration:** `SETUP_FOR_CASEY.md`
- **Project overview:** `.claude/PROJECT_CONTEXT.md`

---

## 🚀 You're Ready!

Once you've completed steps 1-5 above:

1. ✅ Photos can be uploaded via entry codes
2. ✅ Deadline enforced automatically
3. ✅ Admin can monitor photo completion
4. ✅ Results page displays photos beautifully
5. ✅ Mobile-friendly throughout

Test everything thoroughly before the event! 🌶️📸
