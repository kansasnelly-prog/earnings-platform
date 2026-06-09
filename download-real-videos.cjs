const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Use sample videos from sample-videos.com (free, no auth required)
const sampleVideos = [
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    filename: 'comedy_funny_3.mp4',
    category: 'Comedy'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    filename: 'comedy_sketch_1.mp4',
    category: 'Comedy'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    filename: 'comedy_sketch_2.mp4',
    category: 'Comedy'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    filename: 'dating_couple_1.mp4',
    category: 'Dating'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    filename: 'dating_couple_2.mp4',
    category: 'Dating'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    filename: 'khmer_dance_1.mp4',
    category: 'Khmer'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    filename: 'khmer_dance_2.mp4',
    category: 'Khmer'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    filename: 'khmer_culture_3.mp4',
    category: 'Khmer'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    filename: 'lifestyle_vlog_1.mp4',
    category: 'Lifestyle'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    filename: 'lifestyle_vlog_2.mp4',
    category: 'Lifestyle'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    filename: 'lifestyle_daily_3.mp4',
    category: 'Lifestyle'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    filename: 'motivation_speech_1.mp4',
    category: 'Motivation'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouBuyForAGrand.mp4',
    filename: 'motivation_speech_2.mp4',
    category: 'Motivation'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    filename: 'motivation_fitness_3.mp4',
    category: 'Motivation'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    filename: 'nigeria_music_1.mp4',
    category: 'Nigeria'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    filename: 'nigeria_music_2.mp4',
    category: 'Nigeria'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    filename: 'nigeria_dance_3.mp4',
    category: 'Nigeria'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    filename: 'travel_adventure_1.mp4',
    category: 'Travel'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    filename: 'travel_adventure_2.mp4',
    category: 'Travel'
  },
  {
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    filename: 'travel_nature_3.mp4',
    category: 'Travel'
  }
];

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlink(filepath, () => {});
        downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(filepath, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function downloadVideos() {
  console.log('=== DOWNLOADING REAL VIDEOS FROM GOOGLE SAMPLE VIDEOS ===\n');
  
  const contentDir = path.join(__dirname, 'content');
  
  for (const video of sampleVideos) {
    const categoryDir = path.join(contentDir, video.category);
    
    // Ensure category directory exists
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    const filepath = path.join(categoryDir, video.filename);
    
    console.log(`Downloading ${video.filename} to ${video.category}/`);
    
    try {
      await downloadFile(video.url, filepath);
      
      // Verify file size
      const stats = fs.statSync(filepath);
      const sizeKB = stats.size / 1024;
      
      if (stats.size < 1000) {
        console.error(`❌ Downloaded file too small (${sizeKB.toFixed(2)} KB): ${video.filename}`);
        fs.unlinkSync(filepath);
      } else {
        console.log(`✅ Downloaded: ${video.filename} (${sizeKB.toFixed(2)} KB)`);
      }
    } catch (error) {
      console.error(`❌ Failed to download ${video.filename}:`, error.message);
    }
  }
  
  console.log('\n=== DOWNLOAD COMPLETE ===');
}

downloadVideos();
