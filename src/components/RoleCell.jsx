import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useApp } from '../AppContext';

export default function RoleCell({ eventId, venueId, shiftId, role, employeeId, dragId }) {
  const { data, setAssignment, setAssignmentNote } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);

  const shift = data.events
    .find(e => e.id === eventId)?.venues
    .find(v => v.id === venueId)?.shifts
    .find(s => s.id === shiftId);

  const note = shift?.notes?.[role] || '';

  const employee = data.employees.find(e => e.id === employeeId);
  const displayName = employeeId === 'N/A' ? 'N/A' : employee?.name || '';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: dragId,
    data: { eventId, venueId, shiftId, role, employeeId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const qualified = data.employees.filter(e => e.qualifiedRoles.includes(role));

  if (isEditing) {
    return (
      <td className="role-cell role-cell--editing">
        <select
          autoFocus
          value={employeeId || ''}
          onChange={e => {
            setAssignment(eventId, venueId, shiftId, role, e.target.value || null);
            setIsEditing(false);
          }}
          onBlur={() => setIsEditing(false)}
        >
          <option value="">-- Unassigned --</option>
          <option value="N/A">N/A</option>
          {qualified.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
          <optgroup label="All Employees">
            {data.employees.filter(e => !e.qualifiedRoles.includes(role)).map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </optgroup>
        </select>
      </td>
    );
  }

  return (
    <td
      ref={setNodeRef}
      style={style}
      className={`role-cell ${employeeId ? 'role-cell--filled' : 'role-cell--empty'} ${isDragging ? 'role-cell--dragging' : ''}`}
      onClick={() => setIsEditing(true)}
      {...attributes}
      {...listeners}
    >
      <span className="role-cell__name">{displayName || '—'}</span>
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
            onChange={e => setAssignmentNote(eventId, venueId, shiftId, role, e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setShowNoteInput(false); }}
            autoFocus
          />
        </div>
      )}
    </td>
  );
}
