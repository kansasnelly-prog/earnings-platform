
// api/monetization.js

import { calculateAndAwardCredits } from '../../src/services/creditService';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = "kansasnelly@gmail.com"; // Define admin email here

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { action, userId, amount, reason, adminPassword } = req.body;

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
      // Admin authentication (simplified for consolidation, use proper auth in production)
      const adminPasswordEnv = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_SECRET;
      if (adminPassword !== adminPasswordEnv) {
        return res.status(403).json({ error: 'Invalid admin password' });
      }

      // Validate required fields
      if (!userId || !amount) {
        return res.status(400).json({ error: 'Missing required fields: userId, amount' });
      }

      // Validate amount
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }

  // Resolve Supabase URLs and keys with fallbacks for server‑side usage
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
        console.error("CRITICAL: Supabase environment variables are missing in monetization.");
        return res.status(500).json({ error: 'Supabase configuration missing' });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // 🔐 Verify admin using logged-in user (assuming authHeader is passed in req.headers)
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: 'No auth token' });
      }

      const userClient = createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          global: {
            headers: {
              Authorization: authHeader
            }
          }
        }
      );

      const { data: { user }, error: userError } = await userClient.auth.getUser(authHeader.replace('Bearer ', ''));

      if (userError || !user || user.email !== ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Unauthorized user or not admin' });
      }

      // Get current user balance
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('balance, email, display_name')
        .eq('id', userId)
        .single();

      if (fetchError || !userData) {
        console.error('[Admin Balance] Error fetching user:', fetchError);
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

      // Update user balance
      const { error: updateError } = await supabase
        .from('users')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[Admin Balance] Error updating balance:', updateError);
        return res.status(500).json({ error: 'Failed to update balance' });
      }

      // Create transaction record for audit trail
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: req.body.subAction === 'add' ? 'deposit' : 'withdrawal',
          amount: amount,
          description: `Admin ${req.body.subAction === 'add' ? 'added' : 'reduced'} balance. Reason: ${reason || 'No reason provided'}`,
          status: 'completed',
          created_at: new Date().toISOString()
        });

      if (transactionError) {
        console.error('[Admin Balance] Error creating transaction record:', transactionError);
      }

      console.log(`[Admin Balance] ${req.body.subAction === 'add' ? 'Added' : 'Reduced'} $${amount} to user ${userData.email}. New balance: $${newBalance}`);

      return res.status(200).json({
        success: true,
        newBalance,
        previousBalance: currentBalance,
        action: req.body.subAction,
        amount
      });

    default:
      return res.status(400).json({ message: 'Invalid action' });
  }
}
