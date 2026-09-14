import React from 'react';
import { CURRENT_APP_VERSION } from '../version';

export const Footer = () => {
  return (
    <footer
      style={{
        marginTop: '3rem',
        padding: '1.5rem 1rem 5.5rem 1rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border-glass, rgba(255, 255, 255, 0.08))',
        fontSize: '0.8rem',
        color: 'var(--text-dim, #64748b)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.35rem'
      }}
    >
      <div>
        Developed by <strong style={{ color: 'var(--text-main, #e2e8f0)' }}>SA Software & Network Solutions</strong>
      </div>
      <div>
        Powered by{' '}
        <a
          href="https://visitkoszeg.hu"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}
        >
          visitkoszeg.hu
        </a>
      </div>
      <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
        © {new Date().getFullYear()} HomeHub — All rights reserved. <span style={{ opacity: 0.6 }}>v{CURRENT_APP_VERSION}</span>
      </div>
    </footer>
  );
};
