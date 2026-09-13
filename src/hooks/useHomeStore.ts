import { useState, useEffect } from 'react';
import { UserProfile, ShoppingItem, TodoTask, BillItem, MealItem, UserId, StoreTag } from '../types';
import { INITIAL_USERS, INITIAL_SHOPPING, INITIAL_TODOS, INITIAL_BILLS, getRelativeDate } from '../mockData';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

const DEFAULT_STORES: StoreTag[] = ['Lidl', 'Aldi', 'SPAR', 'Tesco', 'Penny', 'Auchan', 'DM', 'Rossmann', 'Egyéb'];

const STORAGE_KEYS = {
  USERS: 'homehub_users_v1',
  ACTIVE_USER: 'homehub_active_user_v1',
  SHOPPING: 'homehub_shopping_v1',
  TODOS: 'homehub_todos_v1',
  BILLS: 'homehub_bills_v1',
  STORES: 'homehub_custom_stores_v1',
  MEALS: 'homehub_meals_v1'
};

// Safe LocalStorage Wrappers with QuotaExceededError Protection
const safeGetLocalStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[LocalStorage Read Warning] Could not read "${key}":`, err);
    return null;
  }
};

const safeSetLocalStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[LocalStorage QuotaExceeded] Could not save "${key}". Storage quota exceeded.`, err);
    if (key === STORAGE_KEYS.SHOPPING) {
      try {
        const items: ShoppingItem[] = JSON.parse(value);
        const stripped = items.map(item => {
          if (item.imageUrl && item.imageUrl.length > 50000) {
            return { ...item, imageUrl: undefined };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(stripped));
      } catch (fallbackErr) {
        console.warn('Fallback LocalStorage save failed:', fallbackErr);
      }
    }
  }
};

