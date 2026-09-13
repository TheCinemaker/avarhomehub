import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export const CalendarModal = ({
  selectedDate,
  onSelectDate,
  onClose,
  shoppingItems,
  todos,
  bills
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(selectedDate));

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

  const todayStr = new Date().toISOString().split('T')[0];

  const monthName = currentMonthDate.toLocaleDateString('hu-HU', { month: 'long', year: 'numeric' });

  // Generate grid cells
  const calendarCells = [];

  // Padding days from previous month
  for (let i = 0; i < startDay; i++) {
    calendarCells.push({ isPadding: true, dayNum: '' });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTodos = todos.filter(t => t.date === isoDate);
    const dayShop = shoppingItems.filter(s => s.date === isoDate);
    const dayBills = bills.filter(b => b.dueDate === isoDate);

    calendarCells.push({
      isPadding: false,
      dayNum: d,
      isoDate,
      hasTodos: dayTodos.length > 0,
      hasShop: dayShop.length > 0,
      hasBills: dayBills.length > 0,
      todoCount: dayTodos.length,
      shopCount: dayShop.length,
      billCount: dayBills.length
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarIcon size={20} style={{ color: '#8b5cf6' }} /> {monthName}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="nav-arrow-btn" onClick={prevMonth}>
              <ChevronLeft size={20} />
            </button>
            <button className="nav-arrow-btn" onClick={nextMonth}>
              <ChevronRight size={20} />
            </button>
            <button className="btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span className="dot-indicator dot-todo"></span> Teendők
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span className="dot-indicator dot-shop"></span> Bevásárlás
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span className="dot-indicator dot-bill"></span> Számlák
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {['Hé', 'Ke', 'Sze', 'Csü', 'Pé', 'Szo', 'Va'].map(dayName => (
            <div key={dayName} className="calendar-header-day">
              {dayName}
            </div>
          ))}

          {calendarCells.map((cell, idx) => {
            if (cell.isPadding) {
              return <div key={`pad-${idx}`} style={{ opacity: 0.2 }} className="calendar-cell"></div>;
            }

            const isSelected = cell.isoDate === selectedDate;
            const isToday = cell.isoDate === todayStr;

            return (
              <div
                key={cell.isoDate}
                className={`calendar-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  if (cell.isoDate) {
                    onSelectDate(cell.isoDate);
                    onClose();
                  }
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cell.dayNum}</span>
                <div className="calendar-cell-dots">
                  {cell.hasTodos && <span className="dot-indicator dot-todo" title={`${cell.todoCount} teendő`}></span>}
                  {cell.hasShop && <span className="dot-indicator dot-shop" title={`${cell.shopCount} bevásárlási tétel`}></span>}
                  {cell.hasBills && <span className="dot-indicator dot-bill" title={`${cell.billCount} számla`}></span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
