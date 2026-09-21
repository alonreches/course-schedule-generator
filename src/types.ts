export type ActivityType = 'run' | 'assessment';

export interface TemplateItem {
  name: string;
  type: ActivityType;
}

export interface Template {
  items: TemplateItem[];
}

export interface Student {
  id: string;
  name: string;
}

export interface Circuit {
  id: string;
  label: string;
  students: Student[];
}

export interface SlotAssignment {
  studentId: string;
  itemName: string;
  itemType: ActivityType;
}

export interface CircuitDay {
  circuitId: string;
  circuitLabel: string;
  type: ActivityType;
  slots: SlotAssignment[];
}

export interface CourseDay {
  date: string;
  type: ActivityType;
  circuits: CircuitDay[];
}

export interface CourseWeek {
  weekNumber: number;
  days: CourseDay[];
}

export interface CourseSchedule {
  weeks: CourseWeek[];
}

export interface ScheduleInputs {
  template: Template;
  students: Student[];
  courseDates: string[];
  daysOff: string[];
}

export interface NamedTemplate {
  id: string;
  name: string;
  items: TemplateItem[];
}

export interface AppStore {
  templates: NamedTemplate[];
  instructors: string[];
  simulators: string[];
}

export interface TemplateUpdates {
  name?: string;
  items?: TemplateItem[];
}
