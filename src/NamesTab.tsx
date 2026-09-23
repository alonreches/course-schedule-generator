import { useState } from 'react'
import type { Student } from './types'

interface Props {
  students: Student[]
  onRename: (id: string, name: string) => void
}

export default function NamesTab({ students, onRename }: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  function getValue(student: Student) {
    return student.id in drafts ? drafts[student.id] : student.name
  }

  function handleChange(id: string, value: string) {
    setDrafts(prev => ({ ...prev, [id]: value }))
  }

  function handleBlur(student: Student) {
    const current = drafts[student.id]
    if (current !== undefined && current !== student.name) {
      onRename(student.id, current)
    }
    setDrafts(prev => {
      const next = { ...prev }
      delete next[student.id]
      return next
    })
  }

  return (
    <section className="names-tab">
      <ol className="names-list">
        {students.map((student, i) => (
          <li key={student.id} className="names-list-item">
            <span className="names-list-number">{i + 1}</span>
            <input
              type="text"
              className="names-list-input"
              aria-label={`Student name ${i + 1}`}
              value={getValue(student)}
              onChange={e => handleChange(student.id, e.target.value)}
              onBlur={() => handleBlur(student)}
            />
          </li>
        ))}
      </ol>
    </section>
  )
}
