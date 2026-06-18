// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

// Define types for Deno environment
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Response dictionary
const AUTO_RESPONSES: Record<string, string> = {
  '/start': 'Welcome to the Online Customer Optimize Tasks Bot! How can I assist you today?',
  'help': 'I can help you with task optimization, balance inquiries, or connecting you to an admin. Please type your query.',
  'balance': 'To check your balance, please log in to your dashboard at earnings.ink.',
  'admin': 'I have notified the admin about your request. Someone will be with you shortly.'
};

async function sendTelegramResponse(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

serve(async (req: Request) => {
  if (req.method === 'POST') {
    try {
      const update = await req.json();
      const message = update.message;
      if (!message || !message.text) return new Response('ok', { status: 200 });

      const chatId = message.chat.id;
      const text = message.text.toLowerCase();
      const userId = message.from.id.toString();

      // Ensure conversation exists
      let { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'open')
        .single();

      if (!conversation) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            status: 'open',
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();
        conversation = newConv;
      }

      // Save message to database (messages table)
      await supabase.from('messages').insert({
        conversation_id: conversation!.id,
        sender: 'user',
        message: message.text,
        created_at: new Date().toISOString()
      });

      // Auto-response
      let responseText = AUTO_RESPONSES[text] || 'I have received your message and forwarded it to our team.';
      
      // If admin keyword, try to route
      if (text.includes('admin')) {
         responseText = AUTO_RESPONSES['admin'];
      }

      await sendTelegramResponse(chatId, responseText);
      
      // Save admin response to database
      await supabase.from('messages').insert({
        conversation_id: conversation!.id,
        sender: 'admin',
        message: responseText,
        created_at: new Date().toISOString()
      });
      
      return new Response('ok', { status: 200 });
    } catch (error) {
      console.error('Webhook error:', error);
      return new Response('error', { status: 500 });
    }
  }
  return new Response('ok', { status: 200 });
});
