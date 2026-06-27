import React, { useState } from 'react';

export const PremiumMediaStudio: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const processFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (selected.length <= 100) {
        setFiles(selected);
      } else {
        alert("Premium payload locked to a maximum of 100 pictures simultaneous input.");
      }
    }
  };

  return (
    <div style={{ background: '#0e0b16', padding: '25px', borderRadius: '8px', marginTop: '20px', color: '#fff' }}>
      <h3>$NCAI MULTIMEDIA & GENERATION CONTROLLER</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setIsRecording(!isRecording)}
          style={{ width: '100%', padding: '12px', background: isRecording ? '#ff1744' : '#00e676', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
        >
          {isRecording ? "🔴 LIVE RECORDING COMMITTED VOICE COMMAND..." : "🎤 START VOICE NOTE COMMAND INTAKE"}
        </button>
      </div>

      <div style={{ border: '2px dashed #00e5ff', padding: '30px', textAlign: 'center', borderRadius: '6px' }}>
        <input type="file" multiple accept="image/*" onChange={processFiles} id="bulk-media" style={{ display: 'none' }} />
        <label htmlFor="bulk-media" style={{ cursor: 'pointer', display: 'block' }}>
          📁 Click here to batch drop up to 100 application layout pictures
        </label>
        <div style={{ marginTop: '10px', color: '#00e5ff', fontWeight: 'bold' }}>
          {files.length} / 100 Media Context Clusters Wired
        </div>
      </div>
    </div>
  );
};

export default PremiumMediaStudio;