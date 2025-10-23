# Supabase Storage Setup for Photo Uploads

## Step 1: Run the Database Migration

First, apply the schema changes to add the new fields:

```bash
# In Supabase SQL Editor, run:
database/add-photo-upload-fields.sql
```

Or directly in SQL:
```sql
ALTER TABLE chili_entries
ADD COLUMN IF NOT EXISTS entry_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_chili_entries_entry_code ON chili_entries(entry_code);
```

## Step 2: Create Storage Bucket

1. Go to **Supabase Dashboard** → Your Project → **Storage**
2. Click **"New bucket"**
3. Configure the bucket:
   - **Name**: `chili-photos`
   - **Public bucket**: ✅ **YES** (checked)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/heic, image/webp`
4. Click **"Create bucket"**

## Step 3: Set Storage Policies

After creating the bucket, set up Row Level Security policies:

### 3.1 Allow Public Read Access

```sql
-- Allow anyone to view photos (for results page)
CREATE POLICY "Public read access for chili photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'chili-photos');
```

### 3.2 Allow Authenticated Uploads

```sql
-- Allow authenticated uploads (via API with entry code)
CREATE POLICY "Allow authenticated uploads to chili-photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chili-photos' AND
  auth.role() = 'authenticated'
);
```

### 3.3 Allow Updates/Replacements

```sql
-- Allow updating/replacing photos
CREATE POLICY "Allow photo updates in chili-photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'chili-photos')
WITH CHECK (bucket_id = 'chili-photos');
```

### 3.4 Allow Deletions (Admin Only)

```sql
-- Allow deletions (for admin panel)
CREATE POLICY "Allow photo deletions in chili-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'chili-photos');
```

## Step 4: Generate Entry Codes for Existing Entries

If you already have entries in the database, generate codes for them:

```bash
npm run tsx scripts/generate-entry-codes.ts
```

Or manually in Supabase SQL Editor:
```sql
-- Check entries without codes
SELECT id, name, contestant_name, entry_code
FROM chili_entries
WHERE entry_code IS NULL;
```

## Step 5: Verify Setup

Test that everything is configured:

```bash
# Check schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chili_entries'
AND column_name IN ('entry_code', 'photo_url', 'photo_uploaded_at');

# Check entry codes
SELECT entry_code, name, contestant_name
FROM chili_entries
ORDER BY created_at DESC;

# Verify storage bucket exists
SELECT * FROM storage.buckets WHERE name = 'chili-photos';
```

## Storage URL Format

Photos will be stored with this structure:
```
chili-photos/
  └── 2025/
      └── {entry_id}/
          └── {timestamp}.jpg
```

Example:
```
chili-photos/2025/abc123-def456/1729876543210.jpg
```

Public URL format:
```
https://{project-ref}.supabase.co/storage/v1/object/public/chili-photos/2025/{entry_id}/{timestamp}.jpg
```

## Troubleshooting

### "Bucket already exists" error
- Delete the old bucket and recreate, or just use the existing one
- Make sure policies are set correctly

### Photos not uploading
- Check that service role key is in `.env.local`
- Verify bucket is set to **public**
- Check storage policies are applied

### Photos not visible
- Ensure `photo_url` field is populated in database
- Check public read policy is active
- Verify URL format is correct

## Next Steps

After completing this setup:
1. ✅ Database schema updated
2. ✅ Storage bucket created
3. ✅ Policies configured
4. ✅ Entry codes generated

Ready to implement:
- Photo upload API endpoint
- Upload page UI
- Admin photo management
