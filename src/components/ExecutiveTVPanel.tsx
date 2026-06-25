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
    <section className="exec-panel">
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
        {['English TV', 'Khmer TV', 'Historical Movies', 'WWE Action', 'Seasonal Events', 'Special Broadcasts'].map((label) => (
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
      <div className="aspect-video bg-black/30 rounded-md border border-gray-600 flex items-center justify-center text-gray-500">
        <span>TV Stream Placeholder</span>
      </div>
    </section>
  );
};

export default ExecutiveTVPanel;
