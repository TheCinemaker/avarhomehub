import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, Database, CheckCircle, KeyRound, Mail } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export const AuthModal = ({ onClose }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setCurrentUserEmail(session.user.email);
        }
      });
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured || !supabase) {
      setMessage({
        text: 'A Supabase URL és Anon Key még nincs megadva a .env fájlban. Hozz létre egy .env fájlt a VITE_SUPABASE_URL és VITE_SUPABASE_ANON_KEY kulcsokkal!',
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
          setCurrentUserEmail(data.session.user.email || email);
          setMessage({ text: 'Sikeres bejelentkezés! A készülék megjegyzi a munkamenetet.', type: 'success' });
          setTimeout(() => onClose(), 1200);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password
        });
        if (error) throw error;
        setMessage({
          text: 'Sikeres regisztráció! Ellenőrizd az e-mailedet az igazoláshoz, vagy lépj be azonnal.',
          type: 'success'
        });
        setMode('login');
      }
    } catch (err) {
      setMessage({ text: err.message || 'Hiba történt a bejelentkezés során!', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      setCurrentUserEmail(null);
      setMessage({ text: 'Sikeres kijelentkezés.', type: 'success' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
            <Database size={22} style={{ color: '#818cf8' }} /> Supabase Bejelentkezés & Fiók
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Current Logged In State */}
        {currentUserEmail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
            <div style={{ padding: '1rem', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={24} style={{ color: '#34d399' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#34d399' }}>Bejelentkezve:</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{currentUserEmail}</div>
              </div>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              A telefonod megjegyezte ezt a munkamenetet, így a böngésző újranyitásakor sem kell újból beírnod az adataidat!
            </p>

            <button className="btn-secondary" onClick={handleLogout} style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              Kijelentkezés erről a készülékről
            </button>
          </div>
        ) : (
          <div>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-glass)' }}>
              <button
                className="btn-secondary"
                onClick={() => setMode('login')}
                style={{
                  flex: 1,
                  border: 'none',
                  background: mode === 'login' ? '#818cf8' : 'transparent',
                  color: mode === 'login' ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700
                }}
              >
                <LogIn size={16} /> Bejelentkezés
              </button>
              <button
                className="btn-secondary"
                onClick={() => setMode('register')}
                style={{
                  flex: 1,
                  border: 'none',
                  background: mode === 'register' ? '#818cf8' : 'transparent',
                  color: mode === 'register' ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700
                }}
              >
                <UserPlus size={16} /> Regisztráció
              </button>
            </div>



            {message && (
              <div style={{ padding: '0.75rem 1rem', background: message.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${message.type === 'success' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`, borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: message.type === 'success' ? '#34d399' : '#ef4444', marginBottom: '1rem' }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={15} /> E-mail cím
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="pl. csalad@homehub.hu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <KeyRound size={15} /> Jelszó
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#818cf8' }}
                />
                <label htmlFor="remember-me" style={{ margin: 0, cursor: 'pointer' }}>
                  Maradjak bejelentkezve ezen a telefonon / eszközön
                </label>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}
              >
                {loading ? 'Feldolgozás...' : mode === 'login' ? 'Bejelentkezés' : 'Regisztráció'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
