#!/usr/bin/env node
/**
 * Telegram Webhook Setup Script
 * Run this after deploying to set up the Telegram webhook
 * 
 * Usage: node setup-telegram-webhook.cjs <your-bot-token> <your-webhook-url>
 * Example: node setup-telegram-webhook.cjs 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11 https://www.earnings.ink/api/webhook
 */

const https = require('https');

// Get arguments
const botToken = process.argv[2];
const webhookUrl = process.argv[3];

if (!botToken || !webhookUrl) {
  console.log('❌ Missing arguments!');
  console.log('');
  console.log('Usage: node setup-telegram-webhook.cjs <bot-token> <webhook-url>');
  console.log('');
  console.log('Example:');
    console.log('  node setup-telegram-webhook.cjs 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11 https://www.earnings.ink/api/webhook');
  console.log('');
  process.exit(1);
}

console.log('🔧 Setting up Telegram Webhook...');
console.log(`   Bot Token: ${botToken.substring(0, 20)}...`);
console.log(`   Webhook URL: ${webhookUrl}`);
console.log('');

// First, delete any existing webhook
function deleteWebhook() {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.ok) {
            console.log('✅ Existing webhook deleted');
            resolve();
          } else {
            console.log('⚠️ No existing webhook or error:', result.description);
            resolve(); // Continue anyway
          }
        } catch (e) {
          resolve();
        }
      });
    }).on('error', (err) => {
      console.log('⚠️ Error deleting webhook:', err.message);
      resolve(); // Continue anyway
    });
  });
}

// Set new webhook
function setWebhook() {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const postData = JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'edited_message']
    });
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.ok) {
            console.log('✅ Webhook set successfully!');
            console.log('');
            console.log('📋 Webhook Info:');
            console.log(`   URL: ${webhookUrl}`);
            console.log(`   Has Custom Certificate: ${result.result.has_custom_certificate ? 'Yes' : 'No'}`);
            console.log(`   Pending Update Count: ${result.result.pending_update_count}`);
            console.log(`   Max Connections: ${result.result.max_connections || 40}`);
            resolve();
          } else {
            console.error('❌ Failed to set webhook:', result.description);
            reject(new Error(result.description));
          }
        } catch (e) {
          console.error('❌ Error parsing response:', e.message);
          reject(e);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ Request error:', err.message);
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

// Get webhook info
function getWebhookInfo() {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.ok) {
            console.log('');
            console.log('📊 Current Webhook Status:');
            console.log(`   URL: ${result.result.url || 'Not set'}`);
            console.log(`   Has Custom Certificate: ${result.result.has_custom_certificate ? 'Yes' : 'No'}`);
            console.log(`   Pending Updates: ${result.result.pending_update_count}`);
            console.log(`   Last Error Date: ${result.result.last_error_date ? new Date(result.result.last_error_date * 1000).toISOString() : 'None'}`);
            console.log(`   Last Error Message: ${result.result.last_error_message || 'None'}`);
            console.log(`   Max Connections: ${result.result.max_connections || 40}`);
            console.log(`   IP Address: ${result.result.ip_address || 'Unknown'}`);
          } else {
            console.error('❌ Failed to get webhook info:', result.description);
          }
          resolve();
        } catch (e) {
          console.error('❌ Error parsing response:', e.message);
          resolve();
        }
      });
    }).on('error', (err) => {
      console.error('❌ Request error:', err.message);
      resolve();
    });
  });
}

// Main execution
async function main() {
  try {
    await deleteWebhook();
    await setWebhook();
    await getWebhookInfo();
    
    console.log('');
    console.log('🎉 Webhook setup complete!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Make sure your Supabase database has the telegram_chat_mappings table');
    console.log('   2. Set SUPABASE_SERVICE_ROLE_KEY in your Vercel environment variables');
    console.log('   3. Test by sending a message from your app to Telegram');
    console.log('   4. Reply from Telegram - it should appear in your app within 3 seconds');
    console.log('');
    console.log('🔧 Testing Commands:');
    console.log(`   Check webhook: curl https://api.telegram.org/bot${botToken.substring(0, 20)}.../getWebhookInfo`);
    console.log(`   Send test message: curl -X POST "https://api.telegram.org/bot${botToken.substring(0, 20)}.../sendMessage" -d "chat_id=YOUR_CHAT_ID&text=Test"`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
