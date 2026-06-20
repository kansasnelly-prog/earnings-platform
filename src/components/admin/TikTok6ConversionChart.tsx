import React, { useState, useEffect, useCallback } from 'react';

/**
 * TikTok6 Product Conversion Tracker Chart
 * Animated bar/timeline visualization of dual-pipeline $5.00 cash flows
 * and NC COINS accumulation across 50+ country jurisdictions.
 */

interface CountryData {
  code: string;
  name: string;
  flag: string;
  ncCoins: number;
  pipelineAlpha: number;
  pipelineBeta: number;
  growth: number;
}

const JURISDICTIONS: CountryData[] = [
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', ncCoins: 0, pipelineAlpha: 0, pipelineBeta: 0, growth: 0 },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', ncCoins: 0, pipelineAlpha: 0, pipelineBeta: 0, growth: 0 },
  { code: 'US', name: 'United States', flag: '🇺🇸', ncCoins: 0, pipelineAlpha: 0, pipelineBeta: 0, growth: 0 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', ncCoins: 0, pipelineAlpha: 0, pipelineBeta: 0, growth: 0 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', ncCoins: 0, pipelineAlpha: 0, pipelineBeta: 0, growth: 0 },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', ncCoins: 0, pipelineAlpha: 0, pipelineBeta: 0, growth: 0 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', ncCoins: 0, pipelineAlpha: 0, pipelineBeta: 0, growth: 0 },
];

const NC_PRICE_USD = 0.014;
const PIPELINE_CYCLE_MS = 30000; // 30-second dual-pipe minting cycle
const ALPHA_RATE = 5.0; // $5 USDT Alpha per cycle
const BETA_RATE = 5.0;  // $5 USDT Beta per cycle

