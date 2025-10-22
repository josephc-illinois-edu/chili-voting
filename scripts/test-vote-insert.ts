/**
 * Test vote insertion directly to debug RLS issues
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVoteInsert() {
  console.log('🧪 Testing Vote Insertion...\n');

  // Use the Texas Red chili ID
  const testChiliId = 'b99bc936-c123-4e49-9966-98ee421e15a0';
  const testSessionId = `test_session_${Date.now()}`;

  console.log(`Chili ID: ${testChiliId}`);
  console.log(`Session ID: ${testSessionId}\n`);

  try {
    const { data, error } = await supabase
      .from('votes')
      .insert({
        chili_id: testChiliId,
        session_id: testSessionId,
        overall_rating: 5,
        taste_rating: 5,
        presentation_rating: 4,
        creativity_rating: 5,
        spice_balance_rating: 4,
        comments: 'Test vote from debug script'
      })
      .select();

    if (error) {
      console.error('❌ Error inserting vote:');
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      return;
    }

    console.log('✅ Vote inserted successfully!');
    console.log('Vote data:', JSON.stringify(data, null, 2));

    // Check if it appears in the database
    const { data: votes, error: fetchError } = await supabase
      .from('votes')
      .select('*')
      .eq('session_id', testSessionId);

    if (fetchError) {
      console.error('❌ Error fetching vote:', fetchError);
      return;
    }

    console.log('\n✅ Vote confirmed in database:', votes);

    // Check updated chili stats
    const { data: chili, error: chiliError } = await supabase
      .from('chili_entries')
      .select('*')
      .eq('id', testChiliId)
      .single();

    if (chiliError) {
      console.error('❌ Error fetching chili:', chiliError);
      return;
    }

    console.log('\n📊 Chili Stats After Vote:');
    console.log(`   Vote Count: ${chili.vote_count}`);
    console.log(`   Total Score: ${chili.total_score}`);
    console.log(`   Average Rating: ${chili.average_rating}`);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testVoteInsert();
