import React, { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Check, Trash2, Clock, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { parseIsoDate, todayIso, formatLong } from '../utils/date';

export const CalendarTab = ({
  selectedDate,
  onSelectDate,
  todos,
  users,
  activeUserId,
  onAddTask,
  onToggleTask,
  onReassignTask,
  onDeleteTask
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => parseIsoDate(selectedDate));
  const [newTodoTitle, setNewTodoTitle] = useState('');

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

    calendarCells.push({
      isPadding: false,
      dayNum: d,
      isoDate,
      hasTodos: dayTodos.length > 0,
      pendingCount: dayTodos.filter(t => !t.isCompleted).length,
      completedCount: dayTodos.filter(t => t.isCompleted).length
    });
  }

  // Selected Day's Agenda Todos
  const selectedDayTodos = todos.filter(t => {
    const matchesUser = activeUserId === 'everyone' || t.assignedUser === activeUserId || t.assignedUser === 'everyone';
    return matchesUser && t.date === selectedDate;
  });

  // Az évszám csak akkor kell, ha nem az idei — lásd utils/date.js
  const selectedDateFormatted = formatLong(selectedDate);

  const handleAddQuickTodo = (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    onAddTask({
      title: newTodoTitle.trim(),
      category: 'Otthon',
      priority: 'medium',
      date: selectedDate,
      assignedUser: activeUserId === 'everyone' ? 'apa' : activeUserId
    });
    setNewTodoTitle('');
  };

  return (
    <div className="glass-panel panel-pad">
      {/* Action Header */}
      <div className="action-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2><CalendarDays size={18} /> Naptár</h2>
          <p className="panel-sub">Válassz napot a rácsban a teendők kezeléséhez.</p>
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
              aria-label={`${cell.isoDate}${cell.pendingCount > 0 ? `, ${cell.pendingCount} nyitott teendő` : ''}`}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDate(cell.isoDate);
                }
              }}
            >
              <span className="calendar-day-num">{cell.dayNum}</span>
              <div className="calendar-cell-dots">
                {cell.pendingCount > 0 && (
                  <span className="calendar-task-badge pending" title={`${cell.pendingCount} nyitott teendő`}>
                    {cell.pendingCount}
                  </span>
                )}
                {cell.completedCount > 0 && cell.pendingCount === 0 && (
                  <span className="calendar-task-badge completed" title="Minden kész">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Agenda Details */}
      <div className="day-agenda">
        <div className="day-agenda-head">
          <h3 className="day-agenda-title">{selectedDateFormatted}</h3>
          <span className="badge badge-today">{selectedDayTodos.length} teendő</span>
        </div>

        {/* Quick Add Todo for Selected Date */}
        <form onSubmit={handleAddQuickTodo} className="quick-add">
          <input
            type="text"
            className="form-input"
            placeholder="Új teendő erre a napra…"
            value={newTodoTitle}
            onChange={e => setNewTodoTitle(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            <Plus size={16} /> <span className="hide-on-tiny">Hozzáadás</span>
          </button>
        </form>

        {/* List of Todos for Selected Date */}
        {selectedDayTodos.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px' }}>
            <CalendarIcon size={24} />
            <p>Erre a napra nincs teendő.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {selectedDayTodos.map(task => (
              <div
                key={task.id}
                className={`item-card ${task.isCompleted ? 'completed' : ''}`}
              >
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
                  <span className="item-title">{task.title}</span>
                </div>

                <div className="item-right">
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

                  <button
                    className="btn-icon btn-icon-sm btn-icon-danger"
                    onClick={() => {
                      if (window.confirm(`Biztosan törlöd ezt a feladatot: "${task.title}"?`)) {
                        onDeleteTask(task.id);
                      }
                    }}
                    title="Feladat törlése"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
