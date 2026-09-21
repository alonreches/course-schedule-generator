# 02: `scheduleGenerator` — core types, pure function, and tests

**What to build:** The heart of the application: a pure TypeScript function `scheduleGenerator(inputs: ScheduleInputs): CourseSchedule` with no side effects, no UI, and no file I/O. All scheduling logic lives here. Ship it with a full Vitest test suite that verifies the scheduling rules as a black box.

**Blocked by:** 01 — Project scaffold

**Status:** ready-for-agent

- [ ] All core domain types are defined and exported: `TemplateItem`, `Template`, `Student`, `Circuit`, `SlotAssignment`, `CircuitDay`, `CourseDay`, `CourseWeek`, `CourseSchedule`, `ScheduleInputs`
- [ ] `scheduleGenerator` accepts a `ScheduleInputs` object (template, student list, course dates, days-off list) and returns a `CourseSchedule`
- [ ] Circuit formation: students are grouped into circuits of 3 or 4; groups of 5 only when unavoidable (e.g. n=5); no circuit smaller than 3
- [ ] Circuits are randomly reshuffled each week; labels (A, B, C…) are re-assigned sequentially and cosmetically each week
- [ ] Weekly curriculum allocation: the template's ordered item list is divided evenly across course weeks based on available slot capacity
- [ ] Day-type assignment: when the next pending item is an assessment, that `CourseDay` is typed `'assessment'`; otherwise `'run'`; all slots in a day share the same type
- [ ] Slot assignment: each curriculum item is assigned once per student in the circuit; student order rotates to balance slot-position counts (the student with the fewest appearances in the target position goes first)
- [ ] Spare-run filling: after all week items are placed, remaining slots in a `CircuitDay` are filled with `SlotAssignment` entries whose `itemName` is `'Spare Run'`
- [ ] Carry-over: items not completed by end of week N are prepended to week N+1's pending list before any new week items
- [ ] **Test — completeness**: every non-spare slot across the full schedule assigns each student to each curriculum item the correct number of times
- [ ] **Test — slot-position fairness**: across the course, the difference in any slot-position count between any two students is ≤ 1
- [ ] **Test — weekly synchronisation**: at the end of each week, every circuit has completed the same set of curriculum items (ignoring spare runs)
- [ ] **Test — carry-over correctness**: items not completed in week N appear at the start of week N+1 before any new items
- [ ] **Test — spare run placement**: spare-run slots only appear after all week items for that circuit are exhausted
- [ ] **Test — circuit sizing**: no circuit has fewer than 3 or more than 5 students (for any realistic input)
- [ ] **Test — day-type consistency**: all slots in a given `CircuitDay` have the same item type (run or assessment)
