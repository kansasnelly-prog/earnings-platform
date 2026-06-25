import React from 'react';
import { Circle } from 'lucide-react';
import './ExecutiveVisuals.css';

/**
 * ExecutiveTVPanel – visual panel for the "LIVE NELLY'S TV" streaming theatre.
 * This component is purely decorative and does not contain any business logic.
 * It follows the black‑glass styling guidelines and uses the cyberGlow7 animation.
 */
const ExecutiveTVPanel: React.FC = () => {
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
      {/* Tab navigation – visual placeholders only */}
      <nav className="flex flex-wrap gap-2 mb-4">
        {['English TV Stations', 'Khmer TV Streams', 'Historical Movies', 'WWE Action', 'Seasonal Events', 'Special Broadcasts'].map((label) => (
          <button
            key={label}
            className="px-3 py-1 text-xs text-gray-300 border border-gray-600 rounded hover:bg-gray-800 transition"
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>
      {/* TV viewport placeholder */}
      <div className="aspect-video bg-black/30 rounded-md border border-gray-600 flex items-center justify-center text-gray-500 mb-4">
        <span>TV Stream Placeholder</span>
      </div>
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