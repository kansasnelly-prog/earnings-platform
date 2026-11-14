import React from 'react';
import ReactDOM from 'react-dom/client';
import CyberNodeDashboard from '../pages/cybernode/CyberNodeDashboard_FIXED';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Fatal: Failed to find the root element for CyberNode Dashboard.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <CyberNodeDashboard />
  </React.StrictMode>
);