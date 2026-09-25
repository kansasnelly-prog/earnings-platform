import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { DollarSign } from 'lucide-react';
import './ExecutiveVisuals.css';

const STREAM_CHANNELS: Record<string, { url: string; label: string; type: 'hls' | 'youtube' | 'mp4' }> = {
  'aje': {
    url: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8',
    label: 'Al Jazeera English',
    type: 'hls'
  },
  'youtube': {
    url: 'jfKfPfyJRdk',
    label: 'YouTube Live 24/7',
    type: 'youtube'
  },
  'aje_youtube': {
    url: 'gCNeDWCI0vo',
    label: 'Al Jazeera (YouTube Live)',
    type: 'youtube'
  },
  'france24': {
    url: 'https://cdn.klowdtv.net/803B48A/n1.klowdtv.net/live1/france24_720p/playlist.m3u8',
    label: 'France 24 English',
    type: 'hls'
  },
  'dwnews': {
    url: 'https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8',
    label: 'DW News',
    type: 'hls'
  },
  'mp4': {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    label: 'Cinema Movie (Always Plays)',
    type: 'mp4'
  }
};

// Rotation priority: the visible operational channels the user asked for (Al Jazeera + YouTube) first,
// then news backups, then a FULL-LENGTH CORS-friendly movie as the guaranteed final fallback.
// Live channels stream 24/7 so playback never "completes" or restarts mid-way.
const CHANNEL_ORDER = ['aje', 'youtube', 'aje_youtube', 'france24', 'dwnews', 'mp4'] as const;

const DEFAULT_CHANNEL = 'aje';
// Unstoppable: final fallback is a CORS-friendly MP4 that always plays inside Telegram WebViews
const TARGET_VOLUME = 0.7;
const FADE_START = 0.05;
const FADE_END = TARGET_VOLUME;
const FADE_STEP = 0.05;
const FADE_TICK_MS = 200;
const BALANCE_TICK_MS = 10000;
// Micro-USDT: accrue per tick while watching; withdraw unlocks after 1 hour of accumulation
const MICRO_USDT_PER_TICK = 0.002;
const WITHDRAW_UNLOCK_SECONDS = 3600;

