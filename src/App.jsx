import React, { useState } from 'react';
import { useHomeStore } from './hooks/useHomeStore';
import { Header } from './components/Header';
import { DayNavigator } from './components/DayNavigator';
import { ShoppingTab } from './components/ShoppingTab';
import { TodoTab } from './components/TodoTab';
import { BillsTab } from './components/BillsTab';
import { SettingsTab } from './components/SettingsTab';
import { CalendarTab } from './components/CalendarTab';
import { CalendarModal } from './components/CalendarModal';
import { AuthModal } from './components/AuthModal';
import { ShoppingCart, CheckSquare, CreditCard, Settings, Calendar, LogIn, Database, X } from 'lucide-react';

export function App() {
  const store = useHomeStore();
  // Primary default active tab: Bevásárlólista
  const [activeTab, setActiveTab] = useState('shopping');
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // User list order: Apa, Anya, Ármin, + Custom Users, Mindenki
  const defaultOrder = ['apa', 'anya', 'gyerek'];
  const orderedUsers = [
    ...defaultOrder.map(id => store.users.find(u => u.id === id)).filter(Boolean),
    ...store.users.filter(u => !defaultOrder.includes(u.id) && u.id !== 'everyone'),
    store.users.find(u => u.id === 'everyone')
  ].filter(Boolean);

  return (
    <div>
      {/* 1. Sticky Header (40% transparent, HomeHub a rendszerező, Login) */}
      <Header onOpenLogin={() => setIsLoginModalOpen(true)} />

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
              >
                <span className="user-avatar-badge">{u.avatar}</span>
                <span>{u.name}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Day Navigator Calendar Strip (Default today) */}
        <DayNavigator
          selectedDate={store.selectedDate}
          onSelectDate={store.setSelectedDate}
          onOpenCalendarModal={() => setActiveTab('calendar')}
        />

        {/* 4. Icon Tabs Side-by-Side (Bevásárlólista, Teendők) - Befizetnivalók kikommentezve */}
        <div className="three-tabs-bar" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <button
            className={`three-tab-btn ${activeTab === 'shopping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shopping')}
          >
            <ShoppingCart size={19} style={{ color: activeTab === 'shopping' ? '#38bdf8' : 'inherit' }} />
            <span>Bevásárlólista</span>
          </button>

          <button
            className={`three-tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            <CheckSquare size={19} style={{ color: activeTab === 'todos' ? '#818cf8' : 'inherit' }} />
            <span>Teendők</span>
          </button>

          {/* Befizetnivalók kikommentezve az 1. körben
          <button
            className={`three-tab-btn ${activeTab === 'bills' ? 'active' : ''}`}
            onClick={() => setActiveTab('bills')}
          >
            <CreditCard size={19} style={{ color: activeTab === 'bills' ? '#f59e0b' : 'inherit' }} />
            <span>Befizetnivalók</span>
          </button>
          */}
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
            onToggleItem={store.toggleShoppingItem}
            onReassignItem={store.reassignShoppingItem}
            onDeleteItem={store.deleteShoppingItem}
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

        {/* Befizetnivalók kikommentezve az 1. körben
        {activeTab === 'bills' && (
          <BillsTab
            bills={store.bills}
            users={store.users}
            activeUserId={store.activeUserId}
            selectedDate={store.selectedDate}
            onAddBill={store.addBillItem}
            onToggleStatus={store.toggleBillStatus}
            onReassignBill={store.reassignBillItem}
            onDeleteBill={store.deleteBillItem}
          />
        )}
        */}

        {activeTab === 'settings' && (
          <SettingsTab
            users={store.users}
            onUpdateUsers={store.setUsers}
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
            className={`nav-item ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            <CheckSquare size={20} />
            <span>Teendők</span>
          </button>

          {/* Befizetnivalók kikommentezve az 1. körben
          <button
            className={`nav-item ${activeTab === 'bills' ? 'active' : ''}`}
            onClick={() => setActiveTab('bills')}
          >
            <CreditCard size={20} />
            <span>Számlák</span>
          </button>
          */}

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

        {/* Full Month Calendar Modal */}
        {isCalendarModalOpen && (
          <CalendarModal
            selectedDate={store.selectedDate}
            onSelectDate={store.setSelectedDate}
            onClose={() => setIsCalendarModalOpen(false)}
            shoppingItems={store.shoppingItems}
            todos={store.todos}
            bills={store.bills}
          />
        )}

        {/* Supabase Auth Login / Register Modal */}
        {isLoginModalOpen && (
          <AuthModal onClose={() => setIsLoginModalOpen(false)} />
        )}
      </div>
    </div>
  );
}

export default App;
