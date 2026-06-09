const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const videos = [
  'comedy_funny_3.mp4',
  'comedy_sketch_1.mp4',
  'comedy_sketch_2.mp4',
  'dating_couple_1.mp4',
  'dating_couple_2.mp4',
  'khmer_culture_3.mp4',
  'khmer_dance_1.mp4',
  'khmer_dance_2.mp4',
  'lifestyle_daily_3.mp4',
  'lifestyle_vlog_1.mp4',
  'lifestyle_vlog_2.mp4',
  'motivation_fitness_3.mp4',
  'motivation_speech_1.mp4',
  'motivation_speech_2.mp4',
  'nigeria_dance_3.mp4',
  'nigeria_music_1.mp4',
  'nigeria_music_2.mp4',
  'travel_adventure_1.mp4',
  'travel_adventure_2.mp4',
  'travel_nature_3.mp4'
];

async function fixCreatorVideos() {
  // Get all creator videos
  const { data: creatorVideos, error } = await supabase
    .from('creator_videos')
    .select('id, creator_name')
    .order('creator_name');
  
  if (error) {
    console.error('Error fetching creator videos:', error);
    return;
  }
  
  console.log('Updating', creatorVideos.length, 'creator videos with unique URLs...');
  
  // Update each creator video with a unique video URL
  for (let i = 0; i < creatorVideos.length; i++) {
    const video = creatorVideos[i];
    const videoUrl = `https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/${videos[i % videos.length]}`;
    
    const { error: updateError } = await supabase
      .from('creator_videos')
      .update({ video_url: videoUrl })
      .eq('id', video.id);
    
    if (updateError) {
      console.error(`Error updating video ${video.id}:`, updateError);
    } else {
      console.log(`Updated ${video.creator_name} -> ${videos[i % videos.length]}`);
    }
  }
  
  console.log('Done!');
}

fixCreatorVideos();
