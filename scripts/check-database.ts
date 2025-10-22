/**
 * Quick database verification script
 * Run: npx tsx scripts/check-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase Connection...\n');

  // Check chili entries
  const { data: chilis, error: chilisError } = await supabase
    .from('chili_entries')
    .select('*');

  if (chilisError) {
    console.error('❌ Error fetching chilis:', chilisError);
    return;
  }

  console.log(`✅ Chili Entries: ${chilis?.length || 0} found`);
  chilis?.forEach((chili, i) => {
    console.log(`   ${i + 1}. "${chili.name}" by ${chili.contestant_name} (ID: ${chili.id})`);
  });

  console.log('');

  // Check votes
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('*');

  if (votesError) {
    console.error('❌ Error fetching votes:', votesError);
    return;
  }

  console.log(`✅ Votes: ${votes?.length || 0} found`);

  // Group votes by chili
  if (votes && votes.length > 0) {
    const votesByChili = votes.reduce((acc: any, vote) => {
      if (!acc[vote.chili_id]) acc[vote.chili_id] = [];
      acc[vote.chili_id].push(vote);
      return acc;
    }, {});

    Object.entries(votesByChili).forEach(([chiliId, chiliVotes]: [string, any]) => {
      const chili = chilis?.find(c => c.id === chiliId);
      const count = chiliVotes.length;
      const avgRating = (chiliVotes.reduce((sum: number, v: any) => sum + v.overall_rating, 0) / count).toFixed(1);
      console.log(`   - "${chili?.name || 'Unknown'}": ${count} vote(s), avg rating ${avgRating}/5`);
    });
  }

  console.log('\n📊 Summary:');
  console.log(`   Total Entries: ${chilis?.length || 0}`);
  console.log(`   Total Votes: ${votes?.length || 0}`);
  console.log(`   Avg Votes/Entry: ${chilis?.length ? (votes?.length || 0) / chilis.length : 0}`);

  if (chilis?.length === 0) {
    console.log('\n⚠️  No chili entries found! Go to /admin to create entries first.');
  } else if (votes?.length === 0) {
    console.log('\n⚠️  No votes found! Try voting at /vote?chili=' + chilis?.[0]?.id);
  } else {
    console.log('\n✅ Database is working! Check /results to see the leaderboard.');
  }
}

checkDatabase().catch(console.error);
