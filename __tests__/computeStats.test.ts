import { describe, it, expect } from 'vitest'
import {
  computeSlotPositionStats,
  computeShiftStats,
  computeInstructorStats,
} from '../src/computeStats'
import type { CourseSchedule } from '../src/types'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeSchedule(overrides: Partial<CourseSchedule> = {}): CourseSchedule {
  return {
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            date: '2024-01-08',
            type: 'run',
            circuits: [
              {
                circuitId: 'circuit-0',
                circuitLabel: 'A',
                type: 'run',
                slots: [
                  { studentId: 's0', itemName: 'Item1', itemType: 'run' },
                  { studentId: 's1', itemName: 'Item2', itemType: 'run' },
                  { studentId: 's2', itemName: 'Item3', itemType: 'run' },
                ],
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  }
}

// ── computeSlotPositionStats ──────────────────────────────────────────────────

describe('computeSlotPositionStats', () => {
  it('counts slot positions correctly', () => {
    const schedule = makeSchedule()
    const { byStudent, maxPosition } = computeSlotPositionStats(schedule)

    expect(byStudent.get('s0')?.get(1)).toBe(1)
    expect(byStudent.get('s1')?.get(2)).toBe(1)
    expect(byStudent.get('s2')?.get(3)).toBe(1)
    expect(maxPosition).toBe(3)
  })

  it('excludes Spare Run slots', () => {
    const schedule: CourseSchedule = {
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              date: '2024-01-08',
              type: 'run',
              circuits: [
                {
                  circuitId: 'circuit-0',
                  circuitLabel: 'A',
                  type: 'run',
                  slots: [
                    { studentId: 's0', itemName: 'Spare Run', itemType: 'run' },
                    { studentId: 's1', itemName: 'Item1', itemType: 'run' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
    const { byStudent } = computeSlotPositionStats(schedule)

    expect(byStudent.has('s0')).toBe(false)
    expect(byStudent.get('s1')?.get(2)).toBe(1)
  })

  it('accumulates counts across multiple days', () => {
    const schedule: CourseSchedule = {
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              date: '2024-01-08',
              type: 'run',
              circuits: [
                {
                  circuitId: 'circuit-0',
                  circuitLabel: 'A',
                  type: 'run',
                  slots: [
                    { studentId: 's0', itemName: 'Item1', itemType: 'run' },
                    { studentId: 's1', itemName: 'Item2', itemType: 'run' },
                  ],
                },
              ],
            },
            {
              date: '2024-01-09',
              type: 'run',
              circuits: [
                {
                  circuitId: 'circuit-0',
                  circuitLabel: 'A',
                  type: 'run',
                  slots: [
                    { studentId: 's1', itemName: 'Item3', itemType: 'run' },
                    { studentId: 's0', itemName: 'Item4', itemType: 'run' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
    const { byStudent } = computeSlotPositionStats(schedule)

    // s0: pos1 once, pos2 once
    expect(byStudent.get('s0')?.get(1)).toBe(1)
    expect(byStudent.get('s0')?.get(2)).toBe(1)
    // s1: pos2 once, pos1 once
    expect(byStudent.get('s1')?.get(2)).toBe(1)
    expect(byStudent.get('s1')?.get(1)).toBe(1)
  })

  it('returns maxPosition 0 for empty schedule', () => {
    const { maxPosition } = computeSlotPositionStats({ weeks: [] })
    expect(maxPosition).toBe(0)
  })
})

// ── computeShiftStats ─────────────────────────────────────────────────────────

describe('computeShiftStats', () => {
  it('counts day shift by default', () => {
    const schedule = makeSchedule()
    const { byStudent } = computeShiftStats(schedule)

    expect(byStudent.get('s0')).toEqual({ day: 1, night: 0 })
    expect(byStudent.get('s1')).toEqual({ day: 1, night: 0 })
  })

  it('counts night shift when assigned', () => {
    const schedule: CourseSchedule = {
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              date: '2024-01-08',
              type: 'run',
              circuits: [
                {
                  circuitId: 'circuit-0',
                  circuitLabel: 'A',
                  type: 'run',
                  shift: 'night',
                  slots: [
                    { studentId: 's0', itemName: 'Item1', itemType: 'run' },
                    { studentId: 's1', itemName: 'Item2', itemType: 'run' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
    const { byStudent } = computeShiftStats(schedule)

    expect(byStudent.get('s0')).toEqual({ day: 0, night: 1 })
    expect(byStudent.get('s1')).toEqual({ day: 0, night: 1 })
  })

  it('accumulates across multiple circuit-days', () => {
    const schedule: CourseSchedule = {
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              date: '2024-01-08',
              type: 'run',
              circuits: [
                {
                  circuitId: 'circuit-0',
                  circuitLabel: 'A',
                  type: 'run',
                  shift: 'day',
                  slots: [{ studentId: 's0', itemName: 'Item1', itemType: 'run' }],
                },
              ],
            },
            {
              date: '2024-01-09',
              type: 'run',
              circuits: [
                {
                  circuitId: 'circuit-0',
                  circuitLabel: 'A',
                  type: 'run',
                  shift: 'night',
                  slots: [{ studentId: 's0', itemName: 'Item2', itemType: 'run' }],
                },
              ],
            },
          ],
        },
      ],
    }
    const { byStudent } = computeShiftStats(schedule)
    expect(byStudent.get('s0')).toEqual({ day: 1, night: 1 })
  })
})

// ── computeInstructorStats ────────────────────────────────────────────────────

describe('computeInstructorStats', () => {
  it('counts assigned circuit-days per instructor', () => {
    const schedule: CourseSchedule = {
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              date: '2024-01-08',
              type: 'run',
              circuits: [
                {
                  circuitId: 'circuit-0',
                  circuitLabel: 'A',
                  type: 'run',
                  instructor: 'Alice',
                  slots: [],
                },
                {
                  circuitId: 'circuit-1',
                  circuitLabel: 'B',
                  type: 'run',
                  instructor: 'Bob',
                  slots: [],
                },
              ],
            },
            {
              date: '2024-01-09',
              type: 'run',
              circuits: [
                {
                  circuitId: 'circuit-0',
                  circuitLabel: 'A',
                  type: 'run',
                  instructor: 'Alice',
                  slots: [],
                },
              ],
            },
          ],
        },
      ],
    }
    const { byInstructor, unassigned } = computeInstructorStats(schedule)

    expect(byInstructor.get('Alice')).toBe(2)
    expect(byInstructor.get('Bob')).toBe(1)
    expect(unassigned).toBe(0)
  })

  it('counts unassigned circuit-days', () => {
    const schedule = makeSchedule()
    const { unassigned } = computeInstructorStats(schedule)
    expect(unassigned).toBe(1)
  })

  it('treats whitespace-only instructor as unassigned', () => {
    const schedule: CourseSchedule = {
      weeks: [
        {
          weekNumber: 1,
          days: [
            {
              date: '2024-01-08',
              type: 'run',
              circuits: [
                {
                  circuitId: 'circuit-0',
                  circuitLabel: 'A',
                  type: 'run',
                  instructor: '   ',
                  slots: [],
                },
              ],
            },
          ],
        },
      ],
    }
    const { unassigned } = computeInstructorStats(schedule)
    expect(unassigned).toBe(1)
  })
})
