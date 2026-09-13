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

// Clean SVG DataURL for Vanish demo photo
const VANISH_DEMO_PHOTO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23ec4899" rx="20"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="28" font-weight="bold" font-family="sans-serif">VANISH</text><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" fill="%23fef08a" font-size="16" font-family="sans-serif">Pink Oxi Action</text></svg>';

export const INITIAL_SHOPPING: ShoppingItem[] = [
  {
    id: 'shop-vanish',
    title: 'Vanish Oxi Action Pink Folttisztító',
    quantity: '1 flakon (1L)',
    estimatedPrice: 3490,
    store: 'DM',
    category: 'Háztartás',
    date: getRelativeDate(0),
    assignedUser: 'apa',
    isCompleted: false,
    imageUrl: VANISH_DEMO_PHOTO
  },
  {
    id: 'shop-1',
    title: 'Friss tej 2.8% & Trappista sajt',
    quantity: '2L tej, 1 tömb sajt',
    estimatedPrice: 2800,
    store: 'Lidl',
    category: 'Élelmiszer',
    date: getRelativeDate(0),
    assignedUser: 'anya',
    isCompleted: false
  },
  {
    id: 'shop-2',
    title: 'Teljes kiőrlésű kenyér',
    quantity: '1 db',
    estimatedPrice: 750,
    store: 'Lidl',
    category: 'Élelmiszer',
    date: getRelativeDate(0),
    assignedUser: 'everyone',
    isCompleted: true
  },
  {
    id: 'shop-3',
    title: 'Ablakmosó folyadék',
    quantity: '5L',
    estimatedPrice: 2400,
    store: 'Tesco',
    category: 'Barkács',
    date: getRelativeDate(1),
    assignedUser: 'apa',
    isCompleted: false
  },
  {
    id: 'shop-4',
    title: 'Iskolai füzetek & Ceruzák',
    quantity: '1 készlet',
    estimatedPrice: 1900,
    store: 'SPAR',
    category: 'Személyes',
    date: getRelativeDate(0),
    assignedUser: 'gyerek', // Ármin
    isCompleted: false
  }
];

export const INITIAL_TODOS: TodoTask[] = [
  {
    id: 'todo-1',
    title: 'Szelektív hulladék kihelyezés a kapu elé',
    date: getRelativeDate(0),
    assignedUser: 'apa',
    priority: 'high',
    category: 'Házimunka',
    isRecurring: true,
    recurringFrequency: 'heti',
    isCompleted: false
  },
  {
    id: 'todo-2',
    title: 'Szobai növények megöntözése',
    date: getRelativeDate(0),
    assignedUser: 'gyerek', // Ármin
    priority: 'medium',
    category: 'Házimunka',
    isRecurring: true,
    recurringFrequency: 'napi',
    isCompleted: true
  },
  {
    id: 'todo-3',
    title: 'Autó műszaki vizsga időpont foglalása',
    date: getRelativeDate(1),
    assignedUser: 'apa',
    priority: 'high',
    category: 'Autó',
    isRecurring: false,
    isCompleted: false
  },
  {
    id: 'todo-4',
    title: 'Házi feladat ellenőrzése (Matek & Angol)',
    date: getRelativeDate(0),
    assignedUser: 'anya',
    priority: 'medium',
    category: 'Suli / Ovi',
    isRecurring: true,
    recurringFrequency: 'napi',
    isCompleted: false
  },
  {
    id: 'todo-5',
    title: 'Gázóra állás bejelentése online',
    date: getRelativeDate(3),
    assignedUser: 'anya',
    priority: 'high',
    category: 'Ügyintézés',
    isRecurring: true,
    recurringFrequency: 'havi',
    isCompleted: false
  }
];

export const INITIAL_BILLS: BillItem[] = [
  {
    id: 'bill-1',
    title: 'Villanyszámla (E.ON / MVM)',
    amountFt: 14500,
    dueDate: getRelativeDate(2),
    category: 'Villany',
    assignedUser: 'apa',
    status: 'pending',
    note: 'Ügyfélazonosító: 9283710'
  },
  {
    id: 'bill-2',
    title: 'Családi Közös Költség',
    amountFt: 22000,
    dueDate: getRelativeDate(-2), // Overdue for demo purpose
    category: 'Közös költség',
    assignedUser: 'apa',
    status: 'overdue',
    note: 'Házirend szerinti utalás számlaszámra'
  },
  {
    id: 'bill-3',
    title: 'Digi Optikai Internet + TV',
    amountFt: 8900,
    dueDate: getRelativeDate(-5),
    category: 'Net / TV',
    assignedUser: 'anya',
    status: 'paid',
    paidDate: getRelativeDate(-4),
    paidBy: 'anya',
    note: 'Befizetve bankkártyával'
  },
  {
    id: 'bill-4',
    title: 'Netflix & Spotify Családi Csomag',
    amountFt: 7200,
    dueDate: getRelativeDate(10),
    category: 'Streaming',
    assignedUser: 'everyone',
    status: 'pending'
  }
];
