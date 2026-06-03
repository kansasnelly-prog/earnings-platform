import React, { useEffect, useState, FC } from 'react';
import { useSafeAuth } from '../contexts/SafeAuthProvider';
import AdminUsers from '../components/admin/AdminUsers.tsx';
import AdminCustomerService from '../components/admin/AdminCustomerService.tsx';
import ProductCatalogManager from '../components/admin/ProductCatalogManager.tsx';
import MainAdminPanel from '../components/admin/MainAdminPanel';

/**
 * AIAssistantWorkspace – renders the premium 3D admin panels after authentication.
 * It also performs a non‑blocking health‑check against the local Llama 3 engine.
 */
const AIAssistantWorkspace: FC = () => {
  const { user, loading, logout } = useSafeAuth();
  const [aiStatus, setAiStatus] = useState<string>('Checking AI service…');

  // Async safety check for local Llama 3 engine
  useEffect(() => {
    const checkAI = async () => {
      try {
        // Attempt health check with CORS-friendly mode; suppress errors from console
        const response = await fetch('http://localhost:11434/api/health', { mode: 'no-cors' });
        // When using no-cors, the response is opaque; we cannot read JSON, so just assume success if no network error
        if (response && (response as any).type === 'opaque') {
          setAiStatus('AI service OK (no‑cors)');
        } else if (response && response.ok) {
          const data = await response.json();
          setAiStatus(data.status ?? 'AI service OK');
        } else {
          throw new Error('AI service responded with error');
        }
      } catch (err) {
        // Gracefully handle failure – do not block UI
        console.error('Llama 3 health check failed:', err);
        setAiStatus('AI service unavailable');
      }
    };
    // fire‑and‑forget, no await needed for UI rendering
    checkAI();
  }, []);

  if (loading) {
    return <div>Loading authentication…</div>;
  }

  if (!user) {
    return <div>Access denied. Please log in.</div>;
  }

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-2xl font-bold">Admin Workspace</h1>
      <p className="text-sm text-gray-600">AI Service Status: {aiStatus}</p>
      {/* Render the premium admin panels */}
      <section>
        <h2 className="text-xl font-semibold mb-2">User Management</h2>
          <AdminUsers onLogout={logout} />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Customer Service</h2>
        <AdminCustomerService />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Product Catalog</h2>
        <ProductCatalogManager />
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Core Network Controls</h2>
        <MainAdminPanel />
      </section>
    </div>
  );
};

export default AIAssistantWorkspace;
