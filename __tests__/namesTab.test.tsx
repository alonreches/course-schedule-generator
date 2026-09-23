import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NamesTab from '../src/NamesTab'
import type { Student } from '../src/types'

const students: Student[] = [
  { id: 'student-1', name: 'Alice' },
  { id: 'student-2', name: 'Bob' },
  { id: 'student-3', name: 'Carol' },
]

describe('NamesTab', () => {
  it('renders a numbered input for each student', () => {
    render(<NamesTab students={students} onRename={vi.fn()} />)
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Carol')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('calls onRename with student id and new name on blur', () => {
    const onRename = vi.fn()
    render(<NamesTab students={students} onRename={onRename} />)
    const input = screen.getByDisplayValue('Alice')
    fireEvent.change(input, { target: { value: 'Alicia' } })
    fireEvent.blur(input)
    expect(onRename).toHaveBeenCalledWith('student-1', 'Alicia')
  })

  it('does not call onRename when name is unchanged on blur', () => {
    const onRename = vi.fn()
    render(<NamesTab students={students} onRename={onRename} />)
    fireEvent.blur(screen.getByDisplayValue('Alice'))
    expect(onRename).not.toHaveBeenCalled()
  })
})
