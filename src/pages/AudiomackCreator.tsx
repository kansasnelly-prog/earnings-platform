import React, { useState, useEffect } from 'react';

type AuthView = 'login' | 'creator';
type EditorTab = 'tracks' | 'arrange' | 'publish';

export const AudiomackCreator: React.FC = () => {
  const [authView, setAuthView] = useState<AuthView>('login');
  const [editorTab, setEditorTab] = useState<EditorTab>('tracks');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tracks, setTracks] = useState([
    { id: '1', title: 'Executive Anthem', bpm: 140, key: 'C minor', duration: '3:42', status: 'Draft' },
    { id: '2', title: 'Neon Dynasty', bpm: 128, key: 'A major', duration: '4:15', status: 'Published' },
    { id: '3', title: 'Phantom Waves', bpm: 95, key: 'G major', duration: '5:01', status: 'Review' },
  ]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (email && password) {
      setAuthView('creator');
    } else {
      setLoginError('Please enter both email and password.');
    }
    setIsLoggingIn(false);
  };

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) || null;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #050811 0%, #0a0e1a 50%, #0e1225 100%)', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '24px' }}>
      <style>{`
        @keyframes rainbowTextShift {
          0%   { color: #ff0055; text-shadow: 0 0 12px #ff0055, 0 0 24px rgba(255, 0, 85, 0.6); }
          20%  { color: #ff8800; text-shadow: 0 0 12px #ff8800, 0 0 24px rgba(255, 136, 0, 0.6); }
          40%  { color: #00ff66; text-shadow: 0 0 12px #00ff66, 0 0 24px rgba(0, 255, 102, 0.6); }
          60%  { color: #00ccff; text-shadow: 0 0 12px #00ccff, 0 0 24px rgba(0, 204, 255, 0.6); }
          80%  { color: #9900ff; text-shadow: 0 0 12px #9900ff, 0 0 24px rgba(153, 0, 255, 0.6); }
          100% { color: #ff0055; text-shadow: 0 0 12px #ff0055, 0 0 24px rgba(255, 0, 85, 0.6); }
        }
        @keyframes rainbowBorderGlow {
          0%   { border-color: #ff0055; box-shadow: 0 0 18px rgba(255, 0, 85, 0.5), inset 0 0 10px rgba(255, 0, 85, 0.2); }
          20%  { border-color: #ff8800; box-shadow: 0 0 18px rgba(255, 136, 0, 0.5), inset 0 0 10px rgba(255, 136, 0, 0.2); }
          40%  { border-color: #00ff66; box-shadow: 0 0 18px rgba(0, 255, 102, 0.5), inset 0 0 10px rgba(0, 255, 102, 0.2); }
          60%  { border-color: #00ccff; box-shadow: 0 0 18px rgba(0, 204, 255, 0.5), inset 0 0 10px rgba(0, 204, 255, 0.2); }
          80%  { border-color: #9900ff; box-shadow: 0 0 18px rgba(153, 0, 255, 0.5), inset 0 0 10px rgba(153, 0, 255, 0.2); }
          100% { border-color: #ff0055; box-shadow: 0 0 18px rgba(255, 0, 85, 0.5), inset 0 0 10px rgba(255, 0, 85, 0.2); }
        }
        .executive-rainbow-border {
          background-color: #060913 !important;
          border: 2px solid #ff0055 !important;
          animation: rainbowBorderGlow 3s infinite linear !important;
        }
        .executive-rainbow-text {
          animation: rainbowTextShift 3s infinite linear !important;
        }
      `}</style>

      {authView === 'login' ? (
        <div style={{ maxWidth: '420px', margin: '80px auto', padding: '32px', borderRadius: '20px', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 className="executive-rainbow-text" style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>Audiomack Creator</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '8px' }}>Sign in to manage your music worldwide</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '6px', display: 'block' }}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@audiomack.com"
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '6px', display: 'block' }}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}
              />
            </div>

            {loginError && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>{loginError}</div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="executive-rainbow-border"
              style={{ padding: '14px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: isLoggingIn ? 'not-allowed' : 'pointer', background: '#0f172a', border: '2px solid' }}
            >
              {isLoggingIn ? 'Authenticating...' : 'Sign In to Creator Studio'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
            Protected by executive authentication layer. All access is logged.
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div>
              <h1 className="executive-rainbow-text" style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>Audiomack Creator Studio</h1>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px' }}>Edit, build, and arrange your music worldwide.</p>
            </div>
            <button
              onClick={() => setAuthView('login')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Sign Out
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {(['tracks', 'arrange', 'publish'] as EditorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setEditorTab(tab)}
                className={editorTab === tab ? 'executive-rainbow-border' : ''}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: editorTab === tab ? '2px solid' : '1px solid #1e293b',
                  background: editorTab === tab ? '#1d4ed8' : '#0f172a',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'tracks' ? '🎵 Tracks' : tab === 'arrange' ? '🧩 Arrange' : '🚀 Publish'}
              </button>
            ))}
          </div>

          {editorTab === 'tracks' && (
            <div className="executive-rainbow-border" style={{ borderRadius: '16px', padding: '20px', background: 'rgba(15, 23, 42, 0.85)' }}>
              <h2 className="executive-rainbow-text" style={{ marginTop: 0, marginBottom: '16px' }}>Your Tracks</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '10px', color: '#94a3b8' }}>Title</th>
                    <th style={{ textAlign: 'left', padding: '10px', color: '#94a3b8' }}>BPM</th>
                    <th style={{ textAlign: 'left', padding: '10px', color: '#94a3b8' }}>Key</th>
                    <th style={{ textAlign: 'left', padding: '10px', color: '#94a3b8' }}>Duration</th>
                    <th style={{ textAlign: 'left', padding: '10px', color: '#94a3b8' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tracks.map((track) => (
                    <tr
                      key={track.id}
                      onClick={() => setSelectedTrackId(track.id)}
                      style={{
                        cursor: 'pointer',
                        background: selectedTrackId === track.id ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{track.title}</td>
                      <td style={{ padding: '10px' }}>{track.bpm}</td>
                      <td style={{ padding: '10px' }}>{track.key}</td>
                      <td style={{ padding: '10px' }}>{track.duration}</td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: track.status === 'Published' ? 'rgba(16, 185, 129, 0.2)' : track.status === 'Review' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                            color: track.status === 'Published' ? '#10b981' : track.status === 'Review' ? '#facc15' : '#94a3b8',
                          }}
                        >
                          {track.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {editorTab === 'arrange' && (
            <div className="executive-rainbow-border" style={{ borderRadius: '16px', padding: '20px', background: 'rgba(15, 23, 42, 0.85)' }}>
              <h2 className="executive-rainbow-text" style={{ marginTop: 0, marginBottom: '16px' }}>Arranger Workspace</h2>
              {selectedTrack ? (
                <div>
                  <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>{selectedTrack.title}</p>
                  <p style={{ color: '#94a3b8', marginBottom: '12px' }}>
                    {selectedTrack.bpm} BPM · {selectedTrack.key} · {selectedTrack.duration}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    {['Intro', 'Verse 1', 'Hook', 'Verse 2', 'Hook', 'Bridge', 'Outro'].map((section) => (
                      <div
                        key={section}
                        style={{ padding: '14px', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.15)', textAlign: 'center', color: '#cbd5e1', background: 'rgba(255,255,255,0.02)' }}
                      >
                        {section}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: '#94a3b8' }}>Select a track from the Tracks tab to begin arranging.</p>
              )}
            </div>
          )}

          {editorTab === 'publish' && (
            <div className="executive-rainbow-border" style={{ borderRadius: '16px', padding: '20px', background: 'rgba(15, 23, 42, 0.85)' }}>
              <h2 className="executive-rainbow-text" style={{ marginTop: 0, marginBottom: '16px' }}>Publish to Audiomack</h2>
              <div style={{ display: 'grid', gap: '12px', maxWidth: '520px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '6px', display: 'block' }}>Release Title</label>
                  <input
                    type="text"
                    defaultValue={selectedTrack?.title || ''}
                    placeholder="Enter release title"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '6px', display: 'block' }}>Description</label>
                  <textarea
                    rows={4}
                    placeholder="Tell listeners about this release..."
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem', fontWeight: 'bold', resize: 'vertical' }}
                  />
                </div>
                <button
                  className="executive-rainbow-border"
                  style={{ padding: '12px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', background: '#0f172a', border: '2px solid' }}
                >
                  🚀 Publish Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
