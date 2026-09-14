import React, { useState } from 'react';
import { createPortal } from 'react-dom';
// FIGYELEM: a lucide `Image` ikonját kötelező átnevezni! Sima `Image` néven
// elfedné a böngésző beépített Image konstruktorát, amit a képtömörítés
// használ — emiatt a fotófeltöltés némán, nyom nélkül elhalt.
import { ShoppingCart, Plus, Trash2, Check, Store, X, Maximize2, ShoppingBag, Camera, Image as ImageIcon, Filter, Pencil, Save, Utensils } from 'lucide-react';
import { useModalBehavior } from '../hooks/useModalBehavior';
import { todayIso } from '../utils/date';

const DEFAULT_STORES = ['Lidl', 'Aldi', 'SPAR', 'Tesco', 'Penny', 'Auchan', 'DM', 'Rossmann', 'Egyéb'];
const CATEGORIES = ['Élelmiszer', 'Háztartás', 'Gyógyszertár', 'Barkács', 'Személyes', 'Egyéb'];

const stripEmojis = (str) => typeof str === 'string' ? str.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}📌💡🍲🛒💳📋]/gu, '').trim() : str;

export const ShoppingTab = ({
  items,
  users,
  activeUserId,
  stores = DEFAULT_STORES,
  onAddCustomStore,
  onAddItem,
  onUpdateItem,
  onToggleItem,
  onReassignItem,
  onDeleteItem
}) => {
  const [selectedStore, setSelectedStore] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStoreModeOpen, setIsStoreModeOpen] = useState(false);

  // Edit Item Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editEstimatedPrice, setEditEstimatedPrice] = useState('');
  const [editStore, setEditStore] = useState('Lidl');
  const [editCategory, setEditCategory] = useState('Élelmiszer');
  const [editAssignedUser, setEditAssignedUser] = useState(activeUserId);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isAddingEditCustomStore, setIsAddingEditCustomStore] = useState(false);
  const [editCustomStoreName, setEditCustomStoreName] = useState('');

  // Custom Store Addition in Modal State
  const [isAddingCustomStore, setIsAddingCustomStore] = useState(false);
  const [customStoreName, setCustomStoreName] = useState('');

  // New Item Form State
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [store, setStore] = useState('Lidl');
  const [category, setCategory] = useState('Élelmiszer');
  const [assignedUser, setAssignedUser] = useState(activeUserId);
  const [imageUrl, setImageUrl] = useState('');

  const availableStores = stores && stores.length > 0 ? stores : DEFAULT_STORES;

  // ESC-re zárás + háttér görgetés-zár minden modálhoz
  useModalBehavior(isModalOpen, () => setIsModalOpen(false));
  useModalBehavior(isStoreModeOpen, () => setIsStoreModeOpen(false));
  useModalBehavior(Boolean(editingItem), () => setEditingItem(null));

  const confirmDelete = (item) => {
    if (window.confirm(`Biztosan törlöd a listáról: "${item.title}"?`)) {
      onDeleteItem(item.id);
      return true;
    }
    return false;
  };

  // Living Shopping Backlog List
  const filteredItems = items.filter(item => {
    const matchesUser = activeUserId === 'everyone' || item.assignedUser === activeUserId || item.assignedUser === 'everyone';
    const matchesStore = selectedStore === 'all' || item.store === selectedStore;
    return matchesUser && matchesStore;
  });

  const pendingItems = filteredItems.filter(i => !i.isCompleted);
  const completedItems = filteredItems.filter(i => i.isCompleted);
  const totalEstimated = pendingItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);

  // Handle Photo Upload with Automatic Image Compression (max 600px, 70% quality JPEG)
  const compressImage = (file, maxWidth = 600, maxHeight = 600, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = (err) => reject(err);
      reader.onload = (e) => {
        // A teljes törzs try/catch-ben: enélkül egy itt dobott hiba nem
        // utasítja el a Promise-t, hanem örökre függőben hagyja (pontosan ez
        // történt a lucide `Image` ütközése miatt).
        try {
        // `window.Image` — a modul tetején importált lucide-ikon miatt a
        // csupasz `Image` itt NEM a böngésző konstruktora lenne.
        const img = new window.Image();
        img.onerror = (err) => reject(err);
        img.onload = () => {
          try {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.src = e.target?.result;
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file, 600, 600, 0.7);
        setImageUrl(compressedDataUrl);
      } catch (err) {
        console.error('Image compression failed, using fallback:', err);
        const reader = new FileReader();
        reader.onload = ev => {
          if (ev.target?.result) setImageUrl(ev.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Start Editing an Item
  const startEditing = (item) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditQuantity(item.quantity || '');
    setEditEstimatedPrice(item.estimatedPrice ? String(item.estimatedPrice) : '');
    setEditStore(item.store || 'Lidl');
    setEditCategory(item.category || 'Élelmiszer');
    setEditAssignedUser(item.assignedUser || activeUserId);
    setEditImageUrl(item.imageUrl || '');
    setIsAddingEditCustomStore(false);
    setEditCustomStoreName('');
  };

  const handleEditPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file, 600, 600, 0.7);
        setEditImageUrl(compressedDataUrl);
      } catch (err) {
        console.error('Image compression failed for edit:', err);
        const reader = new FileReader();
        reader.onload = ev => {
          if (ev.target?.result) setEditImageUrl(ev.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSaveEditCustomStore = () => {
    const trimmed = editCustomStoreName.trim();
    if (trimmed) {
      if (onAddCustomStore) {
        onAddCustomStore(trimmed);
      }
      setEditStore(trimmed);
      setEditCustomStoreName('');
      setIsAddingEditCustomStore(false);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingItem || !editTitle.trim()) return;

    if (onUpdateItem) {
      onUpdateItem(editingItem.id, {
        title: editTitle.trim(),
        quantity: editQuantity.trim() || undefined,
        estimatedPrice: Number(editEstimatedPrice) || 0,
        store: editStore,
        category: editCategory,
        assignedUser: editAssignedUser,
        imageUrl: editImageUrl.trim() || undefined
      });
    }

    setEditingItem(null);
  };

  const handleSaveCustomStore = () => {
    const trimmed = customStoreName.trim();
    if (trimmed) {
      if (onAddCustomStore) {
        onAddCustomStore(trimmed);
      }
      setStore(trimmed);
      setCustomStoreName('');
      setIsAddingCustomStore(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddItem({
      title: title.trim(),
      quantity: quantity.trim() || undefined,
      estimatedPrice: Number(estimatedPrice) || 0,
      store,
      category,
      date: todayIso(),
      assignedUser,
      imageUrl: imageUrl.trim() || undefined
    });

    setTitle('');
    setQuantity('');
    setEstimatedPrice('');
    setImageUrl('');
    setIsModalOpen(false);
  };

  return (
    <div className="glass-panel panel-pad">
      <div className="action-header">
        <div>
          <h2><ShoppingCart size={18} /> Bevásárlólista</h2>
          <p className="panel-sub">Kattints egy tételre a szerkesztéshez vagy a fotó csatolásához.</p>
        </div>

        <div className="action-header-buttons">
          <button className="btn-secondary" onClick={() => setIsStoreModeOpen(true)} title="Nagy méretű, boltban használható nézet">
            <Maximize2 size={15} /> Bolti nézet
          </button>

          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Új tétel
          </button>
        </div>
      </div>

      {/* Store Filter Dropdown */}
      <div className="filter-row">
        <Filter size={15} />
        <select
          className="form-select"
          value={selectedStore}
          onChange={e => setSelectedStore(e.target.value)}
          aria-label="Szűrés bolt szerint"
          style={selectedStore !== 'all' ? { borderColor: 'var(--accent-line)' } : undefined}
        >
          <option value="all">
            Összes üzlet ({items.filter(i => activeUserId === 'everyone' || i.assignedUser === activeUserId || i.assignedUser === 'everyone').length} tétel)
          </option>
          {availableStores.map(st => {
            const userMatchingItems = items.filter(i => activeUserId === 'everyone' || i.assignedUser === activeUserId || i.assignedUser === 'everyone');
            const count = userMatchingItems.filter(i => i.store === st).length;
            return (
              <option key={st} value={st}>
                {st} {count > 0 ? `(${count} tétel)` : ''}
              </option>
            );
          })}
        </select>
        {selectedStore !== 'all' && (
          <button className="btn-quiet btn-sm" onClick={() => setSelectedStore('all')}>
            <X size={14} /> Szűrő törlése
          </button>
        )}
      </div>

      {/* DENSE COMPACT SHOPPING LIST */}
      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={28} />
          <h3>A bevásárlólista üres</h3>
          <p>
            {selectedStore !== 'all'
              ? `Nincs tétel a(z) „${selectedStore}" szűrő alatt.`
              : 'Vedd fel az első tételt az „Új tétel" gombbal — fotót is csatolhatsz hozzá.'}
          </p>
        </div>
      ) : (
        <div className="compact-items-list">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`compact-item-card ${item.isCompleted ? 'completed' : ''}`}
              onClick={() => startEditing(item)}
              title="Kattints a tétel szerkesztéséhez"
            >
              <div className="compact-item-left">
                <div
                  className={`checkbox-custom ${item.isCompleted ? 'checked' : ''}`}
                  onClick={e => {
                    e.stopPropagation();
                    onToggleItem(item.id);
                  }}
                  role="checkbox"
                  aria-checked={item.isCompleted}
                  aria-label={`${item.title} kosárba téve`}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleItem(item.id);
                    }
                  }}
                >
                  {item.isCompleted && <Check size={14} />}
                </div>

                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="item-thumbnail" />
                ) : (
                  <div className="item-thumbnail">
                    <ShoppingBag size={14} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="compact-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span>{stripEmojis(item.title)}</span>
                    {item.quantity && !item.quantity.includes('ebéd') && !item.quantity.includes('vacsora') && (
                      <span className="item-qty">{stripEmojis(item.quantity)}</span>
                    )}
                    {(item.mealTag || (item.quantity && (item.quantity.includes('ebéd') || item.quantity.includes('vacsora')))) && (
                      <span className="meal-tag-badge" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: 'rgba(249, 115, 22, 0.18)',
                        color: '#fb923c',
                        border: '1px solid rgba(249, 115, 22, 0.35)',
                        fontWeight: 600
                      }}>
                        <Utensils size={10} />
                        {stripEmojis(item.mealTag || item.quantity)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="compact-item-right" onClick={e => e.stopPropagation()}>
                <span className="badge badge-store">
                  <Store size={11} /> {item.store}
                </span>

                {item.estimatedPrice > 0 && (
                  <span className="item-price">{item.estimatedPrice.toLocaleString('hu-HU')} Ft</span>
                )}

                <select
                  className="assignee-select"
                  value={item.assignedUser}
                  onChange={e => onReassignItem(item.id, e.target.value)}
                  style={{ color: users.find(u => u.id === item.assignedUser)?.color || 'var(--text-main)' }}
                  aria-label={`${item.title} felelőse`}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <button
                  className="btn-icon btn-icon-sm"
                  style={{ color: '#38bdf8' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(item);
                  }}
                  title="Tétel szerkesztése (mennyiség, név, ár)"
                >
                  <Pencil size={15} />
                </button>

                <button
                  className="btn-icon btn-icon-sm btn-icon-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(item);
                  }}
                  title="Tétel törlése"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {filteredItems.length > 0 && (
        <div className="summary-bar">
          <span>Hátralévő tételek becsült értéke</span>
          <span className="summary-total">{totalEstimated.toLocaleString('hu-HU')} Ft</span>
        </div>
      )}

      {/* BOLTI BEVÁSÁRLÓ ÜZEMMÓD (Portal to document.body) */}
      {isStoreModeOpen && createPortal(
        <div className="modal-overlay store-mode-overlay" style={{ zIndex: 9999 }} onClick={() => setIsStoreModeOpen(false)}>
          <div
            className="modal-content store-mode-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingCart size={24} style={{ color: '#38bdf8' }} /> Bolti Bevásárló Nézet
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#38bdf8', marginTop: '2px' }}>
                  Várható total: {totalEstimated.toLocaleString('hu-HU')} Ft
                </p>
              </div>

              <button className="btn-secondary" onClick={() => setIsStoreModeOpen(false)} style={{ padding: '0.5rem 1rem' }}>
                <X size={20} /> Bezárás
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
              {pendingItems.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.95rem', color: '#38bdf8', marginBottom: '0.75rem' }}>
                    Beszerzendő tételek ({pendingItems.length} db)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {pendingItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => onToggleItem(item.id)}
                        style={{
                          padding: '1rem',
                          background: 'rgba(30, 41, 59, 0.9)',
                          border: '2px solid rgba(56, 189, 248, 0.4)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <div
                          className="checkbox-custom"
                          style={{ width: '28px', height: '28px', borderRadius: '8px', border: '3px solid #38bdf8' }}
                        ></div>
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.title} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span>{stripEmojis(item.title)}</span>
                            {(item.mealTag || (item.quantity && (item.quantity.includes('ebéd') || item.quantity.includes('vacsora')))) && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '999px',
                                background: 'rgba(249, 115, 22, 0.22)',
                                color: '#fb923c',
                                border: '1px solid rgba(249, 115, 22, 0.4)',
                                fontWeight: 600
                              }}>
                                <Utensils size={12} />
                                {stripEmojis(item.mealTag || item.quantity)}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {item.quantity && !item.quantity.includes('ebéd') && !item.quantity.includes('vacsora') && <span>{stripEmojis(item.quantity)} • </span>}
                            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{item.store}</span>
                          </div>
                        </div>
                        {item.estimatedPrice > 0 && (
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#38bdf8' }}>
                            {item.estimatedPrice} Ft
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {completedItems.length > 0 && (
                <div style={{ marginTop: '1rem', opacity: 0.6 }}>
                  <h3 style={{ fontSize: '0.9rem', color: '#34d399', marginBottom: '0.5rem' }}>
                    Kosárba téve ({completedItems.length} db)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {completedItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => onToggleItem(item.id)}
                        style={{
                          padding: '0.85rem 1rem',
                          background: 'rgba(15, 23, 42, 0.5)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          cursor: 'pointer',
                          textDecoration: 'line-through'
                        }}
                      >
                        <Check size={18} style={{ color: '#34d399' }} />
                        <span style={{ fontSize: '1rem' }}>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* TELJES KIJELZŐS ÚJ TÉTEL MODÁL (Portal to document.body for true full screen overlay!) */}
      {isModalOpen && createPortal(
        <div
          className="modal-overlay full-screen-modal-overlay"
          style={{ zIndex: 9999 }}
          onClick={() => setIsModalOpen(false)}
        >
          <div className="modal-content full-screen-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={22} style={{ color: '#fff' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 className="modal-title">Új Bevásárlási Tétel</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tölts fel csomagolás fotót is, hogy a család tudja mit kell hozni!</p>
                </div>
              </div>

              <button
                className="btn-secondary"
                onClick={() => setIsModalOpen(false)}
                style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem', flexShrink: 0 }}
                title="Bezárás"
              >
                <X size={22} /> <span className="hide-on-tiny">Bezárás</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.95rem' }}>Tétel megnevezése *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="pl. Vanish Oxi Action Pink, Trapista sajt 50dkg..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ fontSize: '1.1rem', padding: '0.9rem 1.1rem' }}
                  autoFocus
                  required
                />
              </div>

              {/* PHOTO ATTACHMENT SECTION */}
              <div className="form-group" style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Camera size={20} style={{ color: '#38bdf8' }} /> Termék csomagolás fotója (Ajánlott!)
                </label>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Csatolj képet, hogy a boltban azonnal megismerhető legyen a pontos termék.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    accept="image/*"
                    id="fullscreen-photo-file-input"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => document.getElementById('fullscreen-photo-file-input')?.click()}
                    style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem', background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                  >
                    <ImageIcon size={18} /> Fotó feltöltése / Készítése mobillal
                  </button>

                  {imageUrl && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setImageUrl('')}
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <X size={16} /> Fotó eltávolítása
                    </button>
                  )}
                </div>

                {imageUrl && (
                  <div style={{ marginTop: '1rem', textAlign: 'center', background: '#090d16', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                    <img src={imageUrl} alt="Előnézet" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mennyiség (opcionális)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="pl. 2L, 1 flakon, 50dkg"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Becsült ár (Ft)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="pl. 1500"
                    value={estimatedPrice}
                    onChange={e => setEstimatedPrice(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ margin: 0 }}>Bolt / Üzlet</label>
                    {!isAddingCustomStore && (
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomStore(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#38bdf8',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Plus size={13} /> Új bolt hozzáadása
                      </button>
                    )}
                  </div>

                  {isAddingCustomStore ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Új bolt neve (pl. DM, Obi, Helyi zöldséges)..."
                        value={customStoreName}
                        onChange={e => setCustomStoreName(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        onClick={handleSaveCustomStore}
                      >
                        Hozzáadás
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '0.5rem 0.75rem' }}
                        onClick={() => {
                          setIsAddingCustomStore(false);
                          setCustomStoreName('');
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={store}
                      onChange={e => {
                        if (e.target.value === '__add_new__') {
                          setIsAddingCustomStore(true);
                        } else {
                          setStore(e.target.value);
                        }
                      }}
                    >
                      {availableStores.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="__add_new__">+ Új bolt hozzáadása...</option>
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label>Kategória</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Felelős családtag</label>
                <select
                  className="form-select"
                  value={assignedUser}
                  onChange={e => setAssignedUser(e.target.value)}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1.5rem' }}>
                  Mégse
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                  Tétel Mentése a Listába
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT SHOPPING ITEM MODAL (Portal to document.body for true mobile overlay) */}
      {editingItem && createPortal(
        <div className="modal-overlay full-screen-modal-overlay" style={{ zIndex: 9999 }} onClick={() => setEditingItem(null)}>
          <div className="modal-content full-screen-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pencil size={20} style={{ color: '#38bdf8' }} /> Tétel Szerkesztése
              </h2>
              <button className="btn-icon" onClick={() => setEditingItem(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Tétel megnevezése *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="pl. Zsemle, Tej, Kávé"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Mennyiség (pl. 8 db, 8 zsemle)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="pl. 8 db, 2L, 50 dkg"
                    value={editQuantity}
                    onChange={e => setEditQuantity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Becsült ár (Ft)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={editEstimatedPrice}
                    onChange={e => setEditEstimatedPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontWeight: 600 }}>Bolt / Üzlet</label>
                    {!isAddingEditCustomStore && (
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        onClick={() => setIsAddingEditCustomStore(true)}
                      >
                        <Plus size={12} /> Új bolt
                      </button>
                    )}
                  </div>

                  {isAddingEditCustomStore ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Bolt neve (pl. Spar, Penny)"
                        value={editCustomStoreName}
                        onChange={e => setEditCustomStoreName(e.target.value)}
                        autoFocus
                      />
                      <button type="button" className="btn-primary" onClick={handleSaveEditCustomStore} style={{ padding: '0.5rem 0.85rem' }}>
                        Hozzáadás
                      </button>
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      value={editStore}
                      onChange={e => {
                        if (e.target.value === '__add_new__') {
                          setIsAddingEditCustomStore(true);
                        } else {
                          setEditStore(e.target.value);
                        }
                      }}
                    >
                      {availableStores.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                      <option value="__add_new__">+ Új bolt hozzáadása...</option>
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Kategória</label>
                  <select
                    className="form-select"
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Felelős</label>
                <select
                  className="form-select"
                  value={editAssignedUser}
                  onChange={e => setEditAssignedUser(e.target.value)}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Termék Fotója (opcionális)</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    accept="image/*"
                    id="edit-photo-file-input"
                    onChange={handleEditPhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => document.getElementById('edit-photo-file-input')?.click()}
                    style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem', background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                  >
                    <ImageIcon size={18} /> Fotó feltöltése / csere
                  </button>

                  {editImageUrl && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditImageUrl('')}
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <X size={16} /> Fotó törlése
                    </button>
                  )}
                </div>

                {editImageUrl && (
                  <div style={{ marginTop: '0.75rem', textAlign: 'center', background: '#090d16', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                    <img src={editImageUrl} alt="Előnézet" style={{ maxHeight: '180px', borderRadius: '8px', objectFit: 'contain' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                  onClick={() => {
                    if (confirmDelete(editingItem)) {
                      setEditingItem(null);
                    }
                  }}
                >
                  <Trash2 size={16} /> Törlés
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditingItem(null)}
                  >
                    Mégse
                  </button>

                  <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.5rem' }}>
                    <Save size={18} /> Változtatások Mentése
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
