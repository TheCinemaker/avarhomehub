import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, Check, RefreshCw, X, UserPlus, Calendar } from 'lucide-react';

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
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      {/* Action Header */}
      <div className="action-header">
        <div>
          <h2>
            <CheckSquare size={24} style={{ color: '#818cf8' }} />
            Napi Teendők & Feladatok — {selectedDate}
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            {showAllDates ? 'Minden feladat áttekintése' : `${selectedDate} napra beütemezve`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn-secondary ${showAllDates ? 'active' : ''}`}
            onClick={() => setShowAllDates(!showAllDates)}
            style={{ fontSize: '0.825rem' }}
          >
            <Calendar size={16} />
            {showAllDates ? 'Csak a mai nap' : 'Összes feladat'}
          </button>

          <button className="btn-primary" onClick={() => { setTaskDate(selectedDate); setIsModalOpen(true); }}>
            <Plus size={18} />
            Új Feladat
          </button>
        </div>
      </div>

      {/* Priority Filters */}
      <div className="filter-bar">
        <button
          className={`filter-chip ${priorityFilter === 'all' ? 'active' : ''}`}
          onClick={() => setPriorityFilter('all')}
        >
          Összes prioritás
        </button>
        <button
          className={`filter-chip ${priorityFilter === 'high' ? 'active' : ''}`}
          onClick={() => setPriorityFilter('high')}
        >
          Magas
        </button>
        <button
          className={`filter-chip ${priorityFilter === 'medium' ? 'active' : ''}`}
          onClick={() => setPriorityFilter('medium')}
        >
          Közepes
        </button>
        <button
          className={`filter-chip ${priorityFilter === 'low' ? 'active' : ''}`}
          onClick={() => setPriorityFilter('low')}
        >
          Alacsony
        </button>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={40} style={{ color: 'var(--text-dim)' }} />
          <h3>Nincs elintézendő feladat erre a napra!</h3>
          <p>Minden el van végezve, vagy adj hozzá új feladatot az "Új Feladat" gombbal.</p>
        </div>
      ) : (
        <div className="items-list">
          {filteredTasks.map(task => (
            <div key={task.id} className={`item-card ${task.isCompleted ? 'completed' : ''}`}>
              <div className="item-left">
                <div
                  className={`checkbox-custom ${task.isCompleted ? 'checked' : ''}`}
                  onClick={() => onToggleTask(task.id)}
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
                        value={task.assignedUser}
                        onChange={e => onReassignTask(task.id, e.target.value)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          color: users.find(u => u.id === task.assignedUser)?.color || 'var(--text-main)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.1rem 0.4rem',
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
                    </div>

                    {task.isRecurring && (
                      <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                        <RefreshCw size={11} /> {task.recurringFrequency || 'Ismétlődő'}
                      </span>
                    )}
                    {showAllDates && (
                      <span style={{ color: 'var(--text-dim)' }}>Dátum: {task.date}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="item-right">
                <button className="btn-icon" onClick={() => onDeleteTask(task.id)} title="Törlés">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Új Feladat Hozzáadása</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Feladat megnevezése *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="pl. Növényöntözés, Szemét elvitele..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Prioritás</label>
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

              <div className="form-row">
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

                <div className="form-group">
                  <label>Dátum</label>
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
                <label htmlFor="recurring-check" style={{ cursor: 'pointer', margin: 0 }}>
                  Ismétlődő feladat (rendszeres teendő)
                </label>
              </div>

              {isRecurring && (
                <div className="form-group">
                  <label>Ismétlődés gyakorisága</label>
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
                <button type="submit" className="btn-primary">
                  Feladat Mentése
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
