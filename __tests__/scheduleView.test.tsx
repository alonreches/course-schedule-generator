import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ScheduleView from '../src/ScheduleView'
import type { CourseWeek, TemplateItem } from '../src/types'

const DEFAULT_TEMPLATE_ITEMS: TemplateItem[] = [
  { name: 'BSP-01', type: 'run' },
  { name: 'BSP-02', type: 'assessment' },
]

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

function renderView(week: CourseWeek, overrides: { templateItems?: TemplateItem[], onSlotChange?: ReturnType<typeof vi.fn>, onCircuitDayChange?: ReturnType<typeof vi.fn>, onCourseDayChange?: ReturnType<typeof vi.fn> } = {}) {
  return render(
    <ScheduleView
      week={week}
      students={[{ id: 's1', name: 'Alice' }]}
      instructors={[]}
      simulators={[]}
      templateItems={overrides.templateItems ?? DEFAULT_TEMPLATE_ITEMS}
      onSlotChange={overrides.onSlotChange ?? vi.fn()}
      onCircuitDayChange={overrides.onCircuitDayChange ?? vi.fn()}
      onCourseDayChange={overrides.onCourseDayChange ?? vi.fn()}
    />
  )
}

describe('ScheduleView day note', () => {
  it('renders a note textarea in the day header', () => {
    renderView(makeWeek())
    expect(screen.getByPlaceholderText('Day note')).toBeInTheDocument()
  })

  it('pre-populates the textarea with an existing note', () => {
    renderView(makeWeek('Sim unavailable'))
    expect(screen.getByDisplayValue('Sim unavailable')).toBeInTheDocument()
  })

  it('calls onCourseDayChange with the new note when typed', () => {
    const onCourseDayChange = vi.fn()
    renderView(makeWeek(), { onCourseDayChange })
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
    expect(() => renderView(week)).not.toThrow()
  })
})

describe('ScheduleView cell — type toggle removed', () => {
  it('does not render Run or Assess toggle buttons', () => {
    renderView(makeWeek())
    expect(screen.queryByRole('button', { name: 'Run' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Assess' })).toBeNull()
  })
})

describe('ScheduleView cell — simulation name combobox', () => {
  it('item name input has the template items datalist attached', () => {
    renderView(makeWeek())
    const input = screen.getByDisplayValue('BSP-01')
    expect(input).toHaveAttribute('list', 'schedule-template-items-list')
  })

  it('selecting a template item by exact name updates itemType to match', () => {
    const onSlotChange = vi.fn()
    renderView(makeWeek(), { onSlotChange })
    const input = screen.getByDisplayValue('BSP-01')
    fireEvent.change(input, { target: { value: 'BSP-02' } })
    expect(onSlotChange).toHaveBeenCalledWith(0, 0, 0, { itemName: 'BSP-02', itemType: 'assessment', edited: true })
  })

  it('typing a name that does not match a template item leaves itemType unchanged', () => {
    const onSlotChange = vi.fn()
    renderView(makeWeek(), { onSlotChange })
    const input = screen.getByDisplayValue('BSP-01')
    fireEvent.change(input, { target: { value: 'Custom' } })
    expect(onSlotChange).toHaveBeenCalledWith(0, 0, 0, { itemName: 'Custom', edited: true })
    expect(onSlotChange).not.toHaveBeenCalledWith(
      expect.anything(), expect.anything(), expect.anything(),
      expect.objectContaining({ itemType: expect.anything() })
    )
  })

  it('R badge shown for run slot, A badge for assessment slot', () => {
    const week: CourseWeek = {
      weekNumber: 1,
      days: [{
        date: '2025-01-06',
        type: 'run',
        circuits: [{
          circuitId: 'c1',
          circuitLabel: 'A',
          type: 'run',
          slots: [
            { studentId: 's1', itemName: 'BSP-01', itemType: 'run' },
            { studentId: 's1', itemName: 'BSP-02', itemType: 'assessment' },
          ],
        }],
      }],
    }
    renderView(week)
    const badges = document.querySelectorAll('.schedule-slot-activity')
    expect(badges[0]).toHaveTextContent('R')
    expect(badges[1]).toHaveTextContent('A')
  })

  it('loads without error when CircuitDay.type exists in saved file (backward compat)', () => {
    const week: CourseWeek = {
      weekNumber: 1,
      days: [{
        date: '2025-01-06',
        type: 'assessment',
        circuits: [{
          circuitId: 'c1',
          circuitLabel: 'A',
          type: 'assessment',
          slots: [{ studentId: 's1', itemName: 'BSP-02', itemType: 'assessment' }],
        }],
      }],
    }
    expect(() => renderView(week)).not.toThrow()
  })
})
