/**
 * Round-robin auto-assign employees to roles within a venue's shifts.
 * Each employee can only be assigned to one shift within a venue.
 * Picks the employee with the fewest total assignments for fairness.
 * Respects:
 *  - chemistry/conflict relationships
 *  - active/inactive status
 *  - event exclusions
 *  - shift preferences (prefer/avoid)
 */
export function autoAssignVenue(venue, employees, roles, allEvents, relationships = [], eventId = null) {
  const assignmentCounts = getAssignmentCounts(employees, allEvents);
  const newShifts = venue.shifts.map(shift => ({
    ...shift,
    assignments: { ...shift.assignments },
  }));

  // Filter to only active employees not excluded from this event
  const availableEmployees = employees.filter(emp => {
    if (emp.active === false) return false;
    if (eventId && emp.eventExclusions && emp.eventExclusions.includes(eventId)) return false;
    return true;
  });

  // Track which employees are assigned to a shift in this venue
  const employeeShiftMap = {};

  // First pass: record existing assignments
  for (const shift of newShifts) {
    for (const role of roles) {
      const empId = shift.assignments[role];
      if (empId && empId !== 'N/A') {
        employeeShiftMap[empId] = shift.id;
      }
    }
  }

  // Build relationship lookup
  const conflicts = new Set();
  const chemistry = new Set();
  for (const rel of relationships) {
    const key = [rel.emp1, rel.emp2].sort().join('|');
    if (rel.type === 'conflict') conflicts.add(key);
    else if (rel.type === 'chemistry') chemistry.add(key);
  }

  const hasConflict = (emp1, emp2) => conflicts.has([emp1, emp2].sort().join('|'));
  const hasChemistry = (emp1, emp2) => chemistry.has([emp1, emp2].sort().join('|'));

  // Get employees already assigned to a shift
  const getShiftEmployees = (shift) =>
    Object.values(shift.assignments).filter(id => id && id !== 'N/A');

  // Second pass: fill empty slots
  for (const shift of newShifts) {
    for (const role of roles) {
      if (shift.assignments[role]) continue; // already assigned or N/A

      const shiftEmps = getShiftEmployees(shift);

      const candidates = availableEmployees
        .filter(emp => {
          if (!emp.qualifiedRoles.includes(role)) return false;
          // Not already assigned to a different shift in this venue
          const assignedShift = employeeShiftMap[emp.id];
          if (assignedShift && assignedShift !== shift.id) return false;
          // Not already assigned to a role in this shift
          if (shiftEmps.includes(emp.id)) return false;
          // Check conflicts - skip if conflicts with anyone in this shift
          if (shiftEmps.some(existing => hasConflict(emp.id, existing))) return false;
          return true;
        })
        .sort((a, b) => {
          // First: avoid employees who marked this shift as "avoid"
          const aPref = a.shiftPreferences?.[shift.label];
          const bPref = b.shiftPreferences?.[shift.label];
          const aAvoid = aPref === 'avoid' ? 1 : 0;
          const bAvoid = bPref === 'avoid' ? 1 : 0;
          if (aAvoid !== bAvoid) return aAvoid - bAvoid;

          // Prefer employees who marked this shift as "prefer"
          const aPrefer = aPref === 'prefer' ? 1 : 0;
          const bPrefer = bPref === 'prefer' ? 1 : 0;
          if (bPrefer !== aPrefer) return bPrefer - aPrefer;

          // Prefer employees with chemistry to existing shift members
          const aChemScore = shiftEmps.filter(e => hasChemistry(a.id, e)).length;
          const bChemScore = shiftEmps.filter(e => hasChemistry(b.id, e)).length;
          if (bChemScore !== aChemScore) return bChemScore - aChemScore;

          // Then by fewest assignments
          return (assignmentCounts[a.id] || 0) - (assignmentCounts[b.id] || 0);
        });

      if (candidates.length > 0) {
        const chosen = candidates[0];
        shift.assignments[role] = chosen.id;
        employeeShiftMap[chosen.id] = shift.id;
        assignmentCounts[chosen.id] = (assignmentCounts[chosen.id] || 0) + 1;
      }
    }
  }

  return newShifts;
}

function getAssignmentCounts(employees, allEvents) {
  const counts = {};
  for (const emp of employees) {
    counts[emp.id] = 0;
  }
  for (const event of allEvents) {
    for (const venue of event.venues) {
      for (const shift of venue.shifts) {
        for (const empId of Object.values(shift.assignments)) {
          if (empId && empId !== 'N/A') {
            counts[empId] = (counts[empId] || 0) + 1;
          }
        }
      }
    }
  }
  return counts;
}
