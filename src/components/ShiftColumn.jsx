import { useState } from 'react';
import { useApp } from '../AppContext';
import RoleCell from './RoleCell';

export default function ShiftColumn({ eventId, venueId, shift }) {
  const { data, updateShift, deleteShift } = useApp();
  const [editingTime, setEditingTime] = useState(false);
  const [startTime, setStartTime] = useState(shift.startTime);
  const [endTime, setEndTime] = useState(shift.endTime);
  const [label, setLabel] = useState(shift.label);

  const saveTime = () => {
    updateShift(eventId, venueId, shift.id, { label, startTime, endTime });
    setEditingTime(false);
  };

  return (
    <div className="shift-column">
      <div className="shift-column__header">
        {editingTime ? (
          <div className="shift-column__edit" onClick={e => e.stopPropagation()}>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label" />
            <input value={startTime} onChange={e => setStartTime(e.target.value)} placeholder="Start" />
            <input value={endTime} onChange={e => setEndTime(e.target.value)} placeholder="End" />
            <div className="shift-column__edit-actions">
              <button className="btn btn--small btn--primary" onClick={saveTime}>Save</button>
              <button className="btn btn--small" onClick={() => setEditingTime(false)}>Cancel</button>
              <button className="btn btn--small btn--danger" onClick={() => { if (confirm('Delete this shift?')) deleteShift(eventId, venueId, shift.id); }}>Delete</button>
            </div>
          </div>
        ) : (
          <div className="shift-column__label" onClick={() => setEditingTime(true)}>
            <strong>{shift.label}</strong>
            <span>{shift.startTime}{shift.endTime ? `-${shift.endTime}` : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
