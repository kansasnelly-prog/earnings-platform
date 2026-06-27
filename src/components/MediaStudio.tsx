import React, { useState } from 'react';

interface MediaStudioProps {}

interface VoiceCommandPanelProps {
  isRecording: boolean;
  onToggle: () => void;
}

interface MediaUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const MAX_FILES = 100;

const VoiceCommandPanel: React.FC<VoiceCommandPanelProps> = ({ isRecording, onToggle }) => {
  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    background: isRecording ? '#ff1744' : '#00e676',
    border: 'none',
    color: '#fff',
    fontWeight: 'bold',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.3s ease',
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <button onClick={onToggle} style={buttonStyle}>
        {isRecording ? '🔴 LIVE RECORDING COMMITTED VOICE COMMAND...' : '🎤 START VOICE NOTE COMMAND INTAKE'}
      </button>
    </div>
  );
};

const MediaUploadZone: React.FC<MediaUploadZoneProps> = ({ files, onFilesChange }) => {
  const handleProcessFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files) as File[];
      if (selected.length <= MAX_FILES) {
        onFilesChange(selected);
      } else {
        alert(`Premium payload locked to a maximum of ${MAX_FILES} pictures simultaneous input.`);
      }
    }
  };

  const zoneStyle: React.CSSProperties = {
    border: '2px dashed #00e5ff',
    padding: '30px',
    textAlign: 'center',
    borderRadius: '6px',
  };

  const labelStyle: React.CSSProperties = {
    cursor: 'pointer',
    display: 'block',
    fontSize: '14px',
  };

  const countStyle: React.CSSProperties = {
    marginTop: '10px',
    color: '#00e5ff',
    fontWeight: 'bold',
    fontSize: '14px',
  };

  return (
    <div style={zoneStyle}>
      <input type="file" multiple accept="image/*" onChange={handleProcessFiles} id="bulk-media" style={{ display: 'none' }} />
      <label htmlFor="bulk-media" style={labelStyle}>
        📁 Click here to batch drop up to {MAX_FILES} application layout pictures
      </label>
      <div style={countStyle}>
        {files.length} / {MAX_FILES} Media Context Clusters Wired
      </div>
    </div>
  );
};

export const MediaStudio: React.FC<MediaStudioProps> = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const containerStyle: React.CSSProperties = {
    background: '#0e0b16',
    padding: '25px',
    borderRadius: '8px',
    marginTop: '20px',
    color: '#fff',
  };

  const headerStyle: React.CSSProperties = {
    marginTop: '0',
    marginBottom: '20px',
    fontSize: '20px',
    fontWeight: 'bold',
  };

  return (
    <div style={containerStyle}>
      <h3 style={headerStyle}>$NCAI MULTIMEDIA & GENERATION CONTROLLER</h3>
      
      <VoiceCommandPanel isRecording={isRecording} onToggle={() => setIsRecording(!isRecording)} />
      
      <MediaUploadZone files={files} onFilesChange={setFiles} />
    </div>
  );
};

export default MediaStudio;
