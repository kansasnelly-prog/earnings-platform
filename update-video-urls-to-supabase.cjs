const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// The uploaded Supabase Storage URLs
const supabaseUrls = [
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/khmer_culture_3.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/khmer_dance_1.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/khmer_dance_2.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/nigeria_dance_3.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/nigeria_music_1.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/nigeria_music_2.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/comedy_funny_3.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/comedy_sketch_1.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/comedy_sketch_2.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/lifestyle_daily_3.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/lifestyle_vlog_1.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/lifestyle_vlog_2.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/dating_couple_1.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/dating_couple_2.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/motivation_fitness_3.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/motivation_speech_1.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/motivation_speech_2.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/travel_adventure_1.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/travel_adventure_2.mp4',
  'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/travel_nature_3.mp4'
];

async function updateVideoUrls() {
  console.log('=== UPDATING VIDEO URLs TO SUPABASE STORAGE ===\n');
  
  // Get all videos
  const { data: videos, error: fetchError } = await supabase
    .from('creator_videos')
    .select('id, video_url')
    .order('created_at', { ascending: true });
  
  if (fetchError) {
    console.error('Error fetching videos:', fetchError);
    return;
  }
  
  console.log(`Found ${videos.length} videos to update\n`);
  
  // Update each video with a Supabase Storage URL
  let updateCount = 0;
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const newUrl = supabaseUrls[i % supabaseUrls.length];
    
    console.log(`Updating video ${i + 1}/${videos.length}`);
    console.log(`  ID: ${video.id}`);
    console.log(`  Old URL: ${video.video_url}`);
    console.log(`  New URL: ${newUrl}`);
    
    const { error: updateError } = await supabase
      .from('creator_videos')
      .update({ video_url: newUrl })
      .eq('id', video.id);
    
    if (updateError) {
      console.error(`  ❌ Error updating:`, updateError);
    } else {
      console.log(`  ✅ Updated successfully`);
      updateCount++;
    }
    console.log('');
  }
  
  console.log(`=== UPDATE COMPLETE ===`);
  console.log(`Successfully updated ${updateCount}/${videos.length} videos`);
}

updateVideoUrls();
