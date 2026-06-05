import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// MODULE 1: PWA Installation Event Handler
// Capture browser's beforeinstallprompt event and map to global state token array
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Store in global state for component access
  (window as any).pwaInstallPrompt = deferredPrompt;
  console.log('[PWA] Install prompt captured and stored globally');
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  (window as any).pwaInstallPrompt = null;
  console.log('[PWA] App installed successfully');
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Fatal: Failed to find the root element to mount the React application.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);