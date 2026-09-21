import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App'

describe('App', () => {
  it('renders the tab bar', () => {
    render(<App />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('shows empty state in the tab bar', () => {
    render(<App />)
    expect(screen.getByText('No courses open')).toBeInTheDocument()
  })
})
