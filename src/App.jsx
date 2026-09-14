import React, { useState, useEffect, useRef } from 'react';
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
import { UpdateBanner } from './components/UpdateBanner';
import { Footer } from './components/Footer';
import { ShoppingCart, CheckSquare, Settings, Calendar, Utensils } from 'lucide-react';

// Egyetlen forrás a navigációhoz — az asztali fülsáv és a mobil alsó sáv
// ugyanebből épül, így nem csúszhatnak szét egymástól.
const TABS = [
  { id: 'shopping', label: 'Bevásárlás', Icon: ShoppingCart },
  { id: 'meals', label: 'Heti étlap', Icon: Utensils },
  { id: 'todos', label: 'Teendők', Icon: CheckSquare },
  { id: 'calendar', label: 'Naptár', Icon: Calendar },
  { id: 'settings', label: 'Profilok', Icon: Settings }
];

// Ezeken a füleken szűr ténylegesen a kiválasztott nap.
const DATE_AWARE_TABS = ['todos', 'meals'];

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

  // A választósáv mobilon vízszintesen görgethető. Ha az aktív családtag a
  // sáv végén áll, görgetés nélkül nem látszana, hogy ki van kiválasztva.
  const switcherRef = useRef(null);
  const activePillRef = useRef(null);
  const didScrollSwitcher = useRef(false);

  useEffect(() => {
    const bar = switcherRef.current;
    const pill = activePillRef.current;
    if (!bar || !pill || bar.scrollWidth <= bar.clientWidth) return;

    const barRect = bar.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    const delta = (pillRect.left - barRect.left) - (barRect.width - pillRect.width) / 2;

    bar.scrollBy({ left: delta, behavior: didScrollSwitcher.current ? 'smooth' : 'auto' });
    didScrollSwitcher.current = true;
  }, [store.activeUserId, store.users.length]);

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
      <UpdateBanner />
      {/* 1. Sticky Header (40% transparent, HomeHub a rendszerező, Login/Fiók) */}
      <Header sessionUser={sessionUser} onOpenLogin={() => setIsLoginModalOpen(true)} />

      <div className="app-container">
        {/* Családtag-választó.
            Az aktív állapotot a családtag színe jelzi egy pöttyel — nem a
            teljes gomb élénk kitöltése, ami több profilnál zajossá vált. */}
        <div className="user-switcher-bar" role="group" aria-label="Családtag szűrő" ref={switcherRef}>
          {orderedUsers.map(u => {
            const isActive = u.id === store.activeUserId;
            return (
              <button
                key={u.id}
                ref={isActive ? activePillRef : null}
                className={`user-pill-btn ${isActive ? 'active' : ''}`}
                onClick={() => store.setActiveUserId(u.id)}
                title={u.name}
                aria-pressed={isActive}
              >
                <span className="user-dot" style={{ color: u.color }} />
                <span className="user-pill-name">{u.name}</span>
              </button>
            );
          })}
        </div>

        {/* Napválasztó csík — csak ott, ahol a dátumnak jelentése van.
            A bevásárlólista nem dátum szerint szűr, a Profilok fülön pedig
            végképp nincs értelme, ezért ott korábban csak zajt jelentett. */}
        {DATE_AWARE_TABS.includes(activeTab) && (
          <DayNavigator
            selectedDate={store.selectedDate}
            onSelectDate={store.setSelectedDate}
            onOpenCalendar={() => setActiveTab('calendar')}
          />
        )}

        {/* Fülsáv — asztali. Mobilon a CSS elrejti, mert ott az alsó sáv
            navigál; korábban ugyanaz a három cél kétszer szerepelt. */}
        <nav className="three-tabs-bar" aria-label="Fő navigáció">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`three-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <tab.Icon size={17} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

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
            onUpdateTask={store.updateTodoTask}
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
            onUpdateTask={store.updateTodoTask}
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
            stores={store.stores}
            onAddCustomStore={store.addCustomStore}
            onUpdateCustomStore={store.updateCustomStore}
            onDeleteCustomStore={store.deleteCustomStore}
            onExport={store.exportDataJSON}
            onImport={store.importDataJSON}
            onReset={store.resetToDemoData}
          />
        )}

        {/* Alsó sáv — mobil. Ugyanaz a TABS lista, egy forrásból. */}
        <nav className="mobile-bottom-nav" aria-label="Fő navigáció">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <tab.Icon size={19} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Supabase Auth Login / Register Modal */}
        {isLoginModalOpen && (
          <AuthModal onClose={() => setIsLoginModalOpen(false)} />
        )}

        <Footer />
      </div>
    </div>
  );
}

export default App;
