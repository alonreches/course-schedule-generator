# 05: Schedule week-tab view

**What to build:** The main schedule screen. After course setup completes, `scheduleGenerator` is called and the result is displayed as a week-tab grid. Each tab covers one course week. The grid is read-only at this stage; full editing comes in ticket 06.

**Blocked by:** 02 — `scheduleGenerator`, 04 — Course setup

**Status:** ready-for-agent

- [ ] After the course setup wizard completes, `scheduleGenerator` is called with the course config and the resulting `CourseSchedule` is stored in app state
- [ ] The main screen shows one tab per course week in the tab bar
- [ ] Within each week tab: course days are stacked vertically as row groups (Mon–Fri, skipping days off); circuits are columns
- [ ] Within each day-group × circuit cell: slots 1–6 are listed; each slot shows the assigned student name and run/assessment name (or "Spare Run")
- [ ] Each circuit-day block shows a Day/Night shift toggle, defaulting to Day
- [ ] Night-shift circuit-day blocks render with a visually distinct background colour
- [ ] Each circuit-day block shows an instructor dropdown (blank, populated from the app-level instructor list)
- [ ] Each circuit-day block shows a simulator dropdown (blank, populated from the app-level simulator list)
- [ ] Each circuit-day block has a free-text notes field (blank by default)
- [ ] The circuit label (A, B, C…) is displayed in the column header for each circuit
- [ ] The day type (Run / Assessment) is displayed in each day-group header
