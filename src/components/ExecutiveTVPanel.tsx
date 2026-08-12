import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import './ExecutiveVisuals.css';
import { ExoClickAds, StickyFooterBanner, NativeContentWidget, PropellerAdsScript, PPVModal, AffiliateBanner } from '../components/monetization/CinemaMonetization';

interface Channel {
  id: string;
  name: string;
  subtitle: string;
  videoUrl: string;
  type?: 'hls' | 'mp4' | 'youtube';
  youtubeType?: 'video' | 'playlist';
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

const ExecutiveTVPanel: React.FC = () => {
  const channels: Channel[] = [
    {
      id: 'aljazeera',
      name: 'Al Jazeera English',
      subtitle: '24/7 Global Coverage & Documentary Investigative Reporting',
      videoUrl: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8',
      type: 'hls',
    },
    {
      id: 'france24',
      name: 'France 24 English',
      subtitle: 'Global News Streaming - North African & European Geopolitics',
      videoUrl: 'https://cdn.klowdtv.net/803B48A/n1.klowdtv.net/live1/france24_720p/playlist.m3u8',
      type: 'hls',
    },
    {
      id: 'euronews',
      name: 'Euronews English',
      subtitle: 'European Perspective on Global Affairs, Economic Changes & Border Dynamics',
      videoUrl: 'https://rakuten-euronews-1-eu.xiaomi-cdn.com/out/v1/6101a6d3be67434aa60c5fd54ded0b47/index.m3u8',
      type: 'hls',
    },
    {
      id: 'dwnews',
      name: 'DW News',
      subtitle: 'In-Depth Documentary Reporting, Global Economics & Tech/AI Shifts',
      videoUrl: 'https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8',
      type: 'hls',
    },
    {
      id: 'trtworld',
      name: 'TRT World',
      subtitle: 'Regional Analysis - Middle East/Africa Coverage & Global Event Breakdown',
      videoUrl: 'https://trtcanlitv-lh.akamaihd.net/i/trtworld_1@185332/index_720p.m3u8',
      type: 'hls',
    },
    {
      id: 'cgtndoc',
      name: 'CGTN Documentary',
      subtitle: 'Global Infrastructure, Technology Evolution & International History',
      videoUrl: 'https://news-cdn.cgtn.com/cgtdocumentary/cgtndoc_1080p.m3u8',
      type: 'hls',
    },
    {
      id: 'africanews',
      name: 'Africanews',
      subtitle: 'Pan-African News Coverage & Continental Affairs',
      videoUrl: 'https://rakuten-africanews-1-eu.xiaomi-cdn.com/out/v1/africanews_720p/index.m3u8',
      type: 'hls',
    },
    {
      id: 'abcnews',
      name: 'ABC News Live',
      subtitle: 'Breaking US & International News',
      videoUrl: 'https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd9874563.m3u8',
      type: 'hls',
    },
    {
      id: 'cbsnews',
      name: 'CBS News',
      subtitle: 'US & World News Coverage',
      videoUrl: 'https://cbsn-us-cedexis.cbsnstream.cbsnews.com/out/v1/55ed6f71d02a4b6a9a9e5f1a8e6b3b7a/index.m3u8',
      type: 'hls',
    },
    {
      id: 'skynews',
      name: 'Sky News',
      subtitle: 'UK & Global Breaking News',
      videoUrl: 'https://skynews-api.cloudinary.com/video/upload/q_auto,f_mp4,vc_avc1,w_1920,h_1080/v1/skynews/2024/skynews-live.m3u8',
      type: 'hls',
    },
    {
      id: 'nellytv-youtube-1',
      name: 'NELLY TV YouTube Stream 1',
      subtitle: 'Watch-to-Earn YouTube Feed',
      videoUrl: 'BRvhK4ChS6E',
      type: 'youtube',
      youtubeType: 'video',
    },
    {
      id: 'nellytv-playlist',
      name: 'NELLY TV Playlist',
      subtitle: 'RDMx92lTVxrJQ',
      videoUrl: 'RDMx92lTVxrJQ',
      type: 'youtube',
      youtubeType: 'playlist',
    },
    {
      id: 'nellytv-youtube-2',
      name: 'NELLY TV YouTube Stream 2',
      subtitle: 'Mg_CuDtpfl0',
      videoUrl: 'Mg_CuDtpfl0',
      type: 'youtube',
      youtubeType: 'video',
    },
    {
      id: 'nellytv-youtube-3',
      name: 'NELLY TV YouTube Stream 3',
      subtitle: 'Mx92ITYxrJQ',
      videoUrl: 'Mx92ITYxrJQ',
      type: 'youtube',
      youtubeType: 'video',
    },
    {
      id: 'nollywood',
      name: 'Nollywood / Nigeria Movies',
      subtitle: 'Nigerian Cinema & Entertainment Live Stream',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      type: 'youtube',
      youtubeType: 'video',
    },
    {
      id: 'funny',
      name: 'Funny Videos Channel',
      subtitle: 'AFV / FailArmy / Comedy Compilation',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      type: 'youtube',
      youtubeType: 'video',
    },
    {
      id: 'action',
      name: 'Action Movies Channel',
      subtitle: 'Action Hollywood / Movie Central',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      type: 'mp4',
    },
    {
      id: 'gods',
      name: 'The Gods Must Be Crazy',
      subtitle: 'Classic Comedy Movie Stream',
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
      type: 'mp4',
    },
    {
      id: 'diehard',
      name: 'Die Hard 4 / Action Live Stream',
      subtitle: 'Action Movie Stream',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      type: 'mp4',
    },
    {
      id: 'avatar',
      name: 'Avatar Sci-Fi/Action',
      subtitle: 'Sci-Fi Action Movie Stream',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      type: 'mp4',
    },
    {
      id: 'mission',
      name: 'Mission Impossible',
      subtitle: 'Action Movies Stream',
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
      type: 'mp4',
    },
    {
      id: 'merlin',
      name: 'Merlin Series Stream',
      subtitle: 'Fantasy / Drama Series',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      type: 'mp4',
    },
    {
      id: 'seeker',
      name: 'Legend of the Seeker',
      subtitle: 'Fantasy / Drama Series Stream',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      type: 'mp4',
    },
  ];

  const [currentChannel, setCurrentChannel] = useState<string>(channels[0].id);
  const [playbackStatus, setPlaybackStatus] = useState<'idle' | 'playing' | 'paused' | 'ended' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<'EN' | 'KH' | 'AI-AUTO'>('EN');
  const [videoReady, setVideoReady] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.5);
  const [isChannelOpen, setIsChannelOpen] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [watchBalance, setWatchBalance] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const youtubePlayerRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user, refreshUser } = useAppContext();

  const getCurrentChannel = () => channels.find((c) => c.id === currentChannel) || channels[0];

  const destroyHls = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  const fetchWatchBalance = async () => {
    try {
      const token = localStorage.getItem('supabase_jwt') || localStorage.getItem('sb-access-token');
      if (!token) return;
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('users')
        .select('watch_balance')
        .eq('id', user?.id)
        .single();
      if (error || !data) return;
      setWatchBalance(data.watch_balance || 0);
    } catch (error) {
      console.error('[WatchBalance] Failed to fetch:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchWatchBalance();
    }
  }, [user?.id]);

  const sendHeartbeat = async (videoTimestamp?: number) => {
    try {
      const token = localStorage.getItem('supabase_jwt') || localStorage.getItem('sb-access-token');
      if (!token) return;

      const response = await fetch('/api/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoTimestamp: videoTimestamp ?? playbackTime,
          sessionToken: token,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.watchBalance !== undefined) {
          setWatchBalance(data.watchBalance);
        } else {
          fetchWatchBalance();
        }
        if (typeof refreshUser === 'function') {
          refreshUser();
        }
      }
    } catch (error) {
      console.error('[Heartbeat] Failed:', error);
    }
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      const player = youtubePlayerRef.current;
      const video = videoRef.current;
      const isYouTube = getCurrentChannel().type === 'youtube';

      const isPlaying = isYouTube
        ? player && player.getPlayerState && player.getPlayerState() === 1
        : video && !video.paused;

      const isVisible = document.visibilityState === 'visible';

      if (isPlaying && isVisible) {
        sendHeartbeat();
      }
    }, 10_000);
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const loadStream = async (channel: Channel, retry: boolean = false) => {
    const video = videoRef.current;
    if (!video) return;

    destroyHls();
    setIsLoading(true);
    setHasError(false);
    setPlaybackStatus('idle');
    setVideoReady(false);

    if (channel.type === 'hls') {
      try {
        const Hls = (await import('hls.js')).default;
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
          });
          hlsRef.current = hls;
          hls.loadSource(channel.videoUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
              setHasError(true);
              setPlaybackStatus('error');
              setIsLoading(false);
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = channel.videoUrl;
          video.play().catch(() => {});
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      } catch (e) {
        setHasError(true);
        setIsLoading(false);
      }
    } else if (channel.type === 'youtube') {
      setIsLoading(true);
      if (window.YT && window.YT.Player) {
        initYouTubePlayer(channel);
      } else {
        window.onYouTubeIframeAPIReady = () => {
          initYouTubePlayer(channel);
        };
      }
    } else {
      video.src = channel.videoUrl;
      video.load();
      video.play().catch(() => {});
    }
  };

  const initYouTubePlayer = (channel: Channel) => {
    const container = document.getElementById('youtube-player-container');
    if (!container) return;

    container.innerHTML = '';

    const player = new window.YT.Player('youtube-player-container', {
      height: '100%',
      width: '100%',
      videoId: channel.youtubeType === 'playlist' ? undefined : channel.videoUrl,
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 1,
        playsinline: 1,
        rel: 0,
        iv_load_policy: 3,
        disablekb: 1,
        ...(channel.youtubeType === 'playlist' ? { listType: 'playlist', list: channel.videoUrl } : {}),
      },
      events: {
        onReady: (event: any) => {
          event.target.playVideo();
          event.target.mute();
          setPlaybackStatus('playing');
          setIsLoading(false);
          setVideoReady(true);
          startHeartbeat();
        },
        onStateChange: (event: any) => {
          if (event.data === 1) {
            setPlaybackStatus('playing');
            startHeartbeat();
          } else if (event.data === 2) {
            setPlaybackStatus('paused');
            stopHeartbeat();
          } else if (event.data === 0) {
            setPlaybackStatus('ended');
            stopHeartbeat();
            const currentIndex = channels.findIndex((c) => c.id === currentChannel);
            const nextIndex = (currentIndex + 1) % channels.length;
            const nextChannel = channels[nextIndex];
            if (nextChannel.type === 'youtube') {
              setCurrentChannel(nextChannel.id);
            }
          }
        },
        onError: () => {
          setHasError(true);
          setPlaybackStatus('error');
          setIsLoading(false);
        },
      },
    });

    youtubePlayerRef.current = player;
  };

  useEffect(() => {
    const channel = getCurrentChannel();
    loadStream(channel);
    return () => {
      destroyHls();
      stopHeartbeat();
    };
  }, [currentChannel, retryCount]);

  const lastAdTrigger = useRef<number>(0);
  const AD_COOLDOWN = 30000; // 30 seconds

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    setVideoReady(true);
  };
  const handleCanPlay = () => setIsBuffering(false);
  const handleWaiting = () => setIsBuffering(true);
  const handlePlaying = () => setPlaybackStatus('playing');
  const handlePause = () => setPlaybackStatus('paused');
  const handleEnded = () => setPlaybackStatus('ended');
  const handleError = () => {
    setHasError(true);
    setPlaybackStatus('error');
    setIsLoading(false);
  };
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setPlaybackTime(e.currentTarget.currentTime);
  };
  const handleDurationChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration);
  };
  const triggerPropellerAds = () => {
    const now = Date.now();
    if (now - lastAdTrigger.current < AD_COOLDOWN) return;
    
    lastAdTrigger.current = now;
    const event = new Event('propellerads-interaction');
    window.dispatchEvent(event);
  };

  const currentChannelData = getCurrentChannel();

  return (
    <section className="exec-panel cyber-card">
      {/* LIVE indicator - moved to right */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-red-500 font-bold">
        <span>LIVE</span>
        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      </div>
      {/* Animated Header */}
      <div className="mb-4">
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent animate-pulse">
          NELLY&apos;S TV
        </h2>
        <p className="text-xs text-gray-400 tracking-widest uppercase mt-1">
          Executive Optimized Cinema Suites Globally
        </p>
      </div>
      {/* Watch Balance Badge */}
      <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-full">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-sm text-emerald-300 font-medium">
          Current Watch Earnings: {watchBalance} PTS (80/20 Split Active)
        </span>
      </div>
      {/* Collapsible Channel Selector */}
      <div className="mb-4">
        <button
          onClick={() => {
            setIsChannelOpen(!isChannelOpen);
            if (!isChannelOpen) triggerPropellerAds();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition w-full justify-between"
          aria-expanded={isChannelOpen}
        >
          <span className="font-medium">{currentChannelData.name}</span>
          <span className="text-gray-400 transition-transform duration-200" style={{ transform: isChannelOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            v
          </span>
        </button>
        {isChannelOpen && (
          <div className="mt-2 bg-gray-900 border border-gray-700 rounded-md overflow-hidden max-h-64 overflow-y-auto">
            {channels.map((channel) => (
              <button
                key={channel.id}
                className={`w-full text-left px-4 py-2 text-sm transition ${
                  currentChannel === channel.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => {
                  setCurrentChannel(channel.id);
                  setIsChannelOpen(false);
                }}
              >
                <div className="font-medium">{channel.name}</div>
                <div className="text-xs text-gray-400">{channel.subtitle}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="aspect-video bg-black rounded-md border border-gray-600 mb-4 overflow-hidden relative">
        {currentChannelData.type === 'youtube' ? (
          <div id="youtube-player-container" className="w-full h-full" />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted={isMuted}
            loop={currentChannelData.type === 'mp4'}
            autoPlay
            preload="auto"
            onLoadedData={handleLoadedData}
            onCanPlay={handleCanPlay}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
          />
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white">Loading...</span>
          </div>
        )}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center">
              <p className="text-red-400 mb-3">Failed to load stream</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition"
              >
                Retry Stream
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Status Bar */}
      <div className="flex justify-between items-center text-sm text-gray-300 mb-4">
        <span>Channel: {currentChannelData.name}</span>
        <span>Status: {playbackStatus}</span>
        <span>Audio: {currentAudioTrack}</span>
        <button
          onClick={() => {
            setIsMuted(!isMuted);
            if (!isMuted) triggerPropellerAds();
          }}
          className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700"
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>
      {/* Audio Sub-Bar */}
      <div className="flex gap-2 mb-4">
        {['EN', 'KH', 'AI-AUTO'].map((track) => (
          <button
            key={track}
            className={`px-3 py-1 text-sm rounded transition ${
              currentAudioTrack === track
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => setCurrentAudioTrack(track as 'EN' | 'KH' | 'AI-AUTO')}
            type="button"
          >
            {track}
          </button>
        ))}
      </div>
      {/* Audio Sub-Bar End */}
      <ExoClickAds />
      <StickyFooterBanner />
      <NativeContentWidget />
      <PropellerAdsScript />
      <PPVModal />
      <AffiliateBanner />
    </section>
  );
};

export default ExecutiveTVPanel;
