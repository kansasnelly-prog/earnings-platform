const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseKey);

const videoFiles = [
  'comedy_funny_3.mp4',
  'comedy_sketch_1.mp4',
  'comedy_sketch_2.mp4',
  'dating_couple_1.mp4',
  'dating_couple_2.mp4',
  'khmer_dance_1.mp4',
  'khmer_dance_2.mp4',
  'khmer_culture_3.mp4',
  'lifestyle_vlog_1.mp4',
  'lifestyle_vlog_2.mp4',
  'lifestyle_daily_3.mp4',
  'motivation_speech_1.mp4',
  'motivation_speech_2.mp4',
  'motivation_fitness_3.mp4',
  'nigeria_music_1.mp4',
  'nigeria_music_2.mp4',
  'nigeria_dance_3.mp4',
  'travel_adventure_1.mp4',
  'travel_adventure_2.mp4',
  'travel_nature_3.mp4'
];

async function deleteCorruptedVideos() {
  console.log('=== DELETING CORRUPTED VIDEOS FROM SUPABASE STORAGE ===\n');
  
  let deletedCount = 0;
  let failedCount = 0;
  
  for (const filename of videoFiles) {
    console.log(`Deleting ${filename}...`);
    
    const { data, error } = await supabase.storage
      .from('videos')
      .remove([filename]);
    
    if (error) {
      console.error(`❌ Failed to delete ${filename}:`, error.message);
      failedCount++;
    } else {
      console.log(`✅ Deleted: ${filename}`);
      deletedCount++;
    }
  }
  
  console.log('\n=== DELETION COMPLETE ===');
  console.log(`Successfully deleted: ${deletedCount}/${videoFiles.length}`);
  console.log(`Failed to delete: ${failedCount}/${videoFiles.length}`);
}

deleteCorruptedVideos();
