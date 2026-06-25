import React from 'react';

/**
 * InfrastructureWiringMatrix – visual representation of the platform's digital backbone.
 * This component is purely decorative and contains no business logic.
 * It uses the exec-panel styling for a black‑glass appearance.
 */
const InfrastructureWiringMatrix: React.FC = () => {
  return (
    <section className="exec-panel cyber-card">
      <h2 className="text-2xl font-bold text-white mb-2">Infrastructure Wiring Matrix</h2>
      <p className="text-sm text-gray-300 mb-4">
        Visual map of data flow, AI nodes, and network pathways.
      </p>
      {/* Placeholder for a futuristic network diagram with animated connections */}
      <div className="relative h-96 bg-black/50 rounded-md overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,170,0,0.05)_10px,rgba(255,170,0,0.05)_20px)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,rgba(255,170,0,0.05)_10px,rgba(255,170,0,0.05)_20px)] opacity-50" />
        </div>
        
        {/* Nodes */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Node 1 */}
            <div className="absolute -z-10 left-0 top-0 w-8 h-8 bg-gradient-to-r-from-cyan-400-via-blue-500-to-indigo-600 rounded-full shadow-[0_0_15px_5px_rgba(0,191,255,0.5)] animate-pulse cyber-card" />
            {/* Node 2 */}
            <div className="absolute -z-10 right-0 top-0 w-8 h-8 bg-gradient-to-r-from-emerald-400-via-green-500-to-lime-600 rounded-full shadow-[0_0_15px_5px_rgba(76,175,80,0.5)] animate-pulse cyber-card" />
            {/* Node 3 */}
            <div className="absolute -z-10 left-0 bottom-0 w-8 h-8 bg-gradient-to-r-from-pink-400-via-rose-500-to-red-600 rounded-full shadow-[0_0_15px_5px_rgba(255,105,180,0.5)] animate-pulse cyber-card" />
            {/* Node 4 */}
            <div className="absolute -z-10 right-0 bottom-0 w-8 h-8 bg-gradient-to-r-from-purple-400-via-violet-500-to-indigo-6   rounded-full shadow-[0_0_15px_5px_rgba(138,43,226,0.5)] animate-pulse cyber-card" />
            {/* Center Node */}
            <div className="absolute -z-10 inset-0 m-auto w-12 h-12 bg-gradient-to-r-from-yellow-400-via-amber-500-to-orange-600 rounded-full shadow-[0_0_20px_5px_rgba(255,165,0,0.7)] animate-pulse cyber-card" />
          </div>
        </div>
        
        {/* Connection lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-0 w-1/2 h-1/2 bg-gradient-to-br-from-transparent-via-rgba(255,170,0,0.1)_to-transparent" />
          <div className="absolute right-0 top-0 w-1/2 h-1/2 bg-gradient-to-bl-from-transparent-via-rgba(255,170,0,0.1)_to-transparent" />
          <div className="absolute left-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-tr-from-transparent-via-rgba(255,170,0,0.1)_to-transparent" />
          <div className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-tl-from-transparent-via-rgba(255,170,0,0.1)_to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default InfrastructureWiringMatrix;