import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { CURRENT_APP_VERSION } from '../version';

export const UpdateBanner = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState(CURRENT_APP_VERSION);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);

  const checkVersion = async () => {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.version && data.version !== CURRENT_APP_VERSION) {
          setLatestVersion(data.version);
          setHasUpdate(true);
        }
      }
    } catch (err) {
      // Ignore network errors during background check
    }
  };

  useEffect(() => {
    checkVersion();

    const handleCheck = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleCheck);
    window.addEventListener('focus', handleCheck);

    const interval = setInterval(checkVersion, 120000);

    return () => {
      document.removeEventListener('visibilitychange', handleCheck);
      window.removeEventListener('focus', handleCheck);
      clearInterval(interval);
    };
  }, []);

  const handleApplyUpdate = async () => {
    setUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
    } catch (err) {
      console.warn('Cache clear warning:', err);
    } finally {
      window.location.reload(true);
    }
  };

  if (!hasUpdate || dismissed) return null;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10000,
        background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
        color: '#ffffff',
        padding: '0.65rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        fontSize: '0.875rem',
        fontWeight: 600
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Sparkles size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
        <span>
          Új HomeHub verzió érhető el! (v{latestVersion})
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={handleApplyUpdate}
          disabled={updating}
          style={{
            background: '#ffffff',
            color: '#4f46e5',
            border: 'none',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full, 9999px)',
            fontWeight: 800,
            fontSize: '0.825rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          <RefreshCw size={14} className={updating ? 'spin' : ''} />
          {updating ? 'Frissítés...' : 'Frissítés most'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            padding: '0.2rem',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Bezárás"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
