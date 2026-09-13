import { UserProfile, ShoppingItem, TodoTask, BillItem } from './types';
import { formatIsoDate } from './utils/date';

// Megjelenítési sorrendben: Apa, Anya, Ármin, majd a „Mindannyian".
export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'apa',
    name: 'Apa',
    avatar: 'AP',
    color: '#3b82f6',
    themeVar: '--user-apa'
  },
  {
    id: 'anya',
    name: 'Anya',
    avatar: 'AN',
    color: '#ec4899',
    themeVar: '--user-anya'
  },
  {
    id: 'gyerek',
    name: 'Ármin',
    avatar: 'ÁR',
    color: '#10b981',
    themeVar: '--user-gyerek'
  },
  {
    id: 'everyone',
    name: 'Mindannyian',
    avatar: 'ALL',
    color: '#a855f7',
    themeVar: '--user-everyone'
  }
];

// Helper to format date YYYY-MM-DD relative to today.
// Helyi idő szerint — a `toISOString()` UTC-ben ad vissza, ami negatív
// eltolású időzónákban egy nappal elcsúsztatta a „ma" fogalmát.
export const getRelativeDate = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return formatIsoDate(d);
};

export const INITIAL_SHOPPING: ShoppingItem[] = [];
export const INITIAL_TODOS: TodoTask[] = [];
export const INITIAL_BILLS: BillItem[] = [];
