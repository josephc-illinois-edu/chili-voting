/**
 * Google Sheets Sync Utility
 * Fetches chili cook-off form responses from Google Sheets and syncs to database
 */

import { google } from 'googleapis';
import type { ChiliEntry } from '@/types/database';

export interface GoogleSheetsRow {
  timestamp: string;
  email: string;
  firstName: string;
  lastName: string;
  chiliName: string;
  chiliType: string;
  heatLevel: string;
  ingredients: string;
  allergens: string;
  specialNotes: string;
}

export class GoogleSheetsSync {
  private static sheets = google.sheets('v4');

  /**
   * Parse heat level string to numeric spice level (1-5)
   */
  private static parseHeatLevel(heatLevel: string): number {
    const normalized = heatLevel.toLowerCase().trim();

    if (normalized.includes('mild')) return 1;
    if (normalized.includes('medium')) return 2;
    if (normalized.includes('hot') && !normalized.includes('extra')) return 3;
    if (normalized.includes('extra') || normalized.includes('very')) return 4;

    return 2; // Default to medium
  }

  /**
   * Parse comma-separated or newline-separated list into array
   */
  private static parseListField(field: string): string[] {
    if (!field || field.trim() === '' || field.toLowerCase() === 'no allergens' || field.toLowerCase() === 'none') {
      return [];
    }

    // Split by comma or newline, trim, filter empty
    return field
      .split(/[,\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  /**
   * Authenticate with Google Sheets API using service account
   */
  private static async getAuthClient() {
    // For server-side authentication, we use a service account
    // The credentials should be stored in environment variables

    const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS
      ? JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS)
      : {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return await auth.getClient();
  }

  /**
   * Fetch data from Google Sheets
   * @param spreadsheetId The ID of the Google Sheet (from the URL)
   * @param range The range to fetch (e.g., "Form Responses 1!A:J")
   */
  static async fetchSpreadsheetData(
    spreadsheetId: string,
    range: string = 'Form Responses 1!A:J'
  ): Promise<GoogleSheetsRow[]> {
    try {
      const authClient = await this.getAuthClient();

      const response = await this.sheets.spreadsheets.values.get({
        auth: authClient as any,
        spreadsheetId,
        range,
      });

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        return [];
      }

      // Skip header row
      const dataRows = rows.slice(1);

      return dataRows.map((row) => ({
        timestamp: row[0] || '',
        email: row[1] || '',
        firstName: row[2] || '',
        lastName: row[3] || '',
        chiliName: row[4] || '',
        chiliType: row[5] || '',
        heatLevel: row[6] || 'Medium',
        ingredients: row[7] || '',
        allergens: row[8] || '',
        specialNotes: row[9] || '',
      }));
    } catch (error) {
      console.error('Error fetching Google Sheets data:', error);
      throw new Error('Failed to fetch data from Google Sheets');
    }
  }

  /**
   * Convert Google Sheets row to ChiliEntry format (without database fields)
   */
  static convertRowToChiliEntry(row: GoogleSheetsRow): Omit<ChiliEntry, 'id' | 'vote_count' | 'total_score' | 'average_rating' | 'created_at'> {
    const contestantName = `${row.firstName} ${row.lastName}`.trim();
    const ingredients = this.parseListField(row.ingredients);
    const allergens = this.parseListField(row.allergens);
    const spiceLevel = this.parseHeatLevel(row.heatLevel);

    // Build description from chili type and special notes
    const descriptionParts = [];
    if (row.chiliType) {
      descriptionParts.push(`Type: ${row.chiliType}`);
    }
    if (row.specialNotes) {
      descriptionParts.push(row.specialNotes);
    }
    const description = descriptionParts.join('\n\n');

    return {
      name: row.chiliName || `${contestantName}'s Chili`,
      contestant_name: contestantName,
      recipe: '', // Not collected in form, leave empty
      ingredients,
      allergens,
      spice_level: spiceLevel,
      description: description || undefined,
      entry_code: null,
      photo_url: null,
      photo_uploaded_at: null,
    };
  }

  /**
   * Fetch and convert all entries from Google Sheets
   */
  static async fetchAndConvertEntries(spreadsheetId: string): Promise<Array<Omit<ChiliEntry, 'id' | 'vote_count' | 'total_score' | 'average_rating' | 'created_at'>>> {
    const rows = await this.fetchSpreadsheetData(spreadsheetId);
    return rows
      .filter(row => row.chiliName || (row.firstName && row.lastName)) // Filter out empty rows
      .map(row => this.convertRowToChiliEntry(row));
  }
}
