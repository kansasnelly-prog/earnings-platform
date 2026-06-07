import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seedVideos = async () => {
  console.log('🎬 Seeding creator videos...');

  const videos = [
    {
      id: crypto.randomUUID(),
      creator_id: 'srey_sna_vip',
      title: 'Exploring Phnom Penh Skybars 🥂',
      video_url: 'https://mixkit.co',
      thumbnail_url: 'https://unsplash.com',
      creator_name: 'Srey_Sna_VIP',
      views: 1240,
      likes_count: 432,
      comments_count: 89,
      is_premium: false,
      unlock_cost: 0,
      created_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      creator_id: 'chheng_tiktok_queen',
      title: 'Exclusive Weekend Private Fashion Show 🔒',
      video_url: 'https://mixkit.co',
      thumbnail_url: 'https://unsplash.com',
      creator_name: 'Chheng_TikTok_Queen',
      views: 982,
      likes_count: 741,
      comments_count: 156,
      is_premium: true,
      unlock_cost: 2,
      created_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      creator_id: 'chioma_lagos_vibes',
      title: 'Lagos High-Vibe Energy Check 🇳🇬🔥',
      video_url: 'https://mixkit.co',
      thumbnail_url: 'https://unsplash.com',
      creator_name: 'Chioma_Lagos_Vibes',
      views: 2435,
      likes_count: 1102,
      comments_count: 234,
      is_premium: false,
      unlock_cost: 0,
      created_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      creator_id: 'nelly_premium_club',
      title: 'Private Midnight VIP Lounge Lounge 💎',
      video_url: 'https://mixkit.co',
      thumbnail_url: 'https://unsplash.com',
      creator_name: 'Nelly_Premium_Club',
      views: 562,
      likes_count: 231,
      comments_count: 67,
      is_premium: true,
      unlock_cost: 2,
      created_at: new Date().toISOString()
    }
  ];

  try {
    for (const video of videos) {
      const { error } = await supabase
        .from('creator_videos')
        .insert(video);

      if (error) {
        console.error(`❌ Error inserting video "${video.title}":`, error);
        throw error;
      }

      console.log(`✅ Inserted: ${video.title}`);
    }

    console.log('\n🎉 All videos seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedVideos();
