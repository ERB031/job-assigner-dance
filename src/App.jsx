import { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import Sidebar from './components/Sidebar';
import EventView from './components/EventView';
import EmployeeManager from './components/EmployeeManager';
import RolesManager from './components/RolesManager';
import './App.css';

function AppContent() {
  const { data } = useApp();
  const [activeView, setActiveView] = useState('schedule');
  const [selectedEventId, setSelectedEventId] = useState(data.events[0]?.id || null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <header className="app__header">
        <button className="app__menu-btn" onClick={() => setSidebarOpen(true)}>
          &#9776;
        </button>
        <h1 className="app__title">Job Assigner</h1>
      </header>

      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        selectedEventId={selectedEventId}
        setSelectedEventId={setSelectedEventId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="app__main">
        {activeView === 'schedule' && <EventView eventId={selectedEventId} />}
        {activeView === 'employees' && <EmployeeManager />}
        {activeView === 'roles' && <RolesManager />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
