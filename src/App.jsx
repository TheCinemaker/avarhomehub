import React, { useState, useEffect } from 'react';
import { useHomeStore } from './hooks/useHomeStore';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Header } from './components/Header';
import { DayNavigator } from './components/DayNavigator';
import { ShoppingTab } from './components/ShoppingTab';
import { MealsTab } from './components/MealsTab';
import { TodoTab } from './components/TodoTab';
import { SettingsTab } from './components/SettingsTab';
import { CalendarTab } from './components/CalendarTab';
import { AuthScreen } from './components/AuthScreen';
import { AuthModal } from './components/AuthModal';
import { ShoppingCart, CheckSquare, Settings, Calendar, Utensils } from 'lucide-react';

export function App() {
  const store = useHomeStore();
  // Primary default active tab: Bevásárlólista
  const [activeTab, setActiveTab] = useState('shopping');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSessionUser(session?.user || null);
        setAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSessionUser(session?.user || null);
        setAuthLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setAuthLoading(false);
    }
  }, []);

  // STRICT AUTH GATE: Hide entire app if not logged in!
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090d16', color: '#818cf8', fontWeight: 700 }}>
        HomeHub betöltése...
      </div>
    );
  }

  if (isSupabaseConfigured && !sessionUser) {
    return <AuthScreen onLoginSuccess={user => setSessionUser(user)} />;
  }

  // A sorrendet (Apa, Anya, Ármin, egyedi személyek, Mindannyian) a store
  // tartja karban — itt már csak megjelenítjük.
  const orderedUsers = store.users;

  return (
    <div>
      {/* 1. Sticky Header (40% transparent, HomeHub a rendszerező, Login/Fiók) */}
      <Header sessionUser={sessionUser} onOpenLogin={() => setIsLoginModalOpen(true)} />

      <div className="app-container">
        {/* 2. User Switcher Bar (Single Row: Apa, Anya, Ármin, + Custom, Mindenki) */}
        <div className="user-switcher-bar">
          {orderedUsers.map(u => {
            const isActive = u.id === store.activeUserId;
            return (
              <button
                key={u.id}
                className={`user-pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => store.setActiveUserId(u.id)}
                style={isActive ? { background: u.color } : {}}
                title={u.name}
                aria-pressed={isActive}
              >
                <span className="user-avatar-badge">{u.avatar}</span>
                <span className="user-pill-name">{u.name}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Day Navigator Calendar Strip (Default today) */}
        <DayNavigator
          selectedDate={store.selectedDate}
          onSelectDate={store.setSelectedDate}
          onOpenCalendar={() => setActiveTab('calendar')}
        />

        {/* 4. Fő fül-sáv.
            Asztalon mind az 5 fül itt van — ott ugyanis nincs alsó navigáció,
            és korábban a Profilok fül egyáltalán nem volt elérhető nagy
            képernyőn. Mobilon az utolsó kettőt a CSS elrejti. */}
        <div className="three-tabs-bar">
          <button
            className={`three-tab-btn ${activeTab === 'shopping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shopping')}
          >
            <ShoppingCart size={19} style={{ color: activeTab === 'shopping' ? '#38bdf8' : 'inherit' }} />
            <span>Bevásárlás</span>
          </button>

          <button
            className={`three-tab-btn ${activeTab === 'meals' ? 'active' : ''}`}
            onClick={() => setActiveTab('meals')}
          >
            <Utensils size={19} style={{ color: activeTab === 'meals' ? '#f59e0b' : 'inherit' }} />
            <span>Heti Étlap</span>
          </button>

          <button
            className={`three-tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            <CheckSquare size={19} style={{ color: activeTab === 'todos' ? '#818cf8' : 'inherit' }} />
            <span>Teendők</span>
          </button>

          <button
            className={`three-tab-btn tab-btn-desktop-only ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <Calendar size={19} style={{ color: activeTab === 'calendar' ? '#38bdf8' : 'inherit' }} />
            <span>Naptár</span>
          </button>

          <button
            className={`three-tab-btn tab-btn-desktop-only ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={19} style={{ color: activeTab === 'settings' ? '#a855f7' : 'inherit' }} />
            <span>Profilok</span>
          </button>
        </div>

        {/* 5. Main Content Area (Default: Bevásárlólista) */}
        {activeTab === 'shopping' && (
          <ShoppingTab
            items={store.shoppingItems}
            users={store.users}
            activeUserId={store.activeUserId}
            stores={store.stores}
            onAddCustomStore={store.addCustomStore}
            onAddItem={store.addShoppingItem}
            onUpdateItem={store.updateShoppingItem}
            onToggleItem={store.toggleShoppingItem}
            onReassignItem={store.reassignShoppingItem}
            onDeleteItem={store.deleteShoppingItem}
          />
        )}

        {activeTab === 'meals' && (
          <MealsTab
            meals={store.meals}
            users={store.users}
            activeUserId={store.activeUserId}
            selectedDate={store.selectedDate}
            stores={store.stores}
            onAddMeal={store.addMeal}
            onUpdateMeal={store.updateMeal}
            onDeleteMeal={store.deleteMeal}
            onAddIngredientsToShoppingList={store.addIngredientsToShoppingList}
          />
        )}

        {activeTab === 'todos' && (
          <TodoTab
            tasks={store.todos}
            users={store.users}
            activeUserId={store.activeUserId}
            selectedDate={store.selectedDate}
            onAddTask={store.addTodoTask}
            onToggleTask={store.toggleTodoTask}
            onReassignTask={store.reassignTodoTask}
            onDeleteTask={store.deleteTodoTask}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarTab
            selectedDate={store.selectedDate}
            onSelectDate={store.setSelectedDate}
            todos={store.todos}
            users={store.users}
            activeUserId={store.activeUserId}
            onAddTask={store.addTodoTask}
            onToggleTask={store.toggleTodoTask}
            onReassignTask={store.reassignTodoTask}
            onDeleteTask={store.deleteTodoTask}
          />
        )}

        {/* A Befizetnivalók fül (BillsTab) egyelőre nincs bekötve — a store
            és a komponens készen áll, csak nincs rá fül a navigációban. */}

        {activeTab === 'settings' && (
          <SettingsTab
            users={store.users}
            onUpdateUserProfile={store.updateUserProfile}
            onDeleteCustomUser={store.deleteCustomUser}
            onAddCustomUser={store.addCustomUser}
            onExport={store.exportDataJSON}
            onImport={store.importDataJSON}
            onReset={store.resetToDemoData}
          />
        )}

        {/* Mobile Bottom Navigation Bar */}
        <div className="mobile-bottom-nav">
          <button
            className={`nav-item ${activeTab === 'shopping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shopping')}
          >
            <ShoppingCart size={20} />
            <span>Bevásárlás</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'meals' ? 'active' : ''}`}
            onClick={() => setActiveTab('meals')}
          >
            <Utensils size={20} />
            <span>Heti Étlap</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            <CheckSquare size={20} />
            <span>Teendők</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <Calendar size={20} />
            <span>Naptár</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            <span>Profilok</span>
          </button>
        </div>

        {/* Supabase Auth Login / Register Modal */}
        {isLoginModalOpen && (
          <AuthModal onClose={() => setIsLoginModalOpen(false)} />
        )}
      </div>
    </div>
  );
}

export default App;
