import { describe, it, expect } from 'vitest';
import { scheduleGenerator } from '../src/scheduleGenerator';
import type {
  CourseSchedule,
  SlotAssignment,
  Student,
  TemplateItem,
} from '../src/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStudents(n: number): Student[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i}`,
    name: `Student ${i}`,
  }));
}

function makeItems(count: number, type: 'run' | 'assessment' = 'run'): TemplateItem[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Item${i + 1}`,
    type,
  }));
}

/** Dates in a single ISO week (2024-W02 = Jan 8–12) */
const WEEK1 = ['2024-01-08', '2024-01-09', '2024-01-10', '2024-01-11', '2024-01-12'];
/** Dates in the following ISO week (2024-W03 = Jan 15–19) */
const WEEK2 = ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'];

function allSlots(schedule: CourseSchedule): SlotAssignment[] {
  return schedule.weeks.flatMap(w =>
    w.days.flatMap(d => d.circuits.flatMap(c => c.slots)),
  );
}

function nonSpareSlots(schedule: CourseSchedule): SlotAssignment[] {
  return allSlots(schedule).filter(s => s.itemName !== 'Spare Run');
}

// ── Test: completeness ────────────────────────────────────────────────────────

describe('completeness', () => {
  it('each student is assigned each curriculum item exactly once', () => {
    const students = makeStudents(4);
    const items = makeItems(4);
    const schedule = scheduleGenerator({
      template: { items },
      students,
      courseDates: WEEK1.slice(0, 4),
      daysOff: [],
    });

    const slots = nonSpareSlots(schedule);
    for (const student of students) {
      for (const item of items) {
        const count = slots.filter(
          s => s.studentId === student.id && s.itemName === item.name,
        ).length;
        expect(count).toBe(1);
      }
    }
  });

  it('completeness holds across multiple weeks with reshuffled circuits', () => {
    const students = makeStudents(6);
    const items = makeItems(6);
    const schedule = scheduleGenerator({
      template: { items },
      students,
      courseDates: [...WEEK1.slice(0, 3), ...WEEK2.slice(0, 3)],
      daysOff: [],
    });

    const slots = nonSpareSlots(schedule);
    for (const student of students) {
      for (const item of items) {
        const count = slots.filter(
          s => s.studentId === student.id && s.itemName === item.name,
        ).length;
        expect(count).toBe(1);
      }
    }
  });
});

// ── Test: slot-position fairness ──────────────────────────────────────────────

describe('slot-position fairness', () => {
  function collectPositionCounts(schedule: CourseSchedule, students: Student[], circuitSize: number) {
    const posCount: Record<string, number[]> = {};
    for (const s of students) posCount[s.id] = new Array(circuitSize).fill(0);
    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const circuit of day.circuits) {
          circuit.slots.forEach((slot, pos) => {
            posCount[slot.studentId][pos]++;
          });
        }
      }
    }
    return posCount;
  }

  it('within a week, position counts differ by at most 1', () => {
    const circuitSize = 3;
    const students = makeStudents(circuitSize);
    const numDays = 5; // deliberately not a multiple of circuitSize
    const items = makeItems(numDays);
    const schedule = scheduleGenerator({
      template: { items },
      students,
      courseDates: WEEK1.slice(0, numDays),
      daysOff: [],
    });

    const posCount = collectPositionCounts(schedule, students, circuitSize);
    for (let pos = 0; pos < circuitSize; pos++) {
      const counts = students.map(s => posCount[s.id][pos]);
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
  });

  it('across two weeks (same 3 students, one circuit), position counts differ by at most 1', () => {
    const circuitSize = 3;
    const students = makeStudents(circuitSize);
    // 8 items across 8 days (4+4) — ensures no spare runs distort counts
    const items = makeItems(8);
    const schedule = scheduleGenerator({
      template: { items },
      students,
      courseDates: [...WEEK1.slice(0, 4), ...WEEK2.slice(0, 4)],
      daysOff: [],
    });

    const posCount = collectPositionCounts(schedule, students, circuitSize);
    for (let pos = 0; pos < circuitSize; pos++) {
      const counts = students.map(s => posCount[s.id][pos]);
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
  });
});

// ── Test: weekly synchronisation ─────────────────────────────────────────────

describe('weekly synchronisation', () => {
  it('all circuits complete the same set of items each week', () => {
    const students = makeStudents(8); // 2 circuits of 4
    const items = makeItems(6);
    const schedule = scheduleGenerator({
      template: { items },
      students,
      courseDates: [...WEEK1.slice(0, 3), ...WEEK2.slice(0, 3)],
      daysOff: [],
    });

    for (const week of schedule.weeks) {
      const itemSetsByCircuit = week.days.flatMap(d => d.circuits).reduce<
        Map<string, Set<string>>
      >((acc, cd) => {
        if (!acc.has(cd.circuitId)) acc.set(cd.circuitId, new Set());
        for (const s of cd.slots) {
          if (s.itemName !== 'Spare Run') acc.get(cd.circuitId)!.add(s.itemName);
        }
        return acc;
      }, new Map());

      const sets = [...itemSetsByCircuit.values()];
      if (sets.length < 2) continue;
      for (let i = 1; i < sets.length; i++) {
        const a = sets[0];
        const b = sets[i];
        expect(a.size).toBe(b.size);
        for (const item of a) expect(b.has(item)).toBe(true);
      }
    }
  });
});

// ── Test: carry-over correctness ──────────────────────────────────────────────

describe('carry-over correctness', () => {
  it('items not finished in week N appear at the start of week N+1', () => {
    const students = makeStudents(3);
    // 5 items, 2 days in week1 (2 total), 3 days in week2 (3 total) → 5 total
    // Proportional: week1 = round(5 * 2/5) = 2 items; week2 = 3 items
    // BUT with round(5*2/5) = round(2) = 2, week1 uses 2 items exactly (2 days = 2 items).
    // To force carry-over we need more items than days in week1.
    // Use 7 items, 3+4 days: week1 = round(7*3/7) = 3, week2 = 4.
    // Week1 has 3 days = 3 items → no carry-over. Still no good.
    //
    // Strategy: 5 items, 2 days in week1, 2 days in week2 (4 total).
    // Allocation: week1 = round(5*2/4) = round(2.5) = 3, week2 = 2.
    // Week1 has 2 days but 3 items → uses 2, carries over 1.
    // Week2 pending = [item3] + [item4, item5].
    const items: TemplateItem[] = [
      { name: 'Alpha', type: 'run' },
      { name: 'Beta', type: 'run' },
      { name: 'Gamma', type: 'run' }, // this one should carry over
      { name: 'Delta', type: 'run' },
      { name: 'Epsilon', type: 'run' },
    ];
    const schedule = scheduleGenerator({
      template: { items },
      students,
      courseDates: [WEEK1[0], WEEK1[1], WEEK2[0], WEEK2[1]],
      daysOff: [],
    });

    expect(schedule.weeks).toHaveLength(2);

    // Week1 processes Alpha then Beta (2 items in 2 days)
    const week1Items = schedule.weeks[0].days.map(d => d.circuits[0].slots[0].itemName);
    expect(week1Items[0]).toBe('Alpha');
    expect(week1Items[1]).toBe('Beta');

    // Week2's first day must be Gamma (the carry-over)
    const week2Day1Item = schedule.weeks[1].days[0].circuits[0].slots[0].itemName;
    expect(week2Day1Item).toBe('Gamma');

    // Week2's second day is Delta (first of the new week's allocation)
    const week2Day2Item = schedule.weeks[1].days[1].circuits[0].slots[0].itemName;
    expect(week2Day2Item).toBe('Delta');
  });
});

// ── Test: spare run placement ─────────────────────────────────────────────────

describe('spare run placement', () => {
  it('spare run slots only appear after all week items are exhausted', () => {
    const students = makeStudents(3);
    const items = makeItems(3); // 3 items for 5 days
    const schedule = scheduleGenerator({
      template: { items },
      students,
      courseDates: WEEK1.slice(0, 5),
      daysOff: [],
    });

    const week = schedule.weeks[0];
    let spareStarted = false;
    for (const day of week.days) {
      const isSpare = day.circuits[0].slots[0].itemName === 'Spare Run';
      if (isSpare) spareStarted = true;
      // Once spare runs begin, all subsequent days must also be spare
      if (spareStarted) {
        for (const circuit of day.circuits) {
          for (const slot of circuit.slots) {
            expect(slot.itemName).toBe('Spare Run');
          }
        }
      }
    }
    // Confirm spare runs do appear
    const hasSpare = week.days.some(d =>
      d.circuits.some(c => c.slots.some(s => s.itemName === 'Spare Run')),
    );
    expect(hasSpare).toBe(true);
  });
});

// ── Test: circuit sizing ──────────────────────────────────────────────────────

describe('circuit sizing', () => {
  const dates = WEEK1.slice(0, 1); // only need 1 day to check circuit sizes
  const items = makeItems(1);

  it('throws when fewer than 3 students are supplied', () => {
    expect(() =>
      scheduleGenerator({
        template: { items },
        students: makeStudents(2),
        courseDates: dates,
        daysOff: [],
      }),
    ).toThrow();
  });

  for (const n of [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) {
    it(`n=${n} students → all circuits have 3–5 members`, () => {
      const schedule = scheduleGenerator({
        template: { items },
        students: makeStudents(n),
        courseDates: dates,
        daysOff: [],
      });
      const day = schedule.weeks[0].days[0];
      for (const circuit of day.circuits) {
        expect(circuit.slots.length).toBeGreaterThanOrEqual(3);
        expect(circuit.slots.length).toBeLessThanOrEqual(5);
      }
      // All students assigned
      const total = day.circuits.reduce((s, c) => s + c.slots.length, 0);
      expect(total).toBe(n);
    });
  }
});

// ── Test: day-type consistency ────────────────────────────────────────────────

describe('day-type consistency', () => {
  it('all slots in a CircuitDay share the same item type', () => {
    const students = makeStudents(4);
    const items: TemplateItem[] = [
      { name: 'Warm-up', type: 'run' },
      { name: 'Exam', type: 'assessment' },
      { name: 'Cool-down', type: 'run' },
    ];
    const schedule = scheduleGenerator({
      template: { items },
      students,
      courseDates: WEEK1.slice(0, 3),
      daysOff: [],
    });

    for (const week of schedule.weeks) {
      for (const day of week.days) {
        for (const circuit of day.circuits) {
          const types = circuit.slots.map(s => s.itemType);
          expect(new Set(types).size).toBe(1); // all same type
          expect(types[0]).toBe(circuit.type); // matches CircuitDay.type
        }
        // CourseDay.type matches its circuits
        for (const circuit of day.circuits) {
          expect(circuit.type).toBe(day.type);
        }
      }
    }
  });

  it('assessment items produce assessment-typed days', () => {
    const students = makeStudents(3);
    const items: TemplateItem[] = [
      { name: 'Run1', type: 'run' },
      { name: 'Test', type: 'assessment' },
    ];
    const schedule = scheduleGenerator({
      template: { items },
      students,
      courseDates: WEEK1.slice(0, 2),
      daysOff: [],
    });

    const days = schedule.weeks[0].days;
    expect(days[0].type).toBe('run');
    expect(days[1].type).toBe('assessment');
  });
});

// ── Test: days-off filtering ──────────────────────────────────────────────────

describe('days-off filtering', () => {
  it('days-off dates are excluded from the schedule', () => {
    const students = makeStudents(3);
    const items = makeItems(2);
    const schedule = scheduleGenerator({
      template: { items },
      students,
      courseDates: WEEK1.slice(0, 3),
      daysOff: [WEEK1[1]], // remove middle day
      // Active: WEEK1[0], WEEK1[2]
    });

    const dates = schedule.weeks.flatMap(w => w.days.map(d => d.date));
    expect(dates).not.toContain(WEEK1[1]);
    expect(dates).toContain(WEEK1[0]);
    expect(dates).toContain(WEEK1[2]);
  });
});
