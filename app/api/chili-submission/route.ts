/**
 * API Route: Chili Submission from Google Forms
 * Receives form submissions and adds entries to the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEntryCode } from '@/lib/entry-codes';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Security: Verify the request is from Google Apps Script
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.GOOGLE_FORMS_API_KEY;

  if (!expectedKey) {
    console.error('GOOGLE_FORMS_API_KEY not configured');
    return false;
  }

  return apiKey === expectedKey;
}

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    if (!verifyApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Received submission:', body);

    // Validate required fields
    const requiredFields = ['name', 'contestantName'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Parse ingredients and allergens (comma-separated strings to arrays)
    const ingredientsArray = body.ingredients
      ? body.ingredients.split(',').map((item: string) => item.trim()).filter(Boolean)
      : [];

    const allergensArray = body.allergens
      ? body.allergens.split(',').map((item: string) => item.trim()).filter(Boolean)
      : [];

    // Generate unique entry code
    let entryCode = generateEntryCode();
    let codeIsUnique = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    // Ensure code is unique (very unlikely to collide, but be safe)
    while (!codeIsUnique && attempts < MAX_ATTEMPTS) {
      const { data: existing } = await supabase
        .from('chili_entries')
        .select('entry_code')
        .eq('entry_code', entryCode)
        .single();

      if (!existing) {
        codeIsUnique = true;
      } else {
        entryCode = generateEntryCode();
        attempts++;
      }
    }

    if (!codeIsUnique) {
      console.error('Failed to generate unique entry code after maximum attempts');
      return NextResponse.json(
        { error: 'Failed to generate unique entry code' },
        { status: 500 }
      );
    }

    // Prepare chili entry data
    const chiliEntry = {
      name: body.name,
      contestant_name: body.contestantName,
      recipe: body.recipe || '',
      ingredients: ingredientsArray,
      allergens: allergensArray,
      spice_level: parseInt(body.spiceLevel) || 3,
      description: body.description || '',
      vote_count: 0,
      total_score: 0,
      average_rating: 0,
      entry_code: entryCode,
    };

    // Insert into database
    const { data, error } = await supabase
      .from('chili_entries')
      .insert([chiliEntry])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create entry', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully created entry:', data);

    return NextResponse.json({
      success: true,
      message: 'Chili entry created successfully',
      entry: data,
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}
