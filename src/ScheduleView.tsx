import { Fragment } from 'react'
import type { CircuitDay, CourseDay, CourseWeek, SlotAssignment, Student } from './types'

interface Props {
  week: CourseWeek
  students: Student[]
  instructors: string[]
  simulators: string[]
  onSlotChange: (dayIndex: number, circuitIndex: number, slotIndex: number, patch: Partial<SlotAssignment>) => void
  onCircuitDayChange: (dayIndex: number, circuitIndex: number, patch: Partial<CircuitDay>) => void
  onCourseDayChange: (dayIndex: number, patch: Partial<CourseDay>) => void
}

export default function ScheduleView({ week, students, instructors, simulators, onSlotChange, onCircuitDayChange, onCourseDayChange }: Props) {
  const studentMap = new Map(students.map(s => [s.id, s.name]))
  const nameToStudent = new Map(students.map(s => [s.name, s]))

  if (week.days.length === 0) {
    return <div className="schedule-empty">No active days this week.</div>
  }

  const numCircuits = week.days[0].circuits.length

  return (
    <div className="schedule-container">
      <datalist id="schedule-students-list">
        {students.map(s => <option key={s.id} value={s.name} />)}
      </datalist>
      <datalist id="schedule-instructors-list">
        {instructors.map(ins => <option key={ins} value={ins} />)}
      </datalist>
      <datalist id="schedule-simulators-list">
        {simulators.map(sim => <option key={sim} value={sim} />)}
      </datalist>

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

        {week.days.map((day, dayIndex) => (
          <Fragment key={day.date}>
            <div className="schedule-day-header">
              <span className="schedule-day-date">{formatDate(day.date)}</span>
              <span className={`item-type-badge item-type-${day.type}`}>
                {day.type === 'assessment' ? 'Assessment' : 'Run'}
              </span>
              <textarea
                className="input-sm schedule-day-note"
                value={day.notes ?? ''}
                onChange={e => onCourseDayChange(dayIndex, { notes: e.target.value })}
                placeholder="Day note"
                rows={2}
              />
            </div>
            {day.circuits.map((cd, circuitIndex) => (
              <CircuitBlock
                key={cd.circuitId}
                circuitDay={cd}
                studentMap={studentMap}
                nameToStudent={nameToStudent}
                onSlotChange={(si, patch) => onSlotChange(dayIndex, circuitIndex, si, patch)}
                onChange={patch => onCircuitDayChange(dayIndex, circuitIndex, patch)}
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
  studentMap: Map<string, string>
  nameToStudent: Map<string, Student>
  onSlotChange: (slotIndex: number, patch: Partial<SlotAssignment>) => void
  onChange: (patch: Partial<CircuitDay>) => void
}

function CircuitBlock({ circuitDay, studentMap, nameToStudent, onSlotChange, onChange }: CircuitBlockProps) {
  const shift = circuitDay.shift ?? 'day'

  return (
    <div className={`schedule-circuit-block${shift === 'night' ? ' schedule-night' : ''}${circuitDay.edited ? ' schedule-circuit-edited' : ''}`}>
      <div className="schedule-circuit-type">
        <button
          className={`schedule-type-btn${circuitDay.type === 'run' ? ' schedule-type-run' : ''}`}
          onClick={() => onChange({ type: 'run', edited: true })}
        >
          Run
        </button>
        <button
          className={`schedule-type-btn${circuitDay.type === 'assessment' ? ' schedule-type-assessment' : ''}`}
          onClick={() => onChange({ type: 'assessment', edited: true })}
        >
          Assess
        </button>
      </div>
      <ul className="schedule-slots">
        {circuitDay.slots.map((slot, i) => {
          const displayName = slot.studentOverride ?? studentMap.get(slot.studentId) ?? slot.studentId
          return (
            <li key={i} className={`schedule-slot${slot.edited ? ' schedule-slot-edited' : ''}`}>
              <span className="schedule-slot-num">{i + 1}</span>
              <input
                className="input-sm schedule-slot-student"
                list="schedule-students-list"
                value={displayName}
                onChange={e => {
                  const val = e.target.value
                  const match = nameToStudent.get(val)
                  if (match) {
                    onSlotChange(i, { studentId: match.id, studentOverride: undefined, edited: true })
                  } else {
                    onSlotChange(i, { studentOverride: val, edited: true })
                  }
                }}
              />
              <input
                className="input-sm schedule-slot-item"
                value={slot.itemName}
                onChange={e => onSlotChange(i, { itemName: e.target.value, edited: true })}
              />
              <span className={`item-type-badge item-type-${slot.itemType} schedule-slot-activity`}>
                {slot.itemType === 'assessment' ? 'A' : 'R'}
              </span>
            </li>
          )
        })}
      </ul>
      <div className="schedule-controls">
        <div className="schedule-shift-toggle">
          <button
            className={`schedule-shift-btn${shift === 'day' ? ' active' : ''}`}
            onClick={() => onChange({ shift: 'day', edited: true })}
          >
            Day
          </button>
          <button
            className={`schedule-shift-btn${shift === 'night' ? ' active' : ''}`}
            onClick={() => onChange({ shift: 'night', edited: true })}
          >
            Night
          </button>
        </div>
        <input
          className="input-sm schedule-select"
          list="schedule-instructors-list"
          value={circuitDay.instructor ?? ''}
          onChange={e => onChange({ instructor: e.target.value, edited: true })}
          placeholder="— Instructor —"
        />
        <input
          className="input-sm schedule-select"
          list="schedule-simulators-list"
          value={circuitDay.simulator ?? ''}
          onChange={e => onChange({ simulator: e.target.value, edited: true })}
          placeholder="— Simulator —"
        />
        <textarea
          className="input-sm schedule-notes"
          value={circuitDay.notes ?? ''}
          onChange={e => onChange({ notes: e.target.value, edited: true })}
          placeholder="Notes"
          rows={2}
        />
      </div>
    </div>
  )
}
