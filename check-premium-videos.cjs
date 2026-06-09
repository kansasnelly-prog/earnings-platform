const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkVideos() {
  const { data, error } = await supabase
    .from('creator_videos')
    .select('id, video_url, is_premium, unlock_cost, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total videos:', data.length);
  console.log('Videos:');
  data.forEach((video, i) => {
    console.log(`${i + 1}. ID: ${video.id}, Premium: ${video.is_premium}, Cost: ${video.unlock_cost}, URL: ${video.video_url}`);
  });
  
  const nonPremium = data.filter(v => !v.is_premium);
  console.log('\nNon-premium videos:', nonPremium.length);
  if (nonPremium.length > 0) {
    console.log('First non-premium:', nonPremium[0]);
  }
}

checkVideos();
