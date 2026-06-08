import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from './supabaseAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = supabaseAdmin;

// Sample video data with metadata
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
  }
];

// Public sample video URLs (reliable, free to use)
const sampleVideoUrls = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouBuyForAGrand.mp4'
];

// Sample thumbnail URLs (high-quality images)
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

// Download file from URL
async function downloadFile(url: string, filepath: string): Promise<void> {
  console.log(`📥 Downloading: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
  console.log(`✅ Downloaded to: ${filepath}`);
}

// Upload file to Supabase Storage
async function uploadToStorage(
  bucket: string,
  filename: string,
  filepath: string,
  contentType: string
): Promise<string> {
  console.log(`☁️ Uploading to ${bucket}/${filename}...`);
  
  const fileBuffer = fs.readFileSync(filepath);
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, fileBuffer, {
      contentType,
      upsert: true
    });
  
  if (error) {
    throw error;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filename);
  
  console.log(`✅ Uploaded: ${publicUrl}`);
  return publicUrl;
}

// Clean up temporary files
function cleanupFile(filepath: string): void {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    console.log(`🗑️ Cleaned up: ${filepath}`);
  }
}

// Main seeding function
const seedMedia = async () => {
  console.log('🎬 Starting Supabase Media Seeding...\n');
  
  const tempDir = path.join(__dirname, 'temp-media');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const videosToInsert: any[] = [];
  let successCount = 0;
  let failCount = 0;
  
  try {
    // Process each video
    for (let i = 0; i < videoSamples.length; i++) {
      const videoData = videoSamples[i];
      const videoUrl = sampleVideoUrls[i % sampleVideoUrls.length];
      const thumbnailUrl = sampleThumbnailUrls[i % sampleThumbnailUrls.length];
      
      console.log(`\n📹 Processing video ${i + 1}/${videoSamples.length}: ${videoData.title}`);
      
      const videoId = crypto.randomUUID();
      const videoFilename = `${videoId}.mp4`;
      const thumbnailFilename = `${videoId}.jpg`;
      
      const videoTempPath = path.join(tempDir, videoFilename);
      const thumbnailTempPath = path.join(tempDir, thumbnailFilename);
      
      try {
        // Download and upload video
        await downloadFile(videoUrl, videoTempPath);
        const uploadedVideoUrl = await uploadToStorage(
          'videos',
          videoFilename,
          videoTempPath,
          'video/mp4'
        );
        
        // Download and upload thumbnail
        await downloadFile(thumbnailUrl, thumbnailTempPath);
        const uploadedThumbnailUrl = await uploadToStorage(
          'thumbnails',
          thumbnailFilename,
          thumbnailTempPath,
          'image/jpeg'
        );
        
        // Prepare database record
        videosToInsert.push({
          id: videoId,
          creator_id: videoData.creator_id,
          title: videoData.title,
          video_url: uploadedVideoUrl,
          thumbnail_url: uploadedThumbnailUrl,
          creator_name: videoData.creator_name,
          views: videoData.views,
          likes_count: videoData.likes_count,
          comments_count: videoData.comments_count,
          is_premium: videoData.is_premium,
          unlock_cost: videoData.unlock_cost,
          created_at: new Date().toISOString()
        });
        
        successCount++;
        console.log(`✅ Successfully processed: ${videoData.title}`);
        
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to process ${videoData.title}:`, error);
      } finally {
        // Cleanup temporary files
        cleanupFile(videoTempPath);
        cleanupFile(thumbnailTempPath);
      }
    }
    
    // Insert all videos into database
    if (videosToInsert.length > 0) {
      console.log(`\n💾 Inserting ${videosToInsert.length} videos into creator_videos table...`);
      
      // Clear existing videos first
      const { error: deleteError } = await supabase
        .from('creator_videos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (deleteError) {
        console.warn('⚠️ Warning: Could not clear existing videos:', deleteError);
      }
      
      // Insert new videos
      const { error: insertError } = await supabase
        .from('creator_videos')
        .insert(videosToInsert);
      
      if (insertError) {
        throw insertError;
      }
      
      console.log(`✅ Successfully inserted ${videosToInsert.length} videos`);
    }
    
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`🗑️ Cleaned up temp directory`);
    }
    
    console.log(`\n🎉 Media Seeding Complete!`);
    console.log(`✅ Success: ${successCount} videos`);
    console.log(`❌ Failed: ${failCount} videos`);
    console.log(`📊 Total in database: ${videosToInsert.length} videos`);
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedMedia();
