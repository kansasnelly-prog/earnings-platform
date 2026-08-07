import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

function safeUnsubscribe(channel: any, label: string) {
  if (!channel) {
    console.log(`[${label}] No channel to unsubscribe`);
    return;
  }
  try {
    if (channel.state === 'closed' || channel.state === 'unsubscribed') {
      console.log(`[${label}] Channel already unsubscribed or closed`);
      return;
    }
    channel.unsubscribe();
    console.log(`[${label}] Unsubscribed successfully`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('CLOSED')) {
      // Ignore CLOSED errors during unsubscribe
      console.log(`[${label}] Ignored CLOSED error during unsubscribe`);
    } else {
      console.error(`[${label}] Error during unsubscribe:`, error);
    }
  }
}

// Real-time user registration listener with graceful handling of CLOSED subscription spam
export const setupRealtimeListeners = () => {
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let lastClosedLogTime = 0;
  const CLOSED_LOG_DEBOUNCE_MS = 60000; // 1 minute debounce for CLOSED logs

  const handleSubscriptionStatus = (channelName: string, status: string) => {
    if (status === 'CLOSED') {
      const now = Date.now();
      if (now - lastClosedLogTime > CLOSED_LOG_DEBOUNCE_MS) {
        console.warn(`[Realtime] Subscription closed for channel ${channelName}, will attempt reconnect.`);
        lastClosedLogTime = now;
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        console.log(`[Realtime] Reconnecting channel ${channelName}...`);
        setupRealtimeListeners(); // Re-subscribe all channels
      }, 5000); // Reconnect after 5 seconds
    }
  };

  // Listen for new users
  const usersSubscription = supabase
    .channel('users_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'users' },
      (payload) => {
        const newUser = payload.new;
        
        // Show toast notification for new user
        toast({
          title: '🎉 New User Registered',
          description: `${newUser.display_name || newUser.email} just joined the platform!`,
        });

        // Send Telegram notification (if configured)
        sendTelegramNotification('NEW_USER', newUser);
      }
    )
    .subscribe((status) => handleSubscriptionStatus('users_changes', status));

  // Listen for withdrawal requests
  const withdrawalsSubscription = supabase
    .channel('withdrawals_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'payout_requests' },
      (payload) => {
        const newWithdrawal = payload.new;
        
        // Show toast notification for new withdrawal
        toast({
          title: '💰 New Withdrawal Request',
          description: `$${newWithdrawal.amount} withdrawal requested by ${newWithdrawal.user_email}`,
        });

        // Send Telegram notification
        sendTelegramNotification('NEW_WITHDRAWAL', newWithdrawal);
      }
    )
    .subscribe((status) => handleSubscriptionStatus('withdrawals_changes', status));

  // Listen for task completions
  const tasksSubscription = supabase
    .channel('task_assignments_changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'user_task_assignments' },
      (payload) => {
        const updatedTask = payload.new;
        
        if (updatedTask.status === 'completed' && payload.old.status !== 'completed') {
          // Show toast notification for task completion
          toast({
            title: '✅ Task Completed',
            description: `User completed a task and earned $${updatedTask.reward_value || '0.00'}`,
          });

          // Send Telegram notification
          sendTelegramNotification('TASK_COMPLETED', updatedTask);
        }
      }
    )
    .subscribe((status) => handleSubscriptionStatus('task_assignments_changes', status));

  return () => {
    safeUnsubscribe(usersSubscription, 'users_changes');
    safeUnsubscribe(withdrawalsSubscription, 'withdrawals_changes');
    safeUnsubscribe(tasksSubscription, 'task_assignments_changes');
  };
};

export const logAdminAction = async (action: string, admin: string, details: any) => {
  // Implementation...
  console.log(`[Admin Action] ${action} by ${admin}`, details);
};

