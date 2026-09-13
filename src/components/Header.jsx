import React from 'react';
import { Home, LogIn, ShieldCheck } from 'lucide-react';

export const Header = ({
  sessionUser,
  onOpenLogin
}) => {
  return (
    <header className="sticky-header">
      <div className="header-content">
        <div className="brand-title">
          <div className="brand-icon">
            <Home size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', lineHeight: 1.1, fontWeight: 800 }}>HomeHub</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
              a rendszerező
            </p>
          </div>
        </div>

        {/* Right Side Header Auth State */}
        {sessionUser ? (
          <button
            className="btn-secondary"
            onClick={onOpenLogin}
            style={{
              padding: '0.45rem 0.95rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(52, 211, 153, 0.15)',
              borderColor: 'rgba(52, 211, 153, 0.4)',
              color: '#34d399',
              minHeight: '36px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            title={`Bejelentkezve: ${sessionUser.email || 'Fiók'}`}
          >
            <ShieldCheck size={16} />
            <span>Fiók</span>
          </button>
        ) : (
          <button
            className="btn-secondary"
            onClick={onOpenLogin}
            style={{
              padding: '0.45rem 0.95rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.15)',
              borderColor: 'rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              minHeight: '36px'
            }}
            title="Bejelentkezés"
          >
            <LogIn size={15} />
            <span>Bejelentkezés</span>
          </button>
        )}
      </div>
    </header>
  );
};
