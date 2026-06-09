const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyDatabaseVideoUrls() {
  console.log('=== VERIFYING CREATOR_VIDEOS.VIDEO_URL POINTS TO VALID FILES ===\n');
  
  // Get all videos from creator_videos table
  const { data: videos, error: fetchError } = await supabase
    .from('creator_videos')
    .select('id, video_url')
    .order('created_at', { ascending: true });
  
  if (fetchError) {
    console.error('Error fetching videos:', fetchError);
    return;
  }
  
  console.log(`Found ${videos.length} videos in creator_videos table\n`);
  
  const supabaseBaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/';
  
  let validCount = 0;
  let invalidCount = 0;
  
  for (const video of videos) {
    const isSupabaseUrl = video.video_url.startsWith(supabaseBaseUrl);
    const filename = video.video_url.replace(supabaseBaseUrl, '');
    
    if (isSupabaseUrl) {
      console.log(`✅ Video ID ${video.id}: ${filename} (Supabase Storage URL)`);
      validCount++;
    } else {
      console.log(`❌ Video ID ${video.id}: ${video.video_url} (Not Supabase Storage URL)`);
      invalidCount++;
    }
  }
  
  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(`Valid Supabase Storage URLs: ${validCount}/${videos.length}`);
  console.log(`Invalid URLs: ${invalidCount}/${videos.length}`);
  
  if (invalidCount === 0) {
    console.log('\n✅ All video URLs point to Supabase Storage files');
  } else {
    console.log('\n❌ Some video URLs need to be updated to Supabase Storage URLs');
  }
}

verifyDatabaseVideoUrls();
