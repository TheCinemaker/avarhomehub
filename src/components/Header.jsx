import React from 'react';
import { Home, LogIn, Lock } from 'lucide-react';

export const Header = ({
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

        {/* Right Side Login Placeholder (Supabase Ready) */}
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
          title="Supabase bejelentkezés (Hamarosan)"
        >
          <LogIn size={15} />
          <span>Bejelentkezés</span>
        </button>
      </div>
    </header>
  );
};
