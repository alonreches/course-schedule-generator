import type { CourseSchedule, Student } from './types'
import { computeSlotPositionStats, computeShiftStats, computeInstructorStats } from './computeStats'

interface Props {
  schedule: CourseSchedule
  students: Student[]
  instructors: string[]
}

export default function StatsTab({ schedule, students, instructors }: Props) {
  const { byStudent: slotPos, maxPosition } = computeSlotPositionStats(schedule)
  const { byStudent: shifts } = computeShiftStats(schedule)
  const { byInstructor, unassigned } = computeInstructorStats(schedule)

  const positions = Array.from({ length: maxPosition }, (_, i) => i + 1)

  return (
    <div className="stats-tab">
      <section className="stats-section">
        <h3 className="stats-heading">Slot Positions per Student</h3>
        <table className="stats-table">
          <thead>
            <tr>
              <th className="stats-th stats-th-label">Student</th>
              {positions.map(p => <th key={p} className="stats-th">Pos {p}</th>)}
            </tr>
          </thead>
          <tbody>
            {students.map(student => {
              const posMap = slotPos.get(student.id)
              return (
                <tr key={student.id}>
                  <td className="stats-td stats-td-label">{student.name}</td>
                  {positions.map(p => (
                    <td key={p} className="stats-td stats-td-num">{posMap?.get(p) ?? 0}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="stats-section">
        <h3 className="stats-heading">Shifts per Student</h3>
        <table className="stats-table">
          <thead>
            <tr>
              <th className="stats-th stats-th-label">Student</th>
              <th className="stats-th">Day</th>
              <th className="stats-th">Night</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => {
              const sc = shifts.get(student.id) ?? { day: 0, night: 0 }
              return (
                <tr key={student.id}>
                  <td className="stats-td stats-td-label">{student.name}</td>
                  <td className="stats-td stats-td-num">{sc.day}</td>
                  <td className="stats-td stats-td-num">{sc.night}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section className="stats-section">
        <h3 className="stats-heading">Assignments per Instructor</h3>
        {unassigned > 0 && (
          <p className="stats-note">
            {unassigned} circuit-day{unassigned !== 1 ? 's' : ''} unassigned
          </p>
        )}
        <table className="stats-table">
          <thead>
            <tr>
              <th className="stats-th stats-th-label">Instructor</th>
              <th className="stats-th">Circuit-Days</th>
            </tr>
          </thead>
          <tbody>
            {instructors.map(instructor => (
              <tr key={instructor}>
                <td className="stats-td stats-td-label">{instructor}</td>
                <td className="stats-td stats-td-num">{byInstructor.get(instructor) ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
