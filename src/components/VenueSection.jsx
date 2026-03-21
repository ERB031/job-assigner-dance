import { useState } from 'react';
import { useApp } from '../AppContext';
import RoleCell from './RoleCell';

export default function VenueSection({ eventId, dayId, day, venue }) {
  const { data, updateVenue, deleteVenue, addShiftToVenue, updateShift, deleteShift, runAutoAssign } = useApp();
  const [editingVenue, setEditingVenue] = useState(false);
  const [venueName, setVenueName] = useState(venue.name);
  const [venueColor, setVenueColor] = useState(venue.color);
  const [venueNotes, setVenueNotes] = useState(venue.notes || '');
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [shiftLabel, setShiftLabel] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');

  const saveVenue = () => {
    updateVenue(eventId, dayId, venue.id, { name: venueName, color: venueColor, notes: venueNotes });
    setEditingVenue(false);
  };

  const startEditShift = (shift) => {
    setEditingShiftId(shift.id);
    setShiftLabel(shift.label);
    setShiftStart(shift.startTime);
    setShiftEnd(shift.endTime);
  };

  const saveShift = () => {
    updateShift(eventId, dayId, venue.id, editingShiftId, { label: shiftLabel, startTime: shiftStart, endTime: shiftEnd });
    setEditingShiftId(null);
  };

  return (
    <div className="venue-section">
      {/* Venue header */}
      <div className="venue-section__header" style={{ backgroundColor: venue.color }}>
        {editingVenue ? (
          <div className="venue-section__edit" onClick={e => e.stopPropagation()}>
            <div className="venue-section__edit-row">
              <input value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="Venue name" />
              <input type="color" value={venueColor} onChange={e => setVenueColor(e.target.value)} />
            </div>
            <textarea
              value={venueNotes}
              onChange={e => setVenueNotes(e.target.value)}
              placeholder="Schedule notes (doors, awards times, etc.)"
              rows={4}
            />
            <div className="venue-section__edit-actions">
              <button className="btn btn--small btn--primary" onClick={saveVenue}>Save</button>
              <button className="btn btn--small" onClick={() => setEditingVenue(false)}>Cancel</button>
              <button className="btn btn--small btn--danger" onClick={() => { if (confirm('Delete venue?')) deleteVenue(eventId, dayId, venue.id); }}>Delete Venue</button>
            </div>
          </div>
        ) : (
          <div className="venue-section__title" onClick={() => setEditingVenue(true)}>
            <h3>{venue.name}</h3>
            {venue.notes && <pre className="venue-section__notes">{venue.notes}</pre>}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="venue-section__actions">
        <button className="btn btn--small btn--primary" onClick={() => runAutoAssign(eventId, dayId, venue.id)}>
          Auto-Assign
        </button>
        <button className="btn btn--small" onClick={() => addShiftToVenue(eventId, dayId, venue.id)}>
          + Add Shift
        </button>
      </div>

      {/* Schedule table */}
      <div className="venue-section__table-wrap">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="schedule-table__position-header">Position</th>
              {venue.shifts.map(shift => (
                <th key={shift.id} className="schedule-table__shift-header">
                  {editingShiftId === shift.id ? (
                    <div className="shift-edit" onClick={e => e.stopPropagation()}>
                      <input value={shiftLabel} onChange={e => setShiftLabel(e.target.value)} placeholder="Label" />
                      <input value={shiftStart} onChange={e => setShiftStart(e.target.value)} placeholder="Start time" />
                      <input value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} placeholder="End time" />
                      <div className="shift-edit__actions">
                        <button className="btn btn--small btn--primary" onClick={saveShift}>Save</button>
                        <button className="btn btn--small" onClick={() => setEditingShiftId(null)}>Cancel</button>
                        <button className="btn btn--small btn--danger" onClick={() => { deleteShift(eventId, dayId, venue.id, shift.id); setEditingShiftId(null); }}>Delete</button>
                      </div>
                    </div>
                  ) : (
                    <div className="shift-header-label" onClick={() => startEditShift(shift)}>
                      <strong>{shift.label}</strong>
                      <span>{shift.startTime}{shift.endTime ? `–${shift.endTime}` : ''}</span>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.roles.map(role => (
              <tr key={role}>
                <td className="schedule-table__role-name"><strong>{role}</strong></td>
                {venue.shifts.map((shift, shiftIdx) => (
                  <RoleCell
                    key={`${shift.id}-${role}`}
                    eventId={eventId}
                    dayId={dayId}
                    day={day}
                    venueId={venue.id}
                    shiftId={shift.id}
                    shiftIdx={shiftIdx}
                    role={role}
                    employeeId={shift.assignments[role]}
                    dragId={`${eventId}|${dayId}|${venue.id}|${shift.id}|${role}`}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