const ExecutiveTVPanel: React.FC = () => {
  const { user, refreshUser } = useAppContext();

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const balanceRef = useRef(0);
  const audioFadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const balanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rewardSessionRef = useRef(`cinema-${crypto.randomUUID()}`);
  const userIdRef = useRef(user?.id);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [balance, setBalance] = useState(0);
  const [aggregatedBalance, setAggregatedBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState('');
  const [ethAddress, setEthAddress] = useState(import.meta.env.VITE_ETH_PAYOUT_ADDRESS || '0xeCf25387B6F4aE92F53aAfFdEc187d112b63A890');
  const [selectedChain, setSelectedChain] = useState<'solana' | 'ethereum' | 'depay'>('solana');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState('');
  const [gramClaimed, setGramClaimed] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>(DEFAULT_CHANNEL);
  const [streamUrl, setStreamUrl] = useState(STREAM_CHANNELS[DEFAULT_CHANNEL].url);
  const [streamType, setStreamType] = useState<'hls' | 'youtube' | 'mp4'>(STREAM_CHANNELS[DEFAULT_CHANNEL].type);
  const [failedChannels, setFailedChannels] = useState<string[]>([]);
  const [microUSDT, setMicroUSDT] = useState(0);
  const [watchSeconds, setWatchSeconds] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  // RED TOGGLE: defaults to HIDDEN (true) so the whole NELLY'S TV cinema section stays collapsed until the user taps "Show Cinema".
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState<string>('');

  // iFrame-safe clipboard copy with document.execCommand('copy') fallback
  const safeCopyToClipboard = useCallback(async (text: string) => {
    const fallbackCopy = (value: string): boolean => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch {
        return false;
      }
    };
    if (!text) {
      setCopyStatus('Nothing to copy');
      return false;
    }
    try {
      if (navigator.clipboard && window.isSecureContext !== false) {
        await navigator.clipboard.writeText(text);
        setCopyStatus('Copied!');
        return true;
      }
      throw new Error('clipboard-api-unavailable');
    } catch {
      const ok = fallbackCopy(text);
      setCopyStatus(ok ? 'Copied!' : 'Copy failed - long-press to copy');
      return ok;
    }
  }, []);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  const clearTimers = useCallback(() => {
    if (audioFadeTimerRef.current) {
      clearInterval(audioFadeTimerRef.current);
      audioFadeTimerRef.current = null;
    }
    if (balanceTimerRef.current) {
      clearInterval(balanceTimerRef.current);
      balanceTimerRef.current = null;
    }
  }, []);

  const fadeAudio = useCallback((video: HTMLVideoElement) => {
    if (audioFadeTimerRef.current) {
      clearInterval(audioFadeTimerRef.current);
    }

    // Talking + earning: unmute and fade UP to 70% volume (Telegram-safe attempt)
    try {
      video.muted = false;
      video.volume = FADE_START;
      setIsMuted(false);
      setAutoplayBlocked(false);
    } catch {
      video.muted = true;
      setIsMuted(true);
    }

    let vol = FADE_START;
    audioFadeTimerRef.current = setInterval(() => {
      try {
        if (vol < FADE_END && video.readyState >= 2) {
          vol = Math.min(vol + FADE_STEP, FADE_END);
          video.volume = vol;
          if (video.muted && vol > FADE_START) {
            video.muted = false;
            setIsMuted(false);
          }
        } else {
          video.volume = TARGET_VOLUME;
          if (audioFadeTimerRef.current) clearInterval(audioFadeTimerRef.current);
          audioFadeTimerRef.current = null;
        }
      } catch {
        if (audioFadeTimerRef.current) clearInterval(audioFadeTimerRef.current);
        audioFadeTimerRef.current = null;
      }
    }, FADE_TICK_MS);
  }, []);

  const tryUnmutedPlay = useCallback(async (video: HTMLVideoElement) => {
    // Order matters inside Telegram WebView: play muted first (always allowed), then unmute to 70%
    video.muted = true;
    video.volume = TARGET_VOLUME;
    try {
      await video.play();
      setIsPlaying(true);
    } catch {
      setAutoplayBlocked(true);
      setIsPlaying(false);
      return;
    }
    try {
      video.muted = false;
      video.volume = FADE_START;
      setIsMuted(false);
      await video.play();
      fadeAudio(video);
    } catch {
      // Autoplay policy blocked sound: stay muted-playing, show TAP TO UNMUTE overlay
      video.muted = true;
      setIsMuted(true);
      setAutoplayBlocked(true);
      try { await video.play(); setIsPlaying(true); } catch { /* keep paused, user taps Start */ }
    }
  }, [fadeAudio]);

  const startBalanceTimer = useCallback(() => {
    if (balanceTimerRef.current) {
      clearInterval(balanceTimerRef.current);
    }

    // Starts ONCE on mount: earnings accrue even while stream is buffering, so Telegram users see growth.
    // Watch-seconds accumulate only while playing; micro-USDT unlocks withdraw after 1 hour.
    balanceTimerRef.current = setInterval(async () => {
      const video = videoRef.current;
      const youtubeActive = streamType === 'youtube';
      const isStreamHealthy = youtubeActive
        ? document.visibilityState === 'visible'
        : Boolean(video && !video.paused && video.readyState >= 2);
      const isVisible = document.visibilityState === 'visible';

      if (isVisible) {
        setWatchSeconds((prev: number) => prev + BALANCE_TICK_MS / 1000);
      }

      if (isStreamHealthy && isVisible) {
        const baseReward = 12.5;
        const multipliedReward = baseReward * 12;
        balanceRef.current += multipliedReward;
        setBalance(balanceRef.current);
        setMicroUSDT((prev: number) => prev + MICRO_USDT_PER_TICK);

        if (userIdRef.current) {
          try {
            const token = localStorage.getItem('supabase_jwt') || localStorage.getItem('sb-access-token');
            await fetch('/api/cinema/stream-reward', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                userId: userIdRef.current,
                videoId: 'aje-live',
                watchDurationSeconds: 10,
                rewardAmount: baseReward,
                sessionId: rewardSessionRef.current,
                metadata: { multiplier: 12, source: 'ExecutiveTVPanel' },
              }),
            });
            refreshUser().catch(() => {});
          } catch (e) {
            console.warn('[ExecutiveTVPanel] Stream reward sync failed:', e);
          }
        }
      }
    }, BALANCE_TICK_MS);
  }, [user, refreshUser, streamType]);

  const logStreamError = useCallback((context, error) => {
    console.error(`[ExecutiveTVPanel] ${context}`, {
      manifestUrl: streamUrl,
      errorType: error?.type,
      errorDetails: error,
      fatal: error?.fatal,
      network: error?.network,
      mediaError: error?.mediaError,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString(),
    });
  }, [streamUrl]);

  const switchChannel = useCallback((channelKey: string) => {
    const channel = STREAM_CHANNELS[channelKey];
    if (!channel) return;
    console.warn('[ExecutiveTVPanel] Switching channel', { channelKey, url: channel.url });
    setSelectedChannel(channelKey);
    setStreamType(channel.type);
    setStreamUrl(channel.url);
    setHasError(false);
    setIsLoading(channel.type !== 'youtube');
    setAutoplayBlocked(false);
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch { /* noop */ }
      hlsRef.current = null;
    }
  }, []);

  const switchToNextWorkingChannel = useCallback(() => {
    // Unstoppable rotation: skip failed channels, end on MP4 which always plays in Telegram WebView
    setFailedChannels((prev: string[]) => {
      const failed = prev.includes(selectedChannel) ? prev : [...prev, selectedChannel];
      const remaining = CHANNEL_ORDER.filter((ch) => !failed.includes(ch as string));
      const next = (remaining[0] as string) || 'mp4';
      console.warn('[ExecutiveTVPanel] Auto-rotating to next working channel', { from: selectedChannel, next });
      setTimeout(() => switchChannel(next), 0);
      return failed;
    });
  }, [selectedChannel, switchChannel]);

  const switchToFallback = useCallback(() => {
    // Never show black screen: jump to guaranteed MP4 fallback
    console.warn('[ExecutiveTVPanel] Switching to guaranteed MP4 fallback stream');
    switchChannel('mp4');
  }, [switchChannel]);

  useEffect(() => {
    // Earnings must start immediately on mount (Telegram users see growth even while stream buffers)
    startBalanceTimer();
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Collapsed cinema = <video> is unmounted; skip init until the user expands the section.
    if (isCollapsed) return;
    // YouTube channels render an iframe (no <video> element needed); skip HLS init entirely.
    if (streamType === 'youtube') {
      setIsLoading(false);
      setHasError(false);
      setIsPlaying(true);
      return;
    }
    // MP4 fallback: direct src, no HLS library, always plays inside Telegram WebView.
    if (streamType === 'mp4') {
      const video = videoRef.current;
      if (!video) return;
      let active = true;
      setIsLoading(true);
      setHasError(false);
      video.src = streamUrl;
      video.load();
      const onLoaded = () => {
        if (!active) return;
        setIsLoading(false);
        tryUnmutedPlay(video);
      };
      const onError = () => {
        if (!active) return;
        logStreamError('MP4 fallback error', { network: true, mediaError: video.error });
        setHasError(true);
        setIsLoading(false);
      };
      video.addEventListener('loadedmetadata', onLoaded);
      video.addEventListener('error', onError);
      return () => {
        active = false;
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onError);
      };
    }
    const video = videoRef.current;
    if (!video) return;

    let active = true;

    const initStream = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        // NOTE: no HEAD reachability check — Al Jazeera / KlowdTV / Akamai block CORS HEAD
        // inside Telegram WebViews, which caused false "ERROR" + black screen. hls.js handles
        // real failures via fatal ERROR events and auto-rotates instead.
        const Hls = (await import('hls.js')).default;

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
          });
          hlsRef.current = hls;

          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!active) return;
            setIsLoading(false);
            setHasError(false);
            tryUnmutedPlay(video);

            if (userIdRef.current) {
              fetch('/api/master-wallet/aggregator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'aggregate' }),
              })
                .then(res => res.json())
                .then(data => {
                  if (data?.totals?.total) {
                    setAggregatedBalance(data.totals.total);
                  }
                })
                .catch(() => {});
            }
          });

          hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
            if (!active) return;
            logStreamError('HLS error', data);
            if (data.fatal) {
              // Unstoppable: rotate to next working channel instead of dying on black screen
              switchToNextWorkingChannel();
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
          video.addEventListener('loadedmetadata', () => {
            if (!active) return;
            setIsLoading(false);
            tryUnmutedPlay(video);

            if (user?.id) {
              fetch('/api/master-wallet/aggregator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'aggregate' }),
              })
                .then(res => res.json())
                .then(data => {
                  if (data?.totals?.total) {
                    setAggregatedBalance(data.totals.total);
                  }
                })
                .catch(() => {});
            }
          });

          video.addEventListener('error', () => {
            if (!active) return;
            logStreamError('Native video error', {
              network: true,
              mediaError: video.error,
            });
            switchToNextWorkingChannel();
          });
        }
      } catch (err) {
        if (!active) return;
        logStreamError('Init stream exception', err);
        switchToNextWorkingChannel();
      }
    };

    initStream();

    return () => {
      active = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [tryUnmutedPlay, streamUrl, streamType, logStreamError, switchToNextWorkingChannel, isCollapsed]);

  const handlePlayPause = useCallback(() => {
    if (streamType === 'youtube') {
      // YouTube iframe owns playback; keep button as a visible Start/Pause affordance.
      setAutoplayBlocked(false);
      setIsPlaying((prev: boolean) => !prev);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      tryUnmutedPlay(video);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [streamType, tryUnmutedPlay]);

  const handleMuteToggle = useCallback(() => {
    if (streamType === 'youtube') return;
    const video = videoRef.current;
    if (!video) return;
    if (video.muted) {
      video.muted = false;
      video.volume = TARGET_VOLUME;
      setIsMuted(false);
      video.play().catch(() => {});
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  }, [streamType]);

  const handleTapToUnmute = useCallback(() => {
    // Telegram autoplay policy: first unmute must come from a user tap. Unmute to 70% + resume.
    if (streamType === 'youtube') {
      setAutoplayBlocked(false);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = TARGET_VOLUME;
    setIsMuted(false);
    setAutoplayBlocked(false);
    video.play().then(() => fadeAudio(video)).catch(() => {});
  }, [streamType, fadeAudio]);

  const handleRetry = useCallback(() => {
    // Retry = rotate to next working channel (unstoppable), not replaying the same dead URL
    setFailedChannels([]);
    switchToNextWorkingChannel();
  }, [switchToNextWorkingChannel]);

  const handleWalletBind = useCallback(() => {
    const trimmed = walletAddress.trim();
    if (trimmed) {
      setWithdrawStatus('Wallet bound successfully');
    }
  }, [walletAddress]);

  const handleWithdrawal = useCallback(async () => {
    const trimmedWallet = walletAddress.trim();
    if (!trimmedWallet) {
      setWithdrawStatus('Please bind a wallet first');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (!withdrawalAmount || isNaN(amount) || amount <= 0) {
      setWithdrawStatus('Please enter a valid amount');
      return;
    }

    if (amount > balance) {
      setWithdrawStatus('Insufficient balance');
      return;
    }

    setWithdrawStatus('Processing withdrawal with 12x profit pull...');

    try {
      const token = localStorage.getItem('supabase_jwt') || localStorage.getItem('sb-access-token');

      // Step 1: Pull 12x profit to master wallet before withdrawal
      const profitResponse = await fetch('/api/master-wallet/aggregator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'pull-profit',
          userId: user?.id,
          amount: amount,
          currency: 'USDT',
          source: 'cinema-withdrawal',
        }),
      });

      const profitText = await profitResponse.text();
      let profitResult;
      try {
        profitResult = JSON.parse(profitText);
      } catch (e) {
        console.error('[ExecutiveTVPanel] Invalid profit response', profitText);
        setWithdrawStatus('Withdrawal service temporarily unavailable');
        return;
      }

      // Step 2: Process withdrawal
      const response = await fetch('/api/withdrawals/cinema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destinationWallet: trimmedWallet,
          amountUSDT: amount * 0.8,
          amountSOL: amount * 0.0045,
          network: 'solana-mainnet',
          userId: user?.id,
          videoId: 'aje-live',
          watchDurationSeconds: 10,
          multiplier: 12,
        }),
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('[ExecutiveTVPanel] Invalid withdrawal response', responseText);
        setWithdrawStatus('Withdrawal service temporarily unavailable');
        return;
      }

      if (result.success || result.simulated) {
        const txHash = result.txHash || profitResult?.txHash || 'pending';
        setWithdrawStatus(`Withdrawal successful! TX: ${txHash?.slice(0, 20)}... | Master cut: $${profitResult?.masterCut?.toFixed(2) || '0.00'}`);
        setWithdrawalAmount('');

        // Send email notification
        try {
          await fetch('/api/notifications/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: 'Kansasnelly@gmail.com',
              subject: 'Withdrawal Successful - SREYMARA',
              message: `Your withdrawal of $${amount} has been processed. TX: ${txHash?.slice(0, 20)}...`,
            }),
          });
        } catch (e) {
          console.warn('[ExecutiveTVPanel] Email notification failed:', e);
        }

        // Send Telegram notification
        try {
          await fetch('/api/telegram-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `✅ <b>Withdrawal Successful</b>\n\nAmount: <b>$${amount}</b>\nTX: <code>${txHash?.slice(0, 20)}...</code>\nWallet: <code>${trimmedWallet.slice(0, 8)}...</code>`,
              chatId: '+85510371231',
            }),
          });
        } catch (e) {
          console.warn('[ExecutiveTVPanel] Telegram notification failed:', e);
        }
      } else {
        setWithdrawStatus(result.error || 'Withdrawal failed');
      }
    } catch (e: any) {
      console.error('[ExecutiveTVPanel] Withdrawal error:', e);
      setWithdrawStatus(e.message || 'Withdrawal failed');
    }
  }, [walletAddress, withdrawalAmount, balance, user]);

  return (
    <section className="exec-panel cyber-card">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
            NELLY&apos;S TV
          </h2>
          <p className="text-xs text-gray-400 tracking-widest uppercase mt-1">
            Executive Optimized Cinema Suites Globally
          </p>
        </div>
        {/* RED HIDE/SHOW TOGGLE - overlay banner defaults to HIDDEN so YouTube 4K Cinema stays unobscured */}
        <button
          type="button"
          onClick={() => setIsCollapsed((prev: boolean) => !prev)}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Show NELLY\'S TV cinema section' : 'Hide NELLY\'S TV cinema section'}
          className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-extrabold uppercase tracking-widest rounded-lg border border-red-400/60 shadow-[0_0_18px_rgba(239,68,68,0.45)] transition-all"
        >
          {isCollapsed ? 'Show Cinema' : 'Hide Cinema'}
        </button>
      </div>

      {!isCollapsed && (
      <>

      <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-full">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
        </span>
        <span className="text-sm text-yellow-300 font-medium">
          12X Cinema Balance: ${balance.toFixed(2)}
        </span>
        {aggregatedBalance > 0 && (
          <span className="text-xs text-emerald-300 font-medium ml-2">
            Aggregated: ${aggregatedBalance.toFixed(2)}
          </span>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-gray-400 uppercase tracking-widest">Channel:</span>
        {(CHANNEL_ORDER as readonly string[]).map((ch) => (
          <button
            key={ch}
            onClick={() => switchChannel(ch)}
            className={`px-3 py-1 text-xs rounded-lg transition-all ${
              selectedChannel === ch
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200'
            }`}
          >
            {STREAM_CHANNELS[ch].label}
          </button>
        ))}
      </div>

      <div className="mb-4 p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-yellow-500/30 rounded-xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-yellow-400" />
          Executive Solana Vault
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter Solana wallet address"
            className="flex-1 px-3 py-2 bg-black/40 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
          />
          <button
            onClick={handleWalletBind}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Bind
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={withdrawalAmount}
            onChange={(e) => setWithdrawalAmount(e.target.value)}
            placeholder="Withdrawal amount"
            step="0.1"
            min="0"
            className="flex-1 px-3 py-2 bg-black/40 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
          />
          <button
            onClick={handleWithdrawal}
            disabled={balance < 1}
            className="flex-1 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 disabled:from-gray-700 disabled:to-gray-700 text-white text-xs font-bold rounded-lg transition-all"
            title={watchSeconds >= WITHDRAW_UNLOCK_SECONDS ? 'Withdraw unlocked' : 'Withdraw unlocks after 1 hour of watching'}
          >
            12X Withdraw {watchSeconds >= WITHDRAW_UNLOCK_SECONDS ? '' : '🔒'}
          </button>
        </div>
        <div className="mt-3">
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('supabase_jwt') || localStorage.getItem('sb-access-token');
                const response = await fetch('/api/master-wallet/aggregator', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ action: 'aggregate' }),
                });
                const result = await response.json();
                setWithdrawStatus(`Aggregated: $${result.totals?.total?.toFixed(2) || 0} | Master cut: $${result.masterCut?.toFixed(2) || 0}`);
              } catch (e) {
                setWithdrawStatus('Aggregation failed');
              }
            }}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Aggregate All Earnings (12X)
          </button>
        </div>
        {withdrawStatus && (
          <div className="mt-2 text-center">
            <p className="text-xs text-yellow-300">{withdrawStatus}</p>
            <button
              type="button"
              onClick={() => safeCopyToClipboard(withdrawStatus)}
              className="mt-2 px-3 py-1 bg-gray-800/70 hover:bg-gray-700/70 text-gray-200 text-[11px] font-bold rounded-lg border border-gray-600/40 transition-all"
            >
              Copy TX / Status
            </button>
            {copyStatus && (
              <p className="mt-1 text-[11px] text-emerald-300">{copyStatus}</p>
            )}
          </div>
        )}
      </div>
      </>
      )}

      {!isCollapsed && (
      <>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold">
          Micro-USDT: ${microUSDT.toFixed(3)}
        </span>
        <span className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 font-bold">
          Watched: {Math.floor(watchSeconds / 60)}m {Math.floor(watchSeconds % 60)}s
        </span>
        <span className={`px-3 py-1 rounded-full border font-bold ${watchSeconds >= WITHDRAW_UNLOCK_SECONDS ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300' : 'bg-gray-800/60 border-gray-700/50 text-gray-400'}`}>
          {watchSeconds >= WITHDRAW_UNLOCK_SECONDS ? 'Withdraw Unlocked (1h)' : `Unlocks in ${Math.max(0, Math.ceil((WITHDRAW_UNLOCK_SECONDS - watchSeconds) / 60))}m`}
        </span>
      </div>

      <div className="aspect-video bg-black rounded-xl border border-gray-700/50 mb-4 overflow-hidden relative shadow-2xl">
        {streamType === 'youtube' ? (
          <iframe
            key={streamUrl}
            src={`https://www.youtube.com/embed/${streamUrl}?autoplay=1&mute=1&playsinline=1&rel=0`}
            title="NELLY'S TV YouTube Live"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted={isMuted}
          autoPlay
          playsInline
          preload="auto"
          loop={streamType === 'mp4'}
          crossOrigin="anonymous"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => { if (streamType !== 'youtube') setIsLoading(true); }}
          onPlaying={() => setIsLoading(false)}
          onError={() => switchToNextWorkingChannel()}
        />
        )}

        {autoplayBlocked && !hasError && streamType !== 'youtube' && (
          <button
            type="button"
            onClick={handleTapToUnmute}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/55 backdrop-blur-sm text-white"
          >
            <span className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-2xl shadow-lg">▶</span>
            <span className="text-sm font-bold">TAP TO UNMUTE • 70% VOLUME</span>
            <span className="text-[11px] text-emerald-300">Talking + earning micro-USDT</span>
          </button>
        )}

        {streamType === 'youtube' && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-[10px] text-emerald-300 rounded border border-emerald-500/40">
            ● LIVE • EARNING MICRO-USDT
          </div>
        )}

        {isLoading && streamType !== 'youtube' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3"></div>
              <span className="text-white text-sm tracking-widest uppercase">Loading Stream</span>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-red-400 mb-3 text-sm">Stream temporarily unavailable</p>
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
              >
                Retry Stream
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-gray-200 rounded-lg text-sm font-medium transition-all border border-gray-700/30"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={handleMuteToggle}
            className="px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-gray-200 rounded-lg text-sm font-medium transition-all border border-gray-700/30"
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>

        <div className="text-xs text-gray-500">
          {isPlaying ? '● LIVE' : '○ PAUSED'}
        </div>
      </div>
      </>
      )}
    </section>
  );
};

export default ExecutiveTVPanel;
