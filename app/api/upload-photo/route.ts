/**
 * API Route: Photo Upload for Chili Entries
 * Allows entrants to upload photos using their entry code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidEntryCode } from '@/lib/entry-codes';

// Initialize Supabase client with service role for storage operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];

/**
 * Check if uploads are allowed based on event deadline
 * Deadline: Noon on event day (from env variable)
 */
function isBeforeDeadline(): boolean {
  const eventDateStr = process.env.EVENT_DATE;

  if (!eventDateStr) {
    console.warn('EVENT_DATE not set, allowing uploads');
    return true; // If not configured, allow uploads
  }

  try {
    const eventDate = new Date(eventDateStr);
    const now = new Date();
    return now < eventDate;
  } catch (error) {
    console.error('Invalid EVENT_DATE format:', error);
    return true; // On error, allow uploads
  }
}

/**
 * Get entry by code and validate access
 */
async function getEntryByCode(code: string) {
  const { data, error } = await supabase
    .from('chili_entries')
    .select('*')
    .eq('entry_code', code)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * POST /api/upload-photo
 * Upload photo for a chili entry
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const entryCode = formData.get('entry_code') as string;
    const file = formData.get('photo') as File;

    // Validate entry code
    if (!entryCode || !isValidEntryCode(entryCode)) {
      return NextResponse.json(
        { error: 'Invalid entry code format' },
        { status: 400 }
      );
    }

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No photo file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Please upload JPEG, PNG, HEIC, or WebP images',
          allowedTypes: ALLOWED_TYPES
        },
        { status: 400 }
      );
    }

    // Check deadline
    if (!isBeforeDeadline()) {
      return NextResponse.json(
        { error: 'Upload deadline has passed. Photos can no longer be uploaded or changed.' },
        { status: 403 }
      );
    }

    // Get entry from database
    const entry = await getEntryByCode(entryCode);
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found with this code' },
        { status: 404 }
      );
    }

    // Generate storage path
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const storagePath = `${year}/${entry.id}/${timestamp}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('chili-photos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false, // Don't overwrite, create new file
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload photo', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chili-photos')
      .getPublicUrl(storagePath);

    const photoUrl = urlData.publicUrl;

    // Update database with photo URL
    const { error: updateError } = await supabase
      .from('chili_entries')
      .update({
        photo_url: photoUrl,
        photo_uploaded_at: new Date().toISOString(),
      })
      .eq('id', entry.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      // Photo was uploaded but DB update failed - not ideal but not critical
      return NextResponse.json(
        {
          warning: 'Photo uploaded but database update failed',
          photoUrl,
          details: updateError.message
        },
        { status: 207 } // Multi-status
      );
    }

    console.log(`Photo uploaded successfully for entry ${entryCode}: ${photoUrl}`);

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl,
      entry: {
        id: entry.id,
        name: entry.name,
        contestantName: entry.contestant_name,
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload-photo?code=CHILI-XXXX
 * Get entry details and upload status by code
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryCode = searchParams.get('code');

    if (!entryCode || !isValidEntryCode(entryCode)) {
      return NextResponse.json(
        { error: 'Invalid entry code format' },
        { status: 400 }
      );
    }

    // Get entry
    const entry = await getEntryByCode(entryCode);
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found with this code' },
        { status: 404 }
      );
    }

    // Check deadline status
    const beforeDeadline = isBeforeDeadline();
    const eventDateStr = process.env.EVENT_DATE;
    let deadlineInfo = null;

    if (eventDateStr) {
      const deadline = new Date(eventDateStr);
      deadlineInfo = {
        deadline: deadline.toISOString(),
        beforeDeadline,
        timeRemaining: beforeDeadline ? deadline.getTime() - Date.now() : 0,
      };
    }

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        name: entry.name,
        contestantName: entry.contestant_name,
        recipe: entry.recipe,
        ingredients: entry.ingredients,
        allergens: entry.allergens,
        spiceLevel: entry.spice_level,
        description: entry.description,
        photoUrl: entry.photo_url,
        photoUploadedAt: entry.photo_uploaded_at,
        hasPhoto: !!entry.photo_url,
      },
      uploadAllowed: beforeDeadline,
      deadline: deadlineInfo,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
