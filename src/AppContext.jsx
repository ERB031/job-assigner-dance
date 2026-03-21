import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getDefaultData, createId, createEmployee, createEvent, createVenue, createShift, createDay, migrateData } from './utils/data';
import { autoAssignVenue, buildCrossVenueMap } from './utils/autoAssign';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [data, setData] = useLocalStorage('job-assigner-data', getDefaultData(), migrateData);

  // -- Employees --
  const addEmployee = useCallback((name, qualifiedRoles, color) => {
    setData(d => ({ ...d, employees: [...d.employees, createEmployee(name, qualifiedRoles, color)] }));
  }, [setData]);

  const updateEmployee = useCallback((id, updates) => {
    setData(d => ({
      ...d,
      employees: d.employees.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  }, [setData]);

  const deleteEmployee = useCallback((id) => {
    setData(d => ({
      ...d,
      employees: d.employees.filter(e => e.id !== id),
      events: d.events.map(ev => ({
        ...ev,
        days: (ev.days || []).map(day => ({
          ...day,
          venues: day.venues.map(v => ({
            ...v,
            shifts: v.shifts.map(s => ({
              ...s,
              assignments: Object.fromEntries(
                Object.entries(s.assignments).map(([role, empId]) => [role, empId === id ? null : empId])
              ),
            })),
          })),
        })),
      })),
    }));
  }, [setData]);

  // -- Roles --
  const addRole = useCallback((name) => {
    setData(d => ({ ...d, roles: [...d.roles, name] }));
  }, [setData]);

  const removeRole = useCallback((name) => {
    setData(d => ({
      ...d,
      roles: d.roles.filter(r => r !== name),
      employees: d.employees.map(e => ({ ...e, qualifiedRoles: e.qualifiedRoles.filter(r => r !== name) })),
      events: d.events.map(ev => ({
        ...ev,
        days: (ev.days || []).map(day => ({
          ...day,
          venues: day.venues.map(v => ({
            ...v,
            shifts: v.shifts.map(s => {
              const { [name]: _, ...rest } = s.assignments;
              return { ...s, assignments: rest };
            }),
          })),
        })),
      })),
    }));
  }, [setData]);

  const renameRole = useCallback((oldName, newName) => {
    setData(d => ({
      ...d,
      roles: d.roles.map(r => r === oldName ? newName : r),
      employees: d.employees.map(e => ({
        ...e,
        qualifiedRoles: e.qualifiedRoles.map(r => r === oldName ? newName : r),
      })),
      events: d.events.map(ev => ({
        ...ev,
        days: (ev.days || []).map(day => ({
          ...day,
          venues: day.venues.map(v => ({
            ...v,
            shifts: v.shifts.map(s => {
              const assignments = {};
              for (const [role, empId] of Object.entries(s.assignments)) {
                assignments[role === oldName ? newName : role] = empId;
              }
              return { ...s, assignments };
            }),
          })),
        })),
      })),
    }));
  }, [setData]);

  // -- Events --
  const addEvent = useCallback((name) => {
    setData(d => ({ ...d, events: [...d.events, createEvent(name)] }));
  }, [setData]);

  const updateEvent = useCallback((id, updates) => {
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  }, [setData]);

  const deleteEvent = useCallback((id) => {
    setData(d => ({ ...d, events: d.events.filter(e => e.id !== id) }));
  }, [setData]);

  // -- Days --
  const addDayToEvent = useCallback((eventId, label) => {
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === eventId
        ? { ...e, days: [...(e.days || []), createDay(label)] }
        : e),
    }));
  }, [setData]);

  const updateDay = useCallback((eventId, dayId, updates) => {
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === eventId
        ? { ...e, days: (e.days || []).map(day => day.id === dayId ? { ...day, ...updates } : day) }
        : e),
    }));
  }, [setData]);

  const deleteDay = useCallback((eventId, dayId) => {
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === eventId
        ? { ...e, days: (e.days || []).filter(day => day.id !== dayId) }
        : e),
    }));
  }, [setData]);

  // -- Venues --
  const addVenueToEvent = useCallback((eventId, dayId, name, color) => {
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === eventId
        ? {
          ...e,
          days: (e.days || []).map(day => day.id === dayId
            ? { ...day, venues: [...day.venues, createVenue(name, color)] }
            : day),
        }
        : e),
    }));
  }, [setData]);

  const updateVenue = useCallback((eventId, dayId, venueId, updates) => {
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === eventId
        ? {
          ...e,
          days: (e.days || []).map(day => day.id === dayId
            ? { ...day, venues: day.venues.map(v => v.id === venueId ? { ...v, ...updates } : v) }
            : day),
        }
        : e),
    }));
  }, [setData]);

  const deleteVenue = useCallback((eventId, dayId, venueId) => {
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === eventId
        ? {
          ...e,
          days: (e.days || []).map(day => day.id === dayId
            ? { ...day, venues: day.venues.filter(v => v.id !== venueId) }
            : day),
        }
        : e),
    }));
  }, [setData]);

  // -- Shifts --
  const addShiftToVenue = useCallback((eventId, dayId, venueId) => {
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === eventId
        ? {
          ...e,
          days: (e.days || []).map(day => day.id === dayId
            ? {
              ...day,
              venues: day.venues.map(v => {
                if (v.id !== venueId) return v;
                const num = v.shifts.length + 1;
                return { ...v, shifts: [...v.shifts, createShift(`Shift ${num}`, '', '')] };
              }),
            }
            : day),
        }
        : e),
    }));
  }, [setData]);

  const updateShift = useCallback((eventId, dayId, venueId, shiftId, updates) => {
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === eventId
        ? {
          ...e,
          days: (e.days || []).map(day => day.id === dayId
            ? {
              ...day,
              venues: day.venues.map(v => v.id === venueId
                ? { ...v, shifts: v.shifts.map(s => s.id === shiftId ? { ...s, ...updates } : s) }
                : v),
            }
            : day),
        }
        : e),
    }));
  }, [setData]);

  const deleteShift = useCallback((eventId, dayId, venueId, shiftId) => {
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === eventId
        ? {
          ...e,
          days: (e.days || []).map(day => day.id === dayId
            ? {
              ...day,
              venues: day.venues.map(v => v.id === venueId
                ? { ...v, shifts: v.shifts.filter(s => s.id !== shiftId) }
                : v),
            }
            : day),
        }
        : e),
    }));
  }, [setData]);

  // -- Assignments --
  const setAssignment = useCallback((eventId, dayId, venueId, shiftId, role, employeeId) => {
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === eventId
        ? {
          ...e,
          days: (e.days || []).map(day => day.id === dayId
            ? {
              ...day,
              venues: day.venues.map(v => v.id === venueId
                ? {
                  ...v,
                  shifts: v.shifts.map(s => s.id === shiftId
                    ? { ...s, assignments: { ...s.assignments, [role]: employeeId } }
                    : s),
                }
                : v),
            }
            : day),
        }
        : e),
    }));
  }, [setData]);

  const setAssignmentNote = useCallback((eventId, dayId, venueId, shiftId, role, note) => {
    setData(d => ({
      ...d,
      events: d.events.map(e => e.id === eventId
        ? {
          ...e,
          days: (e.days || []).map(day => day.id === dayId
            ? {
              ...day,
              venues: day.venues.map(v => v.id === venueId
                ? {
                  ...v,
                  shifts: v.shifts.map(s => s.id === shiftId
                    ? { ...s, notes: { ...(s.notes || {}), [role]: note } }
                    : s),
                }
                : v),
            }
            : day),
        }
        : e),
    }));
  }, [setData]);

  // -- Relationships (Chemistry/Conflict) --
  const addRelationship = useCallback((emp1Id, emp2Id, type) => {
    setData(d => {
      const exists = (d.relationships || []).some(
        r => (r.emp1 === emp1Id && r.emp2 === emp2Id) || (r.emp1 === emp2Id && r.emp2 === emp1Id)
      );
      if (exists) return d;
      return { ...d, relationships: [...(d.relationships || []), { id: createId(), emp1: emp1Id, emp2: emp2Id, type }] };
    });
  }, [setData]);

  const removeRelationship = useCallback((id) => {
    setData(d => ({ ...d, relationships: (d.relationships || []).filter(r => r.id !== id) }));
  }, [setData]);

  // -- Auto Assign --
  const runAutoAssign = useCallback((eventId, dayId, venueId) => {
    setData(d => {
      const event = d.events.find(e => e.id === eventId);
      const day = (event?.days || []).find(dy => dy.id === dayId);
      const venue = day?.venues.find(v => v.id === venueId);
      if (!venue) return d;
      const crossVenueMap = buildCrossVenueMap(day, venueId);
      const newShifts = autoAssignVenue(venue, d.employees, d.roles, d.events, d.relationships || [], eventId, crossVenueMap);
      return {
        ...d,
        events: d.events.map(e => e.id === eventId
          ? {
            ...e,
            days: (e.days || []).map(dy => dy.id === dayId
              ? {
                ...dy,
                venues: dy.venues.map(v => v.id === venueId
                  ? { ...v, shifts: newShifts }
                  : v),
              }
              : dy),
          }
          : e),
      };
    });
  }, [setData]);

  // -- Export / Import --
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job-assigner-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importData = useCallback((jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.roles && parsed.employees && parsed.events) {
        if (!parsed.relationships) parsed.relationships = [];
        setData(migrateData(parsed));
        return true;
      }
    } catch { /* invalid JSON */ }
    return false;
  }, [setData]);

  const resetData = useCallback(() => {
    setData(getDefaultData());
  }, [setData]);

  const value = {
    data,
    addEmployee, updateEmployee, deleteEmployee,
    addRole, removeRole, renameRole,
    addEvent, updateEvent, deleteEvent,
    addDayToEvent, updateDay, deleteDay,
    addVenueToEvent, updateVenue, deleteVenue,
    addShiftToVenue, updateShift, deleteShift,
    setAssignment, setAssignmentNote,
    addRelationship, removeRelationship,
    runAutoAssign,
    exportData, importData, resetData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
