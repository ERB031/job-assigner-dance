/**
 * Round-robin auto-assign employees to roles within a venue's shifts.
 * Respects:
 *  - Cross-venue conflict: no employee on two stages at same shift index
 *  - Back-to-back avoidance: soft penalty for consecutive shifts
 *  - Open+close avoidance: soft penalty for first AND last shift
 *  - Chemistry/conflict relationships
 *  - Active/inactive status & event exclusions
 *  - Shift preferences (prefer/avoid)
 */
export function autoAssignVenue(venue, employees, roles, allEvents, relationships = [], eventId = null, crossVenueAssignments = {}) {
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

  const getShiftEmployees = (shift) =>
    Object.values(shift.assignments).filter(id => id && id !== 'N/A');

  const totalShifts = newShifts.length;

  // Second pass: fill empty slots
  for (let shiftIdx = 0; shiftIdx < newShifts.length; shiftIdx++) {
    const shift = newShifts[shiftIdx];
    for (const role of roles) {
      if (shift.assignments[role]) continue;

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
          // HARD: Cross-venue conflict - don't assign if already on another stage at this shift index
          const crossVenueSet = crossVenueAssignments[shiftIdx];
          if (crossVenueSet && crossVenueSet.has(emp.id)) return false;
          return true;
        })
        .sort((a, b) => {
          // 1. Avoid employees who marked this shift as "avoid"
          const aPref = a.shiftPreferences?.[shift.label];
          const bPref = b.shiftPreferences?.[shift.label];
          const aAvoid = aPref === 'avoid' ? 1 : 0;
          const bAvoid = bPref === 'avoid' ? 1 : 0;
          if (aAvoid !== bAvoid) return aAvoid - bAvoid;

          // 2. Prefer employees who marked this shift as "prefer"
          const aPrefer = aPref === 'prefer' ? 1 : 0;
          const bPrefer = bPref === 'prefer' ? 1 : 0;
          if (bPrefer !== aPrefer) return bPrefer - aPrefer;

          // 3. Penalize back-to-back shifts (check adjacent shifts in this venue)
          const aBackToBack = isBackToBack(a.id, shiftIdx, newShifts);
          const bBackToBack = isBackToBack(b.id, shiftIdx, newShifts);
          if (aBackToBack !== bBackToBack) return aBackToBack - bBackToBack;

          // 4. Penalize open+close (first and last shift)
          const aOpenClose = wouldOpenAndClose(a.id, shiftIdx, totalShifts, newShifts);
          const bOpenClose = wouldOpenAndClose(b.id, shiftIdx, totalShifts, newShifts);
          if (aOpenClose !== bOpenClose) return aOpenClose - bOpenClose;

          // 5. Prefer employees with chemistry to existing shift members
          const aChemScore = shiftEmps.filter(e => hasChemistry(a.id, e)).length;
          const bChemScore = shiftEmps.filter(e => hasChemistry(b.id, e)).length;
          if (bChemScore !== aChemScore) return bChemScore - aChemScore;

          // 6. Fewest total assignments
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

/**
 * Check if assigning empId at shiftIdx would create a back-to-back situation.
 * Returns 1 if yes, 0 if no.
 */
function isBackToBack(empId, shiftIdx, shifts) {
  // Check previous shift
  if (shiftIdx > 0) {
    const prevEmps = Object.values(shifts[shiftIdx - 1].assignments);
    if (prevEmps.includes(empId)) return 1;
  }
  // Check next shift
  if (shiftIdx < shifts.length - 1) {
    const nextEmps = Object.values(shifts[shiftIdx + 1].assignments);
    if (nextEmps.includes(empId)) return 1;
  }
  return 0;
}

/**
 * Check if assigning empId at shiftIdx would result in them having both
 * the first and last shift (open and close). Returns 1 if yes, 0 if no.
 */
function wouldOpenAndClose(empId, shiftIdx, totalShifts, shifts) {
  if (totalShifts < 2) return 0;
  const firstIdx = 0;
  const lastIdx = totalShifts - 1;

  if (shiftIdx === firstIdx) {
    // Being assigned to first shift - check if already on last
    const lastEmps = Object.values(shifts[lastIdx].assignments);
    return lastEmps.includes(empId) ? 1 : 0;
  }
  if (shiftIdx === lastIdx) {
    // Being assigned to last shift - check if already on first
    const firstEmps = Object.values(shifts[firstIdx].assignments);
    return firstEmps.includes(empId) ? 1 : 0;
  }
  return 0;
}

/**
 * Build a cross-venue assignment map: shiftIndex -> Set of employeeIds
 * assigned to that shift index across all OTHER venues in the day.
 */
export function buildCrossVenueMap(day, excludeVenueId) {
  const map = {};
  for (const venue of day.venues) {
    if (venue.id === excludeVenueId) continue;
    venue.shifts.forEach((shift, idx) => {
      if (!map[idx]) map[idx] = new Set();
      for (const empId of Object.values(shift.assignments)) {
        if (empId && empId !== 'N/A') {
          map[idx].add(empId);
        }
      }
    });
  }
  return map;
}

/**
 * Get employees assigned to the same shift index in other venues.
 * Returns a Set of employee IDs.
 */
export function getConflictingEmployees(day, venueId, shiftIdx) {
  const conflicting = new Set();
  for (const venue of day.venues) {
    if (venue.id === venueId) continue;
    const shift = venue.shifts[shiftIdx];
    if (!shift) continue;
    for (const empId of Object.values(shift.assignments)) {
      if (empId && empId !== 'N/A') {
        conflicting.add(empId);
      }
    }
  }
  return conflicting;
}

function getAssignmentCounts(employees, allEvents) {
  const counts = {};
  for (const emp of employees) {
    counts[emp.id] = 0;
  }
  for (const event of allEvents) {
    for (const day of (event.days || [])) {
      for (const venue of day.venues) {
        for (const shift of venue.shifts) {
          for (const empId of Object.values(shift.assignments)) {
            if (empId && empId !== 'N/A') {
              counts[empId] = (counts[empId] || 0) + 1;
            }
          }
        }
      }
    }
  }
  return counts;
}