// Telegram notification function
export const sendTelegramNotification = async (type: string, data: any) => {
  try {
    const message = formatTelegramMessage(type, data);
    
    // Call Telegram bot edge function
    const { error } = await supabase.functions.invoke('telegram-bot', {
      body: { message }
    });

    if (error) {
      console.error('Telegram notification failed:', error);
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
};

const formatTelegramMessage = (type: string, data: any): string => {
  const timestamp = new Date().toLocaleString();
  
  switch (type) {
    case 'NEW_USER':
      return `🎉 *NEW USER REGISTRATION*
📧 *Email:* ${data.email}
👤 *Name:* ${data.display_name || 'Not set'}
🔗 *Referral Code:* ${data.referral_code}
👑 *VIP Level:* ${data.vip_level || 0}
⏰ *Time:* ${timestamp}

🚀 Welcome to Optimize Tasks!`;

    case 'NEW_WITHDRAWAL':
      return `💰 *NEW WITHDRAWAL REQUEST*
👤 *User:* ${data.user_email}
💵 *Amount:* $${data.amount}
🏦 *Wallet Type:* ${data.wallet_type}
📋 *Status:* Pending
⏰ *Time:* ${timestamp}

🔍 Admin review required`;

    case 'TASK_COMPLETED':
      return `✅ *TASK COMPLETED*
👤 *User ID:* ${data.user_id}
💰 *Reward:* $${data.reward_value || '0.00'}
📋 *Task ID:* ${data.task_id}
⏰ *Time:* ${timestamp}

🎉 Great job! Task completed successfully`;

    case 'TRAINING_ACCOUNT_RESET':
      return `🔄 *TRAINING ACCOUNT RESET*
 *Email:* ${data.email}
🆔 *User ID:* ${data.userId}
👑 *VIP Level:* ${data.vipLevel || 'N/A'}
📋 *Tasks Reset:* 0/45
💰 *Balance Preserved:* $${data.balance || '0.00'}
⏰ *Time:* ${timestamp}

⚠️ Training account tasks have been reset to 0/45. Balance and earnings preserved.`;

    case 'PERSONAL_ACCOUNT_RESET':
      return ` *PERSONAL ACCOUNT RESET*
📧 *Email:* ${data.email}
🆔 *User ID:* ${data.userId}
👑 *VIP Level:* ${data.vipLevel || 'N/A'}
📋 *Tasks Reset:* 0/35
💰 *Balance Preserved:* $${data.balance || '0.00'}
🔄 *Cycle:* ${data.cycle || '1'}
⏰ *Time:* ${timestamp}

⚠️ Personal account tasks have been reset to 0/35. Balance and earnings preserved.`;

    case 'ADMIN_ACTION':
      return `🛡️ *ADMIN ACTION*
🔧 *Action:* ${data.action}
👤 *Admin:* ${data.admin}
📋 *Details:* ${JSON.stringify(data.details, null, 2)}
⏰ *Time:* ${timestamp}

🔐 Administrative action performed`;

    case 'PENDING_ORDER_CREATED':
      return `⚠️ *PENDING ORDER CREATED*
👤 *User:* ${data.userEmail}
🆔 *User ID:* ${data.userId}
📦 *Task:* #${data.taskNumber}
💰 *Amount:* $${data.amount}
📱 *Product:* ${data.productName || 'Combination Product'}
⏰ *Time:* ${timestamp}

⚡ User must contact CS to clear this order and receive 6× profit!`;

    case 'PENDING_ORDER_CLEARED':
      return `✅ *PENDING ORDER CLEARED - 6× PROFIT PAID*
👤 *User:* ${data.userEmail}
🆔 *User ID:* ${data.userId}
💰 *Pending Amount:* $${data.pendingAmount}
💎 *6× Profit:* $${data.profit}
💵 *Total Credited:* $${data.totalCredit}
👨‍💼 *Cleared By:* ${data.adminEmail || 'Admin'}
⏰ *Time:* ${timestamp}

🎉 User can now continue with tasks!`;

    case 'COMBINATION_PRODUCT_TRIGGERED':
      return `🎯 *COMBINATION PRODUCT TRIGGERED*
👤 *User:* ${data.userEmail}
🆔 *User ID:* ${data.userId}
📦 *Task Number:* #${data.taskNumber}
💰 *Product Price:* $${data.amount}
🎁 *Expected 6× Profit:* $${(data.amount * 6).toFixed(2)}
⏰ *Time:* ${timestamp}

⚠️ User hit combination product - pending order created!`;

    default:
      return `📊 *SYSTEM UPDATE*
📝 *Type:* ${type}
⏰ *Time:* ${timestamp}
📄 *Data:* ${JSON.stringify(data, null, 2)}`;
  }
};