export function useHomeStore() {
  // 1. Users state
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = safeGetLocalStorage(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [activeUserId, setActiveUserId] = useState<UserId>(() => {
    const saved = safeGetLocalStorage(STORAGE_KEYS.ACTIVE_USER) as UserId;
    return saved || 'everyone';
  });

  // 2. Custom stores list
  const [stores, setStores] = useState<StoreTag[]>(() => {
    const saved = safeGetLocalStorage(STORAGE_KEYS.STORES);
    return saved ? JSON.parse(saved) : DEFAULT_STORES;
  });

  // 3. Selected Date filter (YYYY-MM-DD), default today
  const [selectedDate, setSelectedDate] = useState<string>(getRelativeDate(0));

  // 4. Shopping state
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => {
    const saved = safeGetLocalStorage(STORAGE_KEYS.SHOPPING);
    return saved ? JSON.parse(saved) : INITIAL_SHOPPING;
  });

  // 5. Todos state
  const [todos, setTodos] = useState<TodoTask[]>(() => {
    const saved = safeGetLocalStorage(STORAGE_KEYS.TODOS);
    return saved ? JSON.parse(saved) : INITIAL_TODOS;
  });

  // 6. Bills state
  const [bills, setBills] = useState<BillItem[]>(() => {
    const saved = safeGetLocalStorage(STORAGE_KEYS.BILLS);
    return saved ? JSON.parse(saved) : INITIAL_BILLS;
  });

  // 7. Meals state (Heti étlap & családi ebédek)
  const [meals, setMeals] = useState<MealItem[]>(() => {
    const saved = safeGetLocalStorage(STORAGE_KEYS.MEALS);
    return saved ? JSON.parse(saved) : [
      { id: 'meal-1', date: getRelativeDate(0), mealType: 'ebed', title: 'Rakott krumpli', ingredients: '1kg krumpli, 50dkg kolbász, tejföl, 6 tojás', suggestedBy: 'anya' },
      { id: 'meal-2', date: getRelativeDate(1), mealType: 'ebed', title: 'Rántott hús rizi-bizivel', ingredients: '1kg karaj, zsemlemorzsa, tojás, rizs, borsó', suggestedBy: 'apa' }
    ];
  });

  // Supabase Initial Sync & Realtime Channel Subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    async function loadFromSupabase() {
      try {
        const { data: remoteShopping } = await supabase!.from('shopping_items').select('*');
        if (remoteShopping && remoteShopping.length > 0) {
          const mapped: ShoppingItem[] = remoteShopping.map((r: any) => ({
            id: r.id,
            title: r.title,
            quantity: r.quantity || undefined,
            estimatedPrice: Number(r.estimated_price) || 0,
            store: r.store || 'Lidl',
            category: r.category || 'Élelmiszer',
            date: r.date || getRelativeDate(0),
            assignedUser: r.assigned_user || 'everyone',
            isCompleted: r.is_completed || false,
            imageUrl: r.image_url || undefined
          }));
          setShoppingItems(mapped);
        } else {
          setShoppingItems([]);
        }

        const { data: remoteTodos } = await supabase!.from('todo_tasks').select('*');
        if (remoteTodos && remoteTodos.length > 0) {
          const mapped: TodoTask[] = remoteTodos.map((r: any) => ({
            id: r.id,
            title: r.title,
            category: r.category || 'Otthon',
            priority: r.priority || 'medium',
            date: r.date || getRelativeDate(0),
            assignedUser: r.assigned_user || 'apa',
            isCompleted: r.is_completed || false
          }));
          setTodos(mapped);
        } else {
          setTodos([]);
        }

        const { data: remoteStores } = await supabase!.from('stores').select('name');
        if (remoteStores && remoteStores.length > 0) {
          const names = remoteStores.map((s: any) => s.name);
          setStores(prev => Array.from(new Set([...prev, ...names])));
        }

        const { data: remoteProfiles } = await supabase!.from('family_profiles').select('*');
        if (remoteProfiles && remoteProfiles.length > 0) {
          const mapped: UserProfile[] = remoteProfiles.map((p: any) => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar,
            color: p.color,
            isCustom: p.is_custom
          }));
          setUsers(mapped);
        }

        const { data: remoteMeals } = await supabase!.from('family_meals').select('*');
        if (remoteMeals && remoteMeals.length > 0) {
          const mapped: MealItem[] = remoteMeals.map((r: any) => ({
            id: r.id,
            date: r.date || getRelativeDate(0),
            mealType: r.meal_type || 'ebed',
            title: r.title,
            ingredients: r.ingredients || undefined,
            suggestedBy: r.suggested_by || 'everyone',
            notes: r.notes || undefined
          }));
          setMeals(mapped);
        }
      } catch (err) {
        console.warn('Supabase sync warning:', err);
      }
    }

    loadFromSupabase();

    // Subscribe to Supabase Realtime WebSocket changes across all family devices
    const channel = supabase.channel('homehub-family-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, () => loadFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todo_tasks' }, () => loadFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, () => loadFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_profiles' }, () => loadFromSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_meals' }, () => loadFromSupabase())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // LocalStorage Persistence Effects
  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.ACTIVE_USER, activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.STORES, JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.SHOPPING, JSON.stringify(shoppingItems));
  }, [shoppingItems]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.TODOS, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEYS.MEALS, JSON.stringify(meals));
  }, [meals]);

  // Helper to get authenticated user ID
  const getAuthUserId = async () => {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  };

  // Actions: Add Custom Family Profile
  const addCustomUser = async (name: string, color: string = '#f59e0b') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const avatar = trimmed.substring(0, 2).toUpperCase();
    const id = `user-${Date.now()}`;
    const newUser: UserProfile = {
      id,
      name: trimmed,
      avatar,
      color,
      isCustom: true
    };
    
    setUsers(prev => {
      const everyone = prev.find(u => u.id === 'everyone');
      const others = prev.filter(u => u.id !== 'everyone');
      return everyone ? [...others, newUser, everyone] : [...prev, newUser];
    });

    const userId = await getAuthUserId();
    if (isSupabaseConfigured && supabase && userId) {
      supabase.from('family_profiles').insert([{
        id: newUser.id,
        user_id: userId,
        name: newUser.name,
        avatar: newUser.avatar,
        color: newUser.color,
        is_custom: true
      }]).then();
    }
  };

  // Actions: Custom Stores
  const addCustomStore = async (newStoreName: string) => {
    const trimmed = newStoreName.trim();
    if (trimmed && !stores.includes(trimmed)) {
      setStores(prev => [...prev, trimmed]);

      const userId = await getAuthUserId();
      if (isSupabaseConfigured && supabase && userId) {
        supabase.from('stores').insert([{ user_id: userId, name: trimmed }]).then();
      }
    }
  };

  // Actions: Shopping
  const addShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'isCompleted'>) => {
    const newItem: ShoppingItem = {
      ...item,
      id: `shop-${Date.now()}`,
      isCompleted: false
    };
    setShoppingItems(prev => [newItem, ...prev]);

    const userId = await getAuthUserId();
    if (isSupabaseConfigured && supabase && userId) {
      supabase.from('shopping_items').insert([{
        id: newItem.id,
        user_id: userId,
        title: newItem.title,
        quantity: newItem.quantity,
        estimated_price: newItem.estimatedPrice,
        store: newItem.store,
        category: newItem.category,
        date: newItem.date,
        assigned_user: newItem.assignedUser,
        image_url: newItem.imageUrl,
        is_completed: false
      }]).then();
    }
  };

  const toggleShoppingItem = (id: string) => {
    let updatedCompleted = false;
    setShoppingItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          updatedCompleted = !item.isCompleted;
          return { ...item, isCompleted: !item.isCompleted };
        }
        return item;
      })
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('shopping_items').update({ is_completed: updatedCompleted }).eq('id', id).then();
    }
  };

  const reassignShoppingItem = (id: string, assignedUser: UserId) => {
    setShoppingItems(prev =>
      prev.map(item => (item.id === id ? { ...item, assignedUser } : item))
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('shopping_items').update({ assigned_user: assignedUser }).eq('id', id).then();
    }
  };

  const deleteShoppingItem = (id: string) => {
    setShoppingItems(prev => prev.filter(item => item.id !== id));

    if (isSupabaseConfigured && supabase) {
      supabase.from('shopping_items').delete().eq('id', id).then();
    }
  };

  const updateShoppingItem = (id: string, updates: Partial<ShoppingItem>) => {
    setShoppingItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );

    if (isSupabaseConfigured && supabase) {
      const dbPayload: any = {};
      if (updates.title !== undefined) dbPayload.title = updates.title;
      if (updates.quantity !== undefined) dbPayload.quantity = updates.quantity;
      if (updates.estimatedPrice !== undefined) dbPayload.estimated_price = updates.estimatedPrice;
      if (updates.store !== undefined) dbPayload.store = updates.store;
      if (updates.category !== undefined) dbPayload.category = updates.category;
      if (updates.assignedUser !== undefined) dbPayload.assigned_user = updates.assignedUser;
      if (updates.imageUrl !== undefined) dbPayload.image_url = updates.imageUrl;
      if (updates.isCompleted !== undefined) dbPayload.is_completed = updates.isCompleted;
      if (updates.date !== undefined) dbPayload.date = updates.date;

      if (Object.keys(dbPayload).length > 0) {
        supabase.from('shopping_items').update(dbPayload).eq('id', id).then();
      }
    }
  };

  // Actions: Todos
  const addTodoTask = async (task: Omit<TodoTask, 'id' | 'isCompleted'>) => {
    const newTask: TodoTask = {
      ...task,
      id: `todo-${Date.now()}`,
      isCompleted: false
    };
    setTodos(prev => [newTask, ...prev]);

    const userId = await getAuthUserId();
    if (isSupabaseConfigured && supabase && userId) {
      supabase.from('todo_tasks').insert([{
        id: newTask.id,
        user_id: userId,
        title: newTask.title,
        category: newTask.category,
        priority: newTask.priority,
        date: newTask.date,
        assigned_user: newTask.assignedUser,
        is_completed: false
      }]).then();
    }
  };

  const toggleTodoTask = (id: string) => {
    let updatedCompleted = false;
    setTodos(prev =>
      prev.map(t => {
        if (t.id === id) {
          updatedCompleted = !t.isCompleted;
          return { ...t, isCompleted: !t.isCompleted };
        }
        return t;
      })
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('todo_tasks').update({ is_completed: updatedCompleted }).eq('id', id).then();
    }
  };

  const reassignTodoTask = (id: string, assignedUser: UserId) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, assignedUser } : t))
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('todo_tasks').update({ assigned_user: assignedUser }).eq('id', id).then();
    }
  };

  const deleteTodoTask = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));

    if (isSupabaseConfigured && supabase) {
      supabase.from('todo_tasks').delete().eq('id', id).then();
    }
  };

  // Actions: Bills
  const addBillItem = (bill: Omit<BillItem, 'id' | 'status'>) => {
    const newBill: BillItem = {
      ...bill,
      id: `bill-${Date.now()}`,
      status: 'pending'
    };
    setBills(prev => [newBill, ...prev]);
  };

  const toggleBillStatus = (id: string) => {
    setBills(prev =>
      prev.map(b => {
        if (b.id === id) {
          if (b.status === 'paid') {
            return { ...b, status: 'pending', paidDate: undefined, paidBy: undefined };
          } else {
            return {
              ...b,
              status: 'paid',
              paidDate: getRelativeDate(0),
              paidBy: activeUserId
            };
          }
        }
        return b;
      })
    );
  };

  const reassignBillItem = (id: string, assignedUser: UserId) => {
    setBills(prev =>
      prev.map(b => (b.id === id ? { ...b, assignedUser } : b))
    );
  };

  const deleteBillItem = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  // Actions: Family Meals & Weekly Menu Planner
  const addMeal = async (meal: Omit<MealItem, 'id'>) => {
    const newMeal: MealItem = {
      ...meal,
      id: `meal-${Date.now()}`
    };
    setMeals(prev => [newMeal, ...prev]);

    const userId = await getAuthUserId();
    if (isSupabaseConfigured && supabase && userId) {
      supabase.from('family_meals').insert([{
        id: newMeal.id,
        user_id: userId,
        date: newMeal.date,
        meal_type: newMeal.mealType,
        title: newMeal.title,
        ingredients: newMeal.ingredients,
        suggested_by: newMeal.suggestedBy,
        notes: newMeal.notes
      }]).then();
    }
  };

  const updateMeal = (id: string, updates: Partial<MealItem>) => {
    setMeals(prev =>
      prev.map(meal => (meal.id === id ? { ...meal, ...updates } : meal))
    );

    if (isSupabaseConfigured && supabase) {
      const dbPayload: any = {};
      if (updates.date !== undefined) dbPayload.date = updates.date;
      if (updates.mealType !== undefined) dbPayload.meal_type = updates.mealType;
      if (updates.title !== undefined) dbPayload.title = updates.title;
      if (updates.ingredients !== undefined) dbPayload.ingredients = updates.ingredients;
      if (updates.suggestedBy !== undefined) dbPayload.suggested_by = updates.suggestedBy;
      if (updates.notes !== undefined) dbPayload.notes = updates.notes;

      if (Object.keys(dbPayload).length > 0) {
        supabase.from('family_meals').update(dbPayload).eq('id', id).then();
      }
    }
  };

  const deleteMeal = (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));

    if (isSupabaseConfigured && supabase) {
      supabase.from('family_meals').delete().eq('id', id).then();
    }
  };

  // Helper: Copy Recipe Ingredients to Shopping List with 1 click
  const addIngredientsToShoppingList = async (ingredientsStr: string, targetStore: string = 'Lidl') => {
    if (!ingredientsStr || !ingredientsStr.trim()) return;
    const parts = ingredientsStr.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return;

    const newItems: ShoppingItem[] = [];
    const userId = await getAuthUserId();
    const today = getRelativeDate(0);

    for (const rawPart of parts) {
      const id = `shop-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newItem: ShoppingItem = {
        id,
        title: rawPart,
        store: targetStore,
        category: 'Élelmiszer',
        date: today,
        assignedUser: activeUserId,
        isCompleted: false,
        estimatedPrice: 0
      };
      newItems.push(newItem);

      if (isSupabaseConfigured && supabase && userId) {
        supabase.from('shopping_items').insert([{
          id: newItem.id,
          user_id: userId,
          title: newItem.title,
          store: newItem.store,
          category: newItem.category,
          date: newItem.date,
          assigned_user: newItem.assignedUser,
          is_completed: false
        }]).then();
      }
    }

    setShoppingItems(prev => [...newItems, ...prev]);
  };

  // Backup Export/Import Data
  const exportDataJSON = () => {
    const data = {
      users,
      activeUserId,
      stores,
      shoppingItems,
      todos,
      bills,
      meals,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HomeHub_Csaladi_Mentes_${getRelativeDate(0)}.json`;
    link.click();
  };

  const importDataJSON = (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.users) setUsers(parsed.users);
      if (parsed.stores) setStores(parsed.stores);
      if (parsed.shoppingItems) setShoppingItems(parsed.shoppingItems);
      if (parsed.todos) setTodos(parsed.todos);
      if (parsed.bills) setBills(parsed.bills);
      if (parsed.meals) setMeals(parsed.meals);
      return true;
    } catch (err) {
      alert('Érvénytelen JSON fájl!');
      return false;
    }
  };

  const resetToDemoData = () => {
    if (confirm('Biztosan visszaállítod a demó adatokat? A jelenlegi módosítások felülíródnak.')) {
      setUsers(INITIAL_USERS);
      setStores(DEFAULT_STORES);
      setActiveUserId('everyone');
      setShoppingItems(INITIAL_SHOPPING);
      setTodos(INITIAL_TODOS);
      setBills(INITIAL_BILLS);
      setMeals([]);
    }
  };

  // Active user helper
  const currentUser = users.find(u => u.id === activeUserId) || users[0];

  return {
    users,
    setUsers,
    addCustomUser,
    activeUserId,
    setActiveUserId,
    currentUser,
    stores,
    addCustomStore,
    selectedDate,
    setSelectedDate,
    shoppingItems,
    addShoppingItem,
    updateShoppingItem,
    toggleShoppingItem,
    reassignShoppingItem,
    deleteShoppingItem,
    todos,
    addTodoTask,
    toggleTodoTask,
    reassignTodoTask,
    deleteTodoTask,
    bills,
    addBillItem,
    toggleBillStatus,
    reassignBillItem,
    deleteBillItem,
    meals,
    addMeal,
    updateMeal,
    deleteMeal,
    addIngredientsToShoppingList,
    exportDataJSON,
    importDataJSON,
    resetToDemoData
  };
}
