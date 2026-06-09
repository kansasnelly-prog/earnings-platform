const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Categories and video files
const categories = ['Comedy', 'Dating', 'Khmer', 'Lifestyle', 'Motivation', 'Nigeria', 'Travel'];

const videoFiles = [
  'comedy_funny_3.mp4',
  'comedy_sketch_1.mp4',
  'comedy_sketch_2.mp4',
  'dating_couple_1.mp4',
  'dating_couple_2.mp4',
  'khmer_dance_1.mp4',
  'khmer_dance_2.mp4',
  'khmer_culture_3.mp4',
  'lifestyle_vlog_1.mp4',
  'lifestyle_vlog_2.mp4',
  'lifestyle_daily_3.mp4',
  'motivation_speech_1.mp4',
  'motivation_speech_2.mp4',
  'motivation_fitness_3.mp4',
  'nigeria_music_1.mp4',
  'nigeria_music_2.mp4',
  'nigeria_dance_3.mp4',
  'travel_adventure_1.mp4',
  'travel_adventure_2.mp4',
  'travel_nature_3.mp4'
];

// Map filenames to categories
const fileToCategory = {
  'comedy_funny_3.mp4': 'Comedy',
  'comedy_sketch_1.mp4': 'Comedy',
  'comedy_sketch_2.mp4': 'Comedy',
  'dating_couple_1.mp4': 'Dating',
  'dating_couple_2.mp4': 'Dating',
  'khmer_dance_1.mp4': 'Khmer',
  'khmer_dance_2.mp4': 'Khmer',
  'khmer_culture_3.mp4': 'Khmer',
  'lifestyle_vlog_1.mp4': 'Lifestyle',
  'lifestyle_vlog_2.mp4': 'Lifestyle',
  'lifestyle_daily_3.mp4': 'Lifestyle',
  'motivation_speech_1.mp4': 'Motivation',
  'motivation_speech_2.mp4': 'Motivation',
  'motivation_fitness_3.mp4': 'Motivation',
  'nigeria_music_1.mp4': 'Nigeria',
  'nigeria_music_2.mp4': 'Nigeria',
  'nigeria_dance_3.mp4': 'Nigeria',
  'travel_adventure_1.mp4': 'Travel',
  'travel_adventure_2.mp4': 'Travel',
  'travel_nature_3.mp4': 'Travel'
};

async function generateVideos() {
  console.log('=== GENERATING TEST MP4 VIDEOS ===\n');
  
  const contentDir = path.join(__dirname, 'content');
  
  // Check if FFmpeg is available
  let ffmpegAvailable = false;
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    ffmpegAvailable = true;
    console.log('✅ FFmpeg is available\n');
  } catch (error) {
    console.log('⚠️  FFmpeg not found, will use alternative method\n');
  }
  
  for (const filename of videoFiles) {
    const category = fileToCategory[filename];
    const categoryDir = path.join(contentDir, category);
    const filepath = path.join(categoryDir, filename);
    
    // Ensure category directory exists
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    console.log(`Generating ${filename} for ${category}/`);
    
    try {
      if (ffmpegAvailable) {
        // Use FFmpeg to generate a simple test video
        const command = `ffmpeg -f lavfi -i testsrc=size=640x480:duration=5:rate=30 -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -movflags +faststart "${filepath}" -y`;
        execSync(command, { stdio: 'ignore' });
      } else {
        // Alternative: create a minimal valid MP4 structure
        // This is a basic MP4 file with minimal structure
        const minimalMP4 = Buffer.from([
          // FTYP box
          0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D,
          0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
          0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31,
          // MOOV box (simplified)
          0x00, 0x00, 0x00, 0x08, 0x6D, 0x6F, 0x6F, 0x76
        ]);
        
        // Add some padding to make it larger
        const padding = Buffer.alloc(1024 * 100); // 100KB
        fs.writeFileSync(filepath, Buffer.concat([minimalMP4, padding]));
      }
      
      const stats = fs.statSync(filepath);
      const sizeKB = stats.size / 1024;
      console.log(`✅ Generated: ${filename} (${sizeKB.toFixed(2)} KB)`);
      
    } catch (error) {
      console.error(`❌ Failed to generate ${filename}:`, error.message);
    }
  }
  
  console.log('\n=== GENERATION COMPLETE ===');
}

generateVideos();
