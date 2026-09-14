import React, { useState, useEffect } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, Check, Trash2, Clock,
  Calendar as CalendarIcon, RotateCcw, Utensils, ShoppingBag, CreditCard, CheckSquare, Store
} from 'lucide-react';
import { parseIsoDate, todayIso, formatLong } from '../utils/date';

const DAYS_OF_WEEK = [
  { key: 1, name: 'Hétfő' },
  { key: 2, name: 'Kedd' },
  { key: 3, name: 'Szerda' },
  { key: 4, name: 'Csütörtök' },
  { key: 5, name: 'Péntek' },
  { key: 6, name: 'Szombat' },
  { key: 0, name: 'Vasárnap' }
];

export const CalendarTab = ({
  selectedDate,
  onSelectDate,
  todos = [],
  shoppingItems = [],
  meals = [],
  bills = [],
  users = [],
  activeUserId,
  onAddTask,
  onToggleTask,
  onReassignTask,
  onDeleteTask,
  onToggleShoppingItem,
  onDeleteShoppingItem,
  onAddShoppingItem,
  onDeleteMeal,
  onAddIngredientsToShoppingList
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => parseIsoDate(selectedDate));
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newShoppingTitle, setNewShoppingTitle] = useState('');
  const [syncedMealIds, setSyncedMealIds] = useState(new Set());
  const [activeAgendaFilter, setActiveAgendaFilter] = useState('all'); // 'all' | 'meals' | 'todos' | 'shopping' | 'bills'

  // Sync month view if selectedDate changes externally
  useEffect(() => {
    if (selectedDate) {
      const parsed = parseIsoDate(selectedDate);
      setCurrentMonthDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  }, [selectedDate]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Hungarian day of week starting with Monday (0 = Monday, 6 = Sunday)
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay === -1) startDay = 6;

  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const todayStr = todayIso();
  const monthName = currentMonthDate.toLocaleDateString('hu-HU', { month: 'long', year: 'numeric' });

  // Generate calendar cells for the month grid
  const calendarCells = [];
  for (let i = 0; i < startDay; i++) {
    calendarCells.push({ isPadding: true, dayNum: '' });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    const dayTodos = todos.filter(t => {
      const matchesUser = activeUserId === 'everyone' || t.assignedUser === activeUserId || t.assignedUser === 'everyone';
      return matchesUser && t.date === isoDate;
    });

    const dayShopping = shoppingItems.filter(i => {
      const matchesUser = activeUserId === 'everyone' || i.assignedUser === activeUserId || i.assignedUser === 'everyone';
      return matchesUser && i.date === isoDate;
    });

    const dayMeals = meals.filter(m => m.date === isoDate);

    const dayBills = bills.filter(b => {
      const matchesUser = activeUserId === 'everyone' || b.assignedUser === activeUserId || b.assignedUser === 'everyone';
      return matchesUser && b.dueDate === isoDate;
    });

    const pendingTodosCount = dayTodos.filter(t => !t.isCompleted).length;
    const pendingShoppingCount = dayShopping.filter(i => !i.isCompleted).length;

    calendarCells.push({
      isPadding: false,
      dayNum: d,
      isoDate,
      pendingTodosCount,
      pendingShoppingCount,
      hasMeals: dayMeals.length > 0,
      mealsCount: dayMeals.length,
      hasBills: dayBills.length > 0,
      billsCount: dayBills.length
    });
  }

  // Selected Day's Agenda Items
  const selectedDayTodos = todos.filter(t => {
    const matchesUser = activeUserId === 'everyone' || t.assignedUser === activeUserId || t.assignedUser === 'everyone';
    return matchesUser && t.date === selectedDate;
  });

  const selectedDayShopping = shoppingItems.filter(i => {
    const matchesUser = activeUserId === 'everyone' || i.assignedUser === activeUserId || i.assignedUser === 'everyone';
    return matchesUser && i.date === selectedDate;
  });

  const selectedDayMeals = meals.filter(m => m.date === selectedDate);

  const selectedDayBills = bills.filter(b => {
    const matchesUser = activeUserId === 'everyone' || b.assignedUser === activeUserId || b.assignedUser === 'everyone';
    return matchesUser && b.dueDate === selectedDate;
  });

  const selectedDateFormatted = formatLong(selectedDate);

  const handleAddQuickTodo = (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    if (onAddTask) {
      onAddTask({
        title: newTodoTitle.trim(),
        category: 'Otthon',
        priority: 'medium',
        date: selectedDate,
        assignedUser: activeUserId === 'everyone' ? 'apa' : activeUserId
      });
    }
    setNewTodoTitle('');
  };

  const handleAddQuickShopping = (e) => {
    e.preventDefault();
    if (!newShoppingTitle.trim()) return;

    if (onAddShoppingItem) {
      onAddShoppingItem({
        title: newShoppingTitle.trim(),
        estimatedPrice: 0,
        store: 'Lidl',
        category: 'Élelmiszer',
        date: selectedDate,
        assignedUser: activeUserId === 'everyone' ? 'apa' : activeUserId
      });
    }
    setNewShoppingTitle('');
  };

  const getDayNameFromDate = (dateStr) => {
    if (!dateStr) return '';
    const d = parseIsoDate(dateStr);
    const dayIndex = d.getDay();
    const dayObj = DAYS_OF_WEEK.find(dw => dw.key === dayIndex);
    return dayObj ? dayObj.name : '';
  };

  const handleCopyMealIngredients = (meal) => {
    if (!meal || !meal.ingredients || !onAddIngredientsToShoppingList) return;
    const dayName = getDayNameFromDate(meal.date);
    onAddIngredientsToShoppingList(
      meal.ingredients,
      'Lidl',
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

  const totalItemsOnSelectedDay =
    selectedDayTodos.length + selectedDayShopping.length + selectedDayMeals.length + selectedDayBills.length;

  return (
    <div className="glass-panel panel-pad">
      {/* Action Header */}
      <div className="action-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2><CalendarDays size={18} /> Összesített Családi Naptár</h2>
          <p className="panel-sub">Teendők, menü, bevásárlási tételek és számlák egyetlen felületen.</p>
        </div>

        <button
          className="btn-secondary"
          onClick={() => {
            onSelectDate(todayStr);
            setCurrentMonthDate(new Date());
          }}
        >
          <RotateCcw size={14} /> Mai nap
        </button>
      </div>

      {/* Month Navigator Header */}
      <div className="month-nav">
        <h3 className="month-name">{monthName}</h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="nav-arrow-btn" onClick={prevMonth} title="Előző hónap" aria-label="Előző hónap">
            <ChevronLeft size={17} />
          </button>
          <button className="nav-arrow-btn" onClick={nextMonth} title="Következő hónap" aria-label="Következő hónap">
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* Interactive Calendar 7-Column Grid */}
      <div className="calendar-grid" style={{ marginBottom: '1.5rem' }}>
        {['Hé', 'Ke', 'Sze', 'Csü', 'Pé', 'Szo', 'Va'].map((dayName, idx) => (
          <div
            key={dayName}
            className={`calendar-header-day ${idx >= 5 ? 'weekend' : ''}`}
          >
            {dayName}
          </div>
        ))}

        {calendarCells.map((cell, idx) => {
          if (cell.isPadding) {
            return <div key={`pad-${idx}`} className="calendar-cell is-padding"></div>;
          }

          const isSelected = cell.isoDate === selectedDate;
          const isToday = cell.isoDate === todayStr;

          return (
            <div
              key={cell.isoDate}
              className={`calendar-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectDate(cell.isoDate)}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDate(cell.isoDate);
                }
              }}
            >
              <span className="calendar-day-num">{cell.dayNum}</span>
              
              {/* Multi-entity Mini Badge Dots */}
              <div className="calendar-cell-dots" style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2px' }}>
                {cell.hasMeals && (
                  <span className="badge-mini-dot" style={{ background: '#f59e0b', color: '#fff', fontSize: '9px', padding: '1px 3px', borderRadius: '4px' }} title={`${cell.mealsCount} étel rögzítve`}>
                    🍲
                  </span>
                )}
                {cell.pendingTodosCount > 0 && (
                  <span className="calendar-task-badge pending" title={`${cell.pendingTodosCount} nyitott teendő`}>
                    {cell.pendingTodosCount}
                  </span>
                )}
                {cell.pendingShoppingCount > 0 && (
                  <span className="calendar-task-badge" style={{ background: '#38bdf8', color: '#0f172a' }} title={`${cell.pendingShoppingCount} beszerzendő tétel`}>
                    🛒 {cell.pendingShoppingCount}
                  </span>
                )}
                {cell.hasBills && (
                  <span className="badge-mini-dot" style={{ background: '#ef4444', color: '#fff', fontSize: '9px', padding: '1px 3px', borderRadius: '4px' }} title={`${cell.billsCount} esedékes számla`}>
                    💳
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Agenda Details */}
      <div className="day-agenda">
        <div className="day-agenda-head" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 className="day-agenda-title">{selectedDateFormatted}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              {totalItemsOnSelectedDay === 0 ? 'Nincs bejegyzés erre a napra.' : `${totalItemsOnSelectedDay} elem rögzítve erre a napra.`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              className={`btn-quiet btn-sm ${activeAgendaFilter === 'all' ? 'active-filter' : ''}`}
              onClick={() => setActiveAgendaFilter('all')}
              style={activeAgendaFilter === 'all' ? { background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' } : undefined}
            >
              Összes ({totalItemsOnSelectedDay})
            </button>
            {selectedDayMeals.length > 0 && (
              <button
                className={`btn-quiet btn-sm ${activeAgendaFilter === 'meals' ? 'active-filter' : ''}`}
                onClick={() => setActiveAgendaFilter('meals')}
                style={activeAgendaFilter === 'meals' ? { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' } : undefined}
              >
                🍲 Ételek ({selectedDayMeals.length})
              </button>
            )}
            {selectedDayTodos.length > 0 && (
              <button
                className={`btn-quiet btn-sm ${activeAgendaFilter === 'todos' ? 'active-filter' : ''}`}
                onClick={() => setActiveAgendaFilter('todos')}
                style={activeAgendaFilter === 'todos' ? { background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' } : undefined}
              >
                📋 Teendők ({selectedDayTodos.length})
              </button>
            )}
            {selectedDayShopping.length > 0 && (
              <button
                className={`btn-quiet btn-sm ${activeAgendaFilter === 'shopping' ? 'active-filter' : ''}`}
                onClick={() => setActiveAgendaFilter('shopping')}
                style={activeAgendaFilter === 'shopping' ? { background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' } : undefined}
              >
                🛒 Bevásárlás ({selectedDayShopping.length})
              </button>
            )}
          </div>
        </div>

        {/* SECTION 1: 🍲 MEALS / MENÜ FOR THIS DATE */}
        {(activeAgendaFilter === 'all' || activeAgendaFilter === 'meals') && selectedDayMeals.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <Utensils size={16} /> Napi Menü & Ételek
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {selectedDayMeals.map(meal => {
                const user = users.find(u => u.id === meal.suggestedBy);
                const isSynced = syncedMealIds.has(meal.id);
                return (
                  <div key={meal.id} className="meal-card" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.75rem 1rem' }}>
                    <div className="meal-card-head" style={{ marginBottom: '0.4rem' }}>
                      <div className="meal-title-row">
                        <span className="meal-title" style={{ fontSize: '1rem', fontWeight: 700 }}>{meal.title}</span>
                        <span className="badge badge-category" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                          {meal.mealType === 'vacsora' ? 'Vacsora' : 'Ebéd'}
                        </span>
                        {user && (
                          <span className="meal-by" style={{ color: user.color }}>
                            <span className="user-dot" /> {user.name}
                          </span>
                        )}
                      </div>

                      {onDeleteMeal && (
                        <button
                          className="btn-icon btn-icon-sm btn-icon-danger"
                          onClick={() => {
                            if (window.confirm(`Törlöd a(z) "${meal.title}" ételt?`)) onDeleteMeal(meal.id);
                          }}
                          title="Törlés"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {meal.ingredients && (
                      <div className="meal-foot" style={{ marginTop: '0.4rem' }}>
                        <div className="meal-ingredients" style={{ fontSize: '0.85rem' }}>
                          <ShoppingBag size={13} style={{ color: '#38bdf8' }} />
                          <span>{meal.ingredients}</span>
                        </div>
                        {onAddIngredientsToShoppingList && (
                          <button
                            className="btn-quiet btn-sm"
                            onClick={() => handleCopyMealIngredients(meal)}
                            style={isSynced ? { color: 'var(--ok)' } : { color: '#38bdf8' }}
                          >
                            {isSynced ? <Check size={13} /> : <Plus size={13} />}
                            {isSynced ? 'Átmásolva' : 'Listára'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: 📋 TODO TASKS FOR THIS DATE */}
        {(activeAgendaFilter === 'all' || activeAgendaFilter === 'todos') && (
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <CheckSquare size={16} /> Teendők & Feladatok ({selectedDayTodos.length})
            </h4>

            {/* Quick Add Todo for Selected Date */}
            <form onSubmit={handleAddQuickTodo} className="quick-add" style={{ marginBottom: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Új teendő rögzítése erre a napra…"
                value={newTodoTitle}
                onChange={e => setNewTodoTitle(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                <Plus size={16} /> <span className="hide-on-tiny">Teendő</span>
              </button>
            </form>

            {selectedDayTodos.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                Nincs teendő rögzítve erre a napra.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedDayTodos.map(task => (
                  <div
                    key={task.id}
                    className={`item-card ${task.isCompleted ? 'completed' : ''}`}
                  >
                    <div className="item-left">
                      <div
                        className={`checkbox-custom ${task.isCompleted ? 'checked' : ''}`}
                        onClick={() => onToggleTask && onToggleTask(task.id)}
                        role="checkbox"
                        aria-checked={task.isCompleted}
                        tabIndex={0}
                      >
                        {task.isCompleted && <Check size={14} />}
                      </div>
                      <span className="item-title">{task.title}</span>
                    </div>

                    <div className="item-right">
                      {users.length > 0 && onReassignTask && (
                        <select
                          className="assignee-select"
                          value={task.assignedUser}
                          onChange={e => onReassignTask(task.id, e.target.value)}
                          style={{ color: users.find(u => u.id === task.assignedUser)?.color || 'var(--text-main)' }}
                        >
                          {users.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      )}

                      {onDeleteTask && (
                        <button
                          className="btn-icon btn-icon-sm btn-icon-danger"
                          onClick={() => {
                            if (window.confirm(`Törlöd ezt a feladatot: "${task.title}"?`)) onDeleteTask(task.id);
                          }}
                          title="Feladat törlése"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: 🛒 SHOPPING ITEMS FOR THIS DATE */}
        {(activeAgendaFilter === 'all' || activeAgendaFilter === 'shopping') && (
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <ShoppingBag size={16} /> Bevásárlólista Erre a Napra ({selectedDayShopping.length})
            </h4>

            {/* Quick Add Shopping Item for Selected Date */}
            <form onSubmit={handleAddQuickShopping} className="quick-add" style={{ marginBottom: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Új vásárlási tétel erre a napra…"
                value={newShoppingTitle}
                onChange={e => setNewShoppingTitle(e.target.value)}
              />
              <button type="submit" className="btn-secondary" style={{ borderColor: '#38bdf8', color: '#38bdf8' }}>
                <Plus size={16} /> <span className="hide-on-tiny">Tétel</span>
              </button>
            </form>

            {selectedDayShopping.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                Nincs ütemezett bevásárlás erre a napra.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedDayShopping.map(item => (
                  <div
                    key={item.id}
                    className={`compact-item-card ${item.isCompleted ? 'completed' : ''}`}
                    style={{ padding: '0.6rem 0.85rem' }}
                  >
                    <div className="compact-item-left">
                      <div
                        className={`checkbox-custom ${item.isCompleted ? 'checked' : ''}`}
                        onClick={() => onToggleShoppingItem && onToggleShoppingItem(item.id)}
                        role="checkbox"
                        aria-checked={item.isCompleted}
                        tabIndex={0}
                      >
                        {item.isCompleted && <Check size={14} />}
                      </div>
                      <div className="compact-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span>{item.title}</span>
                        {item.quantity && !item.quantity.startsWith('📌') && <span className="item-qty">{item.quantity}</span>}
                        {item.mealTag && (
                          <span className="meal-tag-badge" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '999px', background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', fontWeight: 600 }}>
                            {item.mealTag}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="compact-item-right">
                      <span className="badge badge-store" style={{ fontSize: '0.75rem' }}>
                        <Store size={10} /> {item.store}
                      </span>
                      {onDeleteShoppingItem && (
                        <button
                          className="btn-icon btn-icon-sm btn-icon-danger"
                          onClick={() => {
                            if (window.confirm(`Törlöd a listáról: "${item.title}"?`)) onDeleteShoppingItem(item.id);
                          }}
                          title="Tétel törlése"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: 💳 BILLS DUE ON THIS DATE */}
        {(activeAgendaFilter === 'all' || activeAgendaFilter === 'bills') && selectedDayBills.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <CreditCard size={16} /> Esedékes Csekkek & Számlák ({selectedDayBills.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedDayBills.map(bill => (
                <div key={bill.id} className="item-card" style={{ borderLeft: '3px solid #ef4444' }}>
                  <div className="item-left">
                    <CreditCard size={16} style={{ color: '#ef4444' }} />
                    <span className="item-title" style={{ fontWeight: 700 }}>{bill.title}</span>
                    <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                      {bill.category}
                    </span>
                  </div>

                  <div className="item-right">
                    <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '1rem' }}>
                      {bill.amountFt.toLocaleString('hu-HU')} Ft
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state when no items at all for this day */}
        {totalItemsOnSelectedDay === 0 && (
          <div className="empty-state" style={{ padding: '24px' }}>
            <CalendarIcon size={24} />
            <p>Erre a napra nincs rögzített bejegyzés.</p>
          </div>
        )}
      </div>
    </div>
  );
};
