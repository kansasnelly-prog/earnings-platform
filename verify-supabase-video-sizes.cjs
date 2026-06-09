const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyVideoSizes() {
  console.log('=== VERIFYING SUPABASE STORAGE VIDEO SIZES ===\n');
  
  const { data: files, error } = await supabase.storage
    .from('videos')
    .list('', {
      sortBy: { column: 'name', order: 'asc' }
    });
  
  if (error) {
    console.error('Error listing files:', error);
    return;
  }
  
  console.log(`Found ${files.length} files in videos bucket\n`);
  
  let validCount = 0;
  let invalidCount = 0;
  
  for (const file of files) {
    const sizeKB = file.metadata.size / 1024;
    const sizeMB = sizeKB / 1024;
    
    if (file.metadata.size < 1000) {
      console.log(`❌ ${file.name}: ${file.metadata.size} bytes (${sizeKB.toFixed(2)} KB) - TOO SMALL`);
      invalidCount++;
    } else {
      console.log(`✅ ${file.name}: ${file.metadata.size} bytes (${sizeKB.toFixed(2)} KB / ${sizeMB.toFixed(2)} MB)`);
      validCount++;
    }
  }
  
  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(`Valid files (>= 1KB): ${validCount}/${files.length}`);
  console.log(`Invalid files (< 1KB): ${invalidCount}/${files.length}`);
  
  if (invalidCount === 0) {
    console.log('\n✅ All files have valid sizes!');
  } else {
    console.log('\n❌ Some files are still corrupted');
  }
}

verifyVideoSizes();
