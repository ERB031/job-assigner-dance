import { useState } from 'react';
import { useApp } from '../AppContext';

export default function RolesManager() {
  const { data, addRole, removeRole, renameRole } = useApp();
  const [newRole, setNewRole] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (!newRole.trim() || data.roles.includes(newRole.trim())) return;
    addRole(newRole.trim());
    setNewRole('');
  };

  const handleRename = () => {
    if (!editValue.trim()) return;
    renameRole(editingRole, editValue.trim());
    setEditingRole(null);
  };

  return (
    <div className="manager">
      <h2>Roles</h2>

      <div className="manager__add">
        <input
          placeholder="New role name..."
          value={newRole}
          onChange={e => setNewRole(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn btn--primary" onClick={handleAdd}>Add Role</button>
      </div>

      <div className="manager__list">
        {data.roles.map(role => (
          <div key={role} className="manager__item">
            {editingRole === role ? (
              <div className="manager__edit" style={{ flexDirection: 'row', gap: '8px' }}>
                <input
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') setEditingRole(null);
                  }}
                  autoFocus
                />
                <button className="btn btn--primary" onClick={handleRename}>Save</button>
                <button className="btn" onClick={() => setEditingRole(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <div className="manager__item-info">
                  <strong>{role}</strong>
                </div>
                <div className="manager__item-actions">
                  <button className="sidebar__icon-btn" onClick={() => { setEditingRole(role); setEditValue(role); }} title="Rename">&#9998;</button>
                  <button
                    className="sidebar__icon-btn sidebar__icon-btn--danger"
                    onClick={() => { if (confirm(`Remove role "${role}"? This will remove it from all employees and shifts.`)) removeRole(role); }}
                    title="Delete"
                  >&times;</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
