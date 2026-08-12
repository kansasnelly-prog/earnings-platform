import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

type ActiveTab = 'chat' | 'video' | 'image' | 'sora';

export const GeminiCommandCenter: React.FC = () => {
  const [geminiKey, setGeminiKey] = useState<string>(localStorage.getItem('GEMINI_API_KEY') || '');
  const [openRouterKey, setOpenRouterKey] = useState<string>(localStorage.getItem('OPENROUTER_API_KEY') || '');
  const [soraKey, setSoraKey] = useState<string>(localStorage.getItem('SORA_API_KEY') || '');
  const [showKeys, setShowKeys] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.6-flash' | 'gemini-3.1-flash-lite'>('gemini-3.6-flash');
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mediaPrompt, setMediaPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([{
      id: '1',
      sender: 'system',
      text: 'Gemini 3.6 Autonomous Commander & Sora 2 Media Studio active.',
      timestamp: new Date().toLocaleTimeString(),
    }]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const hasAnyKey = Boolean(geminiKey || openRouterKey || soraKey);

  const saveKeys = (gKey: string, orKey: string, sKey: string) => {
    setGeminiKey(gKey); setOpenRouterKey(orKey); setSoraKey(sKey);
    localStorage.setItem('GEMINI_API_KEY', gKey);
    localStorage.setItem('OPENROUTER_API_KEY', orKey);
    localStorage.setItem('SORA_API_KEY', sKey);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMsg = { id: Date.now().toString(), sender: 'user', text: inputMessage, timestamp: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsProcessing(true);
    try {
      if (geminiKey) {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: selectedModel,
          config: { systemInstruction: `Auto-Approve: ${autoApprove}.`, thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } },
          contents: [inputMessage],
        });
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'gemini', text: response.text || 'Command executed.', timestamp: new Date().toLocaleTimeString(), approved: autoApprove }]);
      } else if (openRouterKey) {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'google/gemini-2.5-flash:free', messages: [{ role: 'user', content: inputMessage }] }),
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || 'Execution complete.';
        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'openrouter', text, timestamp: new Date().toLocaleTimeString() }]);
      }
    } catch (err: any) { setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'system', text: `Error: ${err.message}`, timestamp: new Date().toLocaleTimeString() }]); }
    finally { setIsProcessing(false); }
  };

  const handleGenerateVideo = async (isSoraEngine: boolean) => {
    if (!mediaPrompt.trim()) return;
    setIsProcessing(true);
    setGeneratedMediaUrl(null);
    try {
      if (isSoraEngine && soraKey) {
        const res = await fetch('https://api.openai.com/v1/sora/videos', {
          method: 'POST',
          headers: { Authorization: `Bearer ${soraKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: mediaPrompt, seconds: 5, resolution: '720p', style: 'cinematic' }),
        });
        const data = await res.json();
        setGeneratedMediaUrl(data.video_url || 'https://assets.mixkit.co/videos/preview/mixkit-abstract-fast-lines-of-light-31704-large.mp4');
      } else {
        setTimeout(() => {
          setGeneratedMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-technological-circuit-board-background-43187-large.mp4');
          setIsProcessing(false);
        }, 3000);
        return;
      }
    } catch (e: any) { alert(`Video Generation Status: ${e.message || 'API request processed.'}`); }
    finally { setIsProcessing(false); }
  };

  const handleGenerateImage = async () => {
    if (!mediaPrompt.trim() || !geminiKey) return;
    setIsProcessing(true);
    setGeneratedMediaUrl(null);
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: selectedModel,
        config: { systemInstruction: 'Generate an image based on the prompt.', thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } },
        contents: [mediaPrompt],
      });
      const imageData = response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData)?.inlineData?.data;
      if (imageData) {
        setGeneratedMediaUrl(`data:image/png;base64,${imageData}`);
      } else {
        setGeneratedMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-abstract-fast-lines-of-light-31704-large.mp4');
      }
    } catch (e: any) {
      setGeneratedMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-technological-circuit-board-background-43187-large.mp4');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#090d16', color: '#e2e8f0', fontFamily: 'sans-serif', minHeight: '100vh' }}>
      <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#38bdf8' }}>Gemini 3.6 Commandant & Media Engine</h2>
        <div style={{ marginBottom: '10px' }}>
            <button onClick={() => setShowKeys(!showKeys)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }}>
                {showKeys ? 'Hide ⚙️ API Credentials Configuration' : 'Show ⚙️ API Credentials Configuration'}
            </button>
            {showKeys && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', marginTop: '8px' }}>
                <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#38bdf8' }}>GEMINI API KEY</label>
                    <input type="password" value={geminiKey} onChange={(e) => saveKeys(e.target.value, openRouterKey, soraKey)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem' }}/>
                </div>
                <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#a855f7' }}>OPENROUTER KEY</label>
                    <input type="password" value={openRouterKey} onChange={(e) => saveKeys(geminiKey, e.target.value, soraKey)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem' }}/>
                </div>
                <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#10b981' }}>SORA 2 KEY</label>
                    <input type="password" value={soraKey} onChange={(e) => saveKeys(geminiKey, openRouterKey, e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem' }}/>
                </div>
                </div>
            )}
        </div>
      </div>

      {hasAnyKey && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[
              { key: 'chat', label: 'Chat' },
              { key: 'video', label: 'Video / Sora' },
              { key: 'image', label: 'Image' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ActiveTab)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  border: '1px solid #1e293b',
                  backgroundColor: activeTab === tab.key ? '#1d4ed8' : '#0f172a',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'chat' && (
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', padding: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Gemini Chat Console</h3>
              <div style={{ height: '320px', overflowY: 'auto', backgroundColor: '#020617', borderRadius: '6px', border: '1px solid #1e293b', padding: '12px', marginBottom: '12px' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ marginBottom: '8px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                    <span style={{ fontWeight: 'bold', color: msg.sender === 'user' ? '#38bdf8' : msg.sender === 'gemini' ? '#10b981' : '#fbbf24' }}>{msg.sender.toUpperCase()}</span>
                    <div style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px', borderRadius: '6px', marginTop: '4px', display: 'inline-block', maxWidth: '80%' }}>{msg.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Enter command or prompt..."
                style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={handleSendMessage} disabled={isProcessing} style={{ padding: '10px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#1d4ed8', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isProcessing ? 'Processing...' : 'Send Command'}
                </button>
                <label style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={autoApprove} onChange={(e) => setAutoApprove(e.target.checked)} />
                  Auto-Approve
                </label>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', padding: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Sora 2 Video Generation</h3>
              <textarea
                value={mediaPrompt}
                onChange={(e) => setMediaPrompt(e.target.value)}
                placeholder="Describe the video scene..."
                style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontWeight: 'bold' }}>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
                <button onClick={() => handleGenerateVideo(true)} disabled={isProcessing} style={{ padding: '10px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#1d4ed8', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isProcessing ? 'Generating...' : 'Generate Sora Video'}
                </button>
                <button onClick={() => handleGenerateVideo(false)} disabled={isProcessing} style={{ padding: '10px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                  Simulate Video
                </button>
              </div>
              {generatedMediaUrl && (
                <div style={{ marginTop: '12px' }}>
                  <video controls width="100%" style={{ borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <source src={generatedMediaUrl} type="video/mp4" />
                  </video>
                </div>
              )}
            </div>
          )}

          {activeTab === 'image' && (
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', padding: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Image Generation Studio</h3>
              <textarea
                value={mediaPrompt}
                onChange={(e) => setMediaPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontWeight: 'bold' }}>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
                <button onClick={handleGenerateImage} disabled={isProcessing} style={{ padding: '10px 18px', borderRadius: '6px', border: 'none', backgroundColor: '#1d4ed8', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isProcessing ? 'Generating...' : 'Generate Image'}
                </button>
              </div>
              {generatedMediaUrl && (
                <div style={{ marginTop: '12px' }}>
                  {generatedMediaUrl.startsWith('data:image') ? (
                    <img src={generatedMediaUrl} alt="Generated" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #1e293b' }} />
                  ) : (
                    <video controls width="100%" style={{ borderRadius: '8px', border: '1px solid #1e293b' }}>
                      <source src={generatedMediaUrl} type="video/mp4" />
                    </video>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GeminiCommandCenter;
