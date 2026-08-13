import React, { useState, useEffect, useRef } from 'react';

export const LiveVoiceController: React.FC = () => {
  const [isLiveVoiceActive, setIsLiveVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported on this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      const inputEl = document.querySelector('input[type="text"], textarea') as HTMLInputElement | null;
      if (inputEl) {
        inputEl.value = transcript;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
    recognitionRef.current = recognition;
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '10px 0', flexWrap: 'wrap' }}>
      <button
        onClick={() => setIsLiveVoiceActive(!isLiveVoiceActive)}
        style={{
          background: isLiveVoiceActive ? '#00ff66' : '#333',
          color: '#000',
          fontWeight: 'bold',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          border: 'none',
        }}
      >
        {isLiveVoiceActive ? '🎙️ GEMINI LIVE VOICE: ACTIVE' : '🎙️ TOGGLE GEMINI LIVE VOICE'}
      </button>

      <button
        onClick={isListening ? stopDictation : startDictation}
        style={{ background: '#00ccff', color: '#000', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}
      >
        🎤 {isListening ? 'Stop Dictation' : 'Dictate Real-Time'}
      </button>
    </div>
  );
};
