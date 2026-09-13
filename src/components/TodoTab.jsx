import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckSquare, Plus, Trash2, Check, RefreshCw, X, UserPlus, Calendar } from 'lucide-react';
import { useModalBehavior } from '../hooks/useModalBehavior';
import { formatShort, formatLong, relativeDayName } from '../utils/date';

const PRIORITY_FILTERS = [
  { key: 'all', label: 'Összes prioritás' },
  { key: 'high', label: 'Magas' },
  { key: 'medium', label: 'Közepes' },
  { key: 'low', label: 'Alacsony' }
];

const CATEGORIES = ['Házimunka', 'Suli / Ovi', 'Ügyintézés', 'Autó', 'Kert', 'Hobbi', 'Egyéb'];

export const TodoTab = ({
  tasks,
  users,
  activeUserId,
  selectedDate,
  onAddTask,
  onToggleTask,
  onReassignTask,
  onDeleteTask
}) => {
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showAllDates, setShowAllDates] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Task Form State
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('Házimunka');
  const [assignedUser, setAssignedUser] = useState(activeUserId);
  const [taskDate, setTaskDate] = useState(selectedDate);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('napi');

  useModalBehavior(isModalOpen, () => setIsModalOpen(false));

  // „Ma" / „Holnap", egyébként olvasható dátum — nyers ISO helyett
  const dayLabel = relativeDayName(selectedDate) || formatLong(selectedDate);

  const confirmDeleteTask = (task) => {
    if (window.confirm(`Biztosan törlöd ezt a feladatot: "${task.title}"?`)) {
      onDeleteTask(task.id);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesDate = showAllDates || task.date === selectedDate;
    const matchesUser = activeUserId === 'everyone' || task.assignedUser === activeUserId || task.assignedUser === 'everyone';
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesDate && matchesUser && matchesPriority;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      date: taskDate,
      assignedUser,
      priority,
      category,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined
    });

    setTitle('');
    setIsModalOpen(false);
  };

  const getPriorityBadge = (p) => {
    if (p === 'high') {
      return <span className="badge badge-priority-high">Magas</span>;
    }
    if (p === 'medium') {
      return <span className="badge badge-priority-medium">Közepes</span>;
    }
    return <span className="badge badge-priority-low">Alacsony</span>;
  };

  return (
    <div className="glass-panel panel-pad">
      {/* Action Header */}
      <div className="action-header">
        <div>
          <h2><CheckSquare size={18} /> Teendők</h2>
          <p className="panel-sub">
            {showAllDates ? 'Minden feladat, dátumtól függetlenül' : dayLabel}
          </p>
        </div>

        <div className="action-header-buttons">
          <button
            className={`btn-secondary ${showAllDates ? 'active' : ''}`}
            onClick={() => setShowAllDates(!showAllDates)}
            aria-pressed={showAllDates}
          >
            <Calendar size={15} />
            {showAllDates ? 'Adott nap' : 'Összes nap'}
          </button>

          <button className="btn-primary" onClick={() => { setTaskDate(selectedDate); setIsModalOpen(true); }}>
            <Plus size={16} /> Új feladat
          </button>
        </div>
      </div>

      {/* Priority Filters */}
      <div className="filter-bar">
        {PRIORITY_FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-chip ${priorityFilter === f.key ? 'active' : ''}`}
            onClick={() => setPriorityFilter(f.key)}
            aria-pressed={priorityFilter === f.key}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={28} />
          <h3>Nincs feladat erre a napra</h3>
          <p>Minden kész — vagy vegyél fel újat az „Új feladat" gombbal.</p>
        </div>
      ) : (
        <div className="items-list">
          {filteredTasks.map(task => (
            <div key={task.id} className={`item-card ${task.isCompleted ? 'completed' : ''}`}>
              <div className="item-left">
                <div
                  className={`checkbox-custom ${task.isCompleted ? 'checked' : ''}`}
                  onClick={() => onToggleTask(task.id)}
                  role="checkbox"
                  aria-checked={task.isCompleted}
                  aria-label={`${task.title} kész`}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleTask(task.id);
                    }
                  }}
                >
                  {task.isCompleted && <Check size={14} />}
                </div>

                <div className="item-details">
                  <div className="item-title">{task.title}</div>
                  <div className="item-meta">
                    {getPriorityBadge(task.priority)}
                    <span className="badge badge-category">{task.category}</span>
                    
                    {/* User Assignment Selector */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <UserPlus size={12} style={{ color: 'var(--text-dim)' }} />
                      <select
                        className="assignee-select"
                        value={task.assignedUser}
                        onChange={e => onReassignTask(task.id, e.target.value)}
                        style={{ color: users.find(u => u.id === task.assignedUser)?.color || 'var(--text-main)' }}
                        aria-label={`${task.title} felelőse`}
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {task.isRecurring && (
                      <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                        <RefreshCw size={11} /> {task.recurringFrequency || 'Ismétlődő'}
                      </span>
                    )}
                    {showAllDates && <span>{formatShort(task.date)}</span>}
                  </div>
                </div>
              </div>

              <div className="item-right">
                <button
                  className="btn-icon btn-icon-sm btn-icon-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDeleteTask(task);
                  }}
                  title="Feladat törlése"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal (Portal to document.body to fix top cut-off on mobile) */}
      {isModalOpen && createPortal(
        <div className="modal-overlay full-screen-modal-overlay" style={{ zIndex: 9999 }} onClick={() => setIsModalOpen(false)}>
          <div className="modal-content full-screen-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={20} style={{ color: '#818cf8' }} /> Új Feladat Hozzáadása
              </h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Feladat megnevezése *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="pl. Növényöntözés, Szemét elvitele..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Prioritás</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="high">Magas</option>
                    <option value="medium">Közepes</option>
                    <option value="low">Alacsony</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Kategória</label>
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

              <div className="form-row">
                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Felelős családtag</label>
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

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Dátum</label>
                  <input
                    type="date"
                    className="form-input"
                    value={taskDate}
                    onChange={e => setTaskDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="recurring-check"
                  checked={isRecurring}
                  onChange={e => setIsRecurring(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="recurring-check" style={{ cursor: 'pointer', margin: 0, fontWeight: 600 }}>
                  Ismétlődő feladat (rendszeres teendő)
                </label>
              </div>

              {isRecurring && (
                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Ismétlődés gyakorisága</label>
                  <select
                    className="form-select"
                    value={recurringFrequency}
                    onChange={e => setRecurringFrequency(e.target.value)}
                  >
                    <option value="napi">Minden nap (Napi)</option>
                    <option value="heti">Minden héten (Heti)</option>
                    <option value="havi">Minden hónapban (Havi)</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Mégse
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                  Feladat Mentése
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
