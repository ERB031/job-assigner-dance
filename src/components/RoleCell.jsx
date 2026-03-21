import { useState } from 'react';
import { useApp } from '../AppContext';
import { getConflictingEmployees, getConsecutiveShiftCount } from '../utils/autoAssign';

export default function RoleCell({ eventId, dayId, day, venueId, shiftId, shiftIdx, role, employeeId, dragId }) {
  const { data, setAssignment, setAssignmentNote } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const currentDay = day;
  const venue = currentDay?.venues.find(v => v.id === venueId);
  const shift = venue?.shifts.find(s => s.id === shiftId);

  const note = shift?.notes?.[role] || '';
  const employee = data.employees.find(e => e.id === employeeId);
  const displayName = employeeId === 'N/A' ? 'N/A' : employee?.name || '';

  // Filter to active employees available for this event
  const available = data.employees.filter(e =>
    e.active !== false && !(e.eventExclusions || []).includes(eventId)
  );

  // Get employees already assigned to same shift index in other venues
  const crossVenueConflicts = currentDay ? getConflictingEmployees(currentDay, venueId, shiftIdx) : new Set();

  const qualified = available.filter(e => e.qualifiedRoles.includes(role));
  const unqualified = available.filter(e => !e.qualifiedRoles.includes(role));

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      eventId, dayId, venueId, shiftId, shiftIdx, role, employeeId,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  };

  const handleDragLeave = () => setIsOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    try {
      const from = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (from.shiftId === shiftId && from.role === role) return;
      // Swap
      setAssignment(from.eventId, from.dayId, from.venueId, from.shiftId, from.role, employeeId || null);
      setAssignment(eventId, dayId, venueId, shiftId, role, from.employeeId || null);
    } catch { /* ignore */ }
  };

  const renderOption = (emp) => {
    const isConflict = crossVenueConflicts.has(emp.id);
    return (
      <option key={emp.id} value={emp.id} disabled={isConflict}>
        {emp.name}{isConflict ? ' (on other stage)' : ''}
      </option>
    );
  };

  if (isEditing) {
    return (
      <td className="role-cell role-cell--editing">
        <select
          autoFocus
          value={employeeId || ''}
          onChange={e => {
            setAssignment(eventId, dayId, venueId, shiftId, role, e.target.value || null);
            setIsEditing(false);
          }}
          onBlur={() => setIsEditing(false)}
        >
          <option value="">-- Unassigned --</option>
          <option value="N/A">N/A</option>
          {qualified.map(renderOption)}
          <optgroup label="Other Available">
            {unqualified.map(renderOption)}
          </optgroup>
        </select>
      </td>
    );
  }

  // Check if this employee is double-booked on another stage
  const isDoubleBooked = employeeId && employeeId !== 'N/A' && crossVenueConflicts.has(employeeId);

  // Check if this employee has 3+ consecutive shifts
  const consecutiveCount = venue ? getConsecutiveShiftCount(employeeId, shiftIdx, venue.shifts) : 0;

  const cellStyle = employee?.color && employeeId !== 'N/A'
    ? { backgroundColor: employee.color + '30', borderLeft: `3px solid ${employee.color}` }
    : {};

  return (
    <td
      className={`role-cell ${employeeId ? 'role-cell--filled' : 'role-cell--empty'} ${isOver ? 'role-cell--over' : ''} ${isDoubleBooked ? 'role-cell--conflict' : ''} ${consecutiveCount ? 'role-cell--consecutive-warn' : ''}`}
      style={cellStyle}
      draggable={!!employeeId && employeeId !== 'N/A'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => setIsEditing(true)}
    >
      <span className="role-cell__name">{displayName || '—'}</span>
      {isDoubleBooked && <span className="role-cell__conflict-warn">On other stage!</span>}
      {consecutiveCount > 0 && <span className="role-cell__consecutive-warn">{consecutiveCount} shifts in a row</span>}
      {note && <span className="role-cell__note">({note})</span>}
      {employeeId && employeeId !== 'N/A' && (
        <button
          className="role-cell__note-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowNoteInput(!showNoteInput);
          }}
          title="Add note"
        >
          &#9998;
        </button>
      )}
      {showNoteInput && (
        <div className="role-cell__note-input" onClick={e => e.stopPropagation()}>
          <input
            value={note}
            placeholder="e.g. Switch ~8:00"
            onChange={e => setAssignmentNote(eventId, dayId, venueId, shiftId, role, e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setShowNoteInput(false); }}
            autoFocus
          />
        </div>
      )}
    </td>
  );
}
