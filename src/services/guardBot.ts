// MODULE 3: Protocol 0 Shield & Anti-Scam Bot Engine
// Automated security monitoring daemon for spam, bot patterns, fake profiles, and link harvesting

import { supabase } from '@/lib/supabase';
import { sendTelegramNotification } from '@/lib/realtime';

export interface ScamPattern {
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface BotDetectionResult {
  isScam: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  matchedPatterns: string[];
  confidence: number; // 0-100
  actionTaken: 'none' | 'flagged' | 'frozen' | 'banned';
}

export interface GuardBotConfig {
  enableAutoFreeze: boolean;
  enableTelegramAlerts: boolean;
  reputationThreshold: number; // Minimum reputation score to avoid auto-freeze
  maxViolationsBeforeFreeze: number;
  violationDecayHours: number; // How long before violations decay
}

export class GuardBot {
  private config: GuardBotConfig;
  private scamPatterns: ScamPattern[];

  constructor(config?: Partial<GuardBotConfig>) {
    this.config = {
      enableAutoFreeze: true,
      enableTelegramAlerts: true,
      reputationThreshold: 30,
      maxViolationsBeforeFreeze: 3,
      violationDecayHours: 24,
      ...config,
    };

    // Initialize scam detection patterns
    this.scamPatterns = [
      // Financial scams
      {
        pattern: /(?:bitcoin|crypto|investment|trading|forex|binary option|get rich quick|double your money|wire transfer|western union|moneygram)/i,
        severity: 'high',
        description: 'Financial scam keywords detected',
      },
      // Phishing and link harvesting
      {
        pattern: /(?:click here|verify your account|update your information|confirm your identity|suspicious activity|limited time offer|act now|don't miss out)/i,
        severity: 'medium',
        description: 'Phishing attempt detected',
      },
      // External links (suspicious)
      {
        pattern: /(?:http[s]?:\/\/(?:bit\.ly|tinyurl|short\.link|goo\.gl|t\.co|ow\.ly|is\.gd))/i,
        severity: 'high',
        description: 'Suspicious URL shortener detected',
      },
      // Personal information requests
      {
        pattern: /(?:send me your|provide your|give me your|share your|email me|text me|call me|whatsapp me|telegram me)/i,
        severity: 'medium',
        description: 'Personal information request detected',
      },
      // Romance scam patterns
      {
        pattern: /(?:i love you|my love|darling|sweetheart|honey|baby|dear|marry me|relationship|dating|serious relationship)/i,
        severity: 'low',
        description: 'Romance scam pattern detected',
      },
      // Urgency and pressure tactics
      {
        pattern: /(?:urgent|immediately|right now|asap|today only|expires soon|last chance|final opportunity|limited spots)/i,
        severity: 'medium',
        description: 'Urgency pressure tactics detected',
      },
      // Fake verification requests
      {
        pattern: /(?:verify|confirm|validate|authenticate|prove your identity|send id|passport|driver license|social security)/i,
        severity: 'critical',
        description: 'Fake verification request detected',
      },
      // Bot-like repetitive patterns
      {
        pattern: /(.{10,})\1{2,}/, // Repeated phrases
        severity: 'high',
        description: 'Repetitive bot-like pattern detected',
      },
      // All caps spam
      {
        pattern: /^[A-Z\s!?.,]{20,}$/,
        severity: 'low',
        description: 'All caps spam detected',
      },
      // Multiple phone numbers
      {
        pattern: /(?:\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}.*){2,}/,
        severity: 'high',
        description: 'Multiple phone numbers detected',
      },
    ];
  }

  /**
   * Scan text for scam patterns
   */
  scanText(text: string): BotDetectionResult {
    const matchedPatterns: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let patternCount = 0;
    const severityOrder: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];

    for (const scamPattern of this.scamPatterns) {
      if (scamPattern.pattern.test(text)) {
        matchedPatterns.push(scamPattern.description);
        patternCount++;

        // Update max severity
        const currentSeverityIndex = severityOrder.indexOf(maxSeverity);
        const patternSeverityIndex = severityOrder.indexOf(scamPattern.severity);

        if (patternSeverityIndex > currentSeverityIndex) {
          maxSeverity = scamPattern.severity;
        }
      }
    }

    // Calculate confidence based on pattern count and severity
    const confidence = Math.min(patternCount * 15 + (severityOrder.indexOf(maxSeverity) * 20), 100);

    const isScam = confidence >= 50; // 50% confidence threshold

    return {
      isScam,
      severity: maxSeverity,
      matchedPatterns,
      confidence,
      actionTaken: 'none',
    };
  }

  /**
   * Process a user message and take action if scam detected
   */
  async processMessage(userId: string, message: string): Promise<BotDetectionResult> {
    const result = this.scanText(message);

    if (!result.isScam) {
      return result;
    }

    // Fetch user's current reputation and violation count
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('reputation_score, violation_count, is_frozen, email, display_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('[GuardBot] Failed to fetch user:', userError);
      return result;
    }

    // Don't auto-freeze if user has high reputation
    if (user.reputation_score >= this.config.reputationThreshold) {
      console.log(`[GuardBot] User ${userId} has high reputation (${user.reputation_score}), skipping auto-freeze`);
      result.actionTaken = 'flagged';
      await this.flagUser(userId, result);
      return result;
    }

    // Increment violation count
    const newViolationCount = (user.violation_count || 0) + 1;

    // Determine action based on severity and violation count
    if (result.severity === 'critical' || newViolationCount >= this.config.maxViolationsBeforeFreeze) {
      // Freeze user
      result.actionTaken = 'frozen';
      await this.freezeUser(userId, result, user);
    } else {
      // Flag user
      result.actionTaken = 'flagged';
      await this.flagUser(userId, result);
    }

    return result;
  }

