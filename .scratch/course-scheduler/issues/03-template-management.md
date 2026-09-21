# 03: Template management

**What to build:** A Templates screen where coordinators create, edit, and manage named course templates. Templates are persisted across sessions and can be exported and imported as JSON files for sharing. The same screen also manages the app-level instructor and simulator lists used across all courses.

**Blocked by:** 01 — Project scaffold, 02 — `scheduleGenerator` (for shared types)

**Status:** ready-for-agent

- [ ] `templateStore` module: in-memory store backed by a JSON file in Electron's `userData` directory; survives app restarts
- [ ] Templates screen is accessible from the tab bar or app menu
- [ ] Coordinator can create a new named template
- [ ] Coordinator can add curriculum items via group entry: specify a prefix (e.g. "BSP") and a count (e.g. 10); the store generates BSP-01 through BSP-10 as individual `TemplateItem` records
- [ ] Coordinator can rename any individual item after group entry
- [ ] Coordinator can reorder items by drag-and-drop; the order is persisted
- [ ] Coordinator can delete a template
- [ ] Coordinator can duplicate an existing template
- [ ] App-level instructor list: add, rename, and remove instructors; persisted in `userData`
- [ ] App-level simulator list: add, rename, and remove simulators; persisted in `userData`
- [ ] `templateStore` round-trip test: create → persist → reload app → template is intact
- [ ] Template import/export is out of scope here (covered in ticket 10)
