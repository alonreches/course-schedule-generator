---
Status: ready-for-agent
---

# Course Scheduler — Spec

## Problem Statement

Course coordinators who run simulation-based training courses (e.g. BSP, ASP) must manually build complex weekly schedules that assign students to simulation runs and assessments, divide them into small training groups (circuits), rotate instructors and simulators across those groups, and ensure every student advances through the curriculum at the same pace and gets equal opportunity to practice in different slot positions and shifts. Doing this by hand in a spreadsheet is error-prone and time-consuming, especially when the student count does not divide evenly, when makeup runs carry over across weeks, or when staffing changes at the last minute.

## Solution

A standalone desktop application (Electron + React, delivered as a portable Windows folder) that:

1. Stores reusable **course templates** defining the ordered curriculum (named runs and assessments) for a course type.
2. Lets a coordinator create a **course** by picking a template and entering student count, dates, and days off.
3. **Auto-generates** a full course schedule: divides students into circuits, assigns runs to slots, balances slot positions and night/day shifts across students, fills leftover slots with "Spare Run," and carries overflow to the next week.
4. Presents the schedule as an **editable week-tab grid** where any cell can be overridden and instructors/simulators are assigned via dropdowns.
5. Exports the final schedule to HTML and saves/loads the working state as a JSON project file.
6. Provides a **Stats tab** showing per-student and per-instructor fairness metrics.

## User Stories

1. As a coordinator, I want to create a named course template with an ordered list of runs and assessments, so that I do not have to re-enter curriculum details for every course.
2. As a coordinator, I want to add runs to a template by specifying a prefix and count (e.g. "BSP", 10 → BSP-01 through BSP-10), so that I can populate a long curriculum quickly.
3. As a coordinator, I want to reorder template items by dragging and dropping, so that I can place assessments at the right point in the curriculum without re-typing everything.
4. As a coordinator, I want to export a template to a JSON file and import it on another machine, so that I can share templates with other coordinators.
5. As a coordinator, I want to create a new course by picking a template, entering a course name, student count or names, start/end dates, and any extra days off, so that the scheduler has everything it needs to generate a schedule.
6. As a coordinator, I want student names to be optional (defaulting to S1, S2, S3…), so that I can generate a schedule before the final student list is confirmed.
7. As a coordinator, I want Saturday and Sunday to be excluded from the schedule by default, with the option to mark additional dates as days off, so that the schedule respects non-training days automatically.
8. As a coordinator, I want the app to automatically divide students into circuits of 3 or 4 (or 5 when unavoidable), so that I do not have to compute group sizes manually.
9. As a coordinator, I want circuits to be randomly reshuffled each week, so that students train with different peers across the course.
10. As a coordinator, I want all circuits to complete the same set of runs and assessments by the end of each week, so that students advance through the curriculum at the same pace.
11. As a coordinator, I want any runs a circuit did not complete in a given week to be automatically scheduled at the start of the following week, so that no student falls permanently behind.
12. As a coordinator, I want each day to be designated as either a run day or an assessment day (based on what comes next in the curriculum), so that the day's 6 slots are used consistently.
13. As a coordinator, I want to override the proposed day type (run vs assessment) for any circuit on any day, so that I can accommodate real-world scheduling constraints.
14. As a coordinator, I want leftover slots (when the curriculum runs out before 6 slots are filled) to be labelled "Spare Run," so that instructors know the slot is unplanned practice.
15. As a coordinator, I want the scheduler to rotate students through slot positions (1st, 2nd, 3rd…) as fairly as possible across the course, so that no student always goes first or last.
16. As a coordinator, I want to see the generated schedule in a week-by-week tab view, so that I can review one week at a time.
17. As a coordinator, I want each week tab to show days stacked vertically and circuits as columns, with slots 1–6 listed within each day-group, so that I can read the full week at a glance.
18. As a coordinator, I want to assign an instructor and a simulator to each circuit-day from dropdown lists, so that staffing is recorded in the same document as the schedule.
19. As a coordinator, I want to toggle each circuit-day between Day shift and Night shift (defaulting to Day), so that shift type is visible in the schedule.
20. As a coordinator, I want the Night shift rows to appear in a distinct colour, so that I can immediately spot night-shift circuits when reviewing the schedule.
21. As a coordinator, I want each circuit-day to have a free-text notes field, so that I can record room changes, special instructions, or other day-specific information.
22. As a coordinator, I want to edit any cell in the generated schedule (student, run name, instructor, simulator, shift toggle, notes), so that I can correct exceptions without regenerating the entire schedule.
23. As a coordinator, I want the app to warn me (but not block me) when I export with blank instructor or simulator cells, so that I know what is missing without being prevented from sharing the schedule.
24. As a coordinator, I want to save the working schedule as a JSON project file and reload it later, so that I can continue editing across sessions.
25. As a coordinator, I want to export the schedule as an HTML file, so that I can share it with instructors who do not have the app.
26. As a coordinator, I want the HTML export to include the Night shift colour coding, so that the printed/shared version matches what I see in the app.
27. As a coordinator, I want a Stats tab that shows, for each student, how many times they occupied each slot position (1st, 2nd, 3rd…) and how many Day vs Night shifts they have been assigned, so that I can verify the schedule is fair before finalising it.
28. As a coordinator, I want the Stats tab to also show how many circuit-days each instructor has been assigned, so that I can check instructor workload balance.
29. As a coordinator, I want to manage a small library of named templates (up to ~5) in a dedicated Templates screen inside the app, so that templates are always at hand without needing a separate file manager.
30. As a coordinator, I want to open a new course, open an existing project file, or save the current project from a standard File menu, so that the app behaves like a familiar document editor.

