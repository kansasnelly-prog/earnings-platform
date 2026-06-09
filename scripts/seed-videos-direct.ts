import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS policies during seeding
const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample video data with external URLs
const videoSamples = [
  {
    creator_id: 'srey_sna_vip',
    title: 'Exploring Phnom Penh Skybars 🥂',
    creator_name: 'Srey_Sna_VIP',
    views: 1240,
    likes_count: 432,
    comments_count: 89,
    is_premium: false,
    unlock_cost: 0
  },
  {
    creator_id: 'chheng_tiktok_queen',
    title: 'Exclusive Weekend Private Fashion Show 🔒',
    creator_name: 'Chheng_TikTok_Queen',
    views: 982,
    likes_count: 741,
    comments_count: 156,
    is_premium: true,
    unlock_cost: 2
  },
  {
    creator_id: 'chioma_lagos_vibes',
    title: 'Lagos High-Vibe Energy Check 🇳🇬🔥',
    creator_name: 'Chioma_Lagos_Vibes',
    views: 2435,
    likes_count: 1102,
    comments_count: 234,
    is_premium: false,
    unlock_cost: 0
  },
  {
    creator_id: 'nelly_premium_club',
    title: 'Private Midnight VIP Lounge 💎',
    creator_name: 'Nelly_Premium_Club',
    views: 562,
    likes_count: 231,
    comments_count: 67,
    is_premium: true,
    unlock_cost: 2
  },
  {
    creator_id: 'srey_sna_vip',
    title: 'Sunset Riverside Dining Experience 🌅',
    creator_name: 'Srey_Sna_VIP',
    views: 1876,
    likes_count: 654,
    comments_count: 123,
    is_premium: false,
    unlock_cost: 0
  },
  {
    creator_id: 'chheng_tiktok_queen',
    title: 'Behind the Scenes: Fashion Week 👗',
    creator_name: 'Chheng_TikTok_Queen',
    views: 2341,
    likes_count: 892,
    comments_count: 201,
    is_premium: true,
    unlock_cost: 3
  },
  {
    creator_id: 'chioma_lagos_vibes',
    title: 'Street Food Tour in Lagos 🍜',
    creator_name: 'Chioma_Lagos_Vibes',
    views: 3456,
    likes_count: 1432,
    comments_count: 312,
    is_premium: false,
    unlock_cost: 0
  },
  {
    creator_id: 'nelly_premium_club',
    title: 'Exclusive Pool Party Access 🏊',
    creator_name: 'Nelly_Premium_Club',
    views: 1234,
    likes_count: 567,
    comments_count: 89,
    is_premium: true,
    unlock_cost: 2
  },
  {
    creator_id: 'srey_sna_vip',
    title: 'Night Market Adventure 🏮',
    creator_name: 'Srey_Sna_VIP',
    views: 987,
    likes_count: 345,
    comments_count: 67,
    is_premium: false,
    unlock_cost: 0
  },
  {
    creator_id: 'chheng_tiktok_queen',
    title: 'Makeup Tutorial: Glam Look 💄',
    creator_name: 'Chheng_TikTok_Queen',
    views: 4567,
    likes_count: 2134,
    comments_count: 456,
    is_premium: true,
    unlock_cost: 3
  },
  {
    creator_id: 'chioma_lagos_vibes',
    title: 'Dance Challenge with Friends 💃',
    creator_name: 'Chioma_Lagos_Vibes',
    views: 5678,
    likes_count: 2890,
    comments_count: 567,
    is_premium: false,
    unlock_cost: 0
  },
  {
    creator_id: 'nelly_premium_club',
    title: 'VIP Concert Experience 🎵',
    creator_name: 'Nelly_Premium_Club',
    views: 2345,
    likes_count: 1098,
    comments_count: 234,
    is_premium: true,
    unlock_cost: 4
  },
  {
    creator_id: 'srey_sna_vip',
    title: 'Morning Yoga Session 🧘‍♀️',
    creator_name: 'Srey_Sna_VIP',
    views: 1567,
    likes_count: 432,
    comments_count: 89,
    is_premium: false,
    unlock_cost: 0
  },
  {
    creator_id: 'chheng_tiktok_queen',
    title: 'Cooking Class: Khmer Cuisine 🍲',
    creator_name: 'Chheng_TikTok_Queen',
    views: 2134,
    likes_count: 876,
    comments_count: 145,
    is_premium: true,
    unlock_cost: 2
  },
  {
    creator_id: 'chioma_lagos_vibes',
    title: 'Beach Day Vlog 🏖️',
    creator_name: 'Chioma_Lagos_Vibes',
    views: 3456,
    likes_count: 1234,
    comments_count: 234,
    is_premium: false,
    unlock_cost: 0
  },
  {
    creator_id: 'nelly_premium_club',
    title: 'Rooftop Party Night 🌃',
    creator_name: 'Nelly_Premium_Club',
    views: 1876,
    likes_count: 765,
    comments_count: 123,
    is_premium: true,
    unlock_cost: 3
  },
  {
    creator_id: 'srey_sna_vip',
    title: 'Temple Tour 🏛️',
    creator_name: 'Srey_Sna_VIP',
    views: 1234,
    likes_count: 543,
    comments_count: 98,
    is_premium: false,
    unlock_cost: 0
  },
  {
    creator_id: 'chheng_tiktok_queen',
    title: 'Shopping Spree 👜',
    creator_name: 'Chheng_TikTok_Queen',
    views: 2890,
    likes_count: 1098,
    comments_count: 187,
    is_premium: true,
    unlock_cost: 2
  },
  {
    creator_id: 'chioma_lagos_vibes',
    title: 'Music Festival 🎤',
    creator_name: 'Chioma_Lagos_Vibes',
    views: 4567,
    likes_count: 2109,
    comments_count: 345,
    is_premium: false,
    unlock_cost: 0
  },
  {
    creator_id: 'nelly_premium_club',
    title: 'Yacht Party ⛵',
    creator_name: 'Nelly_Premium_Club',
    views: 1567,
    likes_count: 876,
    comments_count: 145,
    is_premium: true,
    unlock_cost: 4
  }
];

