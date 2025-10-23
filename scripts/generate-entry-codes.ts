/**
 * Migration script: Generate entry codes for existing chili entries
 * Run this once after adding the entry_code column
 */

import { createClient } from '@supabase/supabase-js';
import { generateEntryCode } from '../lib/entry-codes';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateCodesForExistingEntries() {
  console.log('🔍 Fetching entries without codes...');

  // Get all entries that don't have an entry_code
  const { data: entries, error: fetchError } = await supabase
    .from('chili_entries')
    .select('id, name, contestant_name')
    .is('entry_code', null);

  if (fetchError) {
    console.error('❌ Error fetching entries:', fetchError);
    process.exit(1);
  }

  if (!entries || entries.length === 0) {
    console.log('✅ All entries already have codes!');
    return;
  }

  console.log(`📝 Found ${entries.length} entries without codes`);

  // Track all generated codes to ensure uniqueness
  const generatedCodes = new Set<string>();

  // Get existing codes from database
  const { data: existingEntries } = await supabase
    .from('chili_entries')
    .select('entry_code')
    .not('entry_code', 'is', null);

  if (existingEntries) {
    existingEntries.forEach(entry => {
      if (entry.entry_code) {
        generatedCodes.add(entry.entry_code);
      }
    });
  }

  console.log(`🔑 ${generatedCodes.size} codes already in use`);

  // Generate unique codes for each entry
  let successCount = 0;
  let errorCount = 0;

  for (const entry of entries) {
    let code = generateEntryCode();

    // Ensure uniqueness (very unlikely to collide, but be safe)
    while (generatedCodes.has(code)) {
      code = generateEntryCode();
    }

    generatedCodes.add(code);

    // Update the entry
    const { error: updateError } = await supabase
      .from('chili_entries')
      .update({ entry_code: code })
      .eq('id', entry.id);

    if (updateError) {
      console.error(`❌ Failed to update entry ${entry.name}:`, updateError);
      errorCount++;
    } else {
      console.log(`✅ ${code} → "${entry.name}" by ${entry.contestant_name}`);
      successCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📝 Total: ${entries.length}`);

  if (errorCount === 0) {
    console.log('\n🎉 All entry codes generated successfully!');
  }
}

// Run the script
generateCodesForExistingEntries()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
