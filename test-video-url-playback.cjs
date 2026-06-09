const https = require('https');
const http = require('http');

const testUrl = 'https://ybxshqzwirqfybdeukvq.supabase.co/storage/v1/object/public/videos/comedy_funny_3.mp4';

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      console.log(`Testing URL: ${url}`);
      console.log(`Status Code: ${response.statusCode}`);
      console.log(`Content-Type: ${response.headers['content-type']}`);
      console.log(`Content-Length: ${response.headers['content-length']} bytes`);
      
      if (response.statusCode === 200) {
        console.log('✅ URL is accessible');
        resolve({ success: true, statusCode: response.statusCode, contentType: response.headers['content-type'], contentLength: response.headers['content-length'] });
      } else {
        console.log('❌ URL returned error status');
        resolve({ success: false, statusCode: response.statusCode });
      }
    }).on('error', (err) => {
      console.error(`❌ Error accessing URL:`, err.message);
      resolve({ success: false, error: err.message });
    });
  });
}

async function testVideoPlayback() {
  console.log('=== TESTING VIDEO URL PLAYBACK ===\n');
  
  const result = await checkUrl(testUrl);
  
  console.log('\n=== TEST RESULT ===');
  if (result.success) {
    console.log('✅ Video URL is accessible and should play');
    console.log(`   Size: ${(result.contentLength / 1024).toFixed(2)} KB`);
  } else {
    console.log('❌ Video URL is not accessible');
  }
}

testVideoPlayback();