## Implementation Decisions

### Module boundaries

- **`scheduleGenerator(inputs: ScheduleInputs): CourseSchedule`** — a pure function with no side effects. All scheduling logic lives here. Accepts template, student list, course dates, and days-off list; returns a fully populated schedule. The React UI and file I/O layers never contain scheduling logic.
- **`templateStore`** — in-memory + persisted store for the template library. Handles create, read, update, delete, export-to-JSON, import-from-JSON. Persisted to a well-known path inside the app's user-data directory (Electron `app.getPath('userData')`).
- **`projectStore`** — load/save course project JSON files; export HTML. Provides the document lifecycle (new, open, save, save-as).
- **React UI** — thin shell that reads from and writes to the above stores. No business logic in components.

### Data shapes (key types, not exhaustive)

```
TemplateItem = { id, type: 'run' | 'assessment', name: string }
Template = { id, name, items: TemplateItem[] }

Student = { id, name: string }           // name defaults to "S1", "S2"…
Circuit = { label: string, students: Student[] }

SlotAssignment = {
  slot: 1..6,
  student: Student,
  itemName: string                       // run/assessment name or "Spare Run"
}

CircuitDay = {
  circuit: Circuit,
  instructor: string | null,
  simulator: string | null,
  shift: 'day' | 'night',
  notes: string,
  dayType: 'run' | 'assessment',
  slots: SlotAssignment[]
}

CourseDay = { date: Date, circuits: CircuitDay[] }
CourseWeek = { weekNumber: number, days: CourseDay[] }
CourseSchedule = { weeks: CourseWeek[] }
```

### Scheduling algorithm (inside `scheduleGenerator`)

1. **Circuit formation**: divide the student list into groups of 3 or 4. Prefer groups of 4 first; top up with 3s. Allow a group of 5 only when the count mod makes it unavoidable (e.g. n=5).
2. **Weekly circuit shuffle**: at the start of each week, randomly reassign students to circuit slots. Circuit labels (A, B, C…) are cosmetic and re-generated sequentially each week.
3. **Weekly curriculum allocation**: divide the full template item list evenly across the number of course weeks by available slot capacity (constrained by the largest circuit size for that week, so all circuits can complete the batch).
4. **Day-type assignment**: scan the week's pending items in sequence; when the next item is an assessment, that day is an assessment day; otherwise it is a run day.
5. **Slot assignment**: for each circuit-day, fill slots by iterating through pending items. Each item is assigned once per student in the circuit. Student order within an item rotates to balance slot positions across the course (track a per-student position-history counter; always assign the student with the lowest count for the target position).
6. **Spare run filling**: when all week items are exhausted before 6 slots are filled, remaining slots are labelled "Spare Run."
7. **Carry-over**: items not completed by end of the week are prepended to the next week's pending list.

