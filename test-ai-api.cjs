// Test script for AI suggestions API
const http = require('http');

const testData = {
  message: "I completed 35/35 tasks, what do I do next?",
  conversationHistory: []
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/api/generate-ai-suggestions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(postData);
req.end();
