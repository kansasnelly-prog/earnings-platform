 import React, { useState, useEffect, useRef } from 'react';
// import { Circle } from 'lucide-react'; // Unused import removed
import './ExecutiveVisuals.css';

/**
 * ExecutiveTVPanel – visual panel for the "LIVE NELLY'S TV" streaming theatre.
 * This component is purely decorative and does not contain any business logic.
 * It follows the black‑glass styling guidelines and uses the cyberGlow7 animation.
 */
 const ExecutiveTVPanel: React.FC = () => {
   // Channel definitions
   const channels = [
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
      {/* Header */}
      <h2 className="text-2xl font-bold text-white mb-2">NELLY'S TV</h2>
      <p className="text-sm text-gray-300 mb-4">Executive Streaming Theatre</p>
       {/* Channel Selector */}
       <nav className="flex gap-2 mb-4">
         {channels.map((channel) => (
           <button
             key={channel.id}
             className={`px-3 py-1 text-sm font-medium rounded transition ${
               currentChannel === channel.id
                 ? 'bg-green-600 text-white'
                 : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
             }`}
             onClick={() => setCurrentChannel(channel.id)}
           >
             {channel.name}
           </button>
         ))}
       </nav>
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
          onClick={() => setIsMuted(!isMuted)}
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
      {/* AI Stream Intelligence Deck */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* We'll create 10 placeholder cards for the intelligence deck */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="p-3 bg-white/5 rounded-md flex items-center justify-between text-sm text-gray-300 cyber-card">
            <span>
              {[ 
                'Active Viewers', 
                'Stream Health', 
                'Translation Status', 
                'Current Language', 
                'Channel Throughput', 
                'Signal Stability', 
                'Network Availability', 
                'Broadcast Status', 
                'Content Queue', 
                'AI Monitoring'
              ][i-1]}
            </span>
            <div className="flex items-center gap-2">
              {/* Status indicator - we'll use colors based on index for variety */}
              <span className={`w-2.5 h-2.5 rounded-full ${ 
                i <= 3 ? 'bg-green-500' : 
                i <= 6 ? 'bg-yellow-500' : 
                i <= 9 ? 'bg-blue-500' : 
                'bg-red-500'
              }`} />
            </div>
          </div>
        ))}
      </div>
      {/* AI Multi-Language Pay Master Matrix */}
      <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-md cyber-card">
          <span className="font-medium text-white">Transaction Selector</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300">USD</span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Regional activity indicators */}
          {[ 
            { label: 'North America', status: 'active' }, 
            { label: 'Europe', status: 'active' }, 
            { label: 'Asia', status: 'active' }, 
            { label: 'Africa', status: 'active' }, 
            { label: 'South America', status: 'active' }, 
            { label: 'Oceania', status: 'active' } 
          ].map((region, index) => (
               <div key={index} className="p-3 bg-white/5 rounded-md flex items-center justify-between cyber-card">
              <span className="text-sm text-gray-300">{region.label}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${ 
                region.status === 'active' ? 'bg-green-500' : 
                region.status === 'warning' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExecutiveTVPanel;