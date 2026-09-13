import { UserProfile, ShoppingItem, TodoTask, BillItem } from './types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'everyone',
    name: 'Mindannyian',
    avatar: 'ALL',
    color: '#a855f7',
    themeVar: '--user-everyone'
  },
  {
    id: 'anya',
    name: 'Anya',
    avatar: 'AN',
    color: '#ec4899',
    themeVar: '--user-anya'
  },
  {
    id: 'apa',
    name: 'Apa',
    avatar: 'AP',
    color: '#3b82f6',
    themeVar: '--user-apa'
  },
  {
    id: 'gyerek',
    name: 'Ármin',
    avatar: 'ÁR',
    color: '#10b981',
    themeVar: '--user-gyerek'
  }
];

// Helper to format date YYYY-MM-DD relative to today
export const getRelativeDate = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_SHOPPING: ShoppingItem[] = [];
export const INITIAL_TODOS: TodoTask[] = [];
export const INITIAL_BILLS: BillItem[] = [];