### Instructor/simulator assignment

Generated with all cells blank. Coordinator fills them in using dropdowns (populated from the global instructor and simulator lists, which are stored in `templateStore` as app-level config, not per-template).

### Night/Day shift

Stored per `CircuitDay`. Defaults to `'day'`. The Stats tab aggregates shift counts from `CircuitDay.shift` values across the course.

### Template item entry

Group entry only (prefix + count). The generated items (BSP-01 … BSP-10) are stored as individual `TemplateItem` records and can be individually renamed after creation.

### Save formats

- **Project JSON**: full `CourseSchedule` plus course metadata (student list, dates, days-off, template snapshot). Loaded back into the app for continued editing.
- **HTML export**: renders the week-tab view as a static HTML table; night-shift rows use inline CSS background colour. No JavaScript in the export.
- **Template JSON**: a single `Template` object; imported/exported from the Templates screen.

### Validation on export

If any `CircuitDay` has `instructor === null` or `simulator === null`, the app shows a non-blocking warning banner listing the affected days before proceeding with the export.

### No regeneration

Once a schedule is generated it is edited in place. If the coordinator needs a fresh schedule from different inputs, they create a new course (File → New).

## Testing Decisions

### What makes a good test

Test the external contract of each module, not its internal data structures or helper functions. A good test specifies inputs, invokes the public API, and asserts observable properties of the output — never reaching into private state.

### Primary seam: `scheduleGenerator`

This is where all the complexity lives and where tests have the highest leverage. Test it as a pure function:

- **Completeness**: every student appears in every curriculum item's slot assignments exactly the correct number of times across the full schedule.
- **Slot position fairness**: across the course, the maximum difference in any slot-position count between any two students is ≤ 1.
- **Weekly synchronisation**: by the end of each week, every circuit has the same set of items in its completed slots (excluding spare runs).
- **Carry-over correctness**: items not completed in week N appear at the start of week N+1 before any new week-N+1 items.
- **Spare run placement**: spare-run slots only appear after all week items are exhausted.
- **Circuit sizing**: no circuit has fewer than 3 students (except when total student count < 3) or more than 5.
- **Day-type consistency**: all slots in a given `CircuitDay` carry the same item type (run or assessment).

No mocks needed — the function is pure.

### Secondary seams

- **`templateStore`**: round-trip tests (create → export JSON → import → assert equal); CRUD invariants.
- **`projectStore`**: round-trip tests (generate schedule → save JSON → load JSON → assert equal); HTML export produces valid HTML with expected cell content.

### Prior art

No existing codebase — these are the first tests in the project. The scheduler tests should be placed in a `__tests__/scheduleGenerator` directory and written in Vitest (consistent with the React + Vite stack typical for Electron + React projects).

## Out of Scope

- Absence tracking: the app does not model individual student absences. Carry-over is driven by slot-count overflow only.
- Automated instructor/simulator rotation: assignment is always manual.
- Multiple courses open simultaneously: one project at a time.
- Bulk-fill for instructor/simulator cells.
- Mobile or web deployment: desktop/Electron only.
- User accounts or cloud sync.
- PDF export (HTML can be printed to PDF from the browser).
- Re-generation after inputs change: coordinators edit in place or create a new course.
- Enforcement of night/day shift balance: the Stats tab surfaces imbalance but the scheduler does not attempt to balance shifts automatically.

## Further Notes

- The app is distributed as a portable Windows folder (no installer). Electron's `app.getPath('userData')` stores templates and app config.
- The instructor and simulator lists are app-level config (not per-template) and persist across projects.
- Circuit labels (A, B, C…) are purely cosmetic and reset each week; they do not track physical rooms or recurring groups.
- "Spare Run" is a display label only; it carries no curriculum meaning and is not counted in student progress tracking.
- The Stats tab reads directly from the schedule data structure; it is a derived view, not a separate data store.
