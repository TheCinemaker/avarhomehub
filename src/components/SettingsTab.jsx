import React, { useRef, useState } from 'react';
import { Settings, Download, Upload, RefreshCw, User, ShieldCheck, Database, UserPlus, Plus, Trash2 } from 'lucide-react';

const PROTECTED_USER_IDS = ['apa', 'anya', 'gyerek', 'everyone'];

export const SettingsTab = ({
  users,
  onUpdateUserProfile,
  onDeleteCustomUser,
  onAddCustomUser,
  onExport,
  onImport,
  onReset
}) => {
  const fileInputRef = useRef(null);

  // New Family Member Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserColor, setNewUserColor] = useState('#f59e0b');

  // A profilmezők eddig index alapján, a state objektumát MUTÁLVA íródtak,
  // és sosem jutottak el a Supabase-ig. Most azonosító szerint mennek, és a
  // store gondoskodik a felhőbe mentésről is.
  const handleProfileChange = (id, field, value) => {
    onUpdateUserProfile(id, { [field]: value });
  };

  const handleDeleteUser = (u) => {
    if (window.confirm(`Biztosan törlöd "${u.name}" profilját? A hozzá rendelt tételek a „Mindannyian" gyűjtőbe kerülnek.`)) {
      onDeleteCustomUser(u.id);
    }
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
    <div className="glass-panel panel-pad">
      <div className="action-header">
        <div>
          <h2><Settings size={18} /> Profilok és beállítások</h2>
          <p className="panel-sub">Családtagok, adatmentés és felhő-állapot.</p>
        </div>
      </div>

      {/* Profile Customizer */}
      <div className="section">
        <h3 className="section-title"><User size={13} /> Családtagok ({users.length})</h3>

        <div className="profile-grid">
          {users.map(u => (
            <div key={u.id} className="profile-card">
              <div className="profile-card-head">
                <span className="user-dot" style={{ color: u.color, width: 10, height: 10 }} />
                <span className="profile-name">{u.name}</span>

                {!PROTECTED_USER_IDS.includes(u.id) && (
                  <button
                    className="btn-icon btn-icon-sm btn-icon-danger"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => handleDeleteUser(u)}
                    title={`${u.name} profiljának törlése`}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <div className="form-group">
                <label htmlFor={`name-${u.id}`}>Név</label>
                <input
                  id={`name-${u.id}`}
                  type="text"
                  className="form-input"
                  value={u.name}
                  onChange={e => handleProfileChange(u.id, 'name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor={`avatar-${u.id}`}>Monogram / Jelzés</label>
                <input
                  id={`avatar-${u.id}`}
                  type="text"
                  className="form-input"
                  maxLength={3}
                  value={u.avatar}
                  onChange={e => handleProfileChange(u.id, 'avatar', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor={`color-${u.id}`}>Profil színe</label>
                <input
                  id={`color-${u.id}`}
                  type="color"
                  className="form-input color-input"
                  value={u.color}
                  onChange={e => handleProfileChange(u.id, 'color', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add New Custom Family Member Form */}
        <form onSubmit={handleAddMemberSubmit} className="form-card">
          <h4 className="section-title"><UserPlus size={13} /> Új családtag</h4>
          <div className="form-inline">
            <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
              <label htmlFor="new-user-name">Név</label>
              <input
                id="new-user-name"
                type="text"
                className="form-input"
                placeholder="pl. Nagymama, Peti"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ width: '86px' }}>
              <label htmlFor="new-user-color">Szín</label>
              <input
                id="new-user-color"
                type="color"
                className="form-input color-input"
                value={newUserColor}
                onChange={e => setNewUserColor(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ minHeight: '40px' }}>
              <Plus size={16} /> Hozzáadás
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup & Restore */}
      <div className="section">
        <h3 className="section-title"><Database size={13} /> Adatmentés</h3>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={onExport}>
            <Download size={15} /> Mentés letöltése
          </button>

          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} /> Mentés betöltése
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                // A betöltés felülírja a jelenlegi adatokat — ezt előbb kérdezzük meg
                if (window.confirm('A mentés betöltése felülírja a jelenlegi listákat és profilokat. Folytatod?')) {
                  const reader = new FileReader();
                  reader.onload = ev => onImport(ev.target?.result);
                  reader.readAsText(file);
                }
              }
              // ugyanaz a fájl újra kiválasztható legyen
              e.target.value = '';
            }}
            accept=".json,application/json"
            style={{ display: 'none' }}
          />

          <button className="btn-quiet" onClick={onReset} style={{ color: 'var(--danger)' }}>
            <RefreshCw size={15} /> Adatok alaphelyzetbe
          </button>
        </div>
      </div>

      {/* Cloud & Supabase Status */}
      <div className="note-box">
        <ShieldCheck size={16} />
        <span>
          A lista, a teendők és az étlap azonnal szinkronizálódik a család többi
          készülékével. Az app offline is használható, a változások a következő
          kapcsolódáskor felmennek.
        </span>
      </div>
    </div>
  );
};
