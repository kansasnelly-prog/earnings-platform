import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function auditFeedVideos() {
  console.log('📹 AUDIT: Match Feed Video URLs\n');

  try {
    // Get all videos
    const { data: videos, error } = await supabase
      .from('creator_videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Error fetching videos:', error);
      return;
    }

    if (!videos || videos.length === 0) {
      console.log('⚠️ CRITICAL: No videos found in creator_videos table');
      console.log('   This is why videos are showing black screens - no video data exists!');
      return;
    }

    console.log(`✅ Found ${videos.length} videos:\n`);

    let validUrls = 0;
    let invalidUrls = 0;
    let emptyUrls = 0;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      console.log(`Video ${i + 1}:`);
      console.log(`  ID: ${video.id}`);
      console.log(`  Video URL: ${video.video_url || 'EMPTY'}`);
      console.log(`  Thumbnail URL: ${video.thumbnail_url || 'N/A'}`);
      console.log(`  Is Premium: ${video.is_premium}`);
      console.log(`  Creator Name: ${video.creator_name || 'N/A'}`);
      
      if (!video.video_url || video.video_url.trim() === '') {
        console.log('  ❌ CRITICAL: Empty video_url field');
        emptyUrls++;
        invalidUrls++;
      } else if (video.video_url.startsWith('http')) {
        console.log('  ✅ Valid HTTP URL format');
        validUrls++;
      } else {
        console.log('  ⚠️ Suspicious URL format');
        invalidUrls++;
      }
      console.log('');
    }

    console.log('\n📊 SUMMARY:');
    console.log(`  Total videos: ${videos.length}`);
    console.log(`  Valid URLs: ${validUrls}`);
    console.log(`  Invalid/Empty URLs: ${invalidUrls}`);
    console.log(`  Empty URLs: ${emptyUrls}`);

    if (emptyUrls > 0) {
      console.log('\n❌ CRITICAL ISSUE: Videos have empty video_url fields');
      console.log('   This causes black screens - no video source to play!');
    }

    if (invalidUrls > 0) {
      console.log('\n⚠️ WARNING: Some videos have invalid URL formats');
    }

    if (validUrls === 0) {
      console.log('\n❌ FATAL: No valid video URLs found in database');
      console.log('   The feed cannot function without valid video URLs');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

auditFeedVideos();
