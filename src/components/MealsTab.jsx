import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Utensils, Search, Plus, ShoppingBag, Trash2, Pencil, Calendar, Check, X, Clock, UserCheck, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useModalBehavior } from '../hooks/useModalBehavior';
import { parseIsoDate, todayIso, startOfWeek, addDays, formatShort, formatRange } from '../utils/date';

const DAYS_OF_WEEK = [
  { key: 1, name: 'Hétfő' },
  { key: 2, name: 'Kedd' },
  { key: 3, name: 'Szerda' },
  { key: 4, name: 'Csütörtök' },
  { key: 5, name: 'Péntek' },
  { key: 6, name: 'Szombat' },
  { key: 0, name: 'Vasárnap' }
];

const getRelativeTimeString = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const date = parseIsoDate(dateStr);
  date.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Ma';
  if (diffDays === 1) return 'Tegnap';
  if (diffDays === -1) return 'Holnap';
  if (diffDays < 0) return `${Math.abs(diffDays)} nap múlva`;

  if (diffDays < 30) return `${diffDays} napja`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} hónapja`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} éve`;
};

export const MealsTab = ({
  meals = [],
  users = [],
  activeUserId,
  selectedDate,
  stores = [],
  onAddMeal,
  onUpdateMeal,
  onDeleteMeal,
  onAddIngredientsToShoppingList
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);

  // Form State
  const [mealDate, setMealDate] = useState(selectedDate);
  const [mealType, setMealType] = useState('ebed');
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [suggestedBy, setSuggestedBy] = useState(activeUserId);
  const [notes, setNotes] = useState('');
  const [autoAddToShopping, setAutoAddToShopping] = useState(true);
  const [selectedStoreForShopping, setSelectedStoreForShopping] = useState('Lidl');
  const [syncedMealIds, setSyncedMealIds] = useState(new Set());

  // Week navigation state
  const [weekOffset, setWeekOffset] = useState(0);

  // A kiválasztott hét 7 napja (hétfőtől vasárnapig), helyi időben számolva.
  const getWeekDates = (offset = 0) => {
    const monday = startOfWeek(selectedDate, offset);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  };

  const weekDates = getWeekDates(weekOffset);

  useModalBehavior(isModalOpen, () => setIsModalOpen(false));

  const confirmDeleteMeal = (meal) => {
    if (window.confirm(`Biztosan törlöd az étlapról: "${meal.title}"?`)) {
      onDeleteMeal(meal.id);
    }
  };

  const startNewMeal = (defaultDate = selectedDate) => {
    setEditingMeal(null);
    setMealDate(defaultDate);
    setMealType('ebed');
    setTitle('');
    setIngredients('');
    setSuggestedBy(activeUserId === 'everyone' ? 'anya' : activeUserId);
    setNotes('');
    setAutoAddToShopping(true);
    setIsModalOpen(true);
  };

  const startEditMeal = (meal) => {
    setEditingMeal(meal);
    setMealDate(meal.date);
    setMealType(meal.mealType || 'ebed');
    setTitle(meal.title || '');
    setIngredients(meal.ingredients || '');
    setSuggestedBy(meal.suggestedBy || activeUserId);
    setNotes(meal.notes || '');
    setAutoAddToShopping(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const mealData = {
      date: mealDate,
      mealType,
      title: title.trim(),
      ingredients: ingredients.trim() || undefined,
      suggestedBy,
      notes: notes.trim() || undefined
    };

    if (editingMeal) {
      onUpdateMeal(editingMeal.id, mealData);
    } else {
      onAddMeal(mealData);
      if (autoAddToShopping && ingredients.trim()) {
        const dayName = getDayNameFromDate(mealDate);
        onAddIngredientsToShoppingList(
          ingredients.trim(),
          selectedStoreForShopping,
          { date: mealDate, mealTitle: title.trim(), mealType, dayName }
        );
      }
    }

    setIsModalOpen(false);
  };

  const getDayNameFromDate = (dateStr) => {
    if (!dateStr) return '';
    const d = parseIsoDate(dateStr);
    const dayIndex = d.getDay();
    const dayObj = DAYS_OF_WEEK.find(dw => dw.key === dayIndex);
    return dayObj ? dayObj.name : '';
  };

  const handleCopyIngredients = (ingredientsStr, meal) => {
    if (!ingredientsStr || !meal) return;
    const dayName = getDayNameFromDate(meal.date);
    onAddIngredientsToShoppingList(
      ingredientsStr,
      selectedStoreForShopping,
      { date: meal.date, mealTitle: meal.title, mealType: meal.mealType, dayName }
    );
    setSyncedMealIds(prev => new Set([...prev, meal.id]));
    setTimeout(() => {
      setSyncedMealIds(prev => {
        const next = new Set(prev);
        next.delete(meal.id);
        return next;
      });
    }, 3000);
  };

  // Search results filtering
  const isSearching = searchQuery.trim().length > 0;
  const searchResults = isSearching
    ? meals.filter(m => {
        const q = searchQuery.toLowerCase().trim();
        return (
          m.title.toLowerCase().includes(q) ||
          (m.ingredients && m.ingredients.toLowerCase().includes(q)) ||
          (m.notes && m.notes.toLowerCase().includes(q))
        );
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <div className="glass-panel panel-pad">
      {/* Header & Quick Action */}
      <div className="action-header">
        <div>
          <h2><Utensils size={18} /> Heti étlap</h2>
          <p className="panel-sub">Ötletek a hétre — a hozzávalók egy kattintással a bevásárlólistára kerülnek.</p>
        </div>

        <button className="btn-primary" onClick={() => startNewMeal(selectedDate)}>
          <Plus size={16} /> Új étel
        </button>
      </div>

      {/* SEARCH BAR (Ebéd Visszakereső) */}
      <div className="search-field">
        <Search size={16} />
        <input
          type="text"
          className="form-input"
          placeholder="Keresés korábbi ételek között…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Keresés az ételek között"
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Keresés törlése">
            <X size={15} />
          </button>
        )}
      </div>

      {/* SEARCH RESULTS VIEW */}
      {isSearching ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={18} /> Keresési találatok ("{searchQuery}") — {searchResults.length} étel
            </h3>
            <button className="btn-secondary" onClick={() => setSearchQuery('')} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
              Keresés törlése
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Utensils size={36} style={{ color: 'var(--text-dim)' }} />
              <h3>Nincs találat erre a keresésre!</h3>
              <p>Próbálj más ételnevet vagy hozzávalót beírni.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {searchResults.map(meal => {
                const user = users.find(u => u.id === meal.suggestedBy);
                const relativeTime = getRelativeTimeString(meal.date);
                const isSynced = syncedMealIds.has(meal.id);

                return (
                  <div
                    key={meal.id}
                    style={{
                      padding: '1rem',
                      background: 'rgba(30, 41, 59, 0.7)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-glass)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          {meal.title}
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', marginLeft: '0.5rem', background: 'rgba(245, 158, 11, 0.15)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)' }}>
                            {meal.mealType === 'vacsora' ? 'Vacsora' : 'Ebéd'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={13} /> {meal.date}
                          </span>
                          <span style={{ color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={13} /> {relativeTime}
                          </span>
                          {user && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: user.color, fontWeight: 700 }}>
                              <UserCheck size={13} /> Ötletgazda: {user.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button className="btn-icon btn-icon-sm" style={{ color: '#38bdf8' }} onClick={() => startEditMeal(meal)} title="Szerkesztés">
                          <Pencil size={15} />
                        </button>
                        <button className="btn-icon btn-icon-sm btn-icon-danger" onClick={() => confirmDeleteMeal(meal)} title="Törlés">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {meal.ingredients && (
                      <div style={{ marginTop: '0.25rem', padding: '0.5rem 0.75rem', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Hozzávalók:</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginTop: '2px' }}>{meal.ingredients}</div>
                        <button
                          className="btn-secondary"
                          onClick={() => handleCopyIngredients(meal.ingredients, meal)}
                          style={{ marginTop: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: isSynced ? '#34d399' : '#38bdf8', borderColor: isSynced ? '#34d399' : 'rgba(56, 189, 248, 0.4)' }}
                        >
                          {isSynced ? <Check size={14} /> : <ShoppingBag size={14} />}
                          {isSynced ? 'Átmásolva a bevásárlólistára' : 'Hozzávalók a bevásárlólistára'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* WEEKLY MENU GRID VIEW */
        <div>
          <div className="week-nav">
            <div className="week-nav-buttons">
              <button className="btn-secondary btn-sm" onClick={() => setWeekOffset(p => p - 1)} title="Előző hét" aria-label="Előző hét">
                <ChevronLeft size={15} />
              </button>
              <button
                className={`btn-secondary btn-sm ${weekOffset === 0 ? 'active' : ''}`}
                onClick={() => setWeekOffset(0)}
              >
                Ez a hét
              </button>
              <button className="btn-secondary btn-sm" onClick={() => setWeekOffset(p => p + 1)} title="Következő hét" aria-label="Következő hét">
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="week-range">{formatRange(weekDates[0], weekDates[6])}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {weekDates.map(dateStr => {
              const d = parseIsoDate(dateStr);
              const dayIndex = d.getDay();
              const dayObj = DAYS_OF_WEEK.find(dw => dw.key === dayIndex) || { name: '' };
              const isToday = dateStr === todayIso();

              const dayMeals = meals.filter(m => m.date === dateStr);

              return (
                <div key={dateStr} className={`day-row ${isToday ? 'is-today' : ''} ${dayMeals.length === 0 ? 'is-empty' : ''}`}>
                  <div className="day-row-head">
                    <div className="day-row-label">
                      <span className="day-row-name">{dayObj.name}</span>
                      <span className="day-row-date">{formatShort(dateStr)}</span>
                      {isToday && <span className="badge badge-today">Ma</span>}
                    </div>

                    <button className="btn-quiet btn-sm" onClick={() => startNewMeal(dateStr)} title="Étel felvétele erre a napra">
                      <Plus size={14} /> Felvétel
                    </button>
                  </div>

                  {dayMeals.length === 0 ? null : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {dayMeals.map(meal => {
                        const user = users.find(u => u.id === meal.suggestedBy);
                        const isSynced = syncedMealIds.has(meal.id);

                        return (
                          <div key={meal.id} className="meal-card">
                            <div className="meal-card-head">
                              <div className="meal-title-row">
                                <span className="meal-title">{meal.title}</span>
                                <span className="badge badge-category">
                                  {meal.mealType === 'vacsora' ? 'Vacsora' : 'Ebéd'}
                                </span>
                                {user && (
                                  <span className="meal-by" style={{ color: user.color }}>
                                    <span className="user-dot" />
                                    {user.name}
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: '2px' }}>
                                <button className="btn-icon btn-icon-sm" style={{ color: '#38bdf8' }} onClick={() => startEditMeal(meal)} title="Szerkesztés">
                                  <Pencil size={13} />
                                </button>
                                <button className="btn-icon btn-icon-sm btn-icon-danger" onClick={() => confirmDeleteMeal(meal)} title="Törlés">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {meal.ingredients && (
                              <div className="meal-foot">
                                <div className="meal-ingredients">
                                  <ShoppingBag size={13} />
                                  <span>{meal.ingredients}</span>
                                </div>
                                <button
                                  className="btn-quiet btn-sm"
                                  onClick={() => handleCopyIngredients(meal.ingredients, meal)}
                                  style={isSynced ? { color: 'var(--ok)' } : undefined}
                                >
                                  {isSynced ? <Check size={13} /> : <Plus size={13} />}
                                  {isSynced ? 'Átmásolva' : 'Listára'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD / EDIT MEAL MODAL (Portal to document.body) */}
      {isModalOpen && createPortal(
        <div className="modal-overlay full-screen-modal-overlay" style={{ zIndex: 9999 }} onClick={() => setIsModalOpen(false)}>
          <div className="modal-content full-screen-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Utensils size={20} style={{ color: '#f59e0b' }} />
                {editingMeal ? 'Étel Ötlet Szerkesztése' : 'Új Ebéd / Étel Ötlet Rögzítése'}
              </h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Étel megnevezése *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="pl. Rakott krumpli, Gulyásleves, Rántott sajt"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Dátum</label>
                  <input
                    type="date"
                    className="form-input"
                    value={mealDate}
                    onChange={e => setMealDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Típus</label>
                  <select
                    className="form-select"
                    value={mealType}
                    onChange={e => setMealType(e.target.value)}
                  >
                    <option value="ebed">Ebéd</option>
                    <option value="vacsora">Vacsora</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Ötletgazda családtag</label>
                <select
                  className="form-select"
                  value={suggestedBy}
                  onChange={e => setSuggestedBy(e.target.value)}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Hozzávalók (Bevásárlólistához)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="pl. 1kg krumpli, 50dkg kolbász, 1 vödör tejföl, 6 tojás (vesszővel vagy soronként elválasztva)"
                  value={ingredients}
                  onChange={e => setIngredients(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
                <span style={{ fontSize: '0.775rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  A hozzávalókat 1 kattintással felveheted a bevásárlólistára!
                </span>
              </div>

              {!editingMeal && ingredients.trim() && (
                <div className="form-group" style={{ gap: '0.65rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      id="auto-add-shop"
                      checked={autoAddToShopping}
                      onChange={e => setAutoAddToShopping(e.target.checked)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0, accentColor: '#f59e0b' }}
                    />
                    <label htmlFor="auto-add-shop" style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#f59e0b', margin: 0 }}>
                      Hozzávalók azonnali másolása a bevásárlólistára mentéskor
                    </label>
                  </div>

                  {/* A célbolt eddig fixen „Lidl" volt, pedig a `stores` lista
                      már be volt kötve a komponensbe — most választható. */}
                  {autoAddToShopping && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <label htmlFor="ingredients-store" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        Melyik boltba kerüljenek?
                      </label>
                      <select
                        id="ingredients-store"
                        className="form-select"
                        value={selectedStoreForShopping}
                        onChange={e => setSelectedStoreForShopping(e.target.value)}
                        style={{ width: 'auto', flex: '1 1 140px', minHeight: '40px', padding: '0.4rem 0.7rem' }}
                      >
                        {(stores && stores.length > 0 ? stores : ['Lidl']).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Mégse
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                  {editingMeal ? 'Módosítás Mentése' : 'Étel Mentése az Étlapra'}
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
