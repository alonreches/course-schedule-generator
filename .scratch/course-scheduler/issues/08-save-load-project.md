# 08: Save / load project JSON

**What to build:** Full document lifecycle for a course project. Coordinators can save their schedule (including all edits) to a JSON file on disk and reload it later to continue editing. The File menu is wired up to real Electron dialog boxes.

**Blocked by:** 06 — In-app cell editing

**Status:** ready-for-agent

- [ ] File → Save opens an Electron save dialog; writes the full `CourseSchedule` plus course metadata (student list, dates, days-off list, template snapshot) to a JSON file
- [ ] File → Save As always prompts for a new file location
- [ ] File → Open opens an Electron open dialog; reads a project JSON file and restores the full editable schedule in app state
- [ ] File → New prompts the coordinator to save unsaved changes (if any) before clearing state and opening the course setup wizard
- [ ] The title bar shows the current project filename and a dirty indicator (e.g. an asterisk) when there are unsaved changes
- [ ] `projectStore` round-trip test: generate a schedule, save to JSON, reload JSON, assert the restored schedule is equal to the saved one
- [ ] Unsaved changes are detected when any in-memory field differs from the last-saved state
