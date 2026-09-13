// Egységes, időzóna-biztos dátumkezelés.
//
// A `new Date('2026-09-13')` UTC éjfélként értelmez, a `toISOString()` pedig
// UTC-ben ad vissza — a kettő kombinációja negatív eltolású időzónákban
// egy nappal elcsúszik. Ezért itt mindenhol helyi idővel dolgozunk.

/** 'YYYY-MM-DD' → helyi idejű Date (helyi éjfélkor). */
export const parseIsoDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  return new Date(dateStr);
};

/** Date → 'YYYY-MM-DD' helyi idő szerint. */
export const formatIsoDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** A mai nap 'YYYY-MM-DD' formában. */
export const todayIso = () => formatIsoDate(new Date());

/** 'YYYY-MM-DD' + n nap → 'YYYY-MM-DD'. */
export const addDays = (dateStr, days) => {
  const d = parseIsoDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatIsoDate(d);
};

/** A dátumot tartalmazó hét hétfője, `weekOffset` héttel eltolva. */
export const startOfWeek = (dateStr, weekOffset = 0) => {
  const d = parseIsoDate(dateStr);
  const day = d.getDay(); // 0 = vasárnap
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday + weekOffset * 7);
  return formatIsoDate(d);
};
