import { describe, it, expect } from 'vitest'
import { weekTabLabel } from '../src/weekTabLabel'
import type { CourseWeek } from '../src/types'

const makeWeek = (overrides: Partial<CourseWeek> = {}): CourseWeek => ({
  weekNumber: 1,
  days: [],
  ...overrides,
})

describe('weekTabLabel', () => {
  it('returns date range only when no slots are scheduled', () => {
    const week = makeWeek({
      days: [
        { date: '2027-01-04', type: 'run', circuits: [] },
        { date: '2027-01-08', type: 'run', circuits: [] },
      ],
    })
    expect(weekTabLabel(week)).toBe('04/01/2027 – 08/01/2027')
  })

  it('returns date range + sim range when slots are present', () => {
    const week = makeWeek({
      days: [
        {
          date: '2027-01-04',
          type: 'run',
          circuits: [
            {
              circuitId: 'c1',
              circuitLabel: 'C1',
              type: 'run',
              slots: [
                { studentId: 's1', itemName: 'BSP05', itemType: 'run' },
                { studentId: 's2', itemName: 'BSP03', itemType: 'run' },
              ],
            },
          ],
        },
        {
          date: '2027-01-08',
          type: 'run',
          circuits: [
            {
              circuitId: 'c1',
              circuitLabel: 'C1',
              type: 'run',
              slots: [
                { studentId: 's1', itemName: 'BSP06', itemType: 'run' },
              ],
            },
          ],
        },
      ],
    })
    expect(weekTabLabel(week)).toBe('04/01/2027 – 08/01/2027  BSP03–BSP06')
  })

  it('shows a single sim when all slots share the same name', () => {
    const week = makeWeek({
      days: [
        {
          date: '2027-01-04',
          type: 'run',
          circuits: [
            {
              circuitId: 'c1',
              circuitLabel: 'C1',
              type: 'run',
              slots: [
                { studentId: 's1', itemName: 'BSP03', itemType: 'run' },
                { studentId: 's2', itemName: 'BSP03', itemType: 'run' },
              ],
            },
          ],
        },
      ],
    })
    expect(weekTabLabel(week)).toBe('04/01/2027 – 04/01/2027  BSP03–BSP03')
  })

  it('works when start and end date are the same', () => {
    const week = makeWeek({
      days: [{ date: '2027-01-04', type: 'run', circuits: [] }],
    })
    expect(weekTabLabel(week)).toBe('04/01/2027 – 04/01/2027')
  })

  it('falls back to "Week N" when the week has no days', () => {
    const week = makeWeek({ weekNumber: 3, days: [] })
    expect(weekTabLabel(week)).toBe('Week 3')
  })

  it('excludes Spare Run backfill slots (studentId is empty) from the sim range', () => {
    const week = makeWeek({
      days: [
        {
          date: '2027-01-04',
          type: 'run',
          circuits: [
            {
              circuitId: 'c1',
              circuitLabel: 'C1',
              type: 'run',
              slots: [
                { studentId: 's1', itemName: 'BSP03', itemType: 'run' },
                { studentId: '', itemName: 'Spare Run', itemType: 'run' },
              ],
            },
          ],
        },
      ],
    })
    expect(weekTabLabel(week)).toBe('04/01/2027 – 04/01/2027  BSP03–BSP03')
  })

  it('ignores slots with empty itemName', () => {
    const week = makeWeek({
      days: [
        {
          date: '2027-01-04',
          type: 'run',
          circuits: [
            {
              circuitId: 'c1',
              circuitLabel: 'C1',
              type: 'run',
              slots: [
                { studentId: 's1', itemName: '', itemType: 'run' },
                { studentId: 's2', itemName: 'BSP03', itemType: 'run' },
              ],
            },
          ],
        },
      ],
    })
    expect(weekTabLabel(week)).toBe('04/01/2027 – 04/01/2027  BSP03–BSP03')
  })
})
