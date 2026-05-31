
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, userId, adminPassword, vipLevel } = req.body;

  // Get environment variables
  const env = req?.env || process.env;
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('Missing Supabase configuration');
    return res.status(500).json({ error: 'Missing Supabase configuration' });
  }

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Admin password check
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }

    // Verify admin using logged-in user (assuming auth token is in headers)
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

    const { data: { user }, error: userError } =
      await userClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return res.status(403).json({ error: 'Unauthorized user' });
    }

    // ✅ CHANGE THIS EMAIL (Admin check)
    if (user.email !== "kansasnelly@gmail.com") {
      return res.status(403).json({ error: 'Not admin' });
    }

    switch (action) {
      case 'deleteUser':
        if (!userId) {
          return res.status(400).json({ error: 'Missing required field: userId' });
        }
        const { data: userDataDelete, error: fetchErrorDelete } = await supabase
          .from('users')
          .select('email, display_name')
          .eq('id', userId)
          .single();

        if (fetchErrorDelete || !userDataDelete) {
          console.error('[Admin Delete] Error fetching user:', fetchErrorDelete);
          return res.status(404).json({ error: 'User not found' });
        }

        const { error: updateErrorDelete } = await supabase
          .from('users')
          .update({
            user_status: 'deleted',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateErrorDelete) {
          console.error('[Admin Delete] Error soft deleting user:', updateErrorDelete);
          return res.status(500).json({ error: 'Failed to delete user' });
        }
        console.log(`[Admin Delete] Soft deleted user ${userDataDelete.email} (${userDataDelete.display_name})`);
        return res.status(200).json({ success: true, message: 'User soft deleted successfully' });

      case 'freezeUser':
      case 'unfreezeUser':
        if (!userId) {
          return res.status(400).json({ error: 'Missing required field: userId' });
        }
        const isFrozen = action === 'freezeUser';
        const { data: userDataFreeze, error: fetchErrorFreeze } = await supabase
          .from('users')
          .select('is_frozen, email, display_name')
          .eq('id', userId)
          .single();

        if (fetchErrorFreeze || !userDataFreeze) {
          console.error('[Admin Freeze] Error fetching user:', fetchErrorFreeze);
          return res.status(404).json({ error: 'User not found' });
        }

        const { error: updateErrorFreeze } = await supabase
          .from('users')
          .update({
            is_frozen: isFrozen,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateErrorFreeze) {
          console.error('[Admin Freeze] Error updating freeze status:', updateErrorFreeze);
          return res.status(500).json({ error: 'Failed to update freeze status' });
        }
        console.log(`[Admin Freeze] ${isFrozen ? 'Froze' : 'Unfroze'} user ${userDataFreeze.email}`);
        return res.status(200).json({ success: true, isFrozen, action });

      case 'updateVipLevel':
        if (!userId || vipLevel === undefined) {
          return res.status(400).json({ error: 'Missing required fields: userId, vipLevel' });
        }
        if (typeof vipLevel !== 'number' || vipLevel < 1 || vipLevel > 5) {
          return res.status(400).json({ error: 'VIP level must be between 1 and 5' });
        }
        const { data: userDataVip, error: fetchErrorVip } = await supabase
          .from('users')
          .select('vip_level, email, display_name')
          .eq('id', userId)
          .single();

        if (fetchErrorVip || !userDataVip) {
          console.error('[Admin VIP] Error fetching user:', fetchErrorVip);
          return res.status(404).json({ error: 'User not found' });
        }

        const previousVipLevel = userDataVip.vip_level || 1;
        const { error: updateErrorVip } = await supabase
          .from('users')
          .update({
            vip_level: vipLevel,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateErrorVip) {
          console.error('[Admin VIP] Error updating VIP level:', updateErrorVip);
          return res.status(500).json({ error: 'Failed to update VIP level' });
        }
        console.log(`[Admin VIP] Updated VIP level for user ${userDataVip.email} from VIP${previousVipLevel} to VIP${vipLevel}`);
        return res.status(200).json({ success: true, previousVipLevel, newVipLevel: vipLevel });

      default:
        return res.status(400).json({ error: 'Invalid action provided' });
    }
  } catch (error) {
    console.error('Error in admin-users API:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
