import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCreatorVideos() {
  console.log('📹 Checking creator_videos table...\n');

  try {
    // Get all videos
    const { data: videos, error } = await supabase
      .from('creator_videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching videos:', error);
      return;
    }

    if (!videos || videos.length === 0) {
      console.log('⚠️ No videos found in creator_videos table');
      return;
    }

    console.log(`✅ Found ${videos.length} videos:\n`);

    videos.forEach((video, index) => {
      console.log(`Video ${index + 1}:`);
      console.log(`  ID: ${video.id}`);
      console.log(`  Video URL: ${video.video_url}`);
      console.log(`  Thumbnail URL: ${video.thumbnail_url || 'N/A'}`);
      console.log(`  Is Premium: ${video.is_premium}`);
      console.log(`  Unlock Cost: ${video.unlock_cost}`);
      console.log(`  Creator Name: ${video.creator_name || 'N/A'}`);
      console.log(`  Created At: ${video.created_at}`);
      console.log('');
    });

    // Test the first video URL
    if (videos.length > 0) {
      const firstVideo = videos[0];
      console.log(`\n🔍 Testing first video URL: ${firstVideo.video_url}`);
      
      try {
        const response = await fetch(firstVideo.video_url, { method: 'HEAD' });
        console.log(`  Response Status: ${response.status} ${response.statusText}`);
        console.log(`  Content-Type: ${response.headers.get('content-type')}`);
        console.log(`  Content-Length: ${response.headers.get('content-length')}`);
      } catch (err) {
        console.error(`  ❌ Error fetching video URL: ${err}`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkCreatorVideos();
