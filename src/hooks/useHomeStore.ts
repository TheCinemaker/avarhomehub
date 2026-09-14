import { useState, useEffect, useRef } from 'react';
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

// Megjelenítési sorrend: Apa, Anya, Ármin, majd az egyedi személyek, végül
// a „Mindannyian". Így a lista sorrendje sem a betöltés sorrendjétől függ.
const USER_ORDER = ['apa', 'anya', 'gyerek'];

const sortUsers = (list: UserProfile[]): UserProfile[] => {
  const rank = (u: UserProfile) => {
    const idx = USER_ORDER.indexOf(u.id);
    if (idx !== -1) return idx;
    if (u.id === 'everyone') return 999;
    return 500;
  };
  return [...list].sort((a, b) => rank(a) - rank(b));
};

/** Kijelentkezéskor hívjuk: ne maradjon az előző család adata a készüléken. */
export const clearHomeHubLocalData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[LocalStorage] Nem sikerült törölni: ${key}`, err);
    }
  });
};

export function useHomeStore() {
  // 1. Users state
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = safeGetLocalStorage(STORAGE_KEYS.USERS);
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: UserProfile[] = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_USERS;
      // Az alapprofilok mindig legyenek meg — enélkül a hozzájuk rendelt
      // tételek kiesnének minden szűrőből.
      const byId = new Map(parsed.map(u => [u.id, u]));
      INITIAL_USERS.forEach(u => {
        if (!byId.has(u.id)) byId.set(u.id, u);
      });
      return sortUsers(Array.from(byId.values()));
    } catch {
      return INITIAL_USERS;
    }
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

  // Profilmentés késleltető időzítői (profil-azonosító -> timer)
  const profileSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Kilépéskor a függőben lévő profilmentések időzítőit eldobjuk
  useEffect(() => {
    const timers = profileSaveTimers.current;
    return () => {
      Object.values(timers).forEach(t => clearTimeout(t));
    };
  }, []);

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

  // Bejelentkezett felhasználó azonosítója.
  // Ez a szinkron-effect függősége: enélkül az effect `[]`-tal futott, vagyis
  // EGYSZER, még a bejelentkező képernyő alatt — belépés után pedig soha.
  // Emiatt a friss belépés semmit nem töltött le a felhőből (csak a következő
  // oldalfrissítés), és az alapprofilok sem jöttek létre.
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setAuthUserId(data.session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Supabase Initial Sync & Realtime Channel Subscription
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !authUserId) return;

    // Új fióknál az alapprofilokat itt hozzuk létre, nem a regisztrációkor.
    // A regisztráció ugyanis munkamenet nélkül tér vissza, ha a projektben
    // kötelező az e-mail-megerősítés — az akkori beszúrást az RLS
    // (`TO authenticated`) némán eldobta, így a profilok sosem jöttek létre.
    async function seedDefaultProfiles(authUserId: string) {
      try {
        await supabase!.from('family_profiles').upsert(
          INITIAL_USERS.map(u => ({
            id: u.id,
            user_id: authUserId,
            name: u.name,
            avatar: u.avatar,
            color: u.color,
            is_custom: false
          })),
          { onConflict: 'id,user_id' }
        );
      } catch (err) {
        console.warn('Alapprofilok létrehozása sikertelen:', err);
      }
    }

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

        async function seedDefaultStores(authUserId: string) {
          try {
            const defaultNames = ['Lidl', 'Aldi', 'SPAR', 'Tesco', 'Penny', 'Auchan', 'DM', 'Rossmann', 'Egyéb'];
            const payload = defaultNames.map(name => ({
              user_id: authUserId,
              name
            }));
            const { data: inserted, error } = await supabase!.from('stores').insert(payload).select('name');
            if (error) {
              console.warn('Alapértelmezett boltok létrehozása sikertelen:', error);
            } else if (inserted && inserted.length > 0) {
              setStores(inserted.map((s: any) => s.name));
            }
          } catch (err) {
            console.warn('Alapértelmezett boltok seed warning:', err);
          }
        }

        const { data: remoteStores, error: storesError } = await supabase!.from('stores').select('name');
        if (storesError) {
          console.error('[Supabase Sync Error] Hiba a boltok letöltésekor:', storesError);
        } else if (remoteStores && remoteStores.length > 0) {
          const names = remoteStores.map((s: any) => s.name);
          setStores(names);
        } else if (remoteStores) {
          await seedDefaultStores(authUserId);
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

          // ÖSSZEFÉSÜLÉS, nem felülírás!
          // Korábban `setUsers(mapped)` volt: mivel az alapprofilok (apa,
          // anya, gyerek, everyone) csak regisztrációkor kerülnek be a
          // táblába, egy hiányos family_profiles azonnal kitörölte őket a
          // felhasználó-kapcsolóból — és a rájuk hivatkozó tételek eltűntek
          // minden szűrőből.
          setUsers(prev => {
            const byId = new Map(prev.map(u => [u.id, u]));
            mapped.forEach(u => byId.set(u.id, { ...byId.get(u.id), ...u }));
            INITIAL_USERS.forEach(u => {
              if (!byId.has(u.id)) byId.set(u.id, u);
            });
            return sortUsers(Array.from(byId.values()));
          });
        } else {
          // Üres a tábla -> ez egy frissen visszaigazolt fiók első betöltése.
          await seedDefaultProfiles(authUserId);
        }

        const { data: remoteMeals, error: mealsError } = await supabase!.from('family_meals').select('*');
        if (mealsError) {
          console.error('[Supabase Sync Error] Hiba a heti étlap letöltésekor:', mealsError);
        } else if (remoteMeals && remoteMeals.length > 0) {
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
        } else if (remoteMeals) {
          setMeals([]);
        }
      } catch (err) {
        console.warn('Supabase sync warning:', err);
      }
    }

    loadFromSupabase();

    // Összevont újratöltés.
    // Korábban MINDEN realtime-esemény azonnal 5 lekérdezést indított — a
    // saját pipáink is. Egy „mindent a listára" művelet (pl. hozzávalók
    // másolása) így tucatnyi teljes újratöltést eredményezett, mobilneten is.
    // 400 ms-os összevonással egy eseménysorozatból egyetlen frissítés lesz.
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleReload = () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        reloadTimer = null;
        loadFromSupabase();
      }, 400);
    };

    // Subscribe to Supabase Realtime WebSocket changes across all family devices
    const channel = supabase.channel('homehub-family-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todo_tasks' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_profiles' }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_meals' }, scheduleReload)
      .subscribe();

    return () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      supabase.removeChannel(channel);
    };
  }, [authUserId]);

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
    
    setUsers(prev => sortUsers([...prev, newUser]));

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

  // Actions: Profil szerkesztése (név / monogram / szín)
  //
  // Eddig a SettingsTab közvetlenül `setUsers`-t hívott, így az átnevezés
  // sosem jutott el a Supabase-ig, és az első realtime-frissítés vissza is
  // állította a régi nevet.
  const updateUserProfile = (id: string, updates: Partial<UserProfile>) => {
    let merged: UserProfile | undefined;

    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      merged = { ...u, ...updates };
      return merged;
    }));

    if (!isSupabaseConfigured || !supabase || !merged) return;

    // Gépelés közben ne menjen minden leütésre kérés a felhőbe — a profilnév
    // beírása így 1 írás, nem 8.
    const pending = profileSaveTimers.current;
    if (pending[id]) clearTimeout(pending[id]);

    const snapshot = merged;
    pending[id] = setTimeout(async () => {
      delete pending[id];
      const authUserId = await getAuthUserId();
      if (!authUserId) return;

      // upsert: az alapprofilok (apa/anya/gyerek/everyone) lehet, hogy még
      // egyáltalán nincsenek benne a táblában — ilyenkor beszúrjuk őket.
      supabase!.from('family_profiles').upsert([{
        id,
        user_id: authUserId,
        name: snapshot.name,
        avatar: snapshot.avatar,
        color: snapshot.color,
        is_custom: Boolean(snapshot.isCustom)
      }], { onConflict: 'id,user_id' }).then();
    }, 700);
  };

  const deleteCustomUser = async (id: string) => {
    // Az alapprofilok nem törölhetők — rájuk épül a szűrés.
    if (['apa', 'anya', 'gyerek', 'everyone'].includes(id)) return;

    setUsers(prev => prev.filter(u => u.id !== id));
    if (activeUserId === id) setActiveUserId('everyone');

    // A hozzá rendelt tételek ne váljanak láthatatlanná: átkerülnek a
    // „Mindannyian" gyűjtőre.
    setShoppingItems(prev => prev.map(i => (i.assignedUser === id ? { ...i, assignedUser: 'everyone' } : i)));
    setTodos(prev => prev.map(t => (t.assignedUser === id ? { ...t, assignedUser: 'everyone' } : t)));

    if (isSupabaseConfigured && supabase) {
      supabase.from('family_profiles').delete().eq('id', id).then();
      supabase.from('shopping_items').update({ assigned_user: 'everyone' }).eq('assigned_user', id).then();
      supabase.from('todo_tasks').update({ assigned_user: 'everyone' }).eq('assigned_user', id).then();
    }
  };

  // Actions: Custom Stores
  const addCustomStore = async (newStoreName: string) => {
    const trimmed = newStoreName.trim();
    if (!trimmed || stores.includes(trimmed)) return;

    setStores(prev => [...prev, trimmed]);

    const userId = await getAuthUserId();
    if (isSupabaseConfigured && supabase && userId) {
      const { error } = await supabase.from('stores').insert([{ user_id: userId, name: trimmed }]);
      if (error) {
        console.error('[Supabase Write Error] Hiba a bolt hozzáadásakor:', error);
      }
    }
  };

  const updateCustomStore = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return;

    setStores(prev => prev.map(s => (s === oldName ? trimmed : s)));
    setShoppingItems(prev => prev.map(item => (item.store === oldName ? { ...item, store: trimmed } : item)));

    const userId = await getAuthUserId();
    if (isSupabaseConfigured && supabase && userId) {
      const { error: storeErr } = await supabase
        .from('stores')
        .update({ name: trimmed })
        .eq('name', oldName)
        .eq('user_id', userId);
      if (storeErr) {
        console.error('[Supabase Update Error] Hiba a bolt átnevezésekor:', storeErr);
      }

      const { error: itemErr } = await supabase
        .from('shopping_items')
        .update({ store: trimmed })
        .eq('store', oldName)
        .eq('user_id', userId);
      if (itemErr) {
        console.error('[Supabase Update Error] Hiba a bolt elemeinek frissítésekor:', itemErr);
      }
    }
  };

  const deleteCustomStore = async (storeName: string) => {
    setStores(prev => prev.filter(s => s !== storeName));

    const userId = await getAuthUserId();
    if (isSupabaseConfigured && supabase && userId) {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('name', storeName)
        .eq('user_id', userId);
      if (error) {
        console.error('[Supabase Delete Error] Hiba a bolt törlésekor:', error);
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
      const { error } = await supabase.from('shopping_items').insert([{
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
      }]);
      if (error) {
        console.error('[Supabase Write Error] Hiba a bevásárlási tétel mentésekor:', error);
      }
    }
  };

  const toggleShoppingItem = async (id: string) => {
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
      const { error } = await supabase.from('shopping_items').update({ is_completed: updatedCompleted }).eq('id', id);
      if (error) {
        console.error('[Supabase Update Error] Hiba a bevásárlóelem státuszának módosításakor:', error);
      }
    }
  };

  const reassignShoppingItem = async (id: string, assignedUser: UserId) => {
    setShoppingItems(prev =>
      prev.map(item => (item.id === id ? { ...item, assignedUser } : item))
    );

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('shopping_items').update({ assigned_user: assignedUser }).eq('id', id);
      if (error) {
        console.error('[Supabase Update Error] Hiba a tétel felelősének módosításakor:', error);
      }
    }
  };

  const deleteShoppingItem = async (id: string) => {
    setShoppingItems(prev => prev.filter(item => item.id !== id));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('shopping_items').delete().eq('id', id);
      if (error) {
        console.error('[Supabase Delete Error] Hiba a bevásárlási tétel törlésekor:', error);
      }
    }
  };

  const updateShoppingItem = async (id: string, updates: Partial<ShoppingItem>) => {
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
        const { error } = await supabase.from('shopping_items').update(dbPayload).eq('id', id);
        if (error) {
          console.error('[Supabase Update Error] Hiba a bevásárlóelem frissítésekor:', error);
        }
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
      const { error } = await supabase.from('todo_tasks').insert([{
        id: newTask.id,
        user_id: userId,
        title: newTask.title,
        category: newTask.category,
        priority: newTask.priority,
        date: newTask.date,
        assigned_user: newTask.assignedUser,
        is_completed: false
      }]);
      if (error) {
        console.error('[Supabase Write Error] Hiba a feladat mentésekor:', error);
      }
    }
  };

  const toggleTodoTask = async (id: string) => {
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
      const { error } = await supabase.from('todo_tasks').update({ is_completed: updatedCompleted }).eq('id', id);
      if (error) {
        console.error('[Supabase Update Error] Hiba a feladat állapotának módosításakor:', error);
      }
    }
  };

  const reassignTodoTask = async (id: string, assignedUser: UserId) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, assignedUser } : t))
    );

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('todo_tasks').update({ assigned_user: assignedUser }).eq('id', id);
      if (error) {
        console.error('[Supabase Update Error] Hiba a feladat felelősének módosításakor:', error);
      }
    }
  };

  const deleteTodoTask = async (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('todo_tasks').delete().eq('id', id);
      if (error) {
        console.error('[Supabase Delete Error] Hiba a feladat törlésekor:', error);
      }
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
      const { error } = await supabase.from('family_meals').insert([{
        id: newMeal.id,
        user_id: userId,
        date: newMeal.date,
        meal_type: newMeal.mealType,
        title: newMeal.title,
        ingredients: newMeal.ingredients,
        suggested_by: newMeal.suggestedBy,
        notes: newMeal.notes
      }]);
      if (error) {
        console.error('[Supabase Write Error] Hiba az étel mentésekor:', error);
      }
    }
  };

  const updateMeal = async (id: string, updates: Partial<MealItem>) => {
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
        const { error } = await supabase.from('family_meals').update(dbPayload).eq('id', id);
        if (error) {
          console.error('[Supabase Update Error] Hiba az étel frissítésekor:', error);
        }
      }
    }
  };

  const deleteMeal = async (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('family_meals').delete().eq('id', id);
      if (error) {
        console.error('[Supabase Delete Error] Hiba az étel törlésekor:', error);
      }
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
    updateUserProfile,
    deleteCustomUser,
    activeUserId,
    setActiveUserId,
    currentUser,
    stores,
    addCustomStore,
    updateCustomStore,
    deleteCustomStore,
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
