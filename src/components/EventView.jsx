import { useState, useCallback } from 'react';
import { useApp } from '../AppContext';
import VenueSection from './VenueSection';

export default function EventView({ eventId }) {
  const { data, addVenueToEvent } = useApp();
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueColor, setNewVenueColor] = useState('#4CAF50');

  const event = data.events.find(e => e.id === eventId);

  const exportCSV = useCallback(() => {
    if (!event) return;
    let csv = '';
    event.venues.forEach(venue => {
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
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name}-schedule.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [event, data]);

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
    if (!newVenueName.trim()) return;
    addVenueToEvent(eventId, newVenueName.trim(), newVenueColor);
    setNewVenueName('');
  };

  return (
    <div className="event-view">
      <h2 className="event-view__title">{event.name}</h2>

      <div className="event-view__export-bar">
        <button className="btn btn--small btn--primary" onClick={exportCSV}>Export CSV</button>
        <button className="btn btn--small btn--primary" onClick={exportPDF}>Export PDF (Print)</button>
      </div>

      {event.venues.map(venue => (
        <VenueSection key={venue.id} eventId={eventId} venue={venue} />
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
    </div>
  );
}
