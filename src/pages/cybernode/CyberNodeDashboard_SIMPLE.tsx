import React, { useEffect, useState } from 'react';

const GRAM_USD_RATE = 1.35;
const MIN_WITHDRAWAL = 2.00;

function formatGram(val: number): string {
  return Number(val).toFixed(6);
}

export default function CyberNodeDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate async data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setError(null);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
    </div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white p-4 md:p-6">
      <div className="text-center py-8">
        <h1 className="text-4xl font-extrabold text-cyan-400">CyberNode Dashboard</h1>
        <p className="text-xl text-gray-400 mt-4">
          Your wallet balance: <span className="text-cyan-400">{15.5}</span> GRAM
        </p>
      </div>
    </div>
  );
}