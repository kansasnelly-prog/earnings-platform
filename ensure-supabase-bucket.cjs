const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureBucketExists() {
  console.log('=== CHECKING VIDEOS BUCKET ===\n');
  
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error listing buckets:', error);
    return false;
  }
  
  console.log('Existing buckets:', buckets.map(b => b.name));
  
  const videosBucket = buckets.find(b => b.name === 'videos');
  
  if (!videosBucket) {
    console.log('Creating "videos" bucket...');
    const { error: createError } = await supabase.storage.createBucket('videos', {
      public: true,
      fileSizeLimit: 104857600 // 100MB
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      return false;
    }
    
    console.log('✅ Videos bucket created');
  } else {
    console.log('✅ Videos bucket already exists');
    console.log(`Bucket is public: ${videosBucket.public}`);
  }
  
  return true;
}

ensureBucketExists();
