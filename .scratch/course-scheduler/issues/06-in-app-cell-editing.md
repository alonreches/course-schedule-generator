# 06: In-app cell editing

**What to build:** Make every field in the week-tab schedule view editable. Coordinators can correct any generated value — student assignments, run names, day type, instructor, simulator, shift, and notes — directly in the table. All changes update the in-memory schedule immediately.

**Blocked by:** 05 — Schedule week-tab view

**Status:** ready-for-agent

- [ ] Student name in a slot is editable (free text or dropdown of students on the course)
- [ ] Run/assessment name in a slot is editable (free text)
- [ ] Day type per circuit-day can be toggled between Run and Assessment, overriding the generated value
- [ ] Instructor dropdown is interactive: coordinator selects from the app-level instructor list or types a custom value
- [ ] Simulator dropdown is interactive: coordinator selects from the app-level simulator list or types a custom value
- [ ] Day/Night shift toggle is interactive; toggling updates the colour of the circuit-day block immediately
- [ ] Notes field is a free-text input; changes persist in app state
- [ ] All edits update the in-memory `CourseSchedule` in place (no regeneration)
- [ ] Edited values are visually distinguishable from generated values (e.g. a subtle indicator on edited cells)
