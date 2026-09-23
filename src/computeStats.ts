import type { CourseSchedule } from './types'

export interface SlotPositionStats {
  /** studentId → (1-based position → count), excluding Spare Run slots */
  byStudent: Map<string, Map<number, number>>
  maxPosition: number
}

export interface ShiftStats {
  /** studentId → { day, night } circuit-day counts */
  byStudent: Map<string, { day: number; night: number }>
}

export interface InstructorStats {
  /** instructor name → circuit-day count */
  byInstructor: Map<string, number>
  unassigned: number
}

export function computeSlotPositionStats(schedule: CourseSchedule): SlotPositionStats {
  const byStudent = new Map<string, Map<number, number>>()
  let maxPosition = 0

  for (const week of schedule.weeks) {
    for (const day of week.days) {
      for (const circuit of day.circuits) {
        for (let i = 0; i < circuit.slots.length; i++) {
          const slot = circuit.slots[i]
          if (slot.itemName === 'Spare Run') continue
          const position = i + 1
          if (position > maxPosition) maxPosition = position
          if (!byStudent.has(slot.studentId)) byStudent.set(slot.studentId, new Map())
          const posMap = byStudent.get(slot.studentId)!
          posMap.set(position, (posMap.get(position) ?? 0) + 1)
        }
      }
    }
  }

  return { byStudent, maxPosition }
}

export function computeShiftStats(schedule: CourseSchedule): ShiftStats {
  const byStudent = new Map<string, { day: number; night: number }>()

  for (const week of schedule.weeks) {
    for (const day of week.days) {
      for (const circuit of day.circuits) {
        const shift = circuit.shift ?? 'day'
        for (const slot of circuit.slots) {
          if (!byStudent.has(slot.studentId)) byStudent.set(slot.studentId, { day: 0, night: 0 })
          const counts = byStudent.get(slot.studentId)!
          if (shift === 'night') counts.night++
          else counts.day++
        }
      }
    }
  }

  return { byStudent }
}

export function computeInstructorStats(schedule: CourseSchedule): InstructorStats {
  const byInstructor = new Map<string, number>()
  let unassigned = 0

  for (const week of schedule.weeks) {
    for (const day of week.days) {
      for (const circuit of day.circuits) {
        const instructor = circuit.instructor?.trim()
        if (instructor) {
          byInstructor.set(instructor, (byInstructor.get(instructor) ?? 0) + 1)
        } else {
          unassigned++
        }
      }
    }
  }

  return { byInstructor, unassigned }
}

export interface RunsPerStudentPerInstructorStats {
  /** studentId → (instructor name → run count) */
  byStudentByInstructor: Map<string, Map<string, number>>
}

export function computeRunsPerStudentPerInstructor(schedule: CourseSchedule): RunsPerStudentPerInstructorStats {
  const byStudentByInstructor = new Map<string, Map<string, number>>()

  for (const week of schedule.weeks) {
    for (const day of week.days) {
      for (const circuit of day.circuits) {
        const instructor = circuit.instructor?.trim()
        if (!instructor) continue
        for (const slot of circuit.slots) {
          if (slot.itemType !== 'run') continue
          if (!byStudentByInstructor.has(slot.studentId)) {
            byStudentByInstructor.set(slot.studentId, new Map())
          }
          const instructorMap = byStudentByInstructor.get(slot.studentId)!
          instructorMap.set(instructor, (instructorMap.get(instructor) ?? 0) + 1)
        }
      }
    }
  }

  return { byStudentByInstructor }
}
