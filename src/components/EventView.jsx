import { useState } from 'react';
import { useApp } from '../AppContext';
import VenueSection from './VenueSection';

export default function EventView({ eventId }) {
  const { data, addVenueToEvent } = useApp();
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueColor, setNewVenueColor] = useState('#4CAF50');

  const event = data.events.find(e => e.id === eventId);

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
