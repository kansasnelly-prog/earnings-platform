import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import './ExecutiveVisuals.css';

const STREAM_URL = 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8';
const FADE_START = 0.05;
const FADE_END = 0.8;
const FADE_STEP = 0.05;
const FADE_TICK_MS = 200;
const BALANCE_TICK_MS = 10000;

const ExecutiveTVPanel: React.FC = () => {
  const { user } = useAppContext();

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const balanceRef = useRef(0);
  const audioFadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const balanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [balance, setBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState('');

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

    balanceTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      const isStreamHealthy = Boolean(video && !video.paused && video.readyState >= 2);
      const isVisible = document.visibilityState === 'visible';

      if (isStreamHealthy && isVisible) {
        balanceRef.current += 12.5;
        setBalance(balanceRef.current);
      }
    }, BALANCE_TICK_MS);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let active = true;

    const initStream = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
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

          hls.loadSource(STREAM_URL);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!active) return;
            setIsLoading(false);
            video.play().catch(() => {});
            fadeAudio(video);
            startBalanceTimer();
          });

          hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
            if (!active) return;
            if (data.fatal) {
              setHasError(true);
              setIsLoading(false);
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = STREAM_URL;
          video.addEventListener('loadedmetadata', () => {
            if (!active) return;
            setIsLoading(false);
            video.play().catch(() => {});
            fadeAudio(video);
            startBalanceTimer();
          });
        }
      } catch (err) {
        if (!active) return;
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
  }, [clearTimers, fadeAudio, startBalanceTimer]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);

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

    setWithdrawStatus('Processing withdrawal...');

    try {
      const token = localStorage.getItem('supabase_jwt') || localStorage.getItem('sb-access-token');
      const response = await fetch('/api/withdrawals/create', {
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
        }),
      });

      const result = await response.json();
      if (result.success) {
        setWithdrawStatus(`Withdrawal successful! TX: ${result.txHash?.slice(0, 20)}...`);
        setWithdrawalAmount('');
      } else {
        setWithdrawStatus(result.error || 'Withdrawal failed');
      }
    } catch (e: any) {
      setWithdrawStatus(e.message || 'Withdrawal failed');
    }
  }, [walletAddress, withdrawalAmount, balance]);

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

      <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-full">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-sm text-emerald-300 font-medium">
          Cinema Balance: ${balance.toFixed(2)}
        </span>
      </div>

      <div className="mb-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl">
        <h3 className="text-sm font-bold text-white mb-3">Solana Wallet Binding</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter Solana wallet address"
            className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
          <button
            onClick={handleWalletBind}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
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
            className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
          <button
            onClick={handleWithdrawal}
            disabled={balance < 1}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Withdraw SOL/USDT
          </button>
        </div>
        {withdrawStatus && (
          <p className="mt-2 text-xs text-center text-gray-300">{withdrawStatus}</p>
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
