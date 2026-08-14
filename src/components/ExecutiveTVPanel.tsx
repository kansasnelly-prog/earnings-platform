import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import './ExecutiveVisuals.css';

interface Channel {
  id: string;
  name: string;
  subtitle: string;
  videoUrl: string;
  type?: 'hls' | 'mp4' | 'youtube';
  youtubeType?: 'video' | 'playlist';
  category?: 'news' | 'movies' | 'series' | 'premium' | 'music';
  bitrate?: number;
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
      category: 'news',
      bitrate: 1500,
    },
    {
      id: 'france24',
      name: 'France 24 English',
      subtitle: 'Global News Streaming - North African & European Geopolitics',
      videoUrl: 'https://cdn.klowdtv.net/803B48A/n1.klowdtv.net/live1/france24_720p/playlist.m3u8',
      type: 'hls',
      category: 'news',
      bitrate: 1500,
    },
    {
      id: 'euronews',
      name: 'Euronews English',
      subtitle: 'European Perspective on Global Affairs, Economic Changes & Border Dynamics',
      videoUrl: 'https://rakuten-euronews-1-eu.xiaomi-cdn.com/out/v1/6101a6d3be67434aa60c5fd54ded0b47/index.m3u8',
      type: 'hls',
      category: 'news',
      bitrate: 1500,
    },
    {
      id: 'dwnews',
      name: 'DW News',
      subtitle: 'In-Depth Documentary Reporting, Global Economics & Tech/AI Shifts',
      videoUrl: 'https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8',
      type: 'hls',
      category: 'news',
      bitrate: 1500,
    },
    {
      id: 'trtworld',
      name: 'TRT World',
      subtitle: 'Regional Analysis - Middle East/Africa Coverage & Global Event Breakdown',
      videoUrl: 'https://trtcanlitv-lh.akamaihd.net/i/trtworld_1@185332/index_720p.m3u8',
      type: 'hls',
      category: 'news',
      bitrate: 1500,
    },
    {
      id: 'cgtndoc',
      name: 'CGTN Documentary',
      subtitle: 'Global Infrastructure, Technology Evolution & International History',
      videoUrl: 'https://news-cdn.cgtn.com/cgtdocumentary/cgtndoc_1080p.m3u8',
      type: 'hls',
      category: 'news',
      bitrate: 2500,
    },
    {
      id: 'africanews',
      name: 'Africanews',
      subtitle: 'Pan-African News Coverage & Continental Affairs',
      videoUrl: 'https://rakuten-africanews-1-eu.xiaomi-cdn.com/out/v1/africanews_720p/index.m3u8',
      type: 'hls',
      category: 'news',
      bitrate: 1500,
    },
    {
      id: 'abcnews',
      name: 'ABC News Live',
      subtitle: 'Breaking US & International News',
      videoUrl: 'https://content.uplynk.com/channel/3324f2467c414329b3b0cc5cd9874563.m3u8',
      type: 'hls',
      category: 'news',
      bitrate: 2000,
    },
    {
      id: 'cbsnews',
      name: 'CBS News',
      subtitle: 'US & World News Coverage',
      videoUrl: 'https://cbsn-us-cedexis.cbsnstream.cbsnews.com/out/v1/55ed6f71d02a4b6a9a9e5f1a8e6b3b7a/index.m3u8',
      type: 'hls',
      category: 'news',
      bitrate: 2000,
    },
    {
      id: 'skynews',
      name: 'Sky News',
      subtitle: 'UK & Global Breaking News',
      videoUrl: 'https://skynews-api.cloudinary.com/video/upload/q_auto,f_mp4,vc_avc1,w_1920,h_1080/v1/skynews/2024/skynews-live.m3u8',
      type: 'hls',
      category: 'news',
      bitrate: 2500,
    },
    {
      id: 'nellytv-youtube-1',
      name: 'NELLY TV YouTube Stream 1',
      subtitle: 'Watch-to-Earn YouTube Feed',
      videoUrl: 'BRvhK4ChS6E',
      type: 'youtube',
      youtubeType: 'video',
      category: 'movies',
      bitrate: 2000,
    },
    {
      id: 'nellytv-playlist',
      name: 'NELLY TV Playlist',
      subtitle: 'Curated NELLY TV Content Playlist',
      videoUrl: 'RDMx92lTVxrJQ',
      type: 'youtube',
      youtubeType: 'playlist',
      category: 'movies',
      bitrate: 2000,
    },
    {
      id: 'nellytv-youtube-2',
      name: 'NELLY TV YouTube Stream 2',
      subtitle: 'Secondary Watch-to-Earn Feed',
      videoUrl: 'Mg_CuDtpfl0',
      type: 'youtube',
      youtubeType: 'video',
      category: 'movies',
      bitrate: 2000,
    },
    {
      id: 'nellytv-youtube-3',
      name: 'NELLY TV YouTube Stream 3',
      subtitle: 'Tertiary Watch-to-Earn Feed',
      videoUrl: 'Mx92ITYxrJQ',
      type: 'youtube',
      youtubeType: 'video',
      category: 'movies',
      bitrate: 2000,
    },
    {
      id: 'nollywood',
      name: 'Nollywood / Nigeria Movies',
      subtitle: 'Nigerian Cinema & Entertainment Live Stream',
      videoUrl: 'dQw4w9WgXcQ',
      type: 'youtube',
      youtubeType: 'video',
      category: 'movies',
      bitrate: 2000,
    },
    {
      id: 'funny',
      name: 'Funny Videos Channel',
      subtitle: 'AFV / FailArmy / Comedy Compilation',
      videoUrl: 'dQw4w9WgXcQ',
      type: 'youtube',
      youtubeType: 'video',
      category: 'movies',
      bitrate: 2000,
    },
    {
      id: 'action',
      name: 'Action Movies Channel',
      subtitle: 'Action Hollywood / Movie Central',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      type: 'mp4',
      category: 'movies',
      bitrate: 1000,
    },
    {
      id: 'gods',
      name: 'The Gods Must Be Crazy',
      subtitle: 'Classic Comedy Movie Stream',
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
      type: 'mp4',
      category: 'movies',
      bitrate: 1000,
    },
    {
      id: 'diehard',
      name: 'Die Hard 4 / Action Live Stream',
      subtitle: 'Action Movie Stream',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      type: 'mp4',
      category: 'movies',
      bitrate: 1000,
    },
    {
      id: 'avatar',
      name: 'Avatar Sci-Fi/Action',
      subtitle: 'Sci-Fi Action Movie Stream',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      type: 'mp4',
      category: 'movies',
      bitrate: 1000,
    },
    {
      id: 'mission',
      name: 'Mission Impossible',
      subtitle: 'Action Movies Stream',
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
      type: 'mp4',
      category: 'movies',
      bitrate: 1000,
    },
    {
      id: 'merlin',
      name: 'Merlin Series Stream',
      subtitle: 'Fantasy / Drama Series',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      type: 'mp4',
      category: 'series',
      bitrate: 1000,
    },
    {
      id: 'seeker',
      name: 'Legend of the Seeker',
      subtitle: 'Fantasy / Drama Series Stream',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      type: 'mp4',
      category: 'series',
      bitrate: 1000,
    },
    {
      id: 'lofi-girl',
      name: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
      subtitle: '24/7 Lofi Livestream',
      videoUrl: 'jfKfPfyJRdk',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 1500,
    },
    {
      id: 'nature-relax',
      name: 'Relaxing Nature 4K - Earth Visuals',
      subtitle: '4K Nature Ambient Livestream',
      videoUrl: 'eKFT7KC6Tns',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 2500,
    },
    {
      id: 'world-cam-1',
      name: 'Tokyo Street View Live Cam',
      subtitle: 'Real-Time World Camera',
      videoUrl: 'jNQXAC9IVRw',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 2000,
    },
    {
      id: 'live-concert-1',
      name: 'Live Concert Experience - EDM Stage',
      subtitle: 'Electronic Music Festival Live',
      videoUrl: 'kXYiU_JCYtU',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 2000,
    },
    {
      id: 'space-cam',
      name: 'NASA Live - Earth From Space',
      subtitle: 'ISS Earth Observation Stream',
      videoUrl: 'zInDbvGDXfQ',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 2000,
    },
    {
      id: 'fireplace-4k',
      name: 'Cozy Fireplace 4K - Relaxing Ambience',
      subtitle: 'Crackling Fireplace with Music',
      videoUrl: 'gxK4Y5_Mr3I',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 2500,
    },
    {
      id: 'jazz-cafe',
      name: 'Jazz Cafe Radio - Smooth Background Music',
      subtitle: 'Jazz Instrumental 24/7 Stream',
      videoUrl: 'Dx5qF7dYdHQ',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 1500,
    },
    {
      id: 'rain-ambience',
      name: 'Rain Sounds for Sleeping / Relaxation',
      subtitle: 'Heavy Rain & Thunder Ambience',
      videoUrl: 'mPZkdNFkNps',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 1500,
    },
    {
      id: 'ocean-waves',
      name: 'Ocean Waves - Crashing Water Sounds',
      subtitle: '4K Ocean Ambience',
      videoUrl: '62m64xnPcdI',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 2500,
    },
    {
      id: 'gaming-24-7',
      name: '24/7 Gaming Stream Highlights',
      subtitle: 'Epic Gaming Moments Compilation',
      videoUrl: 'zzu_9J673Xw',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 2000,
    },
    {
      id: 'cooking-live',
      name: 'World Street Food - Cooking Live',
      subtitle: 'Global Culinary Journey Stream',
      videoUrl: '1ZYbU82GVzM',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 2000,
    },
    {
      id: 'world-news-24',
      name: 'World News 24/7 - Global Live Coverage',
      subtitle: 'Continuous International News',
      videoUrl: 'wk7kHgQKXrM',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 2000,
    },
    {
      id: 'sports-highlights',
      name: 'Sports Center - Live Highlights',
      subtitle: 'Football, Basketball, Tennis Stream',
      videoUrl: 'tP0NycXx9TY',
      type: 'youtube',
      youtubeType: 'video',
      category: 'premium',
      bitrate: 2000,
    },
    {
      id: 'music-machine-1',
      name: 'Music Engine #1 - Top Hits Rotator',
      subtitle: 'Continuous Top 40 Music Stream',
      videoUrl: 'kJQP7kiw5Fk',
      type: 'youtube',
      youtubeType: 'video',
      category: 'music',
      bitrate: 1500,
    },
    {
      id: 'music-machine-2',
      name: 'Music Engine #2 - Afrobeat Central',
      subtitle: 'Non-Stop Afrobeat & Afrobeats',
      videoUrl: '4NRXx6U8abQ',
      type: 'youtube',
      youtubeType: 'video',
      category: 'music',
      bitrate: 1500,
    },
    {
      id: 'music-machine-3',
      name: 'Music Engine #3 - Hip Hop Mix',
      subtitle: 'Rap & Hip Hop 24/7 Stream',
      videoUrl: 'YQHsXMglC9A',
      type: 'youtube',
      youtubeType: 'video',
      category: 'music',
      bitrate: 1500,
    },
    {
      id: 'music-machine-4',
      name: 'Music Engine #4 - Reggae & Dancehall',
      subtitle: 'Island Vibes Continuous Play',
      videoUrl: '5NV6Rdv1a3I',
      type: 'youtube',
      youtubeType: 'video',
      category: 'music',
      bitrate: 1500,
    },
    {
      id: 'music-machine-5',
      name: 'Music Engine #5 - Electronic Dance',
      subtitle: 'EDM & House Music Non-Stop',
      videoUrl: 'sPXnbzVmK2Y',
      type: 'youtube',
      youtubeType: 'video',
      category: 'music',
      bitrate: 1500,
    },
    {
      id: 'music-machine-6',
      name: 'Music Engine #6 - R&B Soul Classics',
      subtitle: 'Soulful R&B Love Songs Stream',
      videoUrl: 'lWA2pjMjpBs',
      type: 'youtube',
      youtubeType: 'video',
      category: 'music',
      bitrate: 1500,
    },
    {
      id: 'music-machine-7',
      name: 'Music Engine #7 - Gospel & Inspirational',
      subtitle: 'Uplifting Gospel Music 24/7',
      videoUrl: 'i9qRDPjzGJM',
      type: 'youtube',
      youtubeType: 'video',
      category: 'music',
      bitrate: 1500,
    },
    {
      id: 'music-machine-8',
      name: 'Music Engine #8 - Rock Anthems',
      subtitle: 'Classic & Modern Rock Stream',
      videoUrl: 'fJ9rUzIMcZQ',
      type: 'youtube',
      youtubeType: 'video',
      category: 'music',
      bitrate: 1500,
    },
    {
      id: 'music-machine-9',
      name: 'Music Engine #9 - Jazz & Soul Lounge',
      subtitle: 'Smooth Jazz Background Mix',
      videoUrl: 'Dx5qF7dYdHQ',
      type: 'youtube',
      youtubeType: 'video',
      category: 'music',
      bitrate: 1500,
    },
    {
      id: 'music-machine-10',
      name: 'Music Engine #10 - Classical Concentration',
      subtitle: 'Beethoven, Mozart, Chopin Stream',
      videoUrl: '9mzWp5zK4yI',
      type: 'youtube',
      youtubeType: 'video',
      category: 'music',
      bitrate: 1500,
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
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [watchBalance, setWatchBalance] = useState<number>(0);
  const [streamHealth, setStreamHealth] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');
  const [selectedBitrate, setSelectedBitrate] = useState<number>(2000);
  const [selectedResolution, setSelectedResolution] = useState<'1080p' | '720p' | '480p' | 'auto'>('auto');
  const [masterWallet, setMasterWallet] = useState<string>('5uYJ3iVSCnCTVA7Nfr25JTCmE8LPyaAziCNGi1P55DRL');
  const [nodeConnection, setNodeConnection] = useState<string>('primary-rpc-01.solana.com');
  const [activityLog, setActivityLog] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const youtubePlayerRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user, refreshUser } = useAppContext();

  const getCurrentChannel = useCallback(() => channels.find((c) => c.id === currentChannel) || channels[0], [currentChannel]);

  const logActivity = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setActivityLog((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  }, []);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

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

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      const player = youtubePlayerRef.current;
      const video = videoRef.current;
      const channel = getCurrentChannel();
      const isYouTube = channel.type === 'youtube';

      const isPlaying = isYouTube
        ? player && player.getPlayerState && player.getPlayerState() === 1
        : video && !video.paused;

      const isVisible = document.visibilityState === 'visible';

      if (isPlaying && isVisible) {
        sendHeartbeat();
      }
    }, 10_000);
  }, [getCurrentChannel]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const loadStream = async (channel: Channel, retry: boolean = false) => {
    const video = videoRef.current;
    if (!video) return;

    destroyHls();
    setIsLoading(true);
    setHasError(false);
    setPlaybackStatus('idle');
    setVideoReady(false);
    setStreamHealth('healthy');

    if (channel.type === 'youtube') {
      setIsLoading(true);
      const loadYouTube = () => {
        initYouTubePlayer(channel);
      };

      if (window.YT && window.YT.Player) {
        loadYouTube();
      } else {
        window.onYouTubeIframeAPIReady = loadYouTube;
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }
      }
      return;
    }

    if (channel.type === 'hls') {
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
          hls.loadSource(channel.videoUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
              setHasError(true);
              setPlaybackStatus('error');
              setStreamHealth('unhealthy');
              setIsLoading(false);
              logActivity(`Stream error: ${data.type} - ${data.details}`);
            }
          });
          hls.on(Hls.Events.FRAG_LOADED, () => {
            setStreamHealth('healthy');
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
        controls: 0,
        playsinline: 1,
        rel: 0,
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        ...(channel.youtubeType === 'playlist' ? { listType: 'playlist', list: channel.videoUrl } : {}),
      },
      events: {
        onReady: (event: any) => {
          event.target.playVideo();
          event.target.mute();
          event.target.setPlaybackQuality('auto');
          setPlaybackStatus('playing');
          setIsLoading(false);
          setVideoReady(true);
          setStreamHealth('healthy');
          startHeartbeat();
          logActivity(`YouTube ready: ${channel.name}`);
        },
        onStateChange: (event: any) => {
          if (event.data === 1) {
            setPlaybackStatus('playing');
            setStreamHealth('healthy');
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
            if (nextChannel.type === 'youtube' || nextChannel.type === 'mp4') {
              setCurrentChannel(nextChannel.id);
            }
          } else if (event.data === 3) {
            setStreamHealth('buffering');
            setIsBuffering(true);
          }
        },
        onError: (event: any) => {
          setHasError(true);
          setPlaybackStatus('error');
          setStreamHealth('unhealthy');
          setIsLoading(false);
          logActivity(`YouTube error: ${event.data}`);
        },
        onPlaybackQualityChange: (event: any) => {
          logActivity(`Quality changed: ${event.data}`);
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
  }, [currentChannel, retryCount, destroyHls, stopHeartbeat, getCurrentChannel]);

  const lastAdTrigger = useRef<number>(0);
  const AD_COOLDOWN = 30000;

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    logActivity('Retry stream triggered');
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

  const currentChannelData = getCurrentChannel();

  const getHealthColor = () => {
    switch (streamHealth) {
      case 'healthy':
        return 'text-emerald-400';
      case 'degraded':
        return 'text-amber-400';
      case 'unhealthy':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getHealthLabel = () => {
    switch (streamHealth) {
      case 'healthy':
        return 'Optimal';
      case 'degraded':
        return 'Degraded';
      case 'unhealthy':
        return 'Unstable';
      default:
        return 'Unknown';
    }
  };

  const renderChannelIcon = (category?: string) => {
    switch (category) {
      case 'news':
        return '📡';
      case 'movies':
        return '🎬';
      case 'series':
        return '📺';
      case 'premium':
        return '✨';
      case 'music':
        return '🎵';
      default:
        return '📺';
    }
  };

  return (
    <section className="exec-panel cyber-card">
      {/* Top-right toolbar with gear icon */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <button
          onClick={() => {
            setIsSettingsOpen(!isSettingsOpen);
            logActivity(isSettingsOpen ? 'Settings closed' : 'Settings opened');
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all duration-500 ease-in-out backdrop-blur-sm"
          aria-label="Executive Settings"
          title="Stream Settings & Telemetry"
        >
          <span className="text-sm">⚙️</span>
        </button>
      </div>

      {/* LIVE indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 text-red-500 font-bold">
        <span>LIVE</span>
        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      </div>

      {/* Animated Header */}
      <div className="mb-6">
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

      {/* Compact Executive Channel Selector Dropdown */}
      <div className="mb-4">
        <button
          onClick={() => setIsChannelOpen(!isChannelOpen)}
          className="flex items-center gap-3 px-4 py-2.5 bg-gray-800/80 text-gray-200 rounded-lg hover:bg-gray-700/80 transition-all duration-500 ease-in-out w-full justify-between border border-gray-700/50 backdrop-blur-sm"
          aria-expanded={isChannelOpen}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{renderChannelIcon(currentChannelData.category)}</span>
            <span className="font-medium text-sm">{currentChannelData.name}</span>
          </div>
          <span
            className="text-gray-400 transition-transform duration-500 ease-in-out"
            style={{ transform: isChannelOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ∨
          </span>
        </button>
        {isChannelOpen && (
          <div className="mt-2 bg-gray-900/95 border border-gray-700/50 rounded-lg overflow-hidden max-h-80 overflow-y-auto backdrop-blur-md">
            <div className="p-2 space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-500 ease-in-out ${
                    currentChannel === channel.id
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-transparent'
                  }`}
                  onClick={() => {
                    setCurrentChannel(channel.id);
                    setIsChannelOpen(false);
                    logActivity(`Channel switched: ${channel.name}`);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{renderChannelIcon(channel.category)}</span>
                    <div>
                      <div className="font-medium text-xs">{channel.name}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{channel.subtitle}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Video Player */}
      <div className="aspect-video bg-black rounded-xl border border-gray-700/50 mb-4 overflow-hidden relative shadow-2xl">
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
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all duration-500 ease-in-out"
              >
                Retry Stream
              </button>
            </div>
          </div>
        )}
        {isBuffering && !hasError && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <span className="text-white/60 text-xs tracking-wider uppercase">Buffering...</span>
          </div>
        )}
      </div>

      {/* Clean bottom control area - ONLY mute toggle */}
      <div className="flex justify-end items-center">
        <button
          onClick={() => {
            setIsMuted(!isMuted);
            logActivity(isMuted ? 'Audio unmuted' : 'Audio muted');
          }}
          className="px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-gray-200 rounded-lg text-sm font-medium transition-all duration-500 ease-in-out border border-gray-700/30 backdrop-blur-sm"
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      {/* Settings Modal / Drawer */}
      {isSettingsOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-500 ease-in-out"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-gray-900/95 border border-gray-700/50 rounded-2xl shadow-2xl backdrop-blur-xl p-6 transition-all duration-500 ease-in-out">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                Executive Stream Settings
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors duration-500 ease-in-out"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Audio Selector */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Audio Track
                </label>
                <div className="flex gap-2">
                  {(['EN', 'KH', 'AI-AUTO'] as const).map((track) => (
                    <button
                      key={track}
                      onClick={() => {
                        setCurrentAudioTrack(track);
                        logActivity(`Audio track: ${track}`);
                      }}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition-all duration-500 ease-in-out ${
                        currentAudioTrack === track
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-transparent'
                      }`}
                    >
                      {track}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stream Health */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Stream Health
                </label>
                <div className={`flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 rounded-lg border border-gray-700/30 ${getHealthColor()}`}>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-current"></span>
                  </span>
                  <span className="text-sm font-medium">{getHealthLabel()}</span>
                  <span className="text-xs text-gray-500 ml-auto">Status: {playbackStatus.toUpperCase()}</span>
                </div>
              </div>

              {/* Bitrate & Resolution */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Target Bitrate
                  </label>
                  <select
                    value={selectedBitrate}
                    onChange={(e) => {
                      setSelectedBitrate(Number(e.target.value));
                      logActivity(`Bitrate: ${e.target.value}kbps`);
                    }}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/30 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50 transition-all duration-500 ease-in-out"
                  >
                    <option value={500}>500 kbps</option>
                    <option value={1000}>1000 kbps</option>
                    <option value={1500}>1500 kbps</option>
                    <option value={2000}>2000 kbps</option>
                    <option value={2500}>2500 kbps</option>
                    <option value={4000}>4000 kbps</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Resolution
                  </label>
                  <select
                    value={selectedResolution}
                    onChange={(e) => {
                      setSelectedResolution(e.target.value as any);
                      logActivity(`Resolution: ${e.target.value}`);
                    }}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/30 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50 transition-all duration-500 ease-in-out"
                  >
                    <option value="auto">Auto</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                  </select>
                </div>
              </div>

              {/* Master Wallet & Node Connection */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Master Wallet (Solana)
                </label>
                <div className="px-3 py-2 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono truncate max-w-[200px]">
                      {masterWallet.slice(0, 8)}...{masterWallet.slice(-8)}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(masterWallet);
                        logActivity('Wallet address copied');
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors duration-500 ease-in-out"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Node Connection
                </label>
                <div className="px-3 py-2 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                  <span className="text-xs text-gray-400 font-mono">{nodeConnection}</span>
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Recent Activity
                </label>
                <div className="bg-gray-800/30 border border-gray-700/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {activityLog.length === 0 ? (
                    <span className="text-xs text-gray-500">No recent activity</span>
                  ) : (
                    <div className="space-y-1">
                      {activityLog.slice(0, 10).map((log, i) => (
                        <div key={i} className="text-xs text-gray-400 font-mono">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </section>
  );
};

export default ExecutiveTVPanel;
