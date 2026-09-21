# 07: Stats tab

**What to build:** A Stats tab that gives coordinators a fairness overview of the generated (and edited) schedule. Three views in one tab: per-student slot-position history, per-student shift counts, and per-instructor assignment counts. All data is derived live from the in-memory `CourseSchedule`.

**Blocked by:** 05 — Schedule week-tab view

**Status:** ready-for-agent

- [ ] A Stats tab is permanently visible in the tab bar alongside the week tabs
- [ ] Per-student slot-position table: rows are students; columns are slot positions 1–6; each cell shows how many times that student has occupied that position across the full schedule (excluding Spare Run slots)
- [ ] Per-student shift table: rows are students; columns are Day and Night; each cell shows the count of circuit-days that student was assigned to each shift
- [ ] Per-instructor assignment table: rows are instructors from the app-level list; one column showing total circuit-days assigned across the full course
- [ ] All three tables update live as the coordinator edits the schedule (no manual refresh needed)
- [ ] Empty instructor cells (where no instructor is assigned yet) are excluded from the per-instructor count but the table notes how many circuit-days are unassigned
