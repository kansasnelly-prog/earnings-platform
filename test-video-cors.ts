async function testVideoCORS() {
  console.log('🔍 Testing Video CORS and Playability\n');

  const testUrls = [
    'https://www.w3schools.com/html/mov_bbb.mp4',
    'https://www.w3schools.com/html/movie.mp4'
  ];

  for (const url of testUrls) {
    console.log(`Testing: ${url}`);
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`  Status: ${response.status} ${response.statusText}`);
      console.log(`  Content-Type: ${response.headers.get('content-type')}`);
      console.log(`  Content-Length: ${response.headers.get('content-length')}`);
      console.log(`  CORS Headers: ${response.headers.get('access-control-allow-origin') || 'None'}`);
      
      // Try to fetch as video
      const videoResponse = await fetch(url);
      const blob = await videoResponse.blob();
      console.log(`  Blob Type: ${blob.type}`);
      console.log(`  Blob Size: ${blob.size} bytes`);
      
      // Create video element to test playability
      const video = document.createElement('video');
      video.src = url;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          console.log(`  ✅ Video metadata loaded successfully`);
          console.log(`  Duration: ${video.duration}s`);
          console.log(`  Dimensions: ${video.videoWidth}x${video.videoHeight}`);
          resolve(true);
        };
        video.onerror = (e) => {
          console.log(`  ❌ Video error: ${e}`);
          resolve(false);
        };
        setTimeout(() => resolve(false), 5000);
      });
      
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }
    console.log('');
  }
}

testVideoCORS();
