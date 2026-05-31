import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Validate environment variables at module load
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client only if credentials exist
let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function GET() {
  // Check credentials on GET too for health checks
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials");
    return NextResponse.json(
      { error: "Missing Supabase credentials" },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ 
    message: "Webhook is live",
    supabaseConnected: !!supabase 
  });
}

export async function POST(req: Request) {
  try {
    // Validate environment variables at request time
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase credentials");
      console.error("VITE_SUPABASE_URL:", supabaseUrl ? "Set" : "Missing");
      console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "Set" : "Missing");
      return NextResponse.json(
        { error: "Missing Supabase credentials" },
        { status: 500 }
      );
    }

    // Ensure supabase client is initialized
    if (!supabase) {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }

    const body = await req.json();

    console.log("🔥 TELEGRAM WEBHOOK POST RECEIVED");
    console.log("📦 TELEGRAM BODY:", JSON.stringify(body, null, 2));

    // Extract chat_id, text, and sender info from incoming message
    const chatId = body.message?.chat?.id?.toString();
    const text = body.message?.text;
    const senderName = body.message?.from?.first_name || body.message?.from?.username || "Unknown";

    if (chatId && text) {
      console.log("TELEGRAM MESSAGE FROM:", senderName, "Chat ID:", chatId);

      // Find conversation by telegram_chat_id
      const { data: conversations, error: convError } = await supabase
        .from("customer_conversations")
        .select("*")
        .eq("telegram_chat_id", chatId);

      if (convError) {
        console.error("Error finding conversation:", convError);
      }

      let conversationId: string | null = null;

      if (conversations && conversations.length > 0) {
        conversationId = conversations[0].id;
        console.log("✅ Found existing conversation:", conversationId);
      } else {
        // Create new conversation if not found
        console.log("Creating new conversation for chat:", chatId);
        const { data: newConv, error: createError } = await supabase
          .from("customer_conversations")
          .insert({
            user_id: "telegram_user", // Placeholder, will be updated when linked
            username: senderName,
            telegram_chat_id: chatId,
            status: "open"
          })
          .select()
          .single();

        if (!createError && newConv) {
          conversationId = newConv.id;
          console.log("✅ Created new conversation:", conversationId);
        } else {
          console.error("Error creating conversation:", createError);
        }
      }

      // Save Telegram message to customer_messages
      if (conversationId) {
        const { error: msgError } = await supabase
          .from("customer_messages")
          .insert({
            conversation_id: conversationId,
            sender_role: "telegram_admin",
            message: text,
            source: "telegram"
          });

        if (msgError) {
          console.error("Error saving Telegram message:", msgError);
        } else {
          console.log("✅ TELEGRAM REPLY SAVED to conversation:", conversationId);
        }
      }

      // Send auto-reply back to user
      const botToken = process.env.TELEGRAM_BOT_TOKEN || "8513756424:AAGvKY6eJK8ANfqC2S-5z0LlXM-YDRGbmaA";
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: `WELCOME DEAR VALID CUSTOMER\n\nWe received your message: "${text}"\n\nCustomer service will assist you shortly.`,
        }),
      });

      console.log("✅ Auto-reply sent to chat:", chatId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ TELEGRAM ERROR:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
