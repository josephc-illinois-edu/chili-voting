/**
 * API Route: Update Chili Entry Details
 * Allows entrants to update their entry details before the deadline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isValidEntryCode } from '@/lib/entry-codes';
import { validateOrThrow, entryUpdateSchema, ValidationError } from '@/lib/validation';
import { sanitizeRecipeHtml, sanitizeToPlainText } from '@/lib/sanitization';
import { normalizeTitle, normalizeSentence, parseIngredientsList } from '@/lib/text-utils';

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

    // Validate input with Zod
    let validatedData;
    try {
      validatedData = validateOrThrow(entryUpdateSchema, body);
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const { entryCode, ...updates } = validatedData;

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

    // Prepare and sanitize update data
    const updateData: Record<string, unknown> = {};

    // Sanitize and normalize name
    if (updates.name !== undefined) {
      const sanitized = sanitizeToPlainText(updates.name);
      updateData.name = normalizeTitle(sanitized);
    }

    // Sanitize recipe HTML
    if (updates.recipe !== undefined && updates.recipe) {
      updateData.recipe = sanitizeRecipeHtml(updates.recipe);
    } else if (updates.recipe === '') {
      updateData.recipe = null;
    }

    // Parse and sanitize ingredients
    if (updates.ingredients !== undefined) {
      updateData.ingredients = updates.ingredients
        ? parseIngredientsList(updates.ingredients)
        : [];
    }

    // Parse and sanitize allergens
    if (updates.allergens !== undefined) {
      updateData.allergens = updates.allergens
        ? parseIngredientsList(updates.allergens)
        : [];
    }

    // Spice level (already validated by Zod)
    if (updates.spiceLevel !== undefined) {
      updateData.spice_level = updates.spiceLevel;
    }

    // Sanitize and normalize description
    if (updates.description !== undefined && updates.description) {
      const sanitized = sanitizeToPlainText(updates.description);
      updateData.description = normalizeSentence(sanitized);
    } else if (updates.description === '') {
      updateData.description = null;
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

    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

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
