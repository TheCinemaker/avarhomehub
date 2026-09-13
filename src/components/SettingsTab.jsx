import React, { useRef, useState } from 'react';
import { Settings, Download, Upload, RefreshCw, User, ShieldCheck, Database, UserPlus, Plus } from 'lucide-react';

export const SettingsTab = ({
  users,
  onUpdateUsers,
  onAddCustomUser,
  onExport,
  onImport,
  onReset
}) => {
  const fileInputRef = useRef(null);

  // New Family Member Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserColor, setNewUserColor] = useState('#f59e0b');

  const handleNameChange = (index, newName) => {
    const updated = [...users];
    updated[index].name = newName;
    onUpdateUsers(updated);
  };

  const handleAvatarChange = (index, newAvatar) => {
    const updated = [...users];
    updated[index].avatar = newAvatar;
    onUpdateUsers(updated);
  };

  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    if (onAddCustomUser) {
      onAddCustomUser(newUserName.trim(), newUserColor);
    }
    setNewUserName('');
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div className="action-header">
        <div>
          <h2>
            <Settings size={24} style={{ color: '#a855f7' }} />
            Beállítások & Profilok
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Családtagok beállítása, új személyek hozzáadása, adatmentés és felhő beállítások
          </p>
        </div>
      </div>

      {/* Profile Customizer */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} /> Családi Profilok ({users.length} Felhasználó)
          </h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {users.map((u, idx) => (
            <div
              key={u.id}
              style={{
                padding: '1rem',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${u.color}44`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: u.color + '33',
                    color: u.color,
                    fontWeight: 800,
                    fontSize: '0.8rem'
                  }}
                >
                  {u.avatar}
                </span>
                <span style={{ fontWeight: 700, color: u.color }}>{u.name}</span>
                {u.isCustom && (
                  <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 5px', borderRadius: '4px', marginLeft: 'auto' }}>
                    Egyedi
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Név</label>
                <input
                  type="text"
                  className="form-input"
                  value={u.name}
                  onChange={e => handleNameChange(idx, e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Monogram / Jelzés</label>
                <input
                  type="text"
                  className="form-input"
                  value={u.avatar}
                  onChange={e => handleAvatarChange(idx, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add New Custom Family Member Form */}
        <form onSubmit={handleAddMemberSubmit} style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8' }}>
            <UserPlus size={18} /> Új Családtag / Személy Hozzáadása
          </h4>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '0.825rem' }}>Új személy neve *</label>
              <input
                type="text"
                className="form-input"
                placeholder="pl. Nagymama, Peti, Déditata..."
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ width: '110px' }}>
              <label style={{ fontSize: '0.825rem' }}>Profil színe</label>
              <input
                type="color"
                className="form-input"
                value={newUserColor}
                onChange={e => setNewUserColor(e.target.value)}
                style={{ padding: '0.2rem', height: '42px', cursor: 'pointer' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ height: '42px', padding: '0 1.25rem', fontSize: '0.9rem' }}>
              <Plus size={16} /> Személy Hozzáadása
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup & Restore */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={18} /> Adatmentés & Biztonság (JSON Import / Export)
        </h3>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={onExport}>
            <Download size={18} />
            Mentés Letöltése (JSON)
          </button>

          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} />
            Mentés Betöltése
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = ev => onImport(ev.target?.result);
                reader.readAsText(file);
              }
            }}
            accept=".json"
            style={{ display: 'none' }}
          />

          <button className="btn-secondary" onClick={onReset} style={{ color: '#f87171' }}>
            <RefreshCw size={18} />
            Demó Adatok Visszaállítása
          </button>
        </div>
      </div>

      {/* Cloud & Supabase Status */}
      <div
        style={{
          padding: '1rem 1.25rem',
          background: 'rgba(52, 211, 153, 0.1)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}
      >
        <ShieldCheck size={24} style={{ color: '#34d399', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '0.25rem' }}>
            Supabase Felhő Szinkronizáció & Automatikus Mentés
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Minden családi tétel, teendő és termékfotó azonnal szinkronizálódik a Supabase adatbázissal. Az alkalmazás emellett offline is azonnal elérhető és ment.
          </p>
        </div>
      </div>
    </div>
  );
};
