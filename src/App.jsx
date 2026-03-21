import React, { useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import Sidebar from './components/Sidebar';
import EventView from './components/EventView';
import EmployeeManager from './components/EmployeeManager';
import RolesManager from './components/RolesManager';
import ChemistryManager from './components/ChemistryManager';
import './App.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, color: 'red', fontFamily: 'monospace' }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12 }}>{this.state.error.stack}</pre>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }}>
            Reset App Data &amp; Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { data } = useApp();
  const [activeView, setActiveView] = useState('schedule');
  const [selectedEventId, setSelectedEventId] = useState(() => data.events[0]?.id || null);
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
        {activeView === 'chemistry' && <ChemistryManager />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
