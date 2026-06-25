import React, { useState } from 'react';

export const TikTok6MonetizationCockpit: React.FC = () => {
  const [engines] = useState([
    { id: '01', name: 'Real-Time Bidder', status: 'online', telemetry: 'TPS: 1200', latency: '12ms' },
    { id: '02', name: 'Ad Delivery Engine', status: 'online', telemetry: 'Impressions: 3.2M', latency: '15ms' },
    { id: '03', name: 'Data Sync Processor', status: 'maintenance', telemetry: 'Sync Lag: 5s', latency: 'N/A' },
    { id: '04', name: 'User Matching Engine', status: 'online', telemetry: 'Matches/sec: 450', latency: '9ms' },
    { id: '05', name: 'Revenue Optimizer', status: 'offline', telemetry: 'Revenue: $0', latency: 'N/A' },
    { id: '06', name: 'Ad Payload Injector', status: 'online', telemetry: 'Payloads: 800', latency: '11ms' },
  ]);

  const [machines] = useState([
    { id: 1, name: 'Machine 1', status: 'active', referralCode: 'SOLAR-CORE-A' },
    { id: 2, name: 'Machine 2', status: 'active', referralCode: 'SOLAR-CORE-B' },
    { id: 3, name: 'Machine 3', status: 'active', referralCode: 'SOLAR-CORE-A' },
    { id: 4, name: 'Machine 4', status: 'active', referralCode: 'SOLAR-CORE-B' },
    { id: 5, name: 'Machine 5', status: 'active', referralCode: 'SOLAR-CORE-A' },
    { id: 6, name: 'Machine 6', status: 'active', referralCode: 'SOLAR-CORE-B' },
  ]);

  const handleHandshake = (id: string) => {
    console.log(`Executing active payload handshake for Engine ${id}...`);
  };

  return (
    <div style={styles.outerKingdom}>
      <div style={styles.undergroundWiring}></div>
      <div style={styles.panelContainer}>
        <nav style={styles.navBar}>
          <div style={styles.navLeft}>
            <span style={styles.navItem}>❖ Overview</span>
            <span style={styles.navItem}>👥 Users</span>
            <span style={styles.navItem}>📦 Product Catalog</span>
            <span style={{ ...styles.navItem, ...styles.activeNav }}>♥ TikTok6 Match</span>
            <span style={styles.navItem}>⚙ Settings</span>
          </div>
        </nav>

        <header style={styles.header}>
          <h1 style={styles.mainTitle}>TikTok6 Monetization Cockpit</h1>
        </header>

        <section style={styles.engineGrid}>
          {engines.map((engine) => (
            <div key={engine.id} style={styles.engineCard}>
              <div style={styles.engineHeader}>
                Engine {engine.id}: {engine.name}
              </div>
              <div style={styles.engineBody}>
                <div style={styles.telemetryLine}>
                  Status:{' '}
                  <span style={styles.statusBadge(engine.status)}>
                    {engine.status.toUpperCase()}
                  </span>
                </div>
                <div style={styles.telemetryLine}>Telemetry: {engine.telemetry}</div>
                <div style={styles.telemetryLine}>Latency: {engine.latency}</div>
              </div>
              <button 
                onClick={() => handleHandshake(engine.id)} 
                style={styles.handshakeButton}
              >
                Execute Payload Handshake
              </button>
              <div style={styles.sharpCrystalBlink(engine.status)}></div>
            </div>
          ))}
        </section>

        <section style={styles.machineSection}>
          <h2 style={styles.sectionTitle}>Monetization Machines (Solar Backplane Shared System)</h2>
          <div style={styles.machineGrid}>
            {machines.map((machine) => (
              <div key={machine.id} style={styles.machineCard}>
                <div style={styles.machineInfo}>
                  <div style={styles.machineName}>{machine.name}</div>
                  <div style={styles.machineStatus}>Status: {machine.status}</div>
                </div>
                <div style={styles.referralBadge}>Ref: {machine.referralCode}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const styles: { [key: string]: any } = {
  outerKingdom: {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#0c101b',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '20px',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  },
  undergroundWiring: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
    background: `
      linear-gradient(135deg, rgba(255, 0, 128, 0.08) 0%, transparent 35%),
      linear-gradient(215deg, rgba(0, 255, 255, 0.08) 15%, transparent 45%),
      linear-gradient(45deg, rgba(128, 0, 255, 0.06) 30%, transparent 60%),
      linear-gradient(315deg, rgba(0, 255, 0, 0.06) 45%, transparent 70%),
      linear-gradient(90deg, rgba(255, 255, 0, 0.05) 60%, transparent 80%),
      linear-gradient(180deg, rgba(255, 128, 0, 0.05) 75%, transparent 90%),
      linear-gradient(270deg, rgba(0, 0, 255, 0.08) 90%, transparent 100%)
    `,
    boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)',
  },
  panelContainer: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '1600px',
    margin: '0 auto',
    background: 'rgba(16, 22, 37, 0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  },
  navBar: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '16px',
    marginBottom: '24px',
  },
  navLeft: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  navItem: {
    color: '#8a99ad',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  activeNav: {
    color: '#3b82f6',
    borderBottom: '2px solid #3b82f6',
    paddingBottom: '14px',
  },
  header: {
    marginBottom: '28px',
  },
  mainTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    letterSpacing: '0.5px',
    margin: 0,
    textShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
  },
  engineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  engineCard: {
    position: 'relative',
    background: 'rgba(9, 14, 26, 0.85)',
    border: '1px solid rgba(0, 255, 255, 0.15)',
    borderRadius: '12px',
    padding: '20px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  engineHeader: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '14px',
  },
  engineBody: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    marginBottom: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  telemetryLine: {
    letterSpacing: '0.3px',
    fontWeight: '500',
  },
  statusBadge: (status: string) => ({
    color: status === 'online' ? '#10b981' : status === 'maintenance' ? '#f59e0b' : '#ef4444',
    fontWeight: '800',
    textShadow: status === 'online' ? '0 0 8px rgba(16, 185, 129, 0.4)' : '0 0 8px rgba(245, 158, 11, 0.4)',
  }),
  handshakeButton: {
    background: '#1e1b4b',
    color: '#c7d2fe',
    border: '1px solid #3730a3',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s ease',
  },
  sharpCrystalBlink: (status: string) => ({
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: status === 'online' ? '#10b981' : status === 'maintenance' ? '#f59e0b' : '#ef4444',
    boxShadow: status === 'online' ? '0 0 10px #10b981' : '0 0 10px #f59e0b',
  }),
  machineSection: {
    marginTop: '24px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#f8fafc',
  },
  machineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  machineCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '16px 20px',
  },
  machineInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  machineName: {
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  machineStatus: {
    fontSize: '0.85rem',
    color: '#10b981',
  },
  referralBadge: {
    fontSize: '0.75rem',
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#60a5fa',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(59, 130, 246, 0.2)',
  }
};
