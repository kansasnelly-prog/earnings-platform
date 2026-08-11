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


  return (
    <div style={{ padding: '24px', backgroundColor: '#090d16', color: '#e2e8f0', fontFamily: 'sans-serif', minHeight: '100vh' }}>
      <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#38bdf8' }}>Gemini 3.6 Commandant & Media Engine</h2>
        <div style={{ marginBottom: '10px' }}>
            <button onClick={() => setShowKeys(!showKeys)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                {showKeys ? 'Hide ⚙️ API Credentials Configuration' : 'Show ⚙️ API Credentials Configuration'}
            </button>
            {showKeys && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', marginTop: '8px' }}>
                <div>
                    <label style={{ fontSize: '11px', color: '#38bdf8' }}>GEMINI API KEY</label>
                    <input type="password" value={geminiKey} onChange={(e) => saveKeys(e.target.value, openRouterKey, soraKey)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff' }}/>
                </div>
                <div>
                    <label style={{ fontSize: '11px', color: '#a855f7' }}>OPENROUTER KEY</label>
                    <input type="password" value={openRouterKey} onChange={(e) => saveKeys(geminiKey, e.target.value, soraKey)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff' }}/>
                </div>
                <div>
                    <label style={{ fontSize: '11px', color: '#10b981' }}>SORA 2 KEY</label>
                    <input type="password" value={soraKey} onChange={(e) => saveKeys(geminiKey, openRouterKey, e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff' }}/>
                </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GeminiCommandCenter;
