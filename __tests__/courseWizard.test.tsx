import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CourseWizard from '../src/CourseWizard'
import type { NamedTemplate } from '../src/types'

const templates: NamedTemplate[] = [
  { id: 't1', name: 'Template A', items: [{ name: 'BSP-01', type: 'run' }] },
  { id: 't2', name: 'Template B', items: [] },
]

describe('CourseWizard', () => {
  const onComplete = vi.fn()
  const onCancel = vi.fn()

  beforeEach(() => {
    onComplete.mockReset()
    onCancel.mockReset()
  })

  function renderWizard(tmplts = templates) {
    return render(
      <CourseWizard
        templates={tmplts}
        onComplete={onComplete}
        onCancel={onCancel}
      />,
    )
  }

  // ── Step 1 ──

  it('shows step 1 initially', () => {
    renderWizard()
    expect(screen.getByText(/pick a template/i)).toBeInTheDocument()
  })

  it('Next is disabled when no template selected', () => {
    renderWizard()
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('enables Next after selecting a template', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
  })

  it('shows a message when no templates are available', () => {
    renderWizard([])
    expect(screen.getByText(/no templates available/i)).toBeInTheDocument()
  })

  // ── Step 2 ──

  it('advances to step 2 on Next', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByLabelText(/course name/i)).toBeInTheDocument()
  })

  it('step 2 shows course name, student count, and student names inputs', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByLabelText(/course name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/student count/i)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /student name 1/i })).toBeInTheDocument()
  })

  it('Next is disabled on step 2 when student count is 0', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/student count/i), { target: { value: '0' } })
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('Back returns to step 1', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText(/pick a template/i)).toBeInTheDocument()
  })

  it('shows line numbers next to student name inputs', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/student count/i), { target: { value: '3' } })
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('line numbers update when student count changes', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/student count/i), { target: { value: '4' } })
    expect(screen.getByText('4')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/student count/i), { target: { value: '2' } })
    expect(screen.queryByText('3')).not.toBeInTheDocument()
    expect(screen.queryByText('4')).not.toBeInTheDocument()
  })

  // ── Step 3 ──

  it('advances to step 3 from step 2', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
  })

  it('Finish is disabled when dates are empty', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('button', { name: /finish/i })).toBeDisabled()
  })

  it('Finish is disabled when end date is not after start date', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2025-01-10' } })
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2025-01-05' } })
    expect(screen.getByRole('button', { name: /finish/i })).toBeDisabled()
  })

  it('Finish is enabled when end date is after start date', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2025-01-06' } })
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2025-01-31' } })
    expect(screen.getByRole('button', { name: /finish/i })).not.toBeDisabled()
  })

  it('shows weekend-exclusion hint on step 3', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText(/saturday.*sunday.*automatically excluded/i)).toBeInTheDocument()
  })

  // ── Completion ──

  it('calls onComplete with correct CourseConfig on Finish', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/course name/i), { target: { value: 'My Course' } })
    fireEvent.change(screen.getByLabelText(/student count/i), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2025-01-06' } })
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2025-01-31' } })
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 't1',
        templateName: 'Template A',
        courseName: 'My Course',
        startDate: '2025-01-06',
        endDate: '2025-01-31',
        extraDaysOff: [],
      }),
    )
  })

  it('auto-generates student names when none provided', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/student count/i), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2025-01-06' } })
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2025-01-31' } })
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))

    const { students } = onComplete.mock.calls[0][0]
    expect(students).toHaveLength(3)
    expect(students[0].name).toBe('S1')
    expect(students[1].name).toBe('S2')
    expect(students[2].name).toBe('S3')
  })

  it('uses provided student names when filled', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/student count/i), { target: { value: '2' } })
    fireEvent.change(screen.getByRole('textbox', { name: /student name 1/i }), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByRole('textbox', { name: /student name 2/i }), { target: { value: 'Bob' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2025-01-06' } })
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2025-01-31' } })
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))

    const { students } = onComplete.mock.calls[0][0]
    expect(students[0].name).toBe('Alice')
    expect(students[1].name).toBe('Bob')
  })

  it('falls back to auto-names when fewer names than count', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/student count/i), { target: { value: '3' } })
    fireEvent.change(screen.getByRole('textbox', { name: /student name 1/i }), { target: { value: 'Alice' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2025-01-06' } })
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2025-01-31' } })
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))

    const { students } = onComplete.mock.calls[0][0]
    expect(students[0].name).toBe('Alice')
    expect(students[1].name).toBe('S2')
    expect(students[2].name).toBe('S3')
  })

  it('includes template snapshot in CourseConfig', () => {
    renderWizard()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2025-01-06' } })
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2025-01-31' } })
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))

    const { templateSnapshot } = onComplete.mock.calls[0][0]
    expect(templateSnapshot.items).toEqual([{ name: 'BSP-01', type: 'run' }])
  })

  // ── Cancel ──

  it('calls onCancel when Cancel is clicked', () => {
    renderWizard()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('Cancel is available on all steps', () => {
    renderWizard()
    // step 1
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    // step 2
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 't1' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    // step 3
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })
})
