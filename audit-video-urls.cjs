const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditVideoUrls() {
  console.log('=== AUDITING VIDEO URLs ===\n');
  
  const { data, error } = await supabase
    .from('creator_videos')
    .select('id, creator_name, video_url');
  
  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }
  
  console.log(`Total videos: ${data.length}\n`);
  
  const externalDomains = ['sample-videos.com', 'w3schools.com', 'mozilla', 'interactive-examples'];
  const externalVideos = [];
  const supabaseVideos = [];
  
  data.forEach(video => {
    const url = video.video_url;
    const isExternal = externalDomains.some(domain => url.includes(domain));
    
    if (isExternal) {
      externalVideos.push(video);
    } else if (url.includes('supabase.co') || url.includes('/storage/')) {
      supabaseVideos.push(video);
    }
    
    console.log(`ID: ${video.id}`);
    console.log(`Creator: ${video.creator_name}`);
    console.log(`URL: ${url}`);
    console.log(`Status: ${isExternal ? '❌ EXTERNAL' : (url.includes('supabase.co') ? '✅ SUPABASE' : '⚠️ UNKNOWN')}`);
    console.log('---');
  });
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total videos: ${data.length}`);
  console.log(`External URLs (need replacement): ${externalVideos.length}`);
  console.log(`Supabase URLs: ${supabaseVideos.length}`);
  console.log(`Other/Unknown: ${data.length - externalVideos.length - supabaseVideos.length}`);
  
  if (externalVideos.length > 0) {
    console.log('\n=== EXTERNAL VIDEOS TO REPLACE ===');
    externalVideos.forEach(video => {
      console.log(`ID: ${video.id} | Creator: ${video.creator_name} | URL: ${video.video_url}`);
    });
  }
}

auditVideoUrls();
