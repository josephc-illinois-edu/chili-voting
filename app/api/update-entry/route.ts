/**
 * API Route: Update Chili Entry Details
 * Allows entrants to update their entry details before the deadline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidEntryCode } from '@/lib/entry-codes';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Check if updates are allowed based on event deadline
 */
function isBeforeDeadline(): boolean {
  const eventDateStr = process.env.EVENT_DATE;

  if (!eventDateStr) {
    return true;
  }

  try {
    const eventDate = new Date(eventDateStr);
    const now = new Date();
    return now < eventDate;
  } catch (error) {
    console.error('Invalid EVENT_DATE format:', error);
    return true;
  }
}

/**
 * PATCH /api/update-entry
 * Update entry details by entry code
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryCode, ...updates } = body;

    // Validate entry code
    if (!entryCode || !isValidEntryCode(entryCode)) {
      return NextResponse.json(
        { error: 'Invalid entry code format' },
        { status: 400 }
      );
    }

    // Check deadline
    if (!isBeforeDeadline()) {
      return NextResponse.json(
        { error: 'Update deadline has passed. Entry details can no longer be modified.' },
        { status: 403 }
      );
    }

    // Get entry by code
    const { data: entry, error: fetchError } = await supabase
      .from('chili_entries')
      .select('id')
      .eq('entry_code', entryCode)
      .single();

    if (fetchError || !entry) {
      return NextResponse.json(
        { error: 'Entry not found with this code' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }

    if (updates.recipe !== undefined) {
      updateData.recipe = updates.recipe.trim() || null;
    }

    if (updates.ingredients !== undefined) {
      // Convert comma-separated string to array
      updateData.ingredients = updates.ingredients
        ? updates.ingredients.split(',').map((item: string) => item.trim()).filter(Boolean)
        : [];
    }

    if (updates.allergens !== undefined) {
      // Convert comma-separated string to array
      updateData.allergens = updates.allergens
        ? updates.allergens.split(',').map((item: string) => item.trim()).filter(Boolean)
        : [];
    }

    if (updates.spiceLevel !== undefined) {
      const level = parseInt(updates.spiceLevel);
      if (level >= 1 && level <= 5) {
        updateData.spice_level = level;
      }
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description.trim() || null;
    }

    // Validate required fields
    if (updateData.name !== undefined && !updateData.name) {
      return NextResponse.json(
        { error: 'Chili name is required' },
        { status: 400 }
      );
    }

    // Update entry
    const { data, error: updateError } = await supabase
      .from('chili_entries')
      .update(updateData)
      .eq('id', entry.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update entry', details: updateError.message },
        { status: 500 }
      );
    }

    console.log(`Entry ${entryCode} updated successfully`);

    return NextResponse.json({
      success: true,
      message: 'Entry updated successfully',
      entry: {
        id: data.id,
        name: data.name,
        contestantName: data.contestant_name,
        recipe: data.recipe,
        ingredients: data.ingredients,
        allergens: data.allergens,
        spiceLevel: data.spice_level,
        description: data.description,
      },
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
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
