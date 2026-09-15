import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { DollarSign } from 'lucide-react';
import './ExecutiveVisuals.css';

const STREAM_CHANNELS = {
  'aje': {
    url: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8',
    label: 'Al Jazeera English',
    type: 'hls'
  },
  'youtube': {
    url: 'https://www.youtube.com/watch?v=jfKfXpLqMh4',
    label: 'YouTube Live',
    type: 'youtube'
  },
  'mux': {
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    label: 'Test Stream',
    type: 'hls'
  }
};

const DEFAULT_CHANNEL = 'aje';
const PRIMARY_STREAM_URL = import.meta.env.VITE_CINEMA_STREAM_URL || STREAM_CHANNELS[DEFAULT_CHANNEL].url;
const FALLBACK_STREAM_URL = STREAM_CHANNELS['mux'].url;
const FADE_START = 0.05;
const FADE_END = 0.8;
const FADE_STEP = 0.05;
const FADE_TICK_MS = 200;
const BALANCE_TICK_MS = 10000;

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
  const [selectedChannel, setSelectedChannel] = useState<'aje' | 'youtube' | 'mux'>(DEFAULT_CHANNEL);
  const [streamUrl, setStreamUrl] = useState(STREAM_CHANNELS[DEFAULT_CHANNEL].url);

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

    video.volume = FADE_START;
    video.muted = false;
    setIsMuted(false);

    let vol = FADE_START;
    audioFadeTimerRef.current = setInterval(() => {
      if (vol < FADE_END && video.readyState >= 2) {
        vol = Math.min(vol + FADE_STEP, FADE_END);
        video.volume = vol;
      } else {
        clearInterval(audioFadeTimerRef.current!);
        audioFadeTimerRef.current = null;
      }
    }, FADE_TICK_MS);
  }, []);

  const startBalanceTimer = useCallback(() => {
    if (balanceTimerRef.current) {
      clearInterval(balanceTimerRef.current);
    }

    balanceTimerRef.current = setInterval(async () => {
      const video = videoRef.current;
      const isStreamHealthy = Boolean(video && !video.paused && video.readyState >= 2);
      const isVisible = document.visibilityState === 'visible';

      if (isStreamHealthy && isVisible) {
        const baseReward = 12.5;
        const multipliedReward = baseReward * 12;
        balanceRef.current += multipliedReward;
        setBalance(balanceRef.current);

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
  }, [user, refreshUser]);

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

  const switchToFallback = useCallback(() => {
    if (streamUrl !== FALLBACK_STREAM_URL) {
      console.warn('[ExecutiveTVPanel] Switching to fallback stream');
      setStreamUrl(FALLBACK_STREAM_URL);
    }
  }, [streamUrl]);

  const checkManifestReachability = useCallback(async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
      console.log('[ExecutiveTVPanel] Manifest reachability check', {
        url,
        status: response.status,
        contentType: response.headers.get('content-type'),
        corsAllowed: response.headers.get('access-control-allow-origin'),
        timestamp: new Date().toISOString(),
      });
      return response.status;
    } catch (e) {
      console.warn('[ExecutiveTVPanel] Manifest reachability check failed', {
        url,
        error: e.message,
        timestamp: new Date().toISOString(),
      });
      return 0;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let active = true;

    const initStream = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const reachability = await checkManifestReachability(streamUrl);
        if (reachability === 0 && streamUrl !== FALLBACK_STREAM_URL) {
          switchToFallback();
          return;
        }

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
            video.play().catch(() => {});
            fadeAudio(video);
            startBalanceTimer();

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
              setHasError(true);
              setIsLoading(false);
              switchToFallback();
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
          video.addEventListener('loadedmetadata', () => {
            if (!active) return;
            setIsLoading(false);
            video.play().catch(() => {});
            fadeAudio(video);
            startBalanceTimer();

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
            switchToFallback();
          });
        }
      } catch (err) {
        if (!active) return;
        logStreamError('Init stream exception', err);
        setHasError(true);
        setIsLoading(false);
      }
    };

    initStream();

    return () => {
      active = false;
      clearTimers();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [clearTimers, fadeAudio, startBalanceTimer, streamUrl, logStreamError, switchToFallback, checkManifestReachability]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setStreamUrl(PRIMARY_STREAM_URL);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.load();
    }
  }, []);

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

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  return (
    <section className="exec-panel cyber-card">
      <div className="mb-6">
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
          NELLY&apos;S TV
        </h2>
        <p className="text-xs text-gray-400 tracking-widest uppercase mt-1">
          Executive Optimized Cinema Suites Globally
        </p>
      </div>

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
        {(['aje', 'youtube', 'mux'] as const).map((ch) => (
          <button
            key={ch}
            onClick={() => {
              setSelectedChannel(ch);
              setStreamUrl(STREAM_CHANNELS[ch].url);
              setHasError(false);
            }}
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
          >
            12X Withdraw
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
          <p className="mt-2 text-xs text-center text-yellow-300">{withdrawStatus}</p>
        )}
      </div>

      <div className="aspect-video bg-black rounded-xl border border-gray-700/50 mb-4 overflow-hidden relative shadow-2xl">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted={isMuted}
          autoPlay
          playsInline
          preload="auto"
          loop={false}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />

        {isLoading && (
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
    </section>
  );
};

export default ExecutiveTVPanel;