export default function TikTok6ConversionChart() {
  const [countries, setCountries] = useState<CountryData[]>(JURISDICTIONS);
  const [totalNcCoins, setTotalNcCoins] = useState(0);
  const [totalUsdtAccumulated, setTotalUsdtAccumulated] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [activeBarIndex, setActiveBarIndex] = useState(-1);

  // Simulate dual-pipeline cash flow accumulation
  const tickCycle = useCallback(() => {
    setCountries(prev =>
      prev.map((country, i) => {
        // Distribute pipeline yields across countries with slight variance
        const variance = 0.7 + Math.random() * 0.6; // 0.7x - 1.3x
        const alphaShare = (ALPHA_RATE / JURISDICTIONS.length) * variance;
        const betaShare = (BETA_RATE / JURISDICTIONS.length) * variance;
        const combinedUsdt = alphaShare + betaShare;
        const ncGenerated = combinedUsdt / NC_PRICE_USD;

        return {
          ...country,
          pipelineAlpha: country.pipelineAlpha + alphaShare,
          pipelineBeta: country.pipelineBeta + betaShare,
          ncCoins: country.ncCoins + ncGenerated,
          growth: variance > 1.0 ? 1 : variance < 0.9 ? -1 : 0,
        };
      })
    );
    setCycleCount(c => c + 1);
  }, []);

  // 30-second dual-pipe minting interval
  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(tickCycle, PIPELINE_CYCLE_MS);
    return () => clearInterval(interval);
  }, [isAnimating, tickCycle]);

  // Recalculate totals
  useEffect(() => {
    const total = countries.reduce((sum, c) => sum + c.ncCoins, 0);
    setTotalNcCoins(total);
    setTotalUsdtAccumulated(total * NC_PRICE_USD);
  }, [countries]);

  // Animate active bar highlight
  useEffect(() => {
    if (!isAnimating) return;
    const interval = setInterval(() => {
      setActiveBarIndex(prev => (prev + 1) % countries.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isAnimating, countries.length]);

  const maxNc = Math.max(...countries.map(c => c.ncCoins), 1);

  return (
    <div className="mt-4 space-y-4">
      {/* Pipeline Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAnimating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
          <span className="text-xs text-slate-400 font-mono">
            {isAnimating ? 'LIVE DUAL-PIPE STREAM' : 'PAUSED'}
          </span>
        </div>
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className="text-xs px-2 py-1 rounded-md bg-slate-800 border border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all"
        >
          {isAnimating ? '⏸ Pause' : '▶ Resume'}
        </button>
      </div>

      {/* Dual-Pipeline Flow Indicators */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-400 font-mono">ALPHA PIPE</span>
            <span className="text-xs text-blue-300 font-mono">${ALPHA_RATE.toFixed(2)} USDT</span>
          </div>
          <div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000"
              style={{ width: `${((cycleCount * ALPHA_RATE) % 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-purple-400 font-mono">BETA PIPE</span>
            <span className="text-xs text-purple-300 font-mono">${BETA_RATE.toFixed(2)} USDT</span>
          </div>
          <div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000"
              style={{ width: `${((cycleCount * BETA_RATE) % 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Animated Bar Chart — NC COINS by Jurisdiction */}
      <div className="space-y-1.5">
        {countries.map((country, index) => {
          const barWidth = maxNc > 0 ? (country.ncCoins / maxNc) * 100 : 0;
          const isActive = activeBarIndex === index;

          return (
            <div
              key={country.code}
              className={`group relative rounded-lg p-1.5 transition-all duration-500 ${
                isActive
                  ? 'bg-slate-800/80 border border-pink-500/30 shadow-lg shadow-pink-500/5'
                  : 'bg-slate-800/30 border border-transparent hover:border-slate-700/50'
              }`}
            >
              {/* Country Label Row */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{country.flag}</span>
                  <span className="text-[10px] text-slate-300 font-medium">{country.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{country.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  {country.growth > 0 && (
                    <span className="text-[9px] text-emerald-400">▲</span>
                  )}
                  {country.growth < 0 && (
                    <span className="text-[9px] text-amber-400">▼</span>
                  )}
                  <span className="text-[10px] text-pink-300 font-mono font-semibold">
                    {country.ncCoins.toFixed(0)} NC
                  </span>
                </div>
              </div>

              {/* Animated Bar */}
              <div className="h-2 bg-slate-900/80 rounded-full overflow-hidden relative">
                {/* Alpha pipeline layer (blue) */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600/60 to-blue-500/40 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(country.pipelineAlpha / (maxNc * NC_PRICE_USD * 2)) * 100}%`,
                  }}
                ></div>
                {/* Beta pipeline layer (purple) */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600/40 to-purple-500/30 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${((country.pipelineAlpha + country.pipelineBeta) / (maxNc * NC_PRICE_USD * 2)) * 100}%`,
                  }}
                ></div>
                {/* NC COINS total bar (pink accent) */}
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-rose-400 shadow-md shadow-pink-500/30'
                      : 'bg-gradient-to-r from-pink-600/80 to-rose-500/60'
                  }`}
                  style={{ width: `${barWidth}%` }}
                ></div>
                {/* Shimmer effect on active bar */}
                {isActive && (
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full animate-[shimmer_2s_infinite]"
                    style={{ width: `${barWidth}%` }}
                  ></div>
                )}
              </div>

              {/* Pipeline breakdown tooltip on hover */}
              <div className="flex items-center justify-between mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] text-blue-400/70 font-mono">
                  α: ${country.pipelineAlpha.toFixed(2)}
                </span>
                <span className="text-[8px] text-purple-400/70 font-mono">
                  β: ${country.pipelineBeta.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aggregate Totals Footer */}
      <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Total NC COINS</span>
          <span className="text-sm text-pink-300 font-mono font-bold">
            {totalNcCoins.toLocaleString(undefined, { maximumFractionDigits: 0 })} NC
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">USDT Value</span>
          <span className="text-sm text-emerald-300 font-mono font-bold">
            ${totalUsdtAccumulated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Cycle Count</span>
          <span className="text-xs text-slate-300 font-mono">{cycleCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">NC Price</span>
          <span className="text-xs text-amber-300 font-mono">${NC_PRICE_USD.toFixed(3)} USD</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Jurisdictions</span>
          <span className="text-xs text-slate-300 font-mono">{countries.length} Active</span>
        </div>
      </div>

      {/* 50+ Countries Footprint Note */}
      <div className="text-center">
        <p className="text-[9px] text-slate-500 font-mono">
          Tracking {countries.length} of 50+ global jurisdictions • NC COINS conversion at ${NC_PRICE_USD}/coin
        </p>
      </div>
    </div>
  );
}