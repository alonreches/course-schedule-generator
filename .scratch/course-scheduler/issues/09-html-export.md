# 09: HTML export

**What to build:** Export the full schedule to a self-contained static HTML file that coordinators can share with instructors or print. The exported file needs no JavaScript and renders the Night-shift colour coding via inline CSS. A non-blocking warning is shown if any circuit-day has blank instructor or simulator cells.

**Blocked by:** 06 — In-app cell editing

**Status:** ready-for-agent

- [ ] File → Export HTML opens an Electron save dialog and writes a `.html` file
- [ ] The HTML file is self-contained (no external CSS or JS dependencies)
- [ ] Layout matches the in-app week-tab view: one section per week, days stacked vertically, circuits as columns, slots 1–6 per day-group
- [ ] Each slot row shows student name and run/assessment name
- [ ] Each circuit-day block shows instructor, simulator, shift (Day/Night), and notes
- [ ] Night-shift circuit-day blocks use an inline CSS background colour identical to the in-app colour
- [ ] If any circuit-day has a blank instructor or simulator, a warning banner is displayed in the app before the export dialog opens, listing the affected days; the coordinator can dismiss and proceed
- [ ] The exported HTML renders correctly when opened in a modern browser (Chrome, Edge, Firefox)
- [ ] `projectStore` HTML export test: generate a minimal schedule, export to HTML, parse the output, assert expected student and run names appear in the correct positions
