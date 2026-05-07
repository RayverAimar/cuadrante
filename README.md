# Cuadrante 📋

> Interactive work shift roster — manage guards, vacations, and leaves with real-time rule validation.

**Live demo → [rayveraimar.github.io/cuadrante](https://rayveraimar.github.io/cuadrante/)**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-4-orange?style=flat)
![Deployed](https://img.shields.io/badge/deploy-GitHub%20Pages-222?style=flat&logo=github)

---

## What is it?

Cuadrante is a monthly shift scheduling tool for teams with rotating guards. It handles:

- **Three shift groups** — Morning (06–14h), Afternoon (14–22h), Night (22–06h)
- **Six assignment types** — Shift work, Vacation (V), Leave with pay (L), Day off (D)
- **Real-time rule validation** — violations highlighted directly on cells with tooltips
- **Extensible rules engine** — add a new rule by pushing one object, no other changes needed
- **Full employee management** — add, edit, remove, color-code
- **Persistent state** — auto-saved to `localStorage`, survives page refreshes
- **Print-ready** — sidebar and controls hidden in print view

---

## Screenshots

| Roster grid | Shift picker | Violations panel |
|---|---|---|
| Monthly table grouped by shift | Click any cell to assign | Real-time error/warning list |

---

## Stack

| Layer | Tech |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| State | Zustand 4 (with `persist` middleware) |
| UI primitives | Headless UI 2 (dialogs, popovers, transitions) |
| Icons | Lucide React |
| Deploy | GitHub Pages via GitHub Actions |

---

## Getting started

```bash
git clone https://github.com/RayverAimar/cuadrante.git
cd cuadrante
npm install
npm run dev
```

Open [http://localhost:5173/cuadrante/](http://localhost:5173/cuadrante/)

---

## Adding a new rule

Rules live in `src/rules/index.ts`. Add an object to `DEFAULT_RULES` — the UI picks it up automatically:

```typescript
{
  id: 'my_new_rule',
  name: 'Rule display name',
  description: 'Shown in the Rules modal.',
  enabled: true,
  params: { maxValue: 3 },
  paramDefs: [{ key: 'maxValue', label: 'Maximum allowed', min: 1, max: 30 }],
  validate({ employees, getAssignment, daysInMonth }): RuleViolation[] {
    // return [] if no violations, or RuleViolation[] with level, message, employeeId, days
    return []
  },
}
```

No registration required. The Rules modal, violation panel, and cell highlighting all react automatically.

---

## Project structure

```
src/
├── rules/index.ts          # Rules engine + all default rules
├── store/useRosterStore.ts # Zustand store (state + all actions)
├── types/index.ts          # Shared TypeScript types
├── constants/shifts.ts     # Shift definitions, colors, labels
├── components/
│   ├── RosterGrid.tsx      # Main monthly table
│   ├── ShiftPicker.tsx     # Cell click → shift popover
│   ├── ViolationsPanel.tsx # Right sidebar
│   ├── Header.tsx          # Nav + month picker + legend
│   ├── modals/             # Employee, Rules, Help modals
│   └── ui/                 # Modal, Tooltip, Toggle, Badge
└── data/seed.ts            # Demo data for first load
```

---

## License

MIT
