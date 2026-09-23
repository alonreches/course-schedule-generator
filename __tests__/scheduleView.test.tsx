import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ScheduleView from '../src/ScheduleView'
import type { CourseWeek } from '../src/types'

function makeWeek(notes?: string): CourseWeek {
  return {
    weekNumber: 1,
    days: [
      {
        date: '2025-01-06',
        type: 'run',
        notes,
        circuits: [
          {
            circuitId: 'c1',
            circuitLabel: 'A',
            type: 'run',
            slots: [{ studentId: 's1', itemName: 'BSP-01', itemType: 'run' }],
          },
        ],
      },
    ],
  }
}

describe('ScheduleView day note', () => {
  it('renders a note textarea in the day header', () => {
    const week = makeWeek()
    render(
      <ScheduleView
        week={week}
        students={[{ id: 's1', name: 'Alice' }]}
        instructors={[]}
        simulators={[]}
        onSlotChange={vi.fn()}
        onCircuitDayChange={vi.fn()}
        onCourseDayChange={vi.fn()}
      />
    )
    expect(screen.getByPlaceholderText('Day note')).toBeInTheDocument()
  })

  it('pre-populates the textarea with an existing note', () => {
    const week = makeWeek('Sim unavailable')
    render(
      <ScheduleView
        week={week}
        students={[{ id: 's1', name: 'Alice' }]}
        instructors={[]}
        simulators={[]}
        onSlotChange={vi.fn()}
        onCircuitDayChange={vi.fn()}
        onCourseDayChange={vi.fn()}
      />
    )
    expect(screen.getByDisplayValue('Sim unavailable')).toBeInTheDocument()
  })

  it('calls onCourseDayChange with the new note when typed', () => {
    const week = makeWeek()
    const onCourseDayChange = vi.fn()
    render(
      <ScheduleView
        week={week}
        students={[{ id: 's1', name: 'Alice' }]}
        instructors={[]}
        simulators={[]}
        onSlotChange={vi.fn()}
        onCircuitDayChange={vi.fn()}
        onCourseDayChange={onCourseDayChange}
      />
    )
    fireEvent.change(screen.getByPlaceholderText('Day note'), { target: { value: 'Early start' } })
    expect(onCourseDayChange).toHaveBeenCalledWith(0, { notes: 'Early start' })
  })

  it('renders without error when note field is absent (old file format)', () => {
    const week: CourseWeek = {
      weekNumber: 1,
      days: [
        {
          date: '2025-01-06',
          type: 'run',
          circuits: [
            {
              circuitId: 'c1',
              circuitLabel: 'A',
              type: 'run',
              slots: [{ studentId: 's1', itemName: 'BSP-01', itemType: 'run' }],
            },
          ],
        },
      ],
    }
    expect(() =>
      render(
        <ScheduleView
          week={week}
          students={[{ id: 's1', name: 'Alice' }]}
          instructors={[]}
          simulators={[]}
          onSlotChange={vi.fn()}
          onCircuitDayChange={vi.fn()}
          onCourseDayChange={vi.fn()}
        />
      )
    ).not.toThrow()
  })
})
