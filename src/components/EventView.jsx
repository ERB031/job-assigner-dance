import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useApp } from '../AppContext';
import VenueSection from './VenueSection';

export default function EventView({ eventId }) {
  const { data, setAssignment, addVenueToEvent } = useApp();
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueColor, setNewVenueColor] = useState('#4CAF50');

  const event = data.events.find(e => e.id === eventId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  if (!event) {
    return (
      <div className="event-view event-view--empty">
        <h2>Select an event from the sidebar to get started</h2>
        <p>Or create a new event using the sidebar.</p>
      </div>
    );
  }

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const from = active.data.current;
    const to = over.data.current;

    if (!from || !to) return;

    const fromEmpId = from.employeeId;
    const toEmpId = to.employeeId;

    // Swap the two assignments
    setAssignment(from.eventId, from.venueId, from.shiftId, from.role, toEmpId || null);
    setAssignment(to.eventId, to.venueId, to.shiftId, to.role, fromEmpId || null);
  };

  const handleAddVenue = () => {
    if (!newVenueName.trim()) return;
    addVenueToEvent(eventId, newVenueName.trim(), newVenueColor);
    setNewVenueName('');
  };

  return (
    <div className="event-view">
      <h2 className="event-view__title">{event.name}</h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {event.venues.map(venue => (
          <VenueSection key={venue.id} eventId={eventId} venue={venue} />
        ))}
      </DndContext>

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
