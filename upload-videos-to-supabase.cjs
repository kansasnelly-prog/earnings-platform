const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieHNocXp3aXJxZnliZGV1a3ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg3ODY0OSwiZXhwIjoyMDkxNDU0NjQ5fQ.daPlsuIP65-C7Ld-CzZusssO-yGrd9IECQsPFzTCJyM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureBucketExists() {
  console.log('=== CHECKING VIDEOS BUCKET ===\n');
  
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error listing buckets:', error);
    return false;
  }
  
  const videosBucket = buckets.find(b => b.name === 'videos');
  
  if (!videosBucket) {
    console.log('Creating "videos" bucket...');
    const { error: createError } = await supabase.storage.createBucket('videos', {
      public: true,
      fileSizeLimit: 104857600 // 100MB
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      return false;
    }
    
    console.log('✅ Videos bucket created');
  } else {
    console.log('✅ Videos bucket already exists');
  }
  
  return true;
}

async function uploadVideo(filePath, fileName) {
  console.log(`Uploading: ${fileName}`);
  
  const fileBuffer = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(fileName, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true
    });
  
  if (error) {
    console.error(`❌ Error uploading ${fileName}:`, error);
    return null;
  }
  
  console.log(`✅ Uploaded: ${fileName}`);
  
  const { data: publicUrlData } = supabase.storage
    .from('videos')
    .getPublicUrl(fileName);
  
  return publicUrlData.publicUrl;
}

async function uploadVideosFromDirectory(directory) {
  console.log(`\n=== UPLOADING VIDEOS FROM ${directory} ===\n`);
  
  const files = fs.readdirSync(directory);
  const videoFiles = files.filter(f => f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mov'));
  
  console.log(`Found ${videoFiles.length} video files`);
  
  const uploadedUrls = [];
  
  for (const file of videoFiles) {
    const filePath = path.join(directory, file);
    const publicUrl = await uploadVideo(filePath, file);
    
    if (publicUrl) {
      uploadedUrls.push({
        fileName: file,
        url: publicUrl
      });
    }
  }
  
  return uploadedUrls;
}

async function main() {
  const bucketExists = await ensureBucketExists();
  
  if (!bucketExists) {
    console.error('Failed to ensure bucket exists');
    return;
  }
  
  const contentDir = path.join(__dirname, 'content');
  const categories = ['Khmer', 'Nigeria', 'Comedy', 'Lifestyle', 'Dating', 'Motivation', 'Travel'];
  
  const allUploadedUrls = [];
  
  for (const category of categories) {
    const categoryDir = path.join(contentDir, category);
    
    if (fs.existsSync(categoryDir)) {
      const urls = await uploadVideosFromDirectory(categoryDir);
      allUploadedUrls.push(...urls);
    }
  }
  
  console.log('\n=== UPLOAD SUMMARY ===');
  console.log(`Total videos uploaded: ${allUploadedUrls.length}`);
  
  if (allUploadedUrls.length > 0) {
    console.log('\n=== UPLOADED VIDEOS ===');
    allUploadedUrls.forEach(({ fileName, url }) => {
      console.log(`${fileName}: ${url}`);
    });
    
    // Save URLs to file for reference
    fs.writeFileSync(
      path.join(__dirname, 'uploaded-video-urls.json'),
      JSON.stringify(allUploadedUrls, null, 2)
    );
    console.log('\n✅ URLs saved to uploaded-video-urls.json');
  }
}

main();
