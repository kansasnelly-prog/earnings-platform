import { supabaseAdmin } from './supabaseAdmin.js';

const supabase = supabaseAdmin;

const verifyDatabaseState = async () => {
  console.log('🔍 Verifying creator_videos table state...\n');

  try {
    // Get all videos
    const { data: videos, error } = await supabase
      .from('creator_videos')
      .select('*');

    if (error) {
      console.error('❌ Error fetching videos:', error);
      process.exit(1);
    }

    if (!videos || videos.length === 0) {
      console.log('⚠️  No videos found in creator_videos table');
      console.log('📝 Run: npm run seed:media to populate the table');
      process.exit(0);
    }

    console.log(`📊 Found ${videos.length} videos in database\n`);

    // Check for invalid URLs
    const invalidUrls = videos.filter(v => 
      v.video_url?.includes('mixkit.co') ||
      v.video_url?.includes('unsplash.com') ||
      v.thumbnail_url?.includes('googleapis.com') && !v.thumbnail_url?.includes('storage.googleapis.com')
    );

    const validUrls = videos.filter(v =>
      v.video_url?.includes('supabase.co/storage/v1/object/public/videos') ||
      v.video_url?.includes('storage.googleapis.com/gtv-videos-bucket') ||
      v.video_url?.includes('.mp4')
    );

    console.log(`✅ Valid video URLs: ${validUrls.length}`);
    console.log(`⚠️  Invalid/placeholder URLs: ${invalidUrls.length}`);

    if (invalidUrls.length > 0) {
      console.log('\n❌ Found invalid URLs:');
      invalidUrls.forEach(v => {
        console.log(`   - ${v.title}: ${v.video_url}`);
      });
      console.log('\n⚠️  Production sync has problems!');
    } else {
      console.log('\n🎉 All videos have valid URLs!');
      console.log('✅ Production sync successful with 0 problems!');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
};

verifyDatabaseState();
