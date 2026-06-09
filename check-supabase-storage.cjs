const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseStorage() {
  console.log('=== CHECKING SUPABASE STORAGE (videos bucket) ===\n');
  
  const { data, error } = await supabase.storage.from('videos').list();
  
  if (error) {
    console.error('Error listing files:', error);
    return;
  }
  
  console.log(`Total files in videos bucket: ${data.length}\n`);
  
  data.forEach(file => {
    console.log(`- ${file.name} (${(file.metadata?.size || 0) / 1024 / 1024?.toFixed(2)} MB)`);
  });
  
  console.log('\n=== VERIFICATION ===');
  console.log(`Expected: 20 videos`);
  console.log(`Found: ${data.length} videos`);
  console.log(`Status: ${data.length === 20 ? '✅ ALL VIDEOS UPLOADED' : '❌ MISSING VIDEOS'}`);
}

checkSupabaseStorage();
