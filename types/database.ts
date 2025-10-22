/**
 * Database type definitions for the chili cook-off application
 * @fileoverview Comprehensive type definitions matching Supabase schema
 */

export interface ChiliEntry {
  id: string;
  name: string;
  contestant_name: string;
  recipe: string;
  ingredients: string[];
  allergens: string[];
  spice_level: number;
  description?: string;
  vote_count: number;
  total_score: number;
  average_rating: number;
  created_at: string;
}

export interface Vote {
  id?: string;
  chili_id: string;
  session_id: string;
  overall_rating: number;
  taste_rating: number;
  presentation_rating: number;
  creativity_rating: number;
  spice_balance_rating: number;
  comments?: string;
  created_at?: string;
}

export interface VoterSession {
  session_id: string;
  voted_chilis: string[];
  created_at: string;
  last_activity: string;
}

export interface VoteSubmission {
  chiliId: string;
  overallRating: number;
  categoryRatings: {
    taste: number;
    presentation: number;
    creativity: number;
    spiceBalance: number;
  };
  comments?: string;
}

export interface ChiliSubmission {
  name: string;
  contestantName: string;
  recipe: string;
  ingredients: string;
  allergens: string;
  spiceLevel: number;
  description?: string;
}
