import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export const DayNavigator = ({
  selectedDate,
  onSelectDate,
  onOpenCalendarModal
}) => {
  const getDaysOfWeek = (currentDateStr) => {
    const current = new Date(currentDateStr);
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Get past 3 days and next 3 days around selectedDate
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(current);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('hu-HU', { weekday: 'short' });
      const dayNum = d.getDate();
      days.push({
        iso,
        dayName: dayName.toUpperCase(),
        dayNum,
        isToday: iso === todayStr
      });
    }
    return days;
  };

  const days = getDaysOfWeek(selectedDate);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="day-navigator">
      <button className="nav-arrow-btn" onClick={handlePrevDay} title="Előző nap">
        <ChevronLeft size={20} />
      </button>

      <div className="days-scroll-container">
        {days.map(day => (
          <div
            key={day.iso}
            className={`day-chip ${day.iso === selectedDate ? 'active' : ''} ${day.isToday ? 'today-badge' : ''}`}
            onClick={() => onSelectDate(day.iso)}
          >
            <span className="day-name">{day.dayName}</span>
            <span className="day-number">{day.dayNum}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button className="nav-arrow-btn" onClick={handleNextDay} title="Következő nap">
          <ChevronRight size={20} />
        </button>

        <button className="btn-secondary" onClick={onOpenCalendarModal} style={{ padding: '0.5rem 0.85rem' }}>
          <CalendarIcon size={18} />
          <span style={{ fontSize: '0.85rem' }}>Naptár</span>
        </button>
      </div>
    </div>
  );
};
