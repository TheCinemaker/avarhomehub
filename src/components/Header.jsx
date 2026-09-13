import React from 'react';
import { Home, LogIn, UserRound } from 'lucide-react';

export const Header = ({ sessionUser, onOpenLogin }) => {
  const isLoggedIn = Boolean(sessionUser);

  return (
    <header className="sticky-header">
      <div className="header-content">
        <div className="brand-title">
          <div className="brand-icon">
            <Home size={17} />
          </div>
          <div>
            <div className="brand-name">HomeHub</div>
            <div className="brand-sub">a családi rendszerező</div>
          </div>
        </div>

        <button
          className="btn-quiet"
          onClick={onOpenLogin}
          title={isLoggedIn ? `Bejelentkezve: ${sessionUser.email || 'fiók'}` : 'Bejelentkezés'}
        >
          {isLoggedIn ? <UserRound size={16} /> : <LogIn size={16} />}
          <span className="hide-on-tiny">{isLoggedIn ? 'Fiók' : 'Bejelentkezés'}</span>
        </button>
      </div>
    </header>
  );
};
