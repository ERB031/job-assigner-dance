import { useState, useCallback } from 'react';
import { useApp } from '../AppContext';
import VenueSection from './VenueSection';

export default function EventView({ eventId }) {
  const { data, addVenueToEvent, addDayToEvent, updateDay, deleteDay } = useApp();
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueColor, setNewVenueColor] = useState('#4CAF50');
  const [newDayLabel, setNewDayLabel] = useState('');
  const [editingDayId, setEditingDayId] = useState(null);
  const [editDayLabel, setEditDayLabel] = useState('');

  const event = data.events.find(e => e.id === eventId);
  const days = event?.days || [];
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const selectedDay = days[selectedDayIdx] || days[0];

  const exportCSV = useCallback(() => {
    if (!event) return;
    let csv = '';
    for (const day of days) {
      csv += `\n=== ${day.label} ===\n`;
      day.venues.forEach(venue => {
        csv += `\n${venue.name}\n`;
        const headers = ['Position', ...venue.shifts.map(s => `${s.label} (${s.startTime}${s.endTime ? '-' + s.endTime : ''})`)];
        csv += headers.map(h => `"${h}"`).join(',') + '\n';
        data.roles.forEach(role => {
          const row = [role, ...venue.shifts.map(s => {
            const empId = s.assignments[role];
            if (!empId) return '';
            if (empId === 'N/A') return 'N/A';
            const emp = data.employees.find(e => e.id === empId);
            const note = s.notes?.[role];
            return emp ? emp.name + (note ? ` (${note})` : '') : '';
          })];
          csv += row.map(c => `"${c}"`).join(',') + '\n';
        });
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name}-schedule.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [event, data, days]);

  const exportPDF = useCallback(() => {
    window.print();
  }, []);

  if (!event) {
    return (
      <div className="event-view event-view--empty">
        <h2>Select an event from the sidebar to get started</h2>
        <p>Or create a new event using the sidebar.</p>
      </div>
    );
  }

  const handleAddVenue = () => {
    if (!newVenueName.trim() || !selectedDay) return;
    addVenueToEvent(eventId, selectedDay.id, newVenueName.trim(), newVenueColor);
    setNewVenueName('');
  };

  const handleAddDay = () => {
    const label = newDayLabel.trim() || `Day ${days.length + 1}`;
    addDayToEvent(eventId, label);
    setNewDayLabel('');
    setSelectedDayIdx(days.length); // select the new day
  };

  const handleSaveDay = () => {
    if (editingDayId && editDayLabel.trim()) {
      updateDay(eventId, editingDayId, { label: editDayLabel.trim() });
    }
    setEditingDayId(null);
  };

  return (
    <div className="event-view">
      <h2 className="event-view__title">{event.name}</h2>

      <div className="event-view__export-bar">
        <button className="btn btn--small btn--primary" onClick={exportCSV}>Export CSV</button>
        <button className="btn btn--small btn--primary" onClick={exportPDF}>Export PDF (Print)</button>
      </div>

      {/* Day Tabs */}
      <div className="day-tabs">
        <div className="day-tabs__list">
          {days.map((day, idx) => (
            <div key={day.id} className={`day-tabs__tab ${idx === selectedDayIdx ? 'day-tabs__tab--active' : ''}`}>
              {editingDayId === day.id ? (
                <div className="day-tabs__edit" onClick={e => e.stopPropagation()}>
                  <input
                    value={editDayLabel}
                    onChange={e => setEditDayLabel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveDay();
                      if (e.key === 'Escape') setEditingDayId(null);
                    }}
                    autoFocus
                  />
                  <button className="btn btn--small btn--primary" onClick={handleSaveDay}>OK</button>
                </div>
              ) : (
                <>
                  <button className="day-tabs__btn" onClick={() => setSelectedDayIdx(idx)}>
                    {day.label}
                  </button>
                  <button
                    className="day-tabs__edit-btn"
                    onClick={(e) => { e.stopPropagation(); setEditingDayId(day.id); setEditDayLabel(day.label); }}
                    title="Rename day"
                  >
                    &#9998;
                  </button>
                  {days.length > 1 && (
                    <button
                      className="day-tabs__delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${day.label}?`)) {
                          deleteDay(eventId, day.id);
                          if (selectedDayIdx >= days.length - 1) setSelectedDayIdx(Math.max(0, days.length - 2));
                        }
                      }}
                      title="Delete day"
                    >
                      &times;
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
          <div className="day-tabs__add">
            <input
              placeholder="New day..."
              value={newDayLabel}
              onChange={e => setNewDayLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddDay()}
            />
            <button className="btn btn--small btn--primary" onClick={handleAddDay}>+ Day</button>
          </div>
        </div>
      </div>

      {/* Selected Day's Venues */}
      {selectedDay && (
        <>
          {selectedDay.venues.map(venue => (
            <VenueSection
              key={venue.id}
              eventId={eventId}
              dayId={selectedDay.id}
              day={selectedDay}
              venue={venue}
            />
          ))}

          <div className="event-view__add-venue">
            <h3>Add Venue/Stage</h3>
            <div className="event-view__add-venue-form">
              <input
                placeholder="Venue name..."
                value={newVenueName}
                onChange={e => setNewVenueName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddVenue()}
              />
              <input type="color" value={newVenueColor} onChange={e => setNewVenueColor(e.target.value)} />
              <button className="btn btn--primary" onClick={handleAddVenue}>Add Venue</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
