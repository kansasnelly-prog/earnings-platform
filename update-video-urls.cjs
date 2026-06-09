const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseKey);

// Load uploaded video URLs
const uploadedVideos = JSON.parse(fs.readFileSync('./uploaded-video-urls.json', 'utf8'));

// Map videos to creators based on the audit results
// From the audit, we have:
// - Srey_Sna_VIP: 5 videos (Khmer creator)
// - Chheng_TikTok_Queen: 5 videos (Khmer creator)
// - Chioma_Lagos_Vibes: 5 videos (Nigeria creator)
// - Nelly_Premium_Club: 5 videos (Nigeria creator)

const creatorVideoMapping = {
  'Srey_Sna_VIP': [
    'khmer_dance_1.mp4',
    'khmer_dance_2.mp4',
    'khmer_culture_3.mp4',
    'comedy_sketch_1.mp4',
    'lifestyle_vlog_1.mp4'
  ],
  'Chheng_TikTok_Queen': [
    'khmer_dance_1.mp4',
    'khmer_dance_2.mp4',
    'khmer_culture_3.mp4',
    'comedy_sketch_2.mp4',
    'lifestyle_vlog_2.mp4'
  ],
  'Chioma_Lagos_Vibes': [
    'nigeria_music_1.mp4',
    'nigeria_music_2.mp4',
    'nigeria_dance_3.mp4',
    'comedy_funny_3.mp4',
    'dating_couple_1.mp4'
  ],
  'Nelly_Premium_Club': [
    'nigeria_music_1.mp4',
    'nigeria_music_2.mp4',
    'nigeria_dance_3.mp4',
    'motivation_speech_1.mp4',
    'dating_couple_2.mp4'
  ]
};

async function updateVideoUrls() {
  console.log('=== UPDATING VIDEO URLs IN CREATOR_VIDEOS TABLE ===\n');
  
  // Get all current videos
  const { data: currentVideos, error } = await supabase
    .from('creator_videos')
    .select('id, creator_name, video_url')
    .order('creator_name');
  
  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }
  
  console.log(`Found ${currentVideos.length} videos to update\n`);
  
  // Group videos by creator
  const videosByCreator = {};
  currentVideos.forEach(video => {
    if (!videosByCreator[video.creator_name]) {
      videosByCreator[video.creator_name] = [];
    }
    videosByCreator[video.creator_name].push(video);
  });
  
  let updateCount = 0;
  
  // Update each creator's videos
  for (const [creatorName, videos] of Object.entries(videosByCreator)) {
    const videoFiles = creatorVideoMapping[creatorName];
    
    if (!videoFiles) {
      console.log(`⚠️ No mapping found for creator: ${creatorName}`);
      continue;
    }
    
    console.log(`Updating videos for ${creatorName}:`);
    
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const videoFile = videoFiles[i % videoFiles.length]; // Cycle through videos if needed
      
      const uploadedVideo = uploadedVideos.find(v => v.fileName === videoFile);
      
      if (!uploadedVideo) {
        console.log(`  ❌ Could not find uploaded video for ${videoFile}`);
        continue;
      }
      
      const { error: updateError } = await supabase
        .from('creator_videos')
        .update({ video_url: uploadedVideo.url })
        .eq('id', video.id);
      
      if (updateError) {
        console.log(`  ❌ Failed to update video ${video.id}: ${updateError.message}`);
      } else {
        console.log(`  ✅ Updated video ${video.id}: ${uploadedVideo.url}`);
        updateCount++;
      }
    }
    
    console.log('');
  }
  
  console.log(`=== UPDATE COMPLETE ===`);
  console.log(`Total videos updated: ${updateCount}/${currentVideos.length}`);
}

updateVideoUrls();