  /**
   * Flag a user for scam activity
   */
  private async flagUser(userId: string, result: BotDetectionResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          violation_count: (await this.getUserViolationCount(userId)) + 1,
          flagged_at: new Date().toISOString(),
          flag_reason: result.matchedPatterns.join(', '),
        })
        .eq('id', userId);

      if (error) {
        console.error('[GuardBot] Failed to flag user:', error);
      } else {
        console.log(`[GuardBot] User ${userId} flagged for scam activity`);
      }
    } catch (error) {
      console.error('[GuardBot] Error flagging user:', error);
    }
  }

  /**
   * Freeze a user account
   */
  private async freezeUser(userId: string, result: BotDetectionResult, user: any): Promise<void> {
    try {
      // Drop reputation score to zero
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_frozen: true,
          reputation_score: 0,
          violation_count: (user.violation_count || 0) + 1,
          frozen_at: new Date().toISOString(),
          freeze_reason: result.matchedPatterns.join(', '),
          account_status: 'suspended',
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[GuardBot] Failed to freeze user:', updateError);
        return;
      }

      console.log(`[GuardBot] User ${userId} frozen for scam activity`);

      // Send Telegram alert to admin
      if (this.config.enableTelegramAlerts) {
        await this.sendTelegramAlert(user, result);
      }
    } catch (error) {
      console.error('[GuardBot] Error freezing user:', error);
    }
  }

  /**
   * Get user's current violation count
   */
  private async getUserViolationCount(userId: string): Promise<number> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('violation_count')
        .eq('id', userId)
        .single();

      return user?.violation_count || 0;
    } catch (error) {
      console.error('[GuardBot] Error getting violation count:', error);
      return 0;
    }
  }

  /**
   * Send Telegram alert to admin console
   */
  private async sendTelegramAlert(user: any, result: BotDetectionResult): Promise<void> {
    try {
      const message = `
🚨 SCAM DETECTION ALERT 🚨

User: ${user.display_name || user.email}
Email: ${user.email}
Severity: ${result.severity.toUpperCase()}
Confidence: ${result.confidence}%
Matched Patterns:
${result.matchedPatterns.map(p => `• ${p}`).join('\n')}

Action Taken: ${result.actionTaken.toUpperCase()}
Timestamp: ${new Date().toISOString()}
      `.trim();

      await sendTelegramNotification('SCAM_DETECTION', {
        email: user.email,
        severity: result.severity,
        confidence: result.confidence,
        matchedPatterns: result.matchedPatterns,
        actionTaken: result.actionTaken,
        timestamp: new Date().toISOString(),
      });

      console.log('[GuardBot] Telegram alert sent successfully');
    } catch (error) {
      console.error('[GuardBot] Failed to send Telegram alert:', error);
    }
  }

  /**
   * Analyze profile for fake account indicators
   */
  async analyzeProfile(userId: string): Promise<{
    isSuspicious: boolean;
    riskScore: number;
    indicators: string[];
  }> {
    const indicators: string[] = [];
    let riskScore = 0;

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return { isSuspicious: false, riskScore: 0, indicators: [] };
      }

      // Check for suspicious indicators
      if (!user.display_name || user.display_name.length < 3) {
        indicators.push('Missing or short display name');
        riskScore += 20;
      }

      if (!user.phone) {
        indicators.push('No phone number provided');
        riskScore += 15;
      }

      if (user.created_at) {
        const accountAge = Date.now() - new Date(user.created_at).getTime();
        const daysOld = accountAge / (1000 * 60 * 60 * 24);
        if (daysOld < 1) {
          indicators.push('Account created less than 24 hours ago');
          riskScore += 30;
        }
      }

      if (user.reputation_score < 20) {
        indicators.push('Low reputation score');
        riskScore += 25;
      }

      if (user.violation_count > 0) {
        indicators.push('Previous violations detected');
        riskScore += user.violation_count * 15;
      }

      return {
        isSuspicious: riskScore >= 50,
        riskScore,
        indicators,
      };
    } catch (error) {
      console.error('[GuardBot] Error analyzing profile:', error);
      return { isSuspicious: false, riskScore: 0, indicators: [] };
    }
  }

  /**
   * Decay old violations over time
   */
  async decayViolations(userId: string): Promise<void> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('violation_count, flagged_at')
        .eq('id', userId)
        .single();

      if (!user || !user.flagged_at) {
        return;
      }

      const hoursSinceFlag = (Date.now() - new Date(user.flagged_at).getTime()) / (1000 * 60 * 60);

      if (hoursSinceFlag >= this.config.violationDecayHours && user.violation_count > 0) {
        const { error } = await supabase
          .from('users')
          .update({
            violation_count: Math.max(0, user.violation_count - 1),
          })
          .eq('id', userId);

        if (error) {
          console.error('[GuardBot] Failed to decay violations:', error);
        } else {
          console.log(`[GuardBot] Violation decayed for user ${userId}`);
        }
      }
    } catch (error) {
      console.error('[GuardBot] Error decaying violations:', error);
    }
  }
}

// Export singleton instance
export const guardBot = new GuardBot();
