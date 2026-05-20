
import { createRoot } from 'react-dom/client'
import './index.css'

// ===========================================
// CHUNK LOAD ERROR HANDLER
// ===========================================

// Handle webpack/vite chunk loading failures and module load errors
window.addEventListener('error', (event) => {
  const error = event.error;
  const errorMessage = event.message || '';
  
  // Catch ChunkLoadError, "Failed to load module", and related asset loading errors
  if (
    error && (
      error.name === 'ChunkLoadError' ||
      error.name === 'LoadError' ||
      errorMessage.includes('Failed to load module') ||
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('Failed to fetch dynamically imported module')
    )
  ) {
    console.error('[ModuleLoadError] Failed to load asset/module:', error);
    console.error('[ModuleLoadError] Forcing clean reload to fetch new assets...');
    
    // Clear all caches to force fresh asset fetch
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear service worker caches if registered
      if ('serviceWorker' in navigator && navigator.serviceWorker) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          registrations.forEach(function(registration) {
            registration.unregister();
          });
        }).catch(function(e) {
          console.error('[ModuleLoadError] Failed to unregister service workers:', e);
        });
      }
    } catch (e) {
      console.error('[ModuleLoadError] Failed to clear caches:', e);
    }
    
    // Force reload with cache bypass by adding timestamp to URL
    const url = new URL(window.location.href);
    url.searchParams.set('_t', Date.now().toString());
    window.location.href = url.toString();
  }
});

// ===========================================
// SERVICE WORKER REGISTRATION
// ===========================================

const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);

          // Force update service worker on page load
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available, reloading page...');
                  window.location.reload();
                }
              };
            }
          };
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
          // Don't block app initialization if service worker fails
        });
    });
  }
};

// ===========================================
// SAFE INITIALIZATION WITH ERROR HANDLING
// ===========================================

const initializeApp = async () => {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  try {
    // Register service worker
    registerServiceWorker();

    // Dynamically import App to catch module initialization errors
    const { default: App } = await import('./App.tsx');

    // Clear the loading spinner
    rootElement.innerHTML = '';

    // Create and render app
    const root = createRoot(rootElement);
    root.render(<App />);

    // Signal to cache buster that app mounted successfully
    if (typeof window !== 'undefined' && (window as any).appMounted) {
      (window as any).appMounted();
    }

  } catch (error: any) {
    console.error('=== FATAL APP INITIALIZATION ERROR ===', error);

    // Display detailed error for debugging
    rootElement.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: Arial, sans-serif;
        background: #060a14;
        color: white;
        padding: 20px;
      ">
        <div style="text-align: center; max-width: 600px;">
          <h2 style="color: #ef4444; margin-bottom: 16px;">⚠️ Application Failed to Load</h2>
          <p style="margin-bottom: 16px; color: #9ca3af;">The app encountered an error during startup.</p>
          <div style="
            background: #1f2937;
            padding: 16px;
            border-radius: 8px;
            text-align: left;
            font-family: monospace;
            font-size: 12px;
            color: #fca5a5;
            margin-bottom: 16px;
            overflow-wrap: break-word;
          ">
            ${error?.message || 'Unknown error'}
          </div>
          <button onclick="location.reload()" style="
            padding: 10px 20px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">
            🔄 Reload Page
          </button>
          <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">
            Check browser console (F12) for full error details
          </p>
        </div>
      </div>
    `;
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
