import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, Account, TransferParams } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, web3 } from '@coral-xyz/anchor';

// ===========================================
// SOLANA EARNING ENGINE CONFIGURATION
// ===========================================

export interface SolanaVaultConfig {
  vaultAddress: string;
  treasuryAddress: string;
  usdtMintAddress: string;
  network: 'mainnet-beta' | 'testnet' | 'devnet';
  rpcUrl: string;
}

export interface PayoutRecord {
  signature: string;
  amount: number;
  token: 'SOL' | 'USDT';
  recipient: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockTime?: number;
}

export interface EarningPayoutRequest {
  userId: string;
  amount: number;
  tokenType: 'SOL' | 'USDT';
  recipientAddress: string;
  source: 'task_reward' | 'referral_tier' | 'daily_checkpoint' | 'commission_transfer';
  metadata?: Record<string, any>;
}

const DEFAULT_CONFIG: SolanaVaultConfig = {
  vaultAddress: import.meta.env.VITE_SOLANA_VAULT_ADDRESS || '',
  treasuryAddress: import.meta.env.VITE_SOLANA_TREASURY_ADDRESS || '',
  usdtMintAddress: import.meta.env.VITE_SOLANA_USDT_MINT || 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11Mcw8Zt8LZ9sK',
  network: (import.meta.env.VITE_SOLANA_NETWORK as any) || 'devnet',
  rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
};

// ===========================================
// SOLANA EARNING ENGINE
// ===========================================

export class SolanaEarningEngine {
  private static connection: Connection;
  private static config: SolanaVaultConfig = DEFAULT_CONFIG;

  static initialize(config?: Partial<SolanaVaultConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.connection = new Connection(this.config.rpcUrl, 'confirmed');
  }

  static isConfigured(): boolean {
    return !!this.config.vaultAddress && !!this.config.treasuryAddress;
  }

  // ===========================================
  // BALANCE QUERIES
  // ===========================================

  static async getVaultBalance(): Promise<{ sol: number; usdt: number }> {
    if (!this.isConfigured()) {
      return { sol: 0, usdt: 0 };
    }

    try {
      const vaultPubkey = new PublicKey(this.config.vaultAddress);
      const balance = await this.connection.getBalance(vaultPubkey);
      const solBalance = balance / LAMPORTS_PER_SOL;

      let usdtBalance = 0;
      if (this.config.usdtMintAddress) {
        try {
          const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(vaultPubkey, {
            mint: new PublicKey(this.config.usdtMintAddress)
          });
          if (tokenAccounts.value.length > 0) {
            usdtBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
          }
        } catch {
          // USDT balance fetch failed, return 0
        }
      }

      return { sol: solBalance, usdt: usdtBalance };
    } catch {
      return { sol: 0, usdt: 0 };
    }
  }

  static async getUserPendingPayouts(userId: string): Promise<PayoutRecord[]> {
    // Placeholder: in production, query wallet_transactions table for pending payouts
    return [];
  }

  // ===========================================
  // PAYOUT HANDLER
  // ===========================================

  static async processPayout(request: EarningPayoutRequest): Promise<{ success: boolean; signature?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Solana vault not configured' };
    }

    try {
      const recipientPubkey = new PublicKey(request.recipientAddress);
      const amountLamports = Math.round(request.amount * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(this.config.vaultAddress),
          toPubkey: recipientPubkey,
          lamports: amountLamports,
        })
      );

      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(this.config.vaultAddress);

      // Serialize transaction for signing elsewhere (keep private key off client)
      const serialized = transaction.serializeMessage();
      const signature = await this.connection.sendRawTransaction(serialized);

      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      return { success: true, signature };
    } catch (error: any) {
      return { success: false, error: error.message || 'Payout failed' };
    }
  }

  // ===========================================
  // ON-CHAIN EARNING INTEGRATION
  // ===========================================

  static async recordOnChainEarning(
    userId: string,
    amount: number,
    source: EarningPayoutRequest['source']
  ): Promise<{ success: boolean; pendingAmount: number; error?: string }> {
    if (!this.isConfigured()) {
      return { success: true, pendingAmount: amount };
    }

    // In production: insert into wallet_transactions with status 'pending'
    return { success: true, pendingAmount: amount };
  }

  static async getPendingBalance(userId: string): Promise<number> {
    if (!this.isConfigured()) {
      return 0;
    }

    // In production: sum pending wallet_transactions for user
    return 0;
  }

  // ===========================================
  // TRANSACTION HISTORY
  // ===========================================

  static async getTransactionHistory(userId: string): Promise<PayoutRecord[]> {
    if (!this.isConfigured()) {
      return [];
    }

    // In production: query wallet_transactions for user
    return [];
  }

  static async getTransactionStatus(signature: string): Promise<PayoutRecord['status']> {
    if (!this.isConfigured()) {
      return 'pending';
    }

    try {
      const status = await this.connection.getSignatureStatus(signature);
      if (status?.value?.confirmationStatus === 'finalized') {
        return 'confirmed';
      } else if (status?.value?.err) {
        return 'failed';
      }
      return 'pending';
    } catch {
      return 'pending';
    }
  }
}
