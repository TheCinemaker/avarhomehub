export type UserId = string; // Allows default (apa, anya, gyerek, everyone) + custom user added family members!

export interface UserProfile {
  id: UserId;
  name: string;
  avatar: string;
  color: string;
  themeVar?: string;
  isCustom?: boolean;
}

export type StoreTag = string; // Allows default stores (Lidl, Aldi, SPAR, Tesco, Penny, Auchan, DM, Rossmann, Egyéb) + user added custom stores!

export type ShoppingCategory = 'Élelmiszer' | 'Háztartás' | 'Gyógyszertár' | 'Barkács' | 'Személyes' | 'Egyéb';

export interface ShoppingItem {
  id: string;
  title: string;
  quantity?: string; // pl. "2 kg", "1 doboz"
  estimatedPrice: number; // Ft
  store: StoreTag;
  category: ShoppingCategory;
  date: string; // ISO date format YYYY-MM-DD
  assignedUser: UserId;
  isCompleted: boolean;
  imageUrl?: string; // Base64 Data URL or Supabase Storage URL for product packaging photo!
  mealTag?: string; // pl. "Vasárnapi ebéd (Gulyásleves)"
}

export type Priority = 'high' | 'medium' | 'low';
export type TodoCategory = 'Házimunka' | 'Suli / Ovi' | 'Ügyintézés' | 'Autó' | 'Kert' | 'Hobbi' | 'Egyéb';

export interface TodoTask {
  id: string;
  title: string;
  date: string; // ISO format YYYY-MM-DD
  assignedUser: UserId;
  priority: Priority;
  category: TodoCategory;
  isRecurring?: boolean;
  recurringFrequency?: 'napi' | 'heti' | 'havi';
  isCompleted: boolean;
}

export type BillCategory = 'Villany' | 'Gáz' | 'Víz / Csatorna' | 'Net / TV' | 'Közös költség' | 'Hitel' | 'Streaming' | 'Egyéb';
export type BillStatus = 'paid' | 'pending' | 'overdue';

export interface BillItem {
  id: string;
  title: string;
  amountFt: number;
  dueDate: string; // YYYY-MM-DD
  category: BillCategory;
  assignedUser: UserId;
  status: BillStatus;
  paidDate?: string;
  paidBy?: UserId;
  note?: string;
}

export type MealType = 'ebed' | 'vacsora';

export interface MealItem {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  title: string; // pl. "Rakott krumpli"
  ingredients?: string; // pl. "1kg krumpli, 50dkg kolbász, tejföl, 6 tojás"
  suggestedBy: UserId;
  notes?: string;
}
