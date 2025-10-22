/**
 * Check existing RLS policies on votes table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// For admin queries, we need the service role key, but we'll use anon for now
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  console.log('🔍 Checking RLS Policies...\n');

  // Try a raw SQL query to check policies
  const { data, error } = await supabase.rpc('check_policies', {});

  if (error) {
    console.log('Cannot query policies directly (expected with anon key)');
  }

  // Try to insert a test vote
  console.log('Testing vote insertion with current policies...\n');

  const testVote = {
    chili_id: 'b99bc936-c123-4e49-9966-98ee421e15a0',
    session_id: `test_${Date.now()}`,
    overall_rating: 5,
    taste_rating: 5,
    presentation_rating: 5,
    creativity_rating: 5,
    spice_balance_rating: 5,
    comments: 'Test'
  };

  const { data: voteData, error: voteError } = await supabase
    .from('votes')
    .insert(testVote)
    .select();

  if (voteError) {
    console.error('❌ Vote insert failed:');
    console.error('Error:', voteError.message);
    console.error('Code:', voteError.code);
    console.error('Details:', voteError.details);
    console.error('Hint:', voteError.hint);
  } else {
    console.log('✅ Vote insert succeeded!');
    console.log('Data:', voteData);
  }
}

checkPolicies();
