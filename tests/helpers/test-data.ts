import { supabase } from '@/lib/supabase';

/**
 * Test data helpers for creating and cleaning up test chilis
 */

export interface TestChili {
  id?: string;
  name: string;
  contestant_name: string;
  recipe: string;
  ingredients: string[];
  allergens: string[];
  spice_level: number;
  description?: string;
}

export class TestDataHelper {
  /**
   * Create a test chili entry
   */
  static async createTestChili(data?: Partial<TestChili>): Promise<string> {
    const testChili: TestChili = {
      name: data?.name || 'Test Chili',
      contestant_name: data?.contestant_name || 'Test Chef',
      recipe: data?.recipe || 'Test recipe',
      ingredients: data?.ingredients || ['test ingredient'],
      allergens: data?.allergens || [],
      spice_level: data?.spice_level || 3,
      description: data?.description || 'A test chili for automated testing',
      ...data
    };

    const { data: result, error } = await supabase
      .from('chili_entries')
      .insert(testChili)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test chili: ${error.message}`);
    }

    return result.id;
  }

  /**
   * Delete a test chili entry
   */
  static async deleteTestChili(id: string): Promise<void> {
    const { error } = await supabase
      .from('chili_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Failed to delete test chili: ${error.message}`);
    }
  }

  /**
   * Delete all test chilis (name starts with "Test")
   */
  static async cleanupTestChilis(): Promise<void> {
    const { error } = await supabase
      .from('chili_entries')
      .delete()
      .like('name', 'Test%');

    if (error) {
      console.error(`Failed to cleanup test chilis: ${error.message}`);
    }
  }

  /**
   * Get a test chili by ID
   */
  static async getTestChili(id: string) {
    const { data, error } = await supabase
      .from('chili_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get test chili: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete all votes for a test chili
   */
  static async deleteTestVotes(chiliId: string): Promise<void> {
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('chili_id', chiliId);

    if (error) {
      console.error(`Failed to delete test votes: ${error.message}`);
    }
  }
}
