// MODULE 2: The Conversational Fee Interceptor Service
// Message stream processing engine for WebSocket interaction channels

import { supabase } from '@/lib/supabase';
import { MessagePayload, ConversationMetadata } from '@/types/matchmaking';

export interface BillingConfig {
  feeRate: number; // Percentage fee per message (e.g., 0.01 for 1%)
  minimumFee: number; // Minimum fee in NellyCoins
  maximumFee: number; // Maximum fee cap per message
  freeMessageLimit: number; // Number of free messages before fees apply
}

export interface BillingResult {
  success: boolean;
  feeDeducted: number;
  newBalance: number;
  error?: string;
}

export class BillingInterceptor {
  private config: BillingConfig;

  constructor(config?: Partial<BillingConfig>) {
    this.config = {
      feeRate: 0.01, // 1% fee per message
      minimumFee: 0.001, // 0.001 NellyCoins minimum
      maximumFee: 0.1, // 0.1 NellyCoins maximum per message
      freeMessageLimit: 10, // 10 free messages
      ...config,
    };
  }

  /**
   * Calculate conversational fee based on message length and user balance
   */
  private calculateFee(messageLength: number, userBalance: number, messageCount: number): number {
    // Free messages check
    if (messageCount < this.config.freeMessageLimit) {
      return 0;
    }

    // Calculate base fee based on message length (longer messages = higher fee)
    const lengthFactor = Math.min(messageLength / 1000, 1); // Cap at 1 for messages > 1000 chars
    const baseFee = this.config.feeRate * lengthFactor * userBalance;

    // Apply min/max constraints
    const clampedFee = Math.max(
      this.config.minimumFee,
      Math.min(baseFee, this.config.maximumFee)
    );

    return clampedFee;
  }

  /**
   * Process message payload and deduct conversational fee
   */
  async processMessage(
    senderId: string,
    conversationId: string,
    content: string,
    messageCount: number
  ): Promise<BillingResult> {
    try {
      // Fetch user's current balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance, nelly_coins')
        .eq('id', senderId)
        .single();

      if (userError || !user) {
        console.error('[BillingInterceptor] Failed to fetch user balance:', userError);
        return {
          success: false,
          feeDeducted: 0,
          newBalance: 0,
          error: 'User not found',
        };
      }

      const currentBalance = user.balance || 0;
      const nellyCoins = user.nelly_coins || 0;

      // Calculate fee
      const fee = this.calculateFee(content.length, currentBalance, messageCount);

      if (fee === 0) {
        // No fee to deduct (free message)
        return {
          success: true,
          feeDeducted: 0,
          newBalance: currentBalance,
        };
      }

      // Check if user has sufficient balance
      if (currentBalance < fee) {
        console.warn('[BillingInterceptor] Insufficient balance for fee');
        return {
          success: false,
          feeDeducted: 0,
          newBalance: currentBalance,
          error: 'Insufficient balance',
        };
      }

      // Deduct fee from user balance
      const { error: updateError } = await supabase
        .from('users')
        .update({
          balance: currentBalance - fee,
          nelly_coins: nellyCoins + fee, // Convert to NellyCoins
        })
        .eq('id', senderId);

      if (updateError) {
        console.error('[BillingInterceptor] Failed to deduct fee:', updateError);
        return {
          success: false,
          feeDeducted: 0,
          newBalance: currentBalance,
          error: 'Failed to process fee',
        };
      }

      // Route fee to Admin Corporate Revenue parameters table
      await this.routeToAdminRevenue(fee, conversationId, senderId);

      // Update conversation metadata with total fee collected
      await this.updateConversationFee(conversationId, fee);

      return {
        success: true,
        feeDeducted: fee,
        newBalance: currentBalance - fee,
      };
    } catch (error) {
      console.error('[BillingInterceptor] Error processing message:', error);
      return {
        success: false,
        feeDeducted: 0,
        newBalance: 0,
        error: 'Processing error',
      };
    }
  }

  /**
   * Route collected fee to Admin Corporate Revenue parameters table
   */
  private async routeToAdminRevenue(
    fee: number,
    conversationId: string,
    senderId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_revenue')
        .insert({
          fee_amount: fee,
          conversation_id: conversationId,
          sender_id: senderId,
          fee_type: 'conversational',
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('[BillingInterceptor] Failed to route fee to admin revenue:', error);
      } else {
        console.log(`[BillingInterceptor] Fee ${fee} NellyCoins routed to admin revenue`);
      }
    } catch (error) {
      console.error('[BillingInterceptor] Error routing fee to admin revenue:', error);
    }
  }

  /**
   * Update conversation metadata with total fee collected
   */
  private async updateConversationFee(conversationId: string, fee: number): Promise<void> {
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('total_fee_collected')
        .eq('id', conversationId)
        .single();

      const currentTotal = conversation?.total_fee_collected || 0;

      const { error } = await supabase
        .from('conversations')
        .update({
          total_fee_collected: currentTotal + fee,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        console.error('[BillingInterceptor] Failed to update conversation fee:', error);
      }
    } catch (error) {
      console.error('[BillingInterceptor] Error updating conversation fee:', error);
    }
  }

  /**
   * Get billing statistics for a user
   */
  async getUserBillingStats(userId: string): Promise<{
    totalFeesPaid: number;
    messageCount: number;
    averageFeePerMessage: number;
  }> {
    try {
      const { data: revenueData, error } = await supabase
        .from('admin_revenue')
        .select('fee_amount')
        .eq('sender_id', userId);

      if (error || !revenueData) {
        return {
          totalFeesPaid: 0,
          messageCount: 0,
          averageFeePerMessage: 0,
        };
      }

      const totalFeesPaid = revenueData.reduce((sum, r) => sum + r.fee_amount, 0);
      const messageCount = revenueData.length;
      const averageFeePerMessage = messageCount > 0 ? totalFeesPaid / messageCount : 0;

      return {
        totalFeesPaid,
        messageCount,
        averageFeePerMessage,
      };
    } catch (error) {
      console.error('[BillingInterceptor] Error getting user billing stats:', error);
      return {
        totalFeesPaid: 0,
        messageCount: 0,
        averageFeePerMessage: 0,
      };
    }
  }
}

// Export singleton instance
export const billingInterceptor = new BillingInterceptor();
