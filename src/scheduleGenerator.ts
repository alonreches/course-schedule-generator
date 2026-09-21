import type {
  ActivityType,
  Circuit,
  CourseDay,
  CourseSchedule,
  CourseWeek,
  ScheduleInputs,
  SlotAssignment,
  Student,
  TemplateItem,
} from './types';

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function circuitSizes(n: number): number[] {
  if (n < 3) throw new Error(`Cannot form circuits: need at least 3 students, got ${n}`);
  if (n === 5) return [5];
  const quotient = Math.floor(n / 4);
  const remainder = n % 4;
  const sizes: number[] = [];
  if (remainder === 0) {
    for (let i = 0; i < quotient; i++) sizes.push(4);
  } else if (remainder === 1) {
    for (let i = 0; i < quotient - 2; i++) sizes.push(4);
    sizes.push(3, 3, 3);
  } else if (remainder === 2) {
    for (let i = 0; i < quotient - 1; i++) sizes.push(4);
    sizes.push(3, 3);
  } else {
    for (let i = 0; i < quotient; i++) sizes.push(4);
    sizes.push(3);
  }
  return sizes;
}

function formCircuits(students: Student[]): Circuit[] {
  const sizes = circuitSizes(students.length);
  const circuits: Circuit[] = [];
  let offset = 0;
  for (let i = 0; i < sizes.length; i++) {
    circuits.push({
      id: `circuit-${i}`,
      label: String.fromCharCode(65 + i),
      students: students.slice(offset, offset + sizes[i]),
    });
    offset += sizes[i];
  }
  return circuits;
}

function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const dayOfWeek = d.getUTCDay() || 7;
  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() + (4 - dayOfWeek));
  const year = thursday.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const weekNum = Math.ceil(
    ((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

function groupByWeek(dates: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const date of [...dates].sort()) {
    const key = isoWeekKey(date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(date);
  }
  return [...groups.values()];
}

function allocateItemsToWeeks(
  items: TemplateItem[],
  weeks: string[][],
): TemplateItem[][] {
  if (weeks.length === 0) return [];
  if (items.length === 0) return weeks.map(() => []);
  const totalDays = weeks.reduce((s, w) => s + w.length, 0);
  if (totalDays === 0) return weeks.map(() => []);
  const result: TemplateItem[][] = [];
  let assigned = 0;
  for (let w = 0; w < weeks.length; w++) {
    let count: number;
    if (w === weeks.length - 1) {
      count = items.length - assigned;
    } else {
      count = Math.round((items.length * weeks[w].length) / totalDays);
    }
    result.push(items.slice(assigned, assigned + count));
    assigned += count;
  }
  return result;
}

const SPARE_ITEM: { name: string; type: ActivityType } = { name: 'Spare Run', type: 'run' };

// Round-robin using a global (non-resetting) day counter and stable student sort ensures
// position-count fairness (≤1 difference) both within a week and across the full course.
function buildCircuitDay(
  circuit: Circuit,
  item: TemplateItem | null,
  globalDayIndex: number,
): SlotAssignment[] {
  const resolved = item ?? SPARE_ITEM;
  const sorted = [...circuit.students].sort((a, b) => a.id.localeCompare(b.id));
  const size = sorted.length;
  const offset = globalDayIndex % size;
  return sorted.map((_, i) => {
    const student = sorted[(offset + i) % size];
    return {
      studentId: student.id,
      itemName: resolved.name,
      itemType: resolved.type,
    };
  });
}

export function scheduleGenerator(inputs: ScheduleInputs): CourseSchedule {
  const { template, students, courseDates, daysOff } = inputs;
  const daysOffSet = new Set(daysOff);
  const activeDates = courseDates.filter(d => !daysOffSet.has(d));

  const weekGroups = groupByWeek(activeDates);
  const weeklyItems = allocateItemsToWeeks(template.items, weekGroups);

  const courseWeeks: CourseWeek[] = [];
  let carryOver: TemplateItem[] = [];
  let globalDayIndex = 0;

  for (let w = 0; w < weekGroups.length; w++) {
    const weekDates = weekGroups[w];
    const pending = [...carryOver, ...weeklyItems[w]];

    const shuffled = shuffle([...students]);
    const circuits = formCircuits(shuffled);

    const courseDays: CourseDay[] = [];

    for (let d = 0; d < weekDates.length; d++) {
      const item = pending.length > 0 ? pending.shift()! : null;
      const dayType: 'run' | 'assessment' =
        item?.type === 'assessment' ? 'assessment' : 'run';

      const circuitDays = circuits.map(circuit => ({
        circuitId: circuit.id,
        circuitLabel: circuit.label,
        type: dayType,
        slots: buildCircuitDay(circuit, item, globalDayIndex),
      }));

      globalDayIndex++;
      courseDays.push({ date: weekDates[d], type: dayType, circuits: circuitDays });
    }

    carryOver = [...pending];
    courseWeeks.push({ weekNumber: w + 1, days: courseDays });
  }

  return { weeks: courseWeeks };
}
