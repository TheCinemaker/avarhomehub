import React, { useState } from 'react';
import { Home, LogIn, UserPlus, KeyRound, Mail, Lock, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export const AuthScreen = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured || !supabase) {
      setMessage({
        text: 'A Supabase környezeti változók (VITE_SUPABASE_URL és VITE_SUPABASE_ANON_KEY) hiányoznak.',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) throw error;

        if (data.session?.user) {
          setMessage({ text: 'Sikeres bejelentkezés! Betöltés...', type: 'success' });
          setTimeout(() => {
            onLoginSuccess(data.session.user);
          }, 500);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password
        });

        if (error) throw error;

        if (data.user) {
          // Initialize default clean family profiles in Supabase for this new account
          const userId = data.user.id;
          const defaultProfiles = [
            { id: 'apa', user_id: userId, name: 'Apa', avatar: 'AP', color: '#3b82f6', is_custom: false },
            { id: 'anya', user_id: userId, name: 'Anya', avatar: 'AN', color: '#ec4899', is_custom: false },
            { id: 'gyerek', user_id: userId, name: 'Ármin', avatar: 'ÁR', color: '#10b981', is_custom: false },
            { id: 'everyone', user_id: userId, name: 'Mindannyian', avatar: 'ALL', color: '#8b5cf6', is_custom: false }
          ];

          await supabase.from('family_profiles').insert(defaultProfiles);

          setMessage({
            text: 'Sikeres regisztráció! Most már bejelentkezhetsz.',
            type: 'success'
          });
          setMode('login');
        }
      }
    } catch (err) {
      setMessage({ text: err.message || 'Hiba történt a művelet során!', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a, #090d16)',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        padding: '1.25rem',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2rem 1.75rem',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              margin: '0 auto 0.75rem auto',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Home size={30} style={{ color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>
            HomeHub
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            A családi rendszerező & bevásárló központ
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '0.3rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-glass)'
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setMode('login'); setMessage(null); }}
            style={{
              flex: 1,
              border: 'none',
              background: mode === 'login' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              padding: '0.65rem'
            }}
          >
            <LogIn size={16} /> Bejelentkezés
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setMode('register'); setMessage(null); }}
            style={{
              flex: 1,
              border: 'none',
              background: mode === 'register' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              padding: '0.65rem'
            }}
          >
            <UserPlus size={16} /> Regisztráció
          </button>
        </div>

        {message && (
          <div
            style={{
              padding: '0.85rem 1rem',
              background: message.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              color: message.type === 'success' ? '#34d399' : '#ef4444',
              marginBottom: '1.25rem'
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
              <Mail size={16} style={{ color: '#38bdf8' }} /> E-mail cím
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="pl. csalad@homehub.hu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ fontSize: '1rem', padding: '0.75rem 1rem' }}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
              <KeyRound size={16} style={{ color: '#38bdf8' }} /> Jelszó
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ fontSize: '1rem', padding: '0.75rem 1rem' }}
              required
              minLength={6}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              id="remember-device"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ width: '17px', height: '17px', accentColor: '#6366f1', cursor: 'pointer' }}
            />
            <label htmlFor="remember-device" style={{ margin: 0, cursor: 'pointer' }}>
              Maradjak bejelentkezve ezen a telefonon
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              padding: '0.85rem',
              fontSize: '1rem',
              fontWeight: 700,
              marginTop: '0.5rem',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)'
            }}
          >
            {loading ? 'Feldolgozás...' : mode === 'login' ? 'Bejelentkezés a Családi Hub-ba' : 'Új Családi Fiók Létrehozása'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={15} style={{ color: '#34d399' }} />
          <span>Biztonságos Supabase Felhő Alapú Adatvédelem</span>
        </div>
      </div>
    </div>
  );
};
