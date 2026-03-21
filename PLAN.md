# Employee Role Assignment App — Implementation Plan

## Overview
A responsive React + Vite single-page app that auto-assigns employees to roles across events, venues, and shifts. Data persists in LocalStorage. Supports drag-and-drop reassignment and works on both phone and desktop.

---

## Data Model

### Employee
```
{
  id: string,
  name: string,
  qualifiedRoles: string[]   // e.g. ["Audio", "Lighting", "V-Wall"]
}
```

### Role (fixed set, user can customize)
Default roles: `FOH Lead/Supervisor`, `Audio`, `Lighting`, `V-Wall`, `Switch Op`, `Cam Op`, `Backstage Hand`

### Shift
```
{
  id: string,
  label: string,            // e.g. "Shift 1"
  startTime: string,        // e.g. "6:00am"
  endTime: string,          // e.g. "10:30am"
  assignments: { [role]: employeeId | "N/A" | null }
}
```

### Venue/Stage
```
{
  id: string,
  name: string,             // e.g. "Main Stage"
  color: string,            // hex color for visual grouping
  shifts: Shift[]
}
```

### Event
```
{
  id: string,
  name: string,             // e.g. "Cleveland"
  venues: Venue[]
}
```

---

## Features & Components

### 1. App Shell & Navigation
- Top bar with app title and hamburger menu on mobile
- Sidebar (collapsible on mobile) with: Events list, Employee Manager, Roles Manager
- Main content area shows the selected event's schedule

### 2. Event Manager
- Create/rename/delete events
- Select an event to view its schedule

### 3. Venue/Stage Manager (within an event)
- Add/remove venues with name and color picker
- Venues display as color-coded sections (matching the spreadsheet look)

### 4. Shift Manager (within a venue)
- Add/remove shifts within a venue
- Edit shift label, start time, and end time via inline editing
- Configurable number of shifts per venue

### 5. Schedule Grid (main view)
- Mirrors the spreadsheet layout from the image:
  - Event name header
  - For each venue: colored header → shift columns → role rows
  - Each cell shows the assigned employee name
- **Drag and drop**: drag an employee name from one cell to another to reassign
- **Click cell**: dropdown to pick a different employee or set N/A
- Responsive: on mobile, shifts stack vertically instead of side-by-side

### 6. Employee Manager (panel/page)
- Add new employees with name + qualified roles (multi-select checkboxes)
- Edit/delete existing employees
- List view with search/filter

### 7. Auto-Assign Engine
- **Round-robin** algorithm:
  1. For each shift, for each role, find qualified & unassigned employees
  2. Pick the employee with the fewest total assignments (round-robin fairness)
  3. Assign them; if no one is available, leave cell empty
- "Auto-Assign" button per venue, per event, or for all
- Respects constraint: one employee → one shift only (within a venue)

### 8. Drag & Drop
- Use `@dnd-kit/core` + `@dnd-kit/sortable` (lightweight, accessible, mobile-friendly)
- Drag employee names between role cells within the same shift or across shifts
- Visual feedback: highlight valid drop targets, show ghost preview

### 9. Persistence
- All state saved to LocalStorage on every change (debounced)
- Load from LocalStorage on app startup
- Export/import JSON for backup

---

## Tech Stack & Dependencies
- **React 18** + **Vite** (scaffolding)
- **@dnd-kit/core** + **@dnd-kit/sortable** — drag and drop
- **CSS Modules** or plain CSS — styling (no heavy UI library to keep it light)
- No backend — LocalStorage only

---

## File Structure
```
src/
  components/
    App.jsx                 — App shell, layout, routing state
    Sidebar.jsx             — Navigation sidebar (collapsible on mobile)
    EventView.jsx           — Main schedule grid for selected event
    VenueSection.jsx        — Color-coded venue block with shifts
    ShiftColumn.jsx         — Single shift's role assignments
    RoleCell.jsx            — Draggable/droppable cell for one role assignment
    EmployeeManager.jsx     — CRUD panel for employees
    RolesManager.jsx        — CRUD panel for customizing roles list
    ShiftEditor.jsx         — Add/edit/remove shifts (times)
    AutoAssignButton.jsx    — Triggers auto-assign logic
  hooks/
    useLocalStorage.js      — Hook for persisting state
  utils/
    autoAssign.js           — Round-robin assignment algorithm
    data.js                 — Default data / seed data
  styles/
    global.css              — Base styles, responsive breakpoints
    variables.css           — CSS custom properties (colors, spacing)
  main.jsx                  — Entry point
index.html
```

---

## Implementation Steps

### Step 1: Project Scaffolding
- Init Vite + React project
- Set up file structure
- Add @dnd-kit dependencies
- Create CSS variables and base responsive styles

### Step 2: Data Layer & LocalStorage
- Implement useLocalStorage hook
- Define default seed data (sample event, venues, shifts, employees, roles)
- Create React context for global state management

### Step 3: Employee Manager
- Add/edit/delete employees
- Multi-select checkboxes for qualified roles
- Search/filter

### Step 4: Roles Manager
- View/add/remove/rename roles from the default list

### Step 5: Event & Venue Management
- Create/select/delete events
- Add/remove venues with name + color

### Step 6: Shift Management
- Add/remove shifts within venues
- Edit shift times (start/end) with time pickers
- Edit shift labels

### Step 7: Schedule Grid
- Build the main grid layout matching the spreadsheet style
- Render venues as color-coded sections
- Render shifts as columns with role rows
- Click-to-edit cells with employee dropdown

### Step 8: Auto-Assign Engine
- Implement round-robin algorithm in utils/autoAssign.js
- Wire up Auto-Assign buttons (per venue and per event)
- Respect qualifications + one-shift-per-employee constraint

### Step 9: Drag & Drop
- Integrate @dnd-kit for role cells
- Drag employees between cells
- Mobile touch support (built into @dnd-kit)
- Validation: only allow drops for qualified employees

### Step 10: Responsive Polish
- Mobile: sidebar collapses to hamburger, shifts stack vertically
- Touch-friendly tap targets (min 44px)
- Test at 320px, 768px, 1024px+ breakpoints

### Step 11: Export/Import
- JSON export button (downloads file)
- JSON import button (file picker)

---

## Responsive Strategy
- **Desktop (≥1024px)**: Sidebar visible, shifts side-by-side in columns
- **Tablet (768-1023px)**: Sidebar collapsible, shifts 2-per-row
- **Mobile (<768px)**: Hamburger menu, shifts stack vertically, full-width cards
- All interactive elements ≥44px touch targets
- @dnd-kit provides built-in touch/pointer support
