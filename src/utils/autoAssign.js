/**
 * Round-robin auto-assign employees to roles within a venue's shifts.
 * Each employee can only be assigned to one shift within a venue.
 * Picks the employee with the fewest total assignments for fairness.
 */
export function autoAssignVenue(venue, employees, roles, allEvents) {
  const assignmentCounts = getAssignmentCounts(employees, allEvents);
  const newShifts = venue.shifts.map(shift => ({
    ...shift,
    assignments: { ...shift.assignments },
  }));

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

  // Second pass: fill empty slots
  for (const shift of newShifts) {
    for (const role of roles) {
      if (shift.assignments[role]) continue; // already assigned or N/A

      const candidates = employees
        .filter(emp => {
          if (!emp.qualifiedRoles.includes(role)) return false;
          // Not already assigned to a different shift in this venue
          const assignedShift = employeeShiftMap[emp.id];
          if (assignedShift && assignedShift !== shift.id) return false;
          // Not already assigned to a role in this shift
          const isInThisShift = Object.values(shift.assignments).includes(emp.id);
          if (isInThisShift) return false;
          return true;
        })
        .sort((a, b) => (assignmentCounts[a.id] || 0) - (assignmentCounts[b.id] || 0));

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
