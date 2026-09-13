import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { parseIsoDate, formatIsoDate, todayIso, addDays } from '../utils/date';

export const DayNavigator = ({
  selectedDate,
  onSelectDate,
  onOpenCalendar
}) => {
  // Helyi idővel számolunk — a korábbi new Date(iso) + toISOString() páros
  // UTC-n keresztül ment, ami negatív eltolású időzónákban egy napot csúszott.
  const getDaysOfWeek = (currentDateStr) => {
    const current = parseIsoDate(currentDateStr);
    const todayStr = todayIso();

    // 3 nap visszafelé, 3 nap előre a kiválasztott nap körül
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(current);
      d.setDate(d.getDate() + i);
      const iso = formatIsoDate(d);
      const dayName = d.toLocaleDateString('hu-HU', { weekday: 'short' });
      days.push({
        iso,
        dayName: dayName.toUpperCase(),
        dayNum: d.getDate(),
        isToday: iso === todayStr
      });
    }
    return days;
  };

  const days = getDaysOfWeek(selectedDate);

  const handlePrevDay = () => onSelectDate(addDays(selectedDate, -1));
  const handleNextDay = () => onSelectDate(addDays(selectedDate, 1));

  // Telefonon a 7 napból csak 3-4 fér ki, és a csík a legrégebbi napnál állt.
  // A kiválasztott napot gördítsük középre.
  const scrollRef = useRef(null);
  const activeChipRef = useRef(null);
  const didInitialScroll = useRef(false);

  useEffect(() => {
    const container = scrollRef.current;
    const chip = activeChipRef.current;
    if (!container || !chip) return;

    // getBoundingClientRect-tel számolunk: az `offsetLeft` az offsetParent-hez
    // képest mér, ami itt nem a görgetődoboz, így elcsúszott a középre állítás.
    const cRect = container.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const delta = (chipRect.left - cRect.left) - (cRect.width - chipRect.width) / 2;

    container.scrollBy({
      left: delta,
      // Betöltéskor ugorjon oda azonnal; a későbbi napváltásnál már gördüljön.
      behavior: didInitialScroll.current ? 'smooth' : 'auto'
    });
    didInitialScroll.current = true;
  }, [selectedDate]);

  return (
    <div className="day-navigator">
      <button className="nav-arrow-btn" onClick={handlePrevDay} title="Előző nap">
        <ChevronLeft size={20} />
      </button>

      <div className="days-scroll-container" ref={scrollRef}>
        {days.map(day => (
          <button
            type="button"
            key={day.iso}
            ref={day.iso === selectedDate ? activeChipRef : null}
            className={`day-chip ${day.iso === selectedDate ? 'active' : ''} ${day.isToday ? 'today-badge' : ''}`}
            onClick={() => onSelectDate(day.iso)}
            aria-pressed={day.iso === selectedDate}
          >
            <span className="day-name">{day.dayName}</span>
            <span className="day-number">{day.dayNum}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button className="nav-arrow-btn" onClick={handleNextDay} title="Következő nap">
          <ChevronRight size={20} />
        </button>

        <button
          className="btn-secondary"
          onClick={onOpenCalendar}
          style={{ padding: '0.5rem 0.85rem' }}
          title="Havi naptár megnyitása"
        >
          <CalendarIcon size={18} />
          {/* Keskeny kijelzőn csak az ikon marad, hogy a nap-csíknak több hely jusson */}
          <span className="hide-on-tiny" style={{ fontSize: '0.85rem' }}>Naptár</span>
        </button>
      </div>
    </div>
  );
};
