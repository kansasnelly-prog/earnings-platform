// Vercel Serverless Function for Sending Customer Service Messages
// This receives messages from the website form and sends to Telegram
// Falls back to in-memory storage if database is unavailable
// Version: 2.2 - Improved Supabase error handling and logging

import { createClient } from '@supabase/supabase-js';

// In-memory storage for when database is unavailable
const conversationStore = new Map();

export default async function handler(req, res) {
  // Get environment variables from request.env (for Vite plugin) or process.env (for Vercel)
  const env = req?.env || process.env;
  
  const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
  const TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID || 'YOUR_TELEGRAM_CHAT_ID';
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📩 API: Starting message processing...');
  console.log('📩 API: Using env source:', req?.env ? 'req.env (Vite plugin)' : 'process.env (Vercel)');
  console.log('📩 API: Supabase URL exists:', !!supabaseUrl);
  console.log('📩 API: Supabase Service Key exists:', !!supabaseServiceKey);
  console.log('📩 API: Supabase URL value:', supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'undefined');
  console.log('📩 API: Supabase Service Key length:', supabaseServiceKey ? supabaseServiceKey.length : 0);

  try {
    const { name, phone, message, userId, username } = req.body;
    
    console.log('📩 API: Received message request:', { name, phone, messageLength: message?.length, userId, username });

    // Validate required fields
    if (!name || !message) {
      console.error('❌ API: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: name and message are required' });
    }

    // Generate a unique user ID if not provided (use UUID for Supabase compatibility)
    const finalUserId = userId || crypto.randomUUID();
    const finalUsername = username || name || 'Guest User';

    let conversationId;
    let useDatabase = false;

    // Try to use Supabase if configured
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        console.log('🔍 API: Checking for existing open conversation for user:', finalUserId);

        // Step 1: Find existing open conversation for this user
        const { data: existingConvs, error: findError } = await supabase
          .from('customer_conversations')
          .select('*')
          .eq('user_id', finalUserId)
          .eq('status', 'open')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (findError) {
          console.error('❌ API: Database FIND error:', findError.message, findError.details, findError.hint);
        } else if (existingConvs && existingConvs.length > 0) {
          conversationId = existingConvs[0].id;
          useDatabase = true;
          console.log('✅ API: Found existing conversation:', conversationId);
        } else {
          console.log('🔍 API: No existing conversation found, creating new one...');
          
          // Create new conversation in database
          const { data: newConv, error: createError } = await supabase
            .from('customer_conversations')
            .insert({
              user_id: finalUserId,
              status: 'open',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ API: Database CREATE error:', createError.message, createError.details, createError.hint);
          } else if (newConv) {
            conversationId = newConv.id;
            useDatabase = true;
            console.log('✅ API: Created new conversation:', conversationId);
          }
        }

        // Save message to database if we have a conversation
        if (useDatabase && conversationId) {
          console.log('💾 API: Saving message to database...');
          const { error: msgError } = await supabase
            .from('customer_messages')
            .insert({
              conversation_id: conversationId,
              user_id: finalUserId,
              content: message,
              created_at: new Date().toISOString()
            });

          if (msgError) {
            console.error('❌ API: Database INSERT error:', msgError.message, msgError.details, msgError.hint);
            useDatabase = false;
          } else {
            // Update conversation timestamp
            await supabase
              .from('customer_conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', conversationId);
            console.log('✅ API: Message saved to database successfully');
            
            // Send Telegram notification ONLY after successful DB insert
            console.log('📤 API: Sending notification to Telegram (DB save successful)');
            console.log('📤 API: Telegram token source:', env.TELEGRAM_BOT_TOKEN ? 'env' : 'fallback');
            console.log('📤 API: Telegram token length:', TELEGRAM_BOT_TOKEN ? TELEGRAM_BOT_TOKEN.length : 0);
            
            try {
              const telegramMessage = `🆕 NEW CUSTOMER MESSAGE\n\n👤 Name: ${name}\n📞 Phone: ${phone || 'Not provided'}\n🆔 User ID: ${finalUserId}\n💬 Message:\n${message}\n\n📝 Conversation ID: ${conversationId}\n📊 Storage: Database`;

              // Call Supabase Edge Function instead of direct Telegram API
              const supabase = createClient(supabaseUrl, supabaseServiceKey);
              const { data, error } = await supabase.functions.invoke('telegram-bot', {
                body: { message: telegramMessage }
              });

              if (error) {
                console.error('❌ API: Telegram notification via Edge Function failed:', error);
                // Add a specific check for 404 Not Found
                if (error.message.includes('404')) {
                  console.warn('❌ API: Telegram Edge Function not found. Please ensure the function is deployed and the name is correct.');
                }
              } else {
                console.log('✅ API: Telegram notification sent successfully via Edge Function');
              }
            } catch (telegramError) {
              console.error('❌ API: Error sending to Telegram:', telegramError);
            }
          }
        }
      } catch (dbError) {
        console.error('❌ API: Database connection error:', dbError.message, dbError.stack);
        useDatabase = false;
      }
    } else {
      console.log('⚠️ API: Supabase not configured');
    }

    // Fallback to in-memory storage if database didn't work
    if (!conversationId) {
      console.log('💾 API: Using in-memory storage as fallback');
      // Check for existing conversation in memory
      const existingConv = conversationStore.get(finalUserId);
      if (existingConv && existingConv.status === 'open') {
        conversationId = existingConv.id;
        existingConv.messages.push({
          id: crypto.randomUUID(),
          sender_role: 'customer',
          message: message,
          source: 'website',
          created_at: new Date().toISOString()
        });
        existingConv.updated_at = new Date().toISOString();
        console.log('💾 API: Message saved to in-memory conversation:', conversationId);
      } else {
        // Create new in-memory conversation
        conversationId = crypto.randomUUID();
        conversationStore.set(finalUserId, {
          id: conversationId,
          user_id: finalUserId,
          username: finalUsername,
          phone: phone || null,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: [{
            id: crypto.randomUUID(),
            sender_role: 'customer',
            message: message,
            source: 'website',
            created_at: new Date().toISOString()
          }]
        });
        console.log('✅ API: Created in-memory conversation:', conversationId);
      }
    }

    console.log('✅ API: Message processed successfully - Database:', useDatabase);
    
    // Return success with storage info
    return res.status(200).json({ 
      success: true, 
      conversation_id: conversationId,
      user_id: finalUserId,
      storage: useDatabase ? 'database' : 'in-memory',
      message: 'Message sent successfully - Our team will reply via Telegram at @EARNINGSLLCONLINECS1',
      version: '2.2'
    });

  } catch (error) {
    console.error('❌ API: Unhandled error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
