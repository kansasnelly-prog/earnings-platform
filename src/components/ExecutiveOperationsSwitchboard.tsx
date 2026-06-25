import React from 'react';

/**
 * ExecutiveOperationsSwitchboard – visual panel representing executive command functions.
 * This component is decorative only and uses the exec-panel styling for a premium look.
 * It simulates a luxury aerospace command deck with toggle switches, buttons, and indicators.
 */
const ExecutiveOperationsSwitchboard: React.FC = () => {
  return (
    <section className="exec-panel cyber-card p-4 bg-black-glass rounded-lg ambient-glow animate-cyberGlow">
      <h2 className="text-3xl font-extrabold text-white mb-2">Executive Operations Switchboard</h2>
      <p className="text-base text-gray-300 mb-4">
        Visual controls, toggles, and status relays for the command center.
      </p>

      {/* Master Control Panel */}
      <div className="space-y-4 cyber-card p-4 bg-glassmorphism rounded-xl border border-white/10 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-2">Master Control</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Toggle Switches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>System Power</span>
              <div className="relative w-10 h-5 bg-gray-600 rounded-full">
                <div className="absolute left-0 top-0 h-5 w-5 bg-white/50 rounded-full transform translate-x-5 transition-transform duration-200" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Signal Boost</span>
              <div className="relative w-10 h-5 bg-gray-600 rounded-full">
                <div className="absolute left-0 top-0 h-5 w-5 bg-white/50 rounded-full transform translate-x-5 transition-transform duration-200" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Data Flow</span>
              <div className="relative w-10 h-5 bg-gray-600 rounded-full">
                <div className="absolute left-0 top-0 h-5 w-5 bg-white/50 rounded-full transform translate-x-5 transition-transform duration-200" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Security Lock</span>
              <div className="relative w-10 h-5 bg-gray-600 rounded-full">
                <div className="absolute left-0 top-0 h-5 w-5 bg-white/50 rounded-full transform translate-x-5 transition-transform duration-200" />
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-base text-gray-300">
              <span className="text-base">CPU Load</span>
              <div className="w-10 h-2.5 bg-gray-600 rounded-full">
                <div className="h-2.5 w-1/2 bg-green-500 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span className="text-base">Memory</span>
              <div className="w-10 h-2.5 bg-gray-600 rounded-full">
                <div className="h-2.5 w-3/5 bg-yellow-500 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span className="text-base">Network</span>
              <div className="w-10 h-2.5 bg-gray-600 rounded-full">
                <div className="h-2.5 w-4/5 bg-blue-500 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span className="text-base">Storage</span>
              <div className="w-10 h-2.5 bg-gray-600 rounded-full">
                <div className="h-2.5 w-1/3 bg-red-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Controls */}
      <div className="space-y-4 cyber-card p-4 bg-glassmorphism rounded-xl border border-white/10 shadow-lg">
        <h3 className="font-semibold text-white mb-2">Secondary Controls</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Buttons */}
          <div className="space-y-3">
            <button className="w-full py-2 px-4 bg-white/5 rounded-md text-sm text-gray-300 hover:bg-white/10 transition">
              Initiate Scan
            </button>
            <button className="w-full py-2 px-4 bg-white/5 rounded-md text-sm text-gray-300 hover:bg-white/10 transition">
              Deploy Protocol
            </button>
            <button className="w-full py-2 px-4 bg-white/5 rounded-md text-sm text-gray-300 hover:bg-white/10 transition">
              System Diagnostics
            </button>
            <button className="w-full py-2 px-4 bg-white/5 rounded-md text-sm text-gray-300 hover:bg-white/10 transition">
              Emergency Override
            </button>
          </div>

          {/* Dial Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Frequency</span>
              <div className="relative w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="absolute -rotate-45 w-0.5 h-0.5 bg-white/50" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Amplitude</span>
              <div className="relative w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="absolute -rotate-135 w-0.5 h-0.5 bg-white/50" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Phase</span>
              <div className="relative w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="absolute -rotate-225 w-0.5 h-0.5 bg-white/50" />
              </div>
            </div>
            <div className="flex items-center justify-between text-base text-gray-300">
              <span>Gain</span>
              <div className="relative w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="absolute -rotate-315 w-0.5 h-0.5 bg-white/50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Node Display */}
      <div className="space-y-4 cyber-card p-4 bg-glassmorphism rounded-xl border border-white/10 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-2">Command Node Display</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Node Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Node Alpha</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            </div>
          </div>

          {/* Node Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Latency</span>
              <span className="monospace">12ms</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Throughput</span>
              <span className="monospace">1.2 Gbps</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Error Rate</span>
              <span className="monospace">0.01%</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Uptime</span>
              <span className="monospace">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExecutiveOperationsSwitchboard;
