import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, Plus, Trash2, Check, Store, X, Maximize2, UserPlus, ShoppingBag, Camera, Image, Filter } from 'lucide-react';

const DEFAULT_STORES = ['Lidl', 'Aldi', 'SPAR', 'Tesco', 'Penny', 'Auchan', 'DM', 'Rossmann', 'Egyéb'];
const CATEGORIES = ['Élelmiszer', 'Háztartás', 'Gyógyszertár', 'Barkács', 'Személyes', 'Egyéb'];

export const ShoppingTab = ({
  items,
  users,
  activeUserId,
  stores = DEFAULT_STORES,
  onAddCustomStore,
  onAddItem,
  onToggleItem,
  onReassignItem,
  onDeleteItem
}) => {
  const [selectedStore, setSelectedStore] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStoreModeOpen, setIsStoreModeOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

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

  // Living Shopping Backlog List
  const filteredItems = items.filter(item => {
    const matchesUser = activeUserId === 'everyone' || item.assignedUser === activeUserId || item.assignedUser === 'everyone';
    const matchesStore = selectedStore === 'all' || item.store === selectedStore;
    return matchesUser && matchesStore;
  });

  const pendingItems = filteredItems.filter(i => !i.isCompleted);
  const completedItems = filteredItems.filter(i => i.isCompleted);
  const totalEstimated = pendingItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setImageUrl(ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
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
      date: new Date().toISOString().split('T')[0],
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
    <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
      {/* Action Header */}
      <div className="action-header">
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>
            <ShoppingCart size={22} style={{ color: '#38bdf8' }} />
            Bevásárlólista
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Sűrű, gyorsan átlátható lista • Kattints a részletekért & fotóért
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => setIsStoreModeOpen(true)}
            style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff', border: 'none', padding: '0.5rem 0.85rem' }}
          >
            <Maximize2 size={16} />
            Bolti Nézet
          </button>

          <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ padding: '0.5rem 1rem' }}>
            <Plus size={16} />
            Új Tétel + Fotó
          </button>
        </div>
      </div>

      {/* Store Filter Dropdown */}
      <div style={{ marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
          <Filter size={15} style={{ color: '#38bdf8' }} />
          <span>Boltok szűrő:</span>
        </div>
        <select
          className="form-select"
          value={selectedStore}
          onChange={e => setSelectedStore(e.target.value)}
          style={{
            flex: 1,
            minWidth: '220px',
            maxWidth: '340px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            background: 'rgba(15, 23, 42, 0.7)',
            borderColor: selectedStore !== 'all' ? '#38bdf8' : 'var(--border-glass)',
            color: selectedStore !== 'all' ? '#38bdf8' : 'var(--text-main)',
            borderRadius: 'var(--radius-md)'
          }}
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
          <button
            className="btn-secondary"
            onClick={() => setSelectedStore('all')}
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}
          >
            <X size={14} /> Szűrő törlése
          </button>
        )}
      </div>

      {/* DENSE COMPACT SHOPPING LIST */}
      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={36} style={{ color: 'var(--text-dim)' }} />
          <h3 style={{ fontSize: '1.05rem' }}>A bevásárlólista üres!</h3>
          <p style={{ fontSize: '0.85rem' }}>
            {selectedStore !== 'all' ? `Nincs tétel a(z) "${selectedStore}" bolt szűrő alatt.` : 'Írd fel a tételeket (fotóval vagy anélkül) a fenti "Új Tétel" gombbal.'}
          </p>
        </div>
      ) : (
        <div className="compact-items-list">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`compact-item-card ${item.isCompleted ? 'completed' : ''}`}
              onClick={() => setDetailItem(item)}
            >
              <div className="compact-item-left">
                <div
                  className={`checkbox-custom ${item.isCompleted ? 'checked' : ''}`}
                  onClick={e => {
                    e.stopPropagation();
                    onToggleItem(item.id);
                  }}
                >
                  {item.isCompleted && <Check size={14} />}
                </div>

                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="item-thumbnail" />
                ) : (
                  <div className="item-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                    <ShoppingBag size={14} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="compact-item-title">
                    {item.title}
                    {item.quantity && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.35rem', fontWeight: 400 }}>
                        ({item.quantity})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="compact-item-right" onClick={e => e.stopPropagation()}>
                <span className="badge badge-store" style={{ fontSize: '0.675rem', padding: '0.1rem 0.4rem' }}>
                  <Store size={10} /> {item.store}
                </span>

                {item.estimatedPrice > 0 && (
                  <span className="item-price" style={{ fontSize: '0.85rem' }}>
                    {item.estimatedPrice.toLocaleString('hu-HU')} Ft
                  </span>
                )}

                <select
                  value={item.assignedUser}
                  onChange={e => onReassignItem(item.id, e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: users.find(u => u.id === item.assignedUser)?.color || 'var(--text-main)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.05rem 0.35rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <button
                  className="btn-icon"
                  style={{ width: '28px', height: '28px' }}
                  onClick={() => onDeleteItem(item.id)}
                  title="Törlés"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {filteredItems.length > 0 && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.6rem 1rem',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.875rem'
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            Kosárba nem tett tételek (becsült total):
          </span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#38bdf8' }}>
            {totalEstimated.toLocaleString('hu-HU')} Ft
          </span>
        </div>
      )}

      {/* ITEM DETAIL & PHOTO MODAL (Portal to document.body for true overlay) */}
      {detailItem && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setDetailItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={20} style={{ color: '#38bdf8' }} /> {detailItem.title}
              </h3>
              <button className="btn-icon" onClick={() => setDetailItem(null)}>
                <X size={20} />
              </button>
            </div>

            {detailItem.imageUrl ? (
              <div style={{ textAlign: 'center', background: '#090d16', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                <img
                  src={detailItem.imageUrl}
                  alt={detailItem.title}
                  style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                <Image size={32} style={{ opacity: 0.4, marginBottom: '0.3rem' }} />
                <p style={{ fontSize: '0.85rem' }}>Ehhez a tételhez nincs csatolt fotó.</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bolt:</span>
                <span className="badge badge-store"><Store size={12} /> {detailItem.store}</span>
              </div>

              {detailItem.quantity && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mennyiség:</span>
                  <span style={{ fontWeight: 600 }}>{detailItem.quantity}</span>
                </div>
              )}

              {detailItem.estimatedPrice > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Becsült ár:</span>
                  <span style={{ fontWeight: 800, color: '#38bdf8' }}>{detailItem.estimatedPrice.toLocaleString('hu-HU')} Ft</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Kategória:</span>
                <span className="badge badge-category">{detailItem.category}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Felelős:</span>
                <span style={{ fontWeight: 600, color: users.find(u => u.id === detailItem.assignedUser)?.color }}>
                  {users.find(u => u.id === detailItem.assignedUser)?.name}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                className="btn-secondary"
                style={{ color: '#ef4444' }}
                onClick={() => {
                  onDeleteItem(detailItem.id);
                  setDetailItem(null);
                }}
              >
                <Trash2 size={16} /> Törlés
              </button>

              <button
                className="btn-primary"
                onClick={() => {
                  onToggleItem(detailItem.id);
                  setDetailItem(null);
                }}
              >
                {detailItem.isCompleted ? 'Visszatétel kosárból' : 'Kosárba téve (Pipa)'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* BOLTI BEVÁSÁRLÓ ÜZEMMÓD (Portal to document.body) */}
      {isStoreModeOpen && createPortal(
        <div className="modal-overlay" style={{ background: '#090d16', zIndex: 9999 }} onClick={() => setIsStoreModeOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '700px', width: '100%', height: '100vh', maxHeight: '100vh', borderRadius: 0, padding: '1.25rem' }}
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
                          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.title}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {item.quantity && <span>{item.quantity} • </span>}
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
        <div className="full-screen-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="full-screen-modal-wrapper">
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart size={22} style={{ color: '#fff' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Új Bevásárlási Tétel Hozzáadása</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tölts fel csomagolás fotót is, hogy a család tudja mit kell hozni!</p>
                </div>
              </div>

              <button className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem' }}>
                <X size={22} /> Bezárás
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
                    <Image size={18} /> Fotó feltöltése / Készítése mobillal
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
    </div>
  );
};
