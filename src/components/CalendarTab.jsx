import React, { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Check, Trash2, Clock, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';

const parseIsoDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date(dateStr);
};

const formatIsoDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

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

  const todayStr = formatIsoDate(new Date());
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

  const parsedSelected = parseIsoDate(selectedDate);
  const selectedDateFormatted = parsedSelected.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

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
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      {/* Action Header */}
      <div className="action-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarDays size={22} style={{ color: '#818cf8' }} /> Havi Naptár & Napi Áttekintő
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Kattints a rácsban bármelyik napra a teendők azonnali kezeléséhez
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={() => {
            onSelectDate(todayStr);
            setCurrentMonthDate(new Date());
          }}
          style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
        >
          <RotateCcw size={15} /> Ugrás a mai napra ({todayStr})
        </button>
      </div>

      {/* Month Navigator Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', background: 'rgba(15, 23, 42, 0.7)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
        <h3 style={{ fontSize: '1.15rem', textTransform: 'capitalize', fontWeight: 800, color: 'var(--text-main)' }}>
          {monthName}
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="nav-arrow-btn" onClick={prevMonth} title="Előző hónap">
            <ChevronLeft size={20} />
          </button>
          <button className="nav-arrow-btn" onClick={nextMonth} title="Következő hónap">
            <ChevronRight size={20} />
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
                    ✓
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Agenda Details */}
      <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#818cf8', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={18} /> {selectedDateFormatted}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Dátum: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{selectedDate}</span>
            </p>
          </div>

          <span style={{ fontSize: '0.825rem', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', fontWeight: 700 }}>
            {selectedDayTodos.length} teendő
          </span>
        </div>

        {/* Quick Add Todo for Selected Date */}
        <form onSubmit={handleAddQuickTodo} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder={`+ Új teendő erre a napra (${selectedDate})...`}
            value={newTodoTitle}
            onChange={e => setNewTodoTitle(e.target.value)}
            style={{ fontSize: '0.95rem', padding: '0.65rem 0.95rem' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            <Plus size={16} /> Hozzáadás
          </button>
        </form>

        {/* List of Todos for Selected Date */}
        {selectedDayTodos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 'var(--radius-md)', border: '1px border-glass' }}>
            <CalendarIcon size={28} style={{ opacity: 0.3, marginBottom: '0.3rem' }} />
            <p style={{ fontSize: '0.875rem' }}>Ezen a napon ({selectedDate}) nincsenek feljegyezve teendők.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {selectedDayTodos.map(task => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-glass)',
                  opacity: task.isCompleted ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div
                    className={`checkbox-custom ${task.isCompleted ? 'checked' : ''}`}
                    onClick={() => onToggleTask(task.id)}
                  >
                    {task.isCompleted && <Check size={14} />}
                  </div>
                  <span style={{ fontSize: '0.95rem', textDecoration: task.isCompleted ? 'line-through' : 'none', fontWeight: 600 }}>
                    {task.title}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <select
                    value={task.assignedUser}
                    onChange={e => onReassignTask(task.id, e.target.value)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      color: users.find(u => u.id === task.assignedUser)?.color || 'var(--text-main)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.725rem',
                      fontWeight: 700,
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

                  <button className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => onDeleteTask(task.id)} title="Törlés">
                    <Trash2 size={14} />
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