// Public sample video URLs (reliable, free to use, CORS-enabled)
const sampleVideoUrls = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://www.w3schools.com/html/movie.mp4',
  'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
  'https://sample-videos.com/video321/mp4/480/big_buck_bunny_480p_1mb.mp4',
  'https://sample-videos.com/video321/mp4/360/big_buck_bunny_360p_1mb.mp4',
  'https://sample-videos.com/video321/mp4/240/big_buck_bunny_240p_400kb.mp4',
  'https://sample-videos.com/video321/webm/720/big_buck_bunny_720p_1mb.webm',
  'https://sample-videos.com/video321/webm/480/big_buck_bunny_480p_1mb.webm',
  'https://sample-videos.com/video321/webm/360/big_buck_bunny_360p_1mb.webm'
];

// Sample thumbnail URLs
const sampleThumbnailUrls = [
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&q=80',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80'
];

async function seedVideos() {
  console.log('🎬 Starting Direct Video Seeding...\n');
  
  const videosToInsert: any[] = [];
  
  try {
    // Process each video
    for (let i = 0; i < videoSamples.length; i++) {
      const videoData = videoSamples[i];
      const videoUrl = sampleVideoUrls[i % sampleVideoUrls.length];
      const thumbnailUrl = sampleThumbnailUrls[i % sampleThumbnailUrls.length];
      
      console.log(`📹 Processing video ${i + 1}/${videoSamples.length}: ${videoData.title}`);
      
      // Prepare database record with direct URLs
      videosToInsert.push({
        id: crypto.randomUUID(),
        creator_id: videoData.creator_id,
        caption: videoData.title,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        creator_name: videoData.creator_name,
        views: videoData.views,
        likes_count: videoData.likes_count,
        comments_count: videoData.comments_count,
        is_premium: videoData.is_premium,
        unlock_cost: videoData.unlock_cost,
        created_at: new Date().toISOString()
      });
      
      console.log(`✅ Prepared: ${videoData.title}`);
    }
    
    // Clear existing videos first
    console.log(`\n💾 Clearing existing videos...`);
    const { error: deleteError } = await supabase
      .from('creator_videos')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.warn('⚠️ Warning: Could not clear existing videos:', deleteError);
    }
    
    // Insert new videos
    console.log(`💾 Inserting ${videosToInsert.length} videos into creator_videos table...`);
    const { error: insertError } = await supabase
      .from('creator_videos')
      .insert(videosToInsert);
    
    if (insertError) {
      throw insertError;
    }
    
    console.log(`✅ Successfully inserted ${videosToInsert.length} videos`);
    
    console.log(`\n🎉 Video Seeding Complete!`);
    console.log(`📊 Total in database: ${videosToInsert.length} videos`);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedVideos();
