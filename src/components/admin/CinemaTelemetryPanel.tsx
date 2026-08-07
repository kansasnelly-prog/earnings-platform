import React from 'react';

interface TelemetryPanelProps {
  title?: string;
}

const CinemaTelemetryPanel: React.FC<TelemetryPanelProps> = ({ title = 'Cinema Telemetry' }) => {
  const metrics = [
    { label: 'Active Viewers', status: 'active' },
    { label: 'Stream Health', status: 'active' },
    { label: 'Translation Status', status: 'active' },
    { label: 'Current Language', status: 'active' },
    { label: 'Channel Throughput', status: 'active' },
    { label: 'Signal Stability', status: 'active' },
    { label: 'Network Availability', status: 'active' },
    { label: 'Broadcast Status', status: 'active' },
    { label: 'Content Queue', status: 'active' },
    { label: 'AI Monitoring', status: 'active' },
  ];

  const regions = [
    { label: 'North America', status: 'active' },
    { label: 'Europe', status: 'active' },
    { label: 'Asia', status: 'active' },
    { label: 'Africa', status: 'active' },
    { label: 'South America', status: 'active' },
    { label: 'Oceania', status: 'active' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="p-3 bg-white/5 rounded-md flex items-center justify-between text-sm text-gray-300 cyber-card">
            <span>{metric.label}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-md cyber-card">
          <span className="font-medium text-white">Transaction Selector</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-300">USD</span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {regions.map((region, index) => (
            <div key={index} className="p-3 bg-white/5 rounded-md flex items-center justify-between cyber-card">
              <span className="text-sm text-gray-300">{region.label}</span>
              <span className="w-2.5 h-5 rounded-full bg-green-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CinemaTelemetryPanel;
