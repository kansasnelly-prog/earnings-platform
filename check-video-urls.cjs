const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkVideoUrls() {
  const { data, error } = await supabase
    .from('creator_videos')
    .select('id, creator_id, video_url');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total videos:', data.length);
  console.log('\nVideo URLs:');
  data.forEach(video => {
    console.log(`ID: ${video.id}, Creator: ${video.creator_id}`);
    console.log(`URL: ${video.video_url}`);
    console.log('---');
  });
  
  // Check for external URLs
  const externalUrls = data.filter(v => !v.video_url.includes('supabase.co'));
  console.log('\nExternal URLs (need migration):', externalUrls.length);
  externalUrls.forEach(v => {
    console.log(`ID: ${v.id}, URL: ${v.video_url}`);
  });
}

checkVideoUrls();
