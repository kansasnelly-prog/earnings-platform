import React, { useState, useEffect, useRef } from 'react';

export const LiveVoiceController: React.FC = () => {
  const [isLiveVoiceActive, setIsLiveVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not natively supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari for voice dictation.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        const inputEl = document.querySelector('textarea, input[type="text"]') as HTMLInputElement | HTMLTextAreaElement | null;
        if (inputEl) {
          inputEl.value = transcript;
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      recognition.onerror = (err: any) => {
        console.error('Speech Recognition Error:', err);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Recognition start failed:', e);
    }
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
        disabled={!speechSupported}
        style={{
          background: speechSupported ? '#00ccff' : '#334155',
          color: '#000',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: speechSupported ? 'pointer' : 'not-allowed',
          border: 'none',
          fontWeight: 'bold',
          opacity: speechSupported ? 1 : 0.7,
        }}
      >
        🎤 {isListening ? 'Stop Dictation' : speechSupported ? 'Dictate Real-Time' : 'Speech Unavailable'}
      </button>
    </div>
  );
};
