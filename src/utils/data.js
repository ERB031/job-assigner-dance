export const DEFAULT_ROLES = [
  'FOH Lead/Supervisor',
  'Audio',
  'Lighting',
  'V-Wall',
  'Switch Op',
  'Cam Op',
  'Backstage Hand',
];

export function createId() {
  return Math.random().toString(36).substring(2, 10);
}

export function createShift(label, startTime, endTime) {
  return {
    id: createId(),
    label,
    startTime,
    endTime,
    assignments: {},
  };
}

export function createVenue(name, color) {
  return {
    id: createId(),
    name,
    color,
    notes: '',
    shifts: [
      createShift('Shift 1', '6:00am', '10:30am'),
      createShift('Shift 2', '10:30am', '2:30pm'),
      createShift('Shift 3', '2:30pm', '6:30pm'),
      createShift('Shift 4', '6:30pm', 'End of Awards'),
    ],
  };
}

export function createDay(label) {
  return {
    id: createId(),
    label,
    venues: [
      createVenue('ZENITH Stage', '#FFE900'),
      createVenue('NOVA Stage', '#FF9800'),
    ],
  };
}

export function createEvent(name) {
  return {
    id: createId(),
    name,
    days: [
      createDay('Day 1'),
    ],
  };
}

const EMPLOYEE_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
  '#00BCD4', '#E91E63', '#8BC34A', '#FF5722', '#3F51B5',
  '#009688', '#FFC107', '#673AB7', '#CDDC39', '#795548',
];

let colorIndex = 0;

export function createEmployee(name, qualifiedRoles, color) {
  return {
    id: createId(),
    name,
    qualifiedRoles: qualifiedRoles || [],
    color: color || EMPLOYEE_COLORS[colorIndex++ % EMPLOYEE_COLORS.length],
    active: true,
    shiftPreferences: {},   // { shiftLabel: 'prefer' | 'avoid' }
    eventExclusions: [],    // event IDs this employee is excluded from
  };
}

/**
 * Migrate old data format (event.venues) to new format (event.days[].venues).
 */
export function migrateData(data) {
  if (!data || !data.events) return data;
  let migrated = false;
  const events = data.events.map(event => {
    if (event.days) return event; // already migrated
    migrated = true;
    return {
      ...event,
      days: [{
        id: createId(),
        label: 'Day 1',
        venues: event.venues || [],
      }],
    };
  });
  // Clean up old venues key from migrated events
  if (migrated) {
    return {
      ...data,
      relationships: data.relationships || [],
      events: events.map(e => {
        const { venues, ...rest } = e;
        return rest.days ? rest : e;
      }),
    };
  }
  return data;
}

export function getDefaultData() {
  return {
    roles: [...DEFAULT_ROLES],
    relationships: [],
    employees: [
      createEmployee('Nick', ['FOH Lead/Supervisor', 'Audio', 'Lighting', 'Switch Op']),
      createEmployee('Zion', ['Audio', 'Lighting', 'V-Wall']),
      createEmployee('Ruby', ['Lighting', 'V-Wall', 'Switch Op']),
      createEmployee('Mishelle', ['V-Wall', 'Lighting']),
      createEmployee('Don', ['Switch Op', 'Cam Op']),
      createEmployee('Ethan Beller', ['Cam Op', 'Switch Op']),
      createEmployee('Caleb', ['Backstage Hand', 'Cam Op']),
      createEmployee('Riley', ['FOH Lead/Supervisor', 'Audio']),
      createEmployee('Nik H', ['Audio', 'Lighting']),
      createEmployee('Tyler Warren', ['Lighting', 'V-Wall']),
      createEmployee('Kanye', ['V-Wall', 'Switch Op']),
      createEmployee('Andy', ['FOH Lead/Supervisor', 'Switch Op']),
      createEmployee('Joan', ['Cam Op', 'Switch Op']),
      createEmployee('Hasaan', ['Backstage Hand', 'Cam Op']),
      createEmployee('Kam', ['FOH Lead/Supervisor', 'Audio']),
      createEmployee('Justin', ['Audio', 'Lighting']),
      createEmployee('Will', ['Lighting', 'V-Wall']),
      createEmployee('Christian', ['V-Wall', 'Switch Op']),
      createEmployee('Nate', ['V-Wall', 'Lighting']),
      createEmployee('Jordan', ['Switch Op', 'Cam Op']),
      createEmployee('Allan Tan', ['Cam Op', 'Switch Op']),
      createEmployee('Chuck', ['Switch Op', 'Cam Op']),
      createEmployee('Owen', ['Audio', 'Lighting']),
      createEmployee('Tyler Franklin', ['Lighting', 'V-Wall']),
      createEmployee('Lorenzo', ['Cam Op', 'Backstage Hand']),
      createEmployee('Terrence', ['Cam Op', 'Backstage Hand']),
    ],
    events: [createEvent('Cleveland, OH II: Saturday 3/21')],
  };
}
