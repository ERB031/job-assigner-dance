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
      createShift('Shift 1', '7:30am', '11:30am'),
      createShift('Shift 2', '11:30am', '3:30pm'),
      createShift('Shift 3', '3:30pm', '7:30pm'),
      createShift('Shift 4', '7:30pm', 'Awards Complete'),
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
  // Create employees with stable IDs for pre-populated assignments
  const employees = [
    createEmployee('Nick', ['FOH Lead/Supervisor']),
    createEmployee('Riley', ['FOH Lead/Supervisor', 'Audio']),
    createEmployee('Zion', ['Audio']),
    createEmployee('Tyler Franklin', ['Lighting']),
    createEmployee('Nick Reno', ['Lighting']),
    createEmployee('Tyler Warren', ['V-Wall']),
    createEmployee('Christian', ['V-Wall']),
    createEmployee('Chuck', ['Switch Op']),
    createEmployee('Joan', ['Switch Op']),
    createEmployee('Don', ['Switch Op']),
    createEmployee('Ethan Beller', ['Cam Op']),
    createEmployee('Jordan', ['Cam Op']),
    createEmployee('Nicole', ['Lighting']),
    createEmployee('Lorenzo', ['Cam Op']),
    createEmployee('Hassan', ['Backstage Hand']),
    createEmployee('Kanye', ['Switch Op', 'Backstage Hand']),
    createEmployee('Andy', ['FOH Lead/Supervisor', 'V-Wall']),
    createEmployee('Kam', ['FOH Lead/Supervisor']),
    createEmployee('Justin', ['Audio']),
    createEmployee('Owen', ['Audio']),
    createEmployee('Ruby', ['Lighting']),
    createEmployee('Nate Deason', ['V-Wall']),
    createEmployee('Allan', ['Cam Op']),
    createEmployee('Caleb', ['Backstage Hand']),
  ];

  // Build ID lookup
  const empId = (name) => employees.find(e => e.name === name).id;

  // -- ZENITH Stage --
  const zenithShifts = [
    { ...createShift('Shift 1', '7:30am', '11:30am'), assignments: {
      'FOH Lead/Supervisor': empId('Nick'), 'Audio': empId('Riley'), 'Lighting': empId('Tyler Franklin'),
      'V-Wall': empId('Tyler Warren'), 'Switch Op': empId('Chuck'), 'Cam Op': empId('Ethan Beller'), 'Backstage Hand': 'N/A',
    }},
    { ...createShift('Shift 2', '11:30am', '3:30pm'), assignments: {
      'FOH Lead/Supervisor': empId('Nick'), 'Audio': empId('Zion'), 'Lighting': empId('Nick Reno'),
      'V-Wall': empId('Christian'), 'Switch Op': empId('Joan'), 'Cam Op': empId('Jordan'), 'Backstage Hand': empId('Hassan'),
    }, notes: { 'Cam Op': 'Nicole Shadow' }},
    { ...createShift('Shift 3', '3:30pm', '7:30pm'), assignments: {
      'FOH Lead/Supervisor': empId('Nick'), 'Audio': empId('Riley'), 'Lighting': empId('Tyler Franklin'),
      'V-Wall': empId('Tyler Warren'), 'Switch Op': empId('Don'), 'Cam Op': empId('Lorenzo'), 'Backstage Hand': empId('Hassan'),
    }},
    { ...createShift('Shift 4', '7:30pm', 'Awards Complete'), assignments: {
      'FOH Lead/Supervisor': empId('Riley'), 'Audio': empId('Zion'), 'Lighting': empId('Nick Reno'),
      'V-Wall': empId('Christian'), 'Switch Op': empId('Joan'), 'Cam Op': empId('Ethan Beller'), 'Backstage Hand': empId('Kanye'),
    }},
  ];

  const zenith = {
    id: createId(), name: 'ZENITH Stage', color: '#FFE900',
    notes: 'Doors Open 7:45am EST\nAwards 4:27pm EST\nAwards 10:03pm EST\nFinal Awards Complete~ 11:00pm EST',
    shifts: zenithShifts,
  };

  // -- NOVA Stage --
  const novaShifts = [
    { ...createShift('Shift 1', '8:00am', '1:00pm'), assignments: {
      'FOH Lead/Supervisor': empId('Andy'), 'Audio': empId('Justin'), 'Lighting': empId('Ruby'),
      'V-Wall': empId('Nate Deason'), 'Switch Op': empId('Kanye'), 'Cam Op': empId('Jordan'), 'Backstage Hand': 'N/A',
    }},
    { ...createShift('Shift 2', '1:00pm', '6:00pm'), assignments: {
      'FOH Lead/Supervisor': empId('Kam'), 'Audio': empId('Owen'), 'Lighting': empId('Nicole'),
      'V-Wall': empId('Andy'), 'Switch Op': empId('Don'), 'Cam Op': empId('Allan'), 'Backstage Hand': empId('Caleb'),
    }, notes: { 'Lighting': 'train Kam/Andy' }},
    { ...createShift('Shift 3', '6:00pm', 'Awards Complete'), assignments: {
      'FOH Lead/Supervisor': empId('Kam'), 'Audio': empId('Justin'), 'Lighting': empId('Ruby'),
      'V-Wall': empId('Nate Deason'), 'Switch Op': empId('Chuck'), 'Cam Op': empId('Jordan'), 'Backstage Hand': empId('Caleb'),
    }},
  ];

  const nova = {
    id: createId(), name: 'NOVA Stage', color: '#FF9800',
    notes: 'Doors open - 8:40AM\nMasterclass - 8:50am\nMasterclass - 9:35am\nMasterclass - 10:25am\nAwards - 3:37pm\nAwards- 9:38pm',
    shifts: novaShifts,
  };

  const day = { id: createId(), label: 'Friday 3/27', venues: [zenith, nova] };
  const event = { id: createId(), name: 'Long Island, NY Friday 3/27', days: [day] };

  return {
    roles: [...DEFAULT_ROLES],
    relationships: [],
    employees,
    events: [event],
  };
}
