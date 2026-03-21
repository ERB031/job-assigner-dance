import { useState } from 'react';
import { useApp } from '../AppContext';

export default function Sidebar({ activeView, setActiveView, selectedEventId, setSelectedEventId, isOpen, onClose }) {
  const { data, addEvent, deleteEvent, updateEvent, exportData, importData, resetData } = useApp();
  const [newEventName, setNewEventName] = useState('');
  const [editingEventId, setEditingEventId] = useState(null);
  const [editEventName, setEditEventName] = useState('');

  const handleAddEvent = () => {
    if (!newEventName.trim()) return;
    addEvent(newEventName.trim());
    setNewEventName('');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const success = importData(ev.target.result);
        if (!success) alert('Invalid file format');
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__overlay" onClick={onClose} />
      <div className="sidebar__content">
        <div className="sidebar__header">
          <h2>Job Assigner</h2>
          <button className="sidebar__close" onClick={onClose}>&times;</button>
        </div>

        <nav className="sidebar__nav">
          <button
            className={`sidebar__nav-btn ${activeView === 'employees' ? 'active' : ''}`}
            onClick={() => { setActiveView('employees'); onClose(); }}
          >
            Employees
          </button>
          <button
            className={`sidebar__nav-btn ${activeView === 'roles' ? 'active' : ''}`}
            onClick={() => { setActiveView('roles'); onClose(); }}
          >
            Roles
          </button>
          <button
            className={`sidebar__nav-btn ${activeView === 'chemistry' ? 'active' : ''}`}
            onClick={() => { setActiveView('chemistry'); onClose(); }}
          >
            Chemistry / Conflicts
          </button>
        </nav>

        <div className="sidebar__section">
          <h3>Events</h3>
          <div className="sidebar__events">
            {data.events.map(event => (
              <div key={event.id} className="sidebar__event-item">
                {editingEventId === event.id ? (
                  <div className="sidebar__event-edit">
                    <input
                      value={editEventName}
                      onChange={e => setEditEventName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          updateEvent(event.id, { name: editEventName });
                          setEditingEventId(null);
                        }
                        if (e.key === 'Escape') setEditingEventId(null);
                      }}
                      autoFocus
                    />
                    <button onClick={() => { updateEvent(event.id, { name: editEventName }); setEditingEventId(null); }}>Save</button>
                  </div>
                ) : (
                  <>
                    <button
                      className={`sidebar__event-btn ${selectedEventId === event.id && activeView === 'schedule' ? 'active' : ''}`}
                      onClick={() => { setSelectedEventId(event.id); setActiveView('schedule'); onClose(); }}
                    >
                      {event.name}
                    </button>
                    <button className="sidebar__icon-btn" onClick={() => { setEditingEventId(event.id); setEditEventName(event.name); }} title="Rename">&#9998;</button>
                    <button className="sidebar__icon-btn sidebar__icon-btn--danger" onClick={() => { if (confirm('Delete this event?')) deleteEvent(event.id); }} title="Delete">&times;</button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="sidebar__add-event">
            <input
              placeholder="New event name..."
              value={newEventName}
              onChange={e => setNewEventName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
            />
            <button onClick={handleAddEvent}>Add</button>
          </div>
        </div>

        <div className="sidebar__section sidebar__actions">
          <button onClick={exportData}>Export Data</button>
          <button onClick={handleImport}>Import Data</button>
          <button className="btn--danger" onClick={() => { if (confirm('Reset all data to defaults?')) resetData(); }}>Reset Data</button>
        </div>
      </div>
    </div>
  );
}
