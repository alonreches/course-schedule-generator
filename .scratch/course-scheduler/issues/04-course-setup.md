# 04: Course setup

**What to build:** A new-course wizard that collects all inputs needed to generate a schedule. When the coordinator completes the wizard, the course config is stored in memory and the app is ready to hand off to `scheduleGenerator`.

**Blocked by:** 03 — Template management

**Status:** ready-for-agent

- [ ] Coordinator can start a new course from File → New (or a prominent button on the empty-state screen)
- [ ] Wizard step 1 — Pick template: dropdown of available templates from `templateStore`
- [ ] Wizard step 2 — Course details: course name (free text), student count (number input)
- [ ] Wizard step 2 — Optional student names: if the coordinator provides names, they are stored per student; otherwise students are labelled S1, S2, S3…
- [ ] Wizard step 3 — Dates: date-picker for course start and end dates
- [ ] Wizard step 3 — Days off: Saturday and Sunday are pre-excluded; coordinator can add further dates to exclude
- [ ] Wizard validates inputs before allowing the coordinator to proceed (e.g. end date is after start date, student count ≥ 1, a template is selected)
- [ ] On completion, the course config (template snapshot, student list, dates, days-off list) is held in app state ready for schedule generation
- [ ] The wizard can be cancelled without side effects
