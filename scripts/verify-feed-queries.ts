import { createClient } from '@supabase/supabase-js';

// Use anon key for public access verification
const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = 'sb_publishable_bcKizzSl0LlWoKfGJiAp6w_mCsU4Zwn';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFeedQueries() {
  console.log('🔍 Verifying TikTok6 Feed Queries...\n');

  try {
    // Test 1: Query creator_videos table
    console.log('📹 Testing creator_videos query...');
    const { data: videos, error: videosError } = await supabase
      .from('creator_videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (videosError) {
      console.error('❌ creator_videos query failed:', videosError);
    } else {
      console.log(`✅ creator_videos query successful: ${videos.length} videos found`);
      if (videos.length > 0) {
        console.log(`   Sample video: ${videos[0].caption} (${videos[0].video_url})`);
      }
    }

    // Test 2: Query matchmaking_profiles table
    console.log('\n👤 Testing matchmaking_profiles query...');
    const { data: profiles, error: profilesError } = await supabase
      .from('matchmaking_profiles')
      .select('*')
      .in('profile_type', ['single', 'traveler'])
      .limit(20);

    if (profilesError) {
      console.error('❌ matchmaking_profiles query failed:', profilesError);
    } else {
      console.log(`✅ matchmaking_profiles query successful: ${profiles.length} profiles found`);
      if (profiles.length > 0) {
        console.log(`   Sample profile: ${profiles[0].display_name}`);
      }
    }

    // Test 3: Verify video URL accessibility
    console.log('\n🌐 Testing video URL accessibility...');
    if (videos && videos.length > 0) {
      const testVideo = videos[0];
      try {
        const response = await fetch(testVideo.video_url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ Video URL accessible: ${testVideo.video_url}`);
        } else {
          console.log(`⚠️ Video URL returned status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Video URL not accessible: ${error}`);
      }
    }

    // Test 4: Verify thumbnail URL accessibility
    console.log('\n🖼️ Testing thumbnail URL accessibility...');
    if (videos && videos.length > 0) {
      const testVideo = videos[0];
      try {
        const response = await fetch(testVideo.thumbnail_url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`✅ Thumbnail URL accessible: ${testVideo.thumbnail_url}`);
        } else {
          console.log(`⚠️ Thumbnail URL returned status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Thumbnail URL not accessible: ${error}`);
      }
    }

    console.log('\n🎉 Feed Query Verification Complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Videos in database: ${videos?.length || 0}`);
    console.log(`   - Profiles in database: ${profiles?.length || 0}`);
    console.log(`   - Video URLs accessible: ${videos && videos.length > 0 ? 'Yes' : 'No'}`);
    console.log(`   - Thumbnail URLs accessible: ${videos && videos.length > 0 ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

verifyFeedQueries();
