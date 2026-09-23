import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../src/App'
import type { ProjectFile } from '../src/types'

const mockProject: { filePath: string; data: ProjectFile } = {
  filePath: '/test/project.json',
  data: {
    version: 1,
    courseConfig: {
      templateId: 't1',
      templateName: 'T',
      templateSnapshot: { items: [{ name: 'BSP-01', type: 'run' }] },
      courseName: 'Test',
      students: [{ id: 's1', name: 'Alice' }],
      startDate: '2025-01-06',
      endDate: '2025-01-10',
      extraDaysOff: [],
    },
    schedule: {
      weeks: [{
        weekNumber: 1,
        days: [{
          date: '2025-01-06',
          type: 'run',
          circuits: [{
            circuitId: 'c1',
            circuitLabel: 'A',
            type: 'run',
            slots: [{ studentId: 's1', itemName: 'BSP-01', itemType: 'run' }],
          }],
        }],
      }],
    },
  },
}

async function openCourse() {
  vi.spyOn(window.api, 'openProject').mockResolvedValueOnce(mockProject)
  render(<App />)
  fireEvent.click(screen.getByText('Open'))
  await screen.findByPlaceholderText('Day note')
}

describe('Undo/Redo ribbon buttons', () => {
  it('renders Undo and Redo buttons in the ribbon', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeInTheDocument()
  })

  it('Undo is disabled when there is nothing to undo', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
  })

  it('Redo is disabled when there is nothing to redo', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
  })
})

describe('Undo/Redo — per-day notes', () => {
  it('Undo becomes enabled after editing the day note', async () => {
    await openCourse()
    const noteArea = screen.getByPlaceholderText('Day note')
    fireEvent.change(noteArea, { target: { value: 'changed' } })
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
  })

  it('Redo stays disabled before any undo', async () => {
    await openCourse()
    const noteArea = screen.getByPlaceholderText('Day note')
    fireEvent.change(noteArea, { target: { value: 'changed' } })
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
  })

  it('Undo reverts the day note and enables Redo', async () => {
    await openCourse()
    const noteArea = screen.getByPlaceholderText('Day note')
    fireEvent.change(noteArea, { target: { value: 'changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByPlaceholderText('Day note')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Redo' })).toBeEnabled()
  })

  it('Undo disables itself after the last undo', async () => {
    await openCourse()
    const noteArea = screen.getByPlaceholderText('Day note')
    fireEvent.change(noteArea, { target: { value: 'changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
  })

  it('Redo re-applies the reverted change and disables Redo', async () => {
    await openCourse()
    const noteArea = screen.getByPlaceholderText('Day note')
    fireEvent.change(noteArea, { target: { value: 'changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }))
    expect(screen.getByPlaceholderText('Day note')).toHaveValue('changed')
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
  })

  it('Redo enables Undo after being applied', async () => {
    await openCourse()
    const noteArea = screen.getByPlaceholderText('Day note')
    fireEvent.change(noteArea, { target: { value: 'changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
  })

  it('a new edit after undo clears the redo stack', async () => {
    await openCourse()
    const noteArea = screen.getByPlaceholderText('Day note')
    fireEvent.change(noteArea, { target: { value: 'first' } })
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    fireEvent.change(noteArea, { target: { value: 'second' } })
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()
  })
})

describe('Undo/Redo — slot item name changes', () => {
  it('Undo reverts a slot item name change', async () => {
    await openCourse()
    const itemInput = screen.getByDisplayValue('BSP-01')
    fireEvent.change(itemInput, { target: { value: 'BSP-99' } })
    expect(screen.getByDisplayValue('BSP-99')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByDisplayValue('BSP-01')).toBeInTheDocument()
  })
})

describe('Undo/Redo — circuit-day changes (shift)', () => {
  it('Undo reverts a shift toggle from Day to Night', async () => {
    await openCourse()
    // Circuit starts as 'day' (default) — click Night to change it
    fireEvent.click(screen.getByRole('button', { name: 'Night' }))
    expect(screen.getByRole('button', { name: 'Night' })).toHaveClass('active')
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('button', { name: 'Day' })).toHaveClass('active')
  })
})

describe('Undo/Redo — history cleared on open', () => {
  it('Undo is disabled after opening a new project', async () => {
    vi.spyOn(window.api, 'openProject')
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce(mockProject)
    // Allow the unsaved-changes dialog to proceed with "discard" (1) on the second open
    vi.spyOn(window.api, 'confirmUnsaved').mockResolvedValueOnce(1)
    render(<App />)
    fireEvent.click(screen.getByText('Open'))
    await screen.findByPlaceholderText('Day note')

    fireEvent.change(screen.getByPlaceholderText('Day note'), { target: { value: 'edit' } })
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()

    fireEvent.click(screen.getByText('Open'))
    await screen.findByPlaceholderText('Day note')
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
  })
})
