import { useState } from 'react';
import { useApp } from '../AppContext';

export default function EmployeeManager() {
  const { data, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [empColor, setEmpColor] = useState('#4CAF50');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRoles, setEditRoles] = useState([]);
  const [editColor, setEditColor] = useState('#4CAF50');
  const [editShiftPrefs, setEditShiftPrefs] = useState({});
  const [editEventExclusions, setEditEventExclusions] = useState([]);
  const [editActive, setEditActive] = useState(true);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Collect all unique shift labels across all events/venues
  const allShiftLabels = [...new Set(
    data.events.flatMap(e => e.venues.flatMap(v => v.shifts.map(s => s.label)))
  )];

  const handleAdd = () => {
    if (!name.trim()) return;
    addEmployee(name.trim(), selectedRoles, empColor);
    setName('');
    setSelectedRoles([]);
    setEmpColor('#4CAF50');
  };

  const startEdit = (emp) => {
    setEditingId(emp.id);
    setEditName(emp.name);
    setEditRoles([...emp.qualifiedRoles]);
    setEditColor(emp.color || '#4CAF50');
    setEditShiftPrefs({ ...(emp.shiftPreferences || {}) });
    setEditEventExclusions([...(emp.eventExclusions || [])]);
    setEditActive(emp.active !== false);
  };

  const saveEdit = () => {
    updateEmployee(editingId, {
      name: editName,
      qualifiedRoles: editRoles,
      color: editColor,
      shiftPreferences: editShiftPrefs,
      eventExclusions: editEventExclusions,
      active: editActive,
    });
    setEditingId(null);
  };

  const toggleRole = (role, roles, setRoles) => {
    setRoles(roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role]);
  };

  const cycleShiftPref = (label) => {
    setEditShiftPrefs(prev => {
      const current = prev[label];
      if (!current) return { ...prev, [label]: 'prefer' };
      if (current === 'prefer') return { ...prev, [label]: 'avoid' };
      const { [label]: _, ...rest } = prev;
      return rest;
    });
  };

  const toggleEventExclusion = (eventId) => {
    setEditEventExclusions(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]
    );
  };

  const toggleActive = (emp) => {
    updateEmployee(emp.id, { active: emp.active === false ? true : false });
  };

  const filtered = data.employees.filter(e => {
    if (!showInactive && e.active === false) return false;
    return e.name.toLowerCase().includes(search.toLowerCase());
  });

  const activeCount = data.employees.filter(e => e.active !== false).length;
  const inactiveCount = data.employees.length - activeCount;

  return (
    <div className="manager">
      <h2>Employees</h2>

      <div className="manager__add">
        <div className="manager__name-color-row">
          <input
            placeholder="Employee name..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <label className="manager__color-label">
            Color
            <input type="color" value={empColor} onChange={e => setEmpColor(e.target.value)} />
          </label>
        </div>
        <div className="manager__roles-grid">
          {data.roles.map(role => (
            <label key={role} className="manager__role-checkbox">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={() => toggleRole(role, selectedRoles, setSelectedRoles)}
              />
              <span>{role}</span>
            </label>
          ))}
        </div>
        <button className="btn btn--primary" onClick={handleAdd}>Add Employee</button>
      </div>

      <div className="manager__filter-row">
        <input
          className="manager__search"
          placeholder="Search employees..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <label className="manager__inactive-toggle">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
          />
          Show inactive ({inactiveCount})
        </label>
      </div>

      <div className="manager__list">
        {filtered.map(emp => (
          <div key={emp.id} className={`manager__item ${emp.active === false ? 'manager__item--inactive' : ''}`}>
            {editingId === emp.id ? (
              <div className="manager__edit">
                <div className="manager__name-color-row">
                  <input value={editName} onChange={e => setEditName(e.target.value)} />
                  <label className="manager__color-label">
                    Color
                    <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} />
                  </label>
                </div>

                {/* Active toggle */}
                <label className="manager__active-toggle">
                  <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} />
                  <span>Active employee</span>
                </label>

                {/* Roles */}
                <div className="manager__edit-section-label">Qualified Roles</div>
                <div className="manager__roles-grid">
                  {data.roles.map(role => (
                    <label key={role} className="manager__role-checkbox">
                      <input
                        type="checkbox"
                        checked={editRoles.includes(role)}
                        onChange={() => toggleRole(role, editRoles, setEditRoles)}
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>

                {/* Shift Preferences */}
                {allShiftLabels.length > 0 && (
                  <>
                    <div className="manager__edit-section-label">Shift Preferences</div>
                    <div className="manager__shift-prefs">
                      {allShiftLabels.map(label => {
                        const pref = editShiftPrefs[label];
                        return (
                          <button
                            key={label}
                            className={`manager__shift-pref-btn ${pref ? `manager__shift-pref-btn--${pref}` : ''}`}
                            onClick={() => cycleShiftPref(label)}
                            title="Click to cycle: none → prefer → avoid"
                          >
                            <span>{label}</span>
                            {pref === 'prefer' && <span className="manager__pref-badge manager__pref-badge--prefer">Prefer</span>}
                            {pref === 'avoid' && <span className="manager__pref-badge manager__pref-badge--avoid">Avoid</span>}
                            {!pref && <span className="manager__pref-badge">No pref</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Event Availability */}
                {data.events.length > 0 && (
                  <>
                    <div className="manager__edit-section-label">Event Availability</div>
                    <div className="manager__event-availability">
                      {data.events.map(event => (
                        <label key={event.id} className={`manager__event-toggle ${editEventExclusions.includes(event.id) ? 'manager__event-toggle--excluded' : ''}`}>
                          <input
                            type="checkbox"
                            checked={!editEventExclusions.includes(event.id)}
                            onChange={() => toggleEventExclusion(event.id)}
                          />
                          <span>{event.name}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}

                <div className="manager__edit-actions">
                  <button className="btn btn--primary" onClick={saveEdit}>Save</button>
                  <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="manager__item-info">
                  <div className="manager__item-name-row">
                    <span className="manager__color-swatch" style={{ backgroundColor: emp.color || '#4CAF50' }} />
                    <strong>{emp.name}</strong>
                    {emp.active === false && <span className="manager__inactive-badge">Inactive</span>}
                  </div>
                  <span className="manager__item-roles">
                    {emp.qualifiedRoles.join(', ') || 'No roles assigned'}
                  </span>
                  {emp.shiftPreferences && Object.keys(emp.shiftPreferences).length > 0 && (
                    <span className="manager__item-prefs">
                      {Object.entries(emp.shiftPreferences).map(([label, pref]) =>
                        `${label}: ${pref}`
                      ).join(' | ')}
                    </span>
                  )}
                  {emp.eventExclusions && emp.eventExclusions.length > 0 && (
                    <span className="manager__item-exclusions">
                      Excluded from: {emp.eventExclusions.map(id => data.events.find(e => e.id === id)?.name || 'Unknown').join(', ')}
                    </span>
                  )}
                </div>
                <div className="manager__item-actions">
                  <button
                    className={`sidebar__icon-btn ${emp.active === false ? 'manager__activate-btn' : ''}`}
                    onClick={() => toggleActive(emp)}
                    title={emp.active === false ? 'Activate' : 'Deactivate'}
                  >
                    {emp.active === false ? '\u2713' : '\u2298'}
                  </button>
                  <button className="sidebar__icon-btn" onClick={() => startEdit(emp)} title="Edit">&#9998;</button>
                  <button className="sidebar__icon-btn sidebar__icon-btn--danger" onClick={() => { if (confirm(`Delete ${emp.name}?`)) deleteEmployee(emp.id); }} title="Delete">&times;</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
