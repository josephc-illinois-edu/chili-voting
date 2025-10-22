/**
 * Supabase client configuration and database operations
 * @fileoverview Main database interface for the chili voting system
 */

import { createClient } from '@supabase/supabase-js';
import type { ChiliEntry, Vote, ChiliSubmission, VoteSubmission } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Database operations class for chili cook-off
 */
export class ChiliDatabase {
  /**
   * Fetch all chili entries with vote statistics
   * @returns Promise<ChiliEntry[]> Array of chili entries
   */
  static async getChiliEntries(): Promise<ChiliEntry[]> {
    const { data, error } = await supabase
      .from('chili_entries')
      .select('*')
      .order('average_rating', { ascending: false });

    if (error) {
      console.error('Error fetching chili entries:', error);
      throw new Error('Failed to fetch chili entries');
    }

    return data || [];
  }

  /**
   * Submit a new vote for a chili
   * @param vote Vote submission data
   * @throws Error if vote submission fails
   */
  static async submitVote(vote: VoteSubmission & { sessionId: string }): Promise<void> {
    try {
      // Insert the vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          chili_id: vote.chiliId,
          session_id: vote.sessionId,
          overall_rating: vote.overallRating,
          taste_rating: vote.categoryRatings.taste,
          presentation_rating: vote.categoryRatings.presentation,
          creativity_rating: vote.categoryRatings.creativity,
          spice_balance_rating: vote.categoryRatings.spiceBalance,
          comments: vote.comments || null
        });

      if (voteError) {
        throw voteError;
      }

      // Update chili statistics
      await this.updateChiliStats(vote.chiliId);

    } catch (error) {
      console.error('Error submitting vote:', error);
      throw new Error('Failed to submit vote');
    }
  }

  /**
   * Update vote statistics for a chili entry
   * @param chiliId UUID of the chili entry
   */
  private static async updateChiliStats(chiliId: string): Promise<void> {
    try {
      // Get all votes for this chili
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('overall_rating')
        .eq('chili_id', chiliId);

      if (votesError) throw votesError;

      if (votes && votes.length > 0) {
        const totalScore = votes.reduce((sum, vote) => sum + vote.overall_rating, 0);
        const averageRating = totalScore / votes.length;

        // Update chili entry statistics
        const { error: updateError } = await supabase
          .from('chili_entries')
          .update({
            vote_count: votes.length,
            total_score: totalScore,
            average_rating: Math.round(averageRating * 10) / 10 // Round to 1 decimal
          })
          .eq('id', chiliId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error updating chili stats:', error);
      // Don't throw here - vote was successful even if stats update failed
    }
  }

  /**
   * Submit a new chili entry
   * @param entry Chili entry submission data
   * @throws Error if submission fails
   */
  static async submitChiliEntry(entry: ChiliSubmission): Promise<void> {
    try {
      const { error } = await supabase
        .from('chili_entries')
        .insert({
          name: entry.name.trim(),
          contestant_name: entry.contestantName.trim(),
          recipe: entry.recipe?.trim() || null,
          ingredients: entry.ingredients ? entry.ingredients.split(',').map(i => i.trim()).filter(i => i) : [],
          allergens: entry.allergens ? entry.allergens.split(',').map(a => a.trim()).filter(a => a) : [],
          spice_level: entry.spiceLevel,
          description: entry.description?.trim() || null
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error submitting chili entry:', error);
      throw new Error('Failed to submit chili entry');
    }
  }

  /**
   * Check if a session has voted for a specific chili
   * @param sessionId Session identifier
   * @param chiliId Chili entry identifier
   * @returns Promise<boolean> True if already voted
   */
  static async hasVoted(sessionId: string, chiliId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('session_id', sessionId)
        .eq('chili_id', chiliId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false; // Default to allowing vote if check fails
    }
  }

  /**
   * Get voting statistics
   * @returns Promise with total entries, votes, and average participation
   */
  static async getVotingStats(): Promise<{
    totalEntries: number;
    totalVotes: number;
    averageVotesPerEntry: number;
  }> {
    try {
      const [entriesResult, votesResult] = await Promise.all([
        supabase.from('chili_entries').select('id', { count: 'exact' }),
        supabase.from('votes').select('id', { count: 'exact' })
      ]);

      const totalEntries = entriesResult.count || 0;
      const totalVotes = votesResult.count || 0;
      const averageVotesPerEntry = totalEntries > 0 ? totalVotes / totalEntries : 0;

      return {
        totalEntries,
        totalVotes,
        averageVotesPerEntry: Math.round(averageVotesPerEntry * 10) / 10
      };
    } catch (error) {
      console.error('Error fetching voting stats:', error);
      return { totalEntries: 0, totalVotes: 0, averageVotesPerEntry: 0 };
    }
  }

  /**
   * Delete a chili entry
   * @param id UUID of the chili entry to delete
   * @throws Error if deletion fails
   */
  static async deleteChiliEntry(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chili_entries')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting chili entry:', error);
      throw new Error('Failed to delete chili entry');
    }
  }

  /**
   * Bulk delete chili entries by IDs
   * @param ids Array of chili entry UUIDs to delete
   * @throws Error if deletion fails
   */
  static async bulkDeleteChiliEntries(ids: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('chili_entries')
        .delete()
        .in('id', ids);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error bulk deleting chili entries:', error);
      throw new Error('Failed to bulk delete chili entries');
    }
  }

  /**
   * Delete all test entries (entries with name starting with "Test")
   * @returns Promise<number> Number of entries deleted
   */
  static async deleteTestEntries(): Promise<number> {
    try {
      // First get all test entries to count them
      const { data: testEntries, error: fetchError } = await supabase
        .from('chili_entries')
        .select('id')
        .ilike('name', 'Test%');

      if (fetchError) throw fetchError;

      if (!testEntries || testEntries.length === 0) {
        return 0;
      }

      const ids = testEntries.map(entry => entry.id);
      await this.bulkDeleteChiliEntries(ids);

      return ids.length;
    } catch (error) {
      console.error('Error deleting test entries:', error);
      throw new Error('Failed to delete test entries');
    }
  }
}
