import { Fragment, useState } from 'react'
import type { CircuitDay, CourseWeek, Student } from './types'

interface CircuitDayMeta {
  shift: 'day' | 'night'
  instructor: string
  simulator: string
  notes: string
}

const DEFAULT_META: CircuitDayMeta = { shift: 'day', instructor: '', simulator: '', notes: '' }

interface Props {
  week: CourseWeek
  students: Student[]
  instructors: string[]
  simulators: string[]
}

export default function ScheduleView({ week, students, instructors, simulators }: Props) {
  const [circuitMeta, setCircuitMeta] = useState<Record<string, CircuitDayMeta>>({})

  const studentMap = new Map(students.map(s => [s.id, s.name]))

  function getMeta(date: string, circuitId: string): CircuitDayMeta {
    return circuitMeta[`${date}-${circuitId}`] ?? DEFAULT_META
  }

  function updateMeta(date: string, circuitId: string, patch: Partial<CircuitDayMeta>) {
    const key = `${date}-${circuitId}`
    setCircuitMeta(prev => ({ ...prev, [key]: { ...(prev[key] ?? DEFAULT_META), ...patch } }))
  }

  if (week.days.length === 0) {
    return <div className="schedule-empty">No active days this week.</div>
  }

  const numCircuits = week.days[0].circuits.length

  return (
    <div className="schedule-container">
      <div
        className="schedule-grid"
        style={{ gridTemplateColumns: `140px repeat(${numCircuits}, 1fr)` }}
      >
        <div className="schedule-col-header" />
        {week.days[0].circuits.map(c => (
          <div key={c.circuitId} className="schedule-col-header">
            Circuit {c.circuitLabel}
          </div>
        ))}

        {week.days.map(day => (
          <Fragment key={day.date}>
            <div className="schedule-day-header">
              <span className="schedule-day-date">{formatDate(day.date)}</span>
              <span className={`item-type-badge item-type-${day.type}`}>
                {day.type === 'assessment' ? 'Assessment' : 'Run'}
              </span>
            </div>
            {day.circuits.map(cd => (
              <CircuitBlock
                key={cd.circuitId}
                circuitDay={cd}
                meta={getMeta(day.date, cd.circuitId)}
                studentMap={studentMap}
                instructors={instructors}
                simulators={simulators}
                onChange={patch => updateMeta(day.date, cd.circuitId, patch)}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}

interface CircuitBlockProps {
  circuitDay: CircuitDay
  meta: CircuitDayMeta
  studentMap: Map<string, string>
  instructors: string[]
  simulators: string[]
  onChange: (patch: Partial<CircuitDayMeta>) => void
}

function CircuitBlock({ circuitDay, meta, studentMap, instructors, simulators, onChange }: CircuitBlockProps) {
  return (
    <div className={`schedule-circuit-block${meta.shift === 'night' ? ' schedule-night' : ''}`}>
      <ul className="schedule-slots">
        {circuitDay.slots.map((slot, i) => (
          <li key={i} className="schedule-slot">
            <span className="schedule-slot-num">{i + 1}</span>
            <span className="schedule-slot-name">
              {studentMap.get(slot.studentId) ?? slot.studentId}
            </span>
            <span className={`schedule-slot-activity item-type-badge item-type-${slot.itemType}`}>
              {slot.itemName}
            </span>
          </li>
        ))}
      </ul>
      <div className="schedule-controls">
        <div className="schedule-shift-toggle">
          <button
            className={`schedule-shift-btn${meta.shift === 'day' ? ' active' : ''}`}
            onClick={() => onChange({ shift: 'day' })}
          >
            Day
          </button>
          <button
            className={`schedule-shift-btn${meta.shift === 'night' ? ' active' : ''}`}
            onClick={() => onChange({ shift: 'night' })}
          >
            Night
          </button>
        </div>
        <select
          className="input-sm schedule-select"
          value={meta.instructor}
          onChange={e => onChange({ instructor: e.target.value })}
        >
          <option value="">— Instructor —</option>
          {instructors.map(ins => (
            <option key={ins} value={ins}>{ins}</option>
          ))}
        </select>
        <select
          className="input-sm schedule-select"
          value={meta.simulator}
          onChange={e => onChange({ simulator: e.target.value })}
        >
          <option value="">— Simulator —</option>
          {simulators.map(sim => (
            <option key={sim} value={sim}>{sim}</option>
          ))}
        </select>
        <textarea
          className="input-sm schedule-notes"
          value={meta.notes}
          onChange={e => onChange({ notes: e.target.value })}
          placeholder="Notes"
          rows={2}
        />
      </div>
    </div>
  )
}
