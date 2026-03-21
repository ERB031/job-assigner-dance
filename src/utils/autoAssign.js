/**
 * Round-robin auto-assign employees to roles within a venue's shifts.
 * Respects:
 *  - Cross-venue conflict: no employee on two stages at same shift index
 *  - Back-to-back: allowed, but 3+ consecutive flagged as warning
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

  // Second pass: fix cross-venue double-bookings by replacing conflicting employees
  for (let shiftIdx = 0; shiftIdx < newShifts.length; shiftIdx++) {
    const shift = newShifts[shiftIdx];
    const crossVenueSet = crossVenueAssignments[shiftIdx];
    if (!crossVenueSet) continue;

    for (const role of roles) {
      const empId = shift.assignments[role];
      if (!empId || empId === 'N/A') continue;
      if (!crossVenueSet.has(empId)) continue;

      // This employee is double-booked - clear them and find a replacement
      shift.assignments[role] = null;
      delete employeeShiftMap[empId];
    }
  }

  // Third pass: fill empty slots (including ones we just cleared)
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

          // 3. Penalize 3+ consecutive shifts (but allow back-to-back)
          const aConsec = wouldExceedConsecutive(a.id, shiftIdx, newShifts, 2);
          const bConsec = wouldExceedConsecutive(b.id, shiftIdx, newShifts, 2);
          if (aConsec !== bConsec) return aConsec - bConsec;

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
 * Count the length of the consecutive run that would include shiftIdx for empId.
 * Looks backward and forward from the target shift.
 */
function getConsecutiveRunLength(empId, shiftIdx, shifts) {
  let count = 1; // the shift itself
  // Count backward
  for (let i = shiftIdx - 1; i >= 0; i--) {
    if (Object.values(shifts[i].assignments).includes(empId)) count++;
    else break;
  }
  // Count forward
  for (let i = shiftIdx + 1; i < shifts.length; i++) {
    if (Object.values(shifts[i].assignments).includes(empId)) count++;
    else break;
  }
  return count;
}

/**
 * Returns 1 if assigning empId at shiftIdx would create a consecutive run
 * longer than maxAllowed, 0 otherwise. Used as a soft penalty in sorting.
 */
function wouldExceedConsecutive(empId, shiftIdx, shifts, maxAllowed) {
  return getConsecutiveRunLength(empId, shiftIdx, shifts) > maxAllowed ? 1 : 0;
}

/**
 * Check if an employee has more than 2 consecutive shifts in a venue.
 * Returns the length of the consecutive run including shiftIdx, or 0 if <= 2.
 */
export function getConsecutiveShiftCount(empId, shiftIdx, shifts) {
  if (!empId || empId === 'N/A') return 0;
  const run = getConsecutiveRunLength(empId, shiftIdx, shifts);
  return run > 2 ? run : 0;
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
