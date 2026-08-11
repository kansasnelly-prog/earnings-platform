import { calculateAndAwardCredits } from '../../src/services/creditService';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = "kansasnelly@gmail.com";

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { action, userId, amount, reason, adminPassword, priceId, userWalletAddress } = req.body;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  switch (action) {
    case 'trackActivity':
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      try {
        await calculateAndAwardCredits(userId);
        return res.status(200).json({ message: 'Activity tracked and credits awarded' });
      } catch (error) {
        console.error('Error in trackActivity action:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }

    case 'adminUpdateBalance':
      try {
        const adminPasswordEnv = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_SECRET;
        if (adminPassword !== adminPasswordEnv) {
          return res.status(403).json({ error: 'Invalid admin password' });
        }

        if (!userId || !amount) {
          return res.status(400).json({ error: 'Missing required fields: userId, amount' });
        }

        if (typeof amount !== 'number' || amount <= 0) {
          return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ error: 'No auth token' });
        }

        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: userError } = await userClient.auth.getUser(authHeader.replace('Bearer ', ''));
        if (userError || !user || user.email !== ADMIN_EMAIL) {
          return res.status(403).json({ error: 'Unauthorized user or not admin' });
        }

        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('balance, email, display_name')
          .eq('id', userId)
          .single();

        if (fetchError || !userData) {
          return res.status(404).json({ error: 'User not found' });
        }

        const currentBalance = userData.balance || 0;
        let newBalance;

        if (req.body.subAction === 'add') {
          newBalance = currentBalance + amount;
        } else if (req.body.subAction === 'reduce') {
          newBalance = currentBalance - amount;
          if (newBalance < 0) {
            return res.status(400).json({ error: 'Insufficient balance. Cannot reduce below zero.' });
          }
        } else {
          return res.status(400).json({ error: 'Invalid subAction. Must be "add" or "reduce"' });
        }

        const { error: updateError } = await supabase
          .from('users')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (updateError) {
          return res.status(500).json({ error: 'Failed to update balance' });
        }

        await supabase.from('transactions').insert({
          user_id: userId,
          type: req.body.subAction === 'add' ? 'deposit' : 'withdrawal',
          amount,
          description: `Admin ${req.body.subAction === 'add' ? 'added' : 'reduced'} balance. Reason: ${reason || 'No reason provided'}`,
          status: 'completed',
          created_at: new Date().toISOString()
        });

        return res.status(200).json({ success: true, newBalance, previousBalance: currentBalance, action: req.body.subAction, amount });
      } catch (err) {
        console.error('Error in adminUpdateBalance action:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }

    case 'generateAiSuggestions':
      try {
        const { message, conversationHistory, account_type } = req.body || {};
        if (!message) {
          return res.status(400).json({ success: false, error: 'Message is required' });
        }

        let context = '';
        if (conversationHistory && conversationHistory.length > 0) {
          const recentMessages = conversationHistory.slice(-4).map(msg => {
            const role = msg.sender === 'customer' ? 'Customer' : 'Support';
            return `${role}: ${msg.message}`;
          }).join('\n');
          context = `\n\nRECENT CONVERSATION HISTORY:\n${recentMessages}`;
        }

        const systemPrompt = `You are an advanced AI Support Engineer for 'TASKS REWARD'.
- MAIN ACCOUNT RULE: Users must complete 35/35 tasks. Then they MUST contact Customer Service for a manual account reset.
- TRAINING ACCOUNT RULE: Users in training must complete 45/45 tasks before requesting a training reset.
Generate exactly 5 distinct response variations in strict JSON formatting.
CRITICAL: All response contents must be entirely in UPPERCASE LETTERS.`;

        const userPrompt = `CUSTOMER MESSAGE: ${message}${context}
Generate 5 response variations in this exact format:
{
  "suggestions": [
    {"type": "PROFESSIONAL", "content": "TEXT"},
    {"type": "EMPATHETIC", "content": "TEXT"},
    {"type": "SHORT", "content": "TEXT"},
    {"type": "DETAILED", "content": "TEXT"},
    {"type": "TECHNICAL", "content": "TEXT"}
  ]
}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);
        let ollamaResponse;

        try {
          ollamaResponse = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              stream: false,
              options: { temperature: 0.6 }
            }),
            signal: controller.signal
          });
          clearTimeout(timeout);
        } catch (err) {
          clearTimeout(timeout);
          if (err.name === 'AbortError') {
            return res.status(504).json({ success: false, error: 'Request timed out' });
          }
          return res.status(500).json({ success: false, error: 'Ollama fetch error' });
        }

        if (!ollamaResponse.ok) {
          const errText = await ollamaResponse.text();
          return res.status(500).json({ success: false, error: 'Ollama Error', details: errText });
        }

        const data = await ollamaResponse.json();
        const aiResponse = data?.message?.content;

        try {
          const jsonStart = aiResponse.indexOf('{');
          const jsonEnd = aiResponse.lastIndexOf('}') + 1;
          if (jsonStart !== -1 && jsonEnd !== -1) {
            return res.status(200).json(JSON.parse(aiResponse.substring(jsonStart, jsonEnd)));
          }
          return res.status(200).json({ text: aiResponse });
        } catch (parseError) {
          return res.status(200).json({ text: aiResponse });
        }
      } catch (globalError) {
        return res.status(500).json({ success: false, error: 'Internal server exception' });
      }

    case 'createWithdrawalRequest':
      try {
        const { userId, email, amount, walletAddress, walletType, currentBalance } = req.body;

        if (!userId || !email || !amount || !walletAddress || !walletType || currentBalance === undefined) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        if (amount <= 0) {
          return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        if (amount > currentBalance) {
          return res.status(400).json({ error: `Insufficient balance. Available: $${currentBalance.toFixed(2)}` });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ error: 'No auth token' });
        }

        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: userError } = await userClient.auth.getUser(authHeader.replace('Bearer ', ''));
        if (userError || !user || user.id !== userId) {
          return res.status(403).json({ error: 'Unauthorized user' });
        }

        const { data: existingPending } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .maybeSingle();

        if (existingPending) {
          return res.status(400).json({ error: 'You already have a pending withdrawal request. Please wait for admin approval.' });
        }

        const { data, error } = await supabase
          .from('withdrawals')
          .insert({
            user_id: userId,
            user_email: email,
            amount,
            wallet_address: walletAddress,
            wallet_type: walletType,
            status: 'pending',
            balance_snapshot: currentBalance,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        await supabase.from('transactions').insert({
          user_id: userId,
          type: 'withdrawal_request',
          amount,
          description: `Withdrawal request of $${amount.toFixed(2)} to ${walletType} wallet`,
          status: 'pending',
          metadata: { withdrawal_id: data.id, wallet_address: walletAddress, wallet_type: walletType, balance_before: currentBalance },
          created_at: new Date().toISOString()
        });

        return res.status(200).json({ success: true, withdrawalId: data.id });
      } catch (error) {
        console.error('[Withdrawal API] Exception:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
      }

    case 'createStripeSession':
      try {
        const { userId, priceId } = req.body;

        if (!userId || !priceId) {
          return res.status(400).json({ error: 'Missing required fields: userId or priceId' });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
          throw new Error('Stripe secret key is not configured');
        }

        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{ price: priceId, quantity: 1 }],
          mode: 'subscription',
          success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.origin}/cancel`,
          metadata: { userId },
        });

        return res.status(200).json({ url: session.url });
      } catch (error) {
        console.error('Error creating Stripe session:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
      }

    case 'proxyTikTok':
      try {
        const { endpoint, method = 'GET', data, headers } = req.body;

        if (!endpoint || !endpoint.startsWith('/api/v202309/')) {
          return res.status(403).json({ error: 'Forbidden endpoint' });
        }

        const axios = require('axios');
        const response = await axios({
          method,
          url: `https://tiktokglobalshop.com${endpoint}`,
          data,
          headers: {
            'x-shop-app-key': process.env.TIKTOK_SHOP_APP_KEY,
            'x-shop-access-token': process.env.TIKTOK_SHOP_ACCESS_TOKEN,
            'x-vendor-secret-stream': process.env.TIKTOK_VENDOR_SECRET_STREAM,
            'Content-Type': 'application/json',
            ...headers
          }
        });

        return res.status(200).json(response.data);
      } catch (error) {
        return res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to proxy request' });
      }

    default:
      return res.status(400).json({ message: 'Invalid action' });
  }
}
