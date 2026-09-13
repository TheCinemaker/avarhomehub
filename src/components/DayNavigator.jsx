import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { parseIsoDate, formatIsoDate, todayIso, addDays } from '../utils/date';

export const DayNavigator = ({ selectedDate, onSelectDate, onOpenCalendar }) => {
  // Helyi idővel számolunk — a new Date(iso) + toISOString() páros UTC-n
  // keresztül ment, ami negatív eltolású időzónákban egy napot csúszott.
  const current = parseIsoDate(selectedDate);
  const todayStr = todayIso();

  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(current);
    d.setDate(d.getDate() + i);
    const iso = formatIsoDate(d);
    days.push({
      iso,
      dayName: d.toLocaleDateString('hu-HU', { weekday: 'short' }).replace('.', ''),
      dayNum: d.getDate(),
      isToday: iso === todayStr
    });
  }

  // Telefonon a 7 napból csak 3-4 fér ki, és a csík a legrégebbi napnál állt.
  const scrollRef = useRef(null);
  const activeChipRef = useRef(null);
  const didInitialScroll = useRef(false);

  useEffect(() => {
    const container = scrollRef.current;
    const chip = activeChipRef.current;
    if (!container || !chip) return;

    // getBoundingClientRect: az offsetLeft az offsetParent-hez mér, ami itt
    // nem a görgetődoboz — emiatt csúszott el korábban a középre állítás.
    const cRect = container.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const delta = (chipRect.left - cRect.left) - (cRect.width - chipRect.width) / 2;

    container.scrollBy({
      left: delta,
      behavior: didInitialScroll.current ? 'smooth' : 'auto'
    });
    didInitialScroll.current = true;
  }, [selectedDate]);

  return (
    <div className="day-navigator">
      <button
        className="nav-arrow-btn"
        onClick={() => onSelectDate(addDays(selectedDate, -1))}
        title="Előző nap"
        aria-label="Előző nap"
      >
        <ChevronLeft size={17} />
      </button>

      <div className="days-scroll-container" ref={scrollRef}>
        {days.map(day => {
          const isActive = day.iso === selectedDate;
          return (
            <button
              type="button"
              key={day.iso}
              ref={isActive ? activeChipRef : null}
              className={`day-chip ${isActive ? 'active' : ''} ${day.isToday ? 'today-badge' : ''}`}
              onClick={() => onSelectDate(day.iso)}
              aria-pressed={isActive}
            >
              <span className="day-name">{day.dayName}</span>
              <span className="day-number">{day.dayNum}</span>
            </button>
          );
        })}
      </div>

      <button
        className="nav-arrow-btn"
        onClick={() => onSelectDate(addDays(selectedDate, 1))}
        title="Következő nap"
        aria-label="Következő nap"
      >
        <ChevronRight size={17} />
      </button>

      <button
        className="nav-arrow-btn"
        onClick={onOpenCalendar}
        title="Havi naptár"
        aria-label="Havi naptár megnyitása"
      >
        <CalendarDays size={17} />
      </button>
    </div>
  );
};
