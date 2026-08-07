 import React, { useState, useEffect, useRef } from 'react';
// import { Circle } from 'lucide-react'; // Unused import removed
import './ExecutiveVisuals.css';
import { ExoClickAds, StickyFooterBanner, NativeContentWidget, PropellerAdsScript, PPVModal, AffiliateBanner } from '../components/monetization/CinemaMonetization';

/**
 * ExecutiveTVPanel – visual panel for the "LIVE NELLY'S TV" streaming theatre.
 * This component is purely decorative and does not contain any business logic.
 * It follows the black‑glass styling guidelines and uses the cyberGlow7 animation.
 */
 const ExecutiveTVPanel: React.FC = () => {
   // Channel definitions
   const channels = [
    {
      id: 'aljazeera',
      name: 'Al Jazeera English',
      subtitle: '24/7 Global Coverage & Documentary Investigative Reporting',
      videoUrl: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8',
    },
    {
      id: 'wwe',
      name: 'WWE',
      subtitle: 'WWE SEASONAL ACTION MATRIX',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    {
      id: 'en',
      name: 'ENGLISH',
      subtitle: 'HOLLYWOOD PREMIUM BLOCKBUSTER FEED',
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    },
    {
      id: 'kh',
      name: 'KHMER',
      subtitle: 'KHMER LOCALIZED CINEMA NETWORK',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    },
    {
      id: 'france24',
      name: 'France 24 English',
      subtitle: 'Global News Streaming - North African & European Geopolitics',
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    },
    {
      id: 'dwnews',
      name: 'DW News',
      subtitle: 'In-Depth Documentary Reporting, Global Economics & Tech/AI Shifts',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    },
    {
      id: 'trtworld',
      name: 'TRT World',
      subtitle: 'Regional Analysis - Middle East/Africa Coverage & Global Event Breakdown',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    {
      id: 'cgtndoc',
      name: 'CGTN Documentary',
      subtitle: 'Global Infrastructure, Technology Evolution & International History',
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    },
    {
      id: 'euronews',
      name: 'Euronews English',
      subtitle: 'European Perspective on Global Affairs, Economic Changes & Border Dynamics',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    },
    {
      id: 'cheddar',
      name: 'Cheddar News',
      subtitle: 'Next-Gen Financial News, AI Tech Innovations & Media Trends',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
    {
      id: 'bloomberg',
      name: 'Bloomberg TV FAST',
      subtitle: 'Real-Time Financial Markets, Tech Disruptors & Global Macroeconomic Trends',
      videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    },
    {
      id: 'pbs',
      name: 'PBS NewsHour / Frontline',
      subtitle: 'Award-Winning Investigative Reporting on Social, Political & Tech Shifts',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    },
    {
      id: 'rtve',
      name: 'RTVE Play / TV5Monde Info',
      subtitle: 'Francophone and Hispanic Global News Streams for International Reach',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    },
  ];

  const [currentChannel, setCurrentChannel] = useState<string>(channels[0].id);
  const [playbackStatus, setPlaybackStatus] = useState<'idle' | 'playing' | 'paused' | 'ended'>('idle');
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
  const videoRef = useRef<HTMLVideoElement>(null);

   // Event handlers
  const handleLoadedData = () => {
    setIsLoading(false);
    setVideoReady(true);
  };
  const handleCanPlay = () => setIsBuffering(false);
  const handleWaiting = () => setIsBuffering(true);
  const handlePlaying = () => setPlaybackStatus('playing');
  const handlePause = () => setPlaybackStatus('paused');
  const handleEnded = () => setPlaybackStatus('ended');
  const handleError = () => setHasError(true);
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setPlaybackTime(e.currentTarget.currentTime);
  };
  const handleDurationChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration);
  };
  const triggerPropellerAds = () => {
    const event = new Event('propellerads-interaction');
    window.dispatchEvent(event);
  };

   // Switch video source when channel changes
   useEffect(() => {
     const video = videoRef.current;
     if (video) {
       setIsLoading(true);
       setHasError(false);
       video.load();
       video.play().catch(() => {});
     }
   }, [currentChannel]);
   return (
     <section className="exec-panel cyber-card">
       {/* Floating LIVE indicator */}
       <div className="absolute top-4 left-4 flex items-center gap-2 text-red-500 font-bold">
         <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
         <span>LIVE</span>
       </div>
       {/* Animated Header */}
       <div className="mb-4">
         <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent animate-pulse">
           NELLY&apos;S TV
         </h2>
         <p className="text-xs text-gray-400 tracking-widest uppercase mt-1">
           Executive Optimized Cinema Suites Globally
         </p>
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
            <span className="font-medium">
              {channels.find((c) => c.id === currentChannel)?.name || 'Select Channel'}
            </span>
            <span className="text-gray-400 transition-transform duration-200" style={{ transform: isChannelOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              v
            </span>
          </button>
          {isChannelOpen && (
            <div className="mt-2 bg-gray-900 border border-gray-700 rounded-md overflow-hidden">
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
         <video
           ref={videoRef}
           src={channels.find((c) => c.id === currentChannel)?.videoUrl}
           className="w-full h-full object-cover"
           muted={isMuted}
           loop
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
         {isLoading && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/50">
             <span className="text-white">Loading...</span>
           </div>
         )}
         {hasError && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/70">
             <span className="text-red-400">Failed to load video</span>
           </div>
         )}
         </div>
       {/* Status Bar */}
       <div className="flex justify-between items-center text-sm text-gray-300 mb-4">
         <span>Channel: {channels.find((c) => c.id === currentChannel)?.name}</span>
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