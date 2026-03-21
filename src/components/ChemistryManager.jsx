import { useState } from 'react';
import { useApp } from '../AppContext';

export default function ChemistryManager() {
  const { data, addRelationship, removeRelationship } = useApp();
  const [emp1, setEmp1] = useState('');
  const [emp2, setEmp2] = useState('');
  const [type, setType] = useState('conflict');

  const relationships = data.relationships || [];

  const handleAdd = () => {
    if (!emp1 || !emp2 || emp1 === emp2) return;
    addRelationship(emp1, emp2, type);
    setEmp1('');
    setEmp2('');
  };

  const getEmployeeName = (id) => data.employees.find(e => e.id === id)?.name || 'Unknown';

  return (
    <div className="chemistry-manager">
      <h2>Chemistry / Conflicts</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
        Flag employees who work well together (chemistry) or should be kept apart (conflict).
        Auto-assign will respect these settings.
      </p>

      <div className="chemistry-manager__add">
        <div className="chemistry-manager__add-row">
          <select value={emp1} onChange={e => setEmp1(e.target.value)}>
            <option value="">Select employee...</option>
            {data.employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <span style={{ fontWeight: 600 }}>&amp;</span>
          <select value={emp2} onChange={e => setEmp2(e.target.value)}>
            <option value="">Select employee...</option>
            {data.employees.filter(e => e.id !== emp1).map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        <div className="chemistry-manager__type-toggle">
          <button
            className={type === 'conflict' ? 'active-conflict' : ''}
            onClick={() => setType('conflict')}
          >
            Conflict
          </button>
          <button
            className={type === 'chemistry' ? 'active-chemistry' : ''}
            onClick={() => setType('chemistry')}
          >
            Chemistry
          </button>
        </div>
        <button className="btn btn--primary" onClick={handleAdd} disabled={!emp1 || !emp2 || emp1 === emp2}>
          Add Relationship
        </button>
      </div>

      <div className="chemistry-manager__list">
        {relationships.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 24 }}>
            No relationships set yet. Add one above.
          </p>
        )}
        {relationships.map(rel => (
          <div key={rel.id} className={`chemistry-manager__item chemistry-manager__item--${rel.type}`}>
            <span className="chemistry-manager__item-label">
              <strong>{getEmployeeName(rel.emp1)}</strong> &amp; <strong>{getEmployeeName(rel.emp2)}</strong>
            </span>
            <span className={`chemistry-manager__item-type chemistry-manager__item-type--${rel.type}`}>
              {rel.type === 'conflict' ? 'Conflict' : 'Chemistry'}
            </span>
            <button
              className="sidebar__icon-btn sidebar__icon-btn--danger"
              onClick={() => removeRelationship(rel.id)}
              title="Remove"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
