const https = require('https');
const fs = require('fs');
const path = require('path');

// Free sample videos from Pexels (public domain/CC0)
const sampleVideos = [
  {
    url: 'https://videos.pexels.com/video-files/4763826/4763826-sd_540_960_24fps.mp4',
    category: 'Khmer',
    filename: 'khmer_dance_1.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/4763826/4763826-sd_540_960_24fps.mp4',
    category: 'Khmer',
    filename: 'khmer_dance_2.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/3205917/3205917-sd_540_960_25fps.mp4',
    category: 'Nigeria',
    filename: 'nigeria_music_1.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/3205917/3205917-sd_540_960_25fps.mp4',
    category: 'Nigeria',
    filename: 'nigeria_music_2.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/5752729/5752729-sd_540_960_25fps.mp4',
    category: 'Comedy',
    filename: 'comedy_sketch_1.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/5752729/5752729-sd_540_960_25fps.mp4',
    category: 'Comedy',
    filename: 'comedy_sketch_2.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/3252928/3252928-sd_540_960_24fps.mp4',
    category: 'Lifestyle',
    filename: 'lifestyle_vlog_1.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/3252928/3252928-sd_540_960_24fps.mp4',
    category: 'Lifestyle',
    filename: 'lifestyle_vlog_2.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/4123445/4123445-sd_540_960_24fps.mp4',
    category: 'Dating',
    filename: 'dating_couple_1.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/4123445/4123445-sd_540_960_24fps.mp4',
    category: 'Dating',
    filename: 'dating_couple_2.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/3168726/3168726-sd_540_960_25fps.mp4',
    category: 'Motivation',
    filename: 'motivation_speech_1.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/3168726/3168726-sd_540_960_25fps.mp4',
    category: 'Motivation',
    filename: 'motivation_speech_2.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/3209828/3209828-sd_540_960_25fps.mp4',
    category: 'Travel',
    filename: 'travel_adventure_1.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/3209828/3209828-sd_540_960_25fps.mp4',
    category: 'Travel',
    filename: 'travel_adventure_2.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/2869545/2869545-sd_540_960_24fps.mp4',
    category: 'Khmer',
    filename: 'khmer_culture_3.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/2869545/2869545-sd_540_960_24fps.mp4',
    category: 'Nigeria',
    filename: 'nigeria_dance_3.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/2759477/2759477-sd_540_960_25fps.mp4',
    category: 'Comedy',
    filename: 'comedy_funny_3.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/2759477/2759477-sd_540_960_25fps.mp4',
    category: 'Lifestyle',
    filename: 'lifestyle_daily_3.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/2880209/2880209-sd_540_960_24fps.mp4',
    category: 'Motivation',
    filename: 'motivation_fitness_3.mp4'
  },
  {
    url: 'https://videos.pexels.com/video-files/2880209/2880209-sd_540_960_24fps.mp4',
    category: 'Travel',
    filename: 'travel_nature_3.mp4'
  }
];

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', (err) => {
          fs.unlink(filepath, () => {});
          reject(err);
        });
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function downloadVideos() {
  console.log('=== DOWNLOADING SAMPLE VIDEOS ===\n');
  
  const contentDir = path.join(__dirname, 'content');
  
  for (const video of sampleVideos) {
    const categoryDir = path.join(contentDir, video.category);
    const filepath = path.join(categoryDir, video.filename);
    
    console.log(`Downloading ${video.filename} to ${video.category}/`);
    
    try {
      await downloadFile(video.url, filepath);
      console.log(`✅ Downloaded: ${video.filename}`);
    } catch (error) {
      console.error(`❌ Failed to download ${video.filename}:`, error.message);
    }
  }
  
  console.log('\n=== DOWNLOAD COMPLETE ===');
}

downloadVideos();
