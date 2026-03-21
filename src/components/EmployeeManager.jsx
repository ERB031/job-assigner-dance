import { useState } from 'react';
import { useApp } from '../AppContext';

export default function EmployeeManager() {
  const { data, addEmployee, updateEmployee, deleteEmployee } = useApp();
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRoles, setEditRoles] = useState([]);
  const [search, setSearch] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addEmployee(name.trim(), selectedRoles);
    setName('');
    setSelectedRoles([]);
  };

  const startEdit = (emp) => {
    setEditingId(emp.id);
    setEditName(emp.name);
    setEditRoles([...emp.qualifiedRoles]);
  };

  const saveEdit = () => {
    updateEmployee(editingId, { name: editName, qualifiedRoles: editRoles });
    setEditingId(null);
  };

  const toggleRole = (role, roles, setRoles) => {
    setRoles(roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role]);
  };

  const filtered = data.employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="manager">
      <h2>Employees</h2>

      <div className="manager__add">
        <input
          placeholder="Employee name..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
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

      <input
        className="manager__search"
        placeholder="Search employees..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="manager__list">
        {filtered.map(emp => (
          <div key={emp.id} className="manager__item">
            {editingId === emp.id ? (
              <div className="manager__edit">
                <input value={editName} onChange={e => setEditName(e.target.value)} />
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
                <div className="manager__edit-actions">
                  <button className="btn btn--primary" onClick={saveEdit}>Save</button>
                  <button className="btn" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="manager__item-info">
                  <strong>{emp.name}</strong>
                  <span className="manager__item-roles">
                    {emp.qualifiedRoles.join(', ') || 'No roles assigned'}
                  </span>
                </div>
                <div className="manager__item-actions">
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
