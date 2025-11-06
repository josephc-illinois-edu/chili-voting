/**
 * Google Sheets Sync API Endpoint
 * Fetches chili entries from Google Sheets and syncs them to the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsSync } from '@/lib/google-sheets-sync';
import { ChiliDatabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get spreadsheet ID from request body or environment
    const body = await request.json().catch(() => ({}));
    const spreadsheetId =
      body.spreadsheetId || process.env.GOOGLE_SHEETS_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Missing spreadsheet ID. Provide it in the request body or set GOOGLE_SHEETS_ID environment variable.' },
        { status: 400 }
      );
    }

    // Fetch entries from Google Sheets
    console.log(`Fetching entries from Google Sheets: ${spreadsheetId}`);
    const entries = await GoogleSheetsSync.fetchAndConvertEntries(spreadsheetId);

    if (entries.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No entries found in Google Sheets',
        synced: 0,
        skipped: 0,
        errors: 0,
      });
    }

    // Sync each entry to the database
    const results = {
      synced: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        name: string;
        contestant: string;
        status: 'synced' | 'skipped' | 'error';
        reason?: string;
      }>,
    };

    for (const entry of entries) {
      try {
        // Check if entry already exists (by contestant name and chili name)
        const existingEntries = await ChiliDatabase.getChiliEntries();
        const exists = existingEntries.some(
          (existing) =>
            existing.contestant_name.toLowerCase() === entry.contestant_name.toLowerCase() &&
            existing.name.toLowerCase() === entry.name.toLowerCase()
        );

        if (exists) {
          results.skipped++;
          results.details.push({
            name: entry.name,
            contestant: entry.contestant_name,
            status: 'skipped',
            reason: 'Entry already exists',
          });
          continue;
        }

        // Convert to ChiliSubmission format
        const submission = {
          name: entry.name,
          contestantName: entry.contestant_name,
          contestantEmail: entry.contestant_email || '',
          chiliType: entry.chili_type || '',
          recipe: entry.recipe || '',
          ingredients: entry.ingredients.join(', '),
          allergens: entry.allergens.join(', '),
          spiceLevel: entry.spice_level,
          description: entry.description || '',
        };

        // Insert into database (entry code is generated automatically)
        await ChiliDatabase.submitChiliEntry(submission);

        results.synced++;
        results.details.push({
          name: entry.name,
          contestant: entry.contestant_name,
          status: 'synced',
        });

        console.log(`✓ Synced: ${entry.name} by ${entry.contestant_name}`);
      } catch (error) {
        results.errors++;
        results.details.push({
          name: entry.name,
          contestant: entry.contestant_name,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`✗ Error syncing ${entry.name}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed. ${results.synced} new entries added, ${results.skipped} skipped, ${results.errors} errors.`,
      ...results,
    });
  } catch (error) {
    console.error('Error in Google Sheets sync:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync from Google Sheets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status / preview entries
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'GOOGLE_SHEETS_ID environment variable not set' },
        { status: 400 }
      );
    }

    // Fetch entries from Google Sheets (preview only, don't sync)
    const entries = await GoogleSheetsSync.fetchAndConvertEntries(spreadsheetId);

    return NextResponse.json({
      success: true,
      count: entries.length,
      entries: entries.map((entry) => ({
        name: entry.name,
        contestant: entry.contestant_name,
        spiceLevel: entry.spice_level,
        ingredients: entry.ingredients,
        allergens: entry.allergens,
      })),
    });
  } catch (error) {
    console.error('Error previewing Google Sheets data:', error);
    return NextResponse.json(
      {
        error: 'Failed to preview Google Sheets data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
