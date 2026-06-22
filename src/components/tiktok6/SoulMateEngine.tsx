import React, { useState, useEffect } from 'react';

const SoulMateEngine: React.FC = () => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [matching, setMatching] = useState(false);

  const startMatching = () => {
    setMatching(true);
    setCountdown(9);
  };

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setMatching(false);
      setCountdown(null);
    }
  }, [countdown]);

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 opacity-50 z-0"></div>
      
      <div className="relative z-10 text-center">
        <h1 className="text-4xl font-bold mb-8 neon-text">Soul Mate Engine</h1>
        
        {matching ? (
          <div className="text-8xl font-bold text-red-500 animate-pulse">
            {countdown}
          </div>
        ) : (
          <button 
            onClick={startMatching}
            className="group relative px-8 py-4 bg-red-600 rounded-full text-2xl font-bold hover:bg-red-700 transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.7)]"
          >
            ❤️ Soul Mate
            <span className="absolute inset-0 rounded-full group-hover:ring-4 ring-white animate-ping opacity-20"></span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SoulMateEngine;
