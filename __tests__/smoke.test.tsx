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
      templateSnapshot: { items: [] },
      courseName: 'Test',
      students: [
        { id: 'student-1', name: 'Alice' },
        { id: 'student-2', name: 'Bob' },
      ],
      startDate: '2025-01-06',
      endDate: '2025-01-10',
      extraDaysOff: [],
    },
    schedule: { weeks: [{ weekNumber: 1, days: [] }] },
  },
}

async function openCourse() {
  vi.spyOn(window.api, 'openProject').mockResolvedValueOnce(mockProject)
  render(<App />)
  fireEvent.click(screen.getByText('Open'))
}

describe('App', () => {
  it('renders the tab bar', () => {
    render(<App />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('shows empty state in the tab bar', () => {
    render(<App />)
    expect(screen.getByText('No courses open')).toBeInTheDocument()
  })

  it('shows Names tab after a course is opened', async () => {
    await openCourse()
    await screen.findByRole('tab', { name: /names/i })
  })

  it('Names tab shows numbered student name inputs after a course is opened', async () => {
    await openCourse()
    const namesTab = await screen.findByRole('tab', { name: /names/i })
    fireEvent.click(namesTab)
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()
  })
})
