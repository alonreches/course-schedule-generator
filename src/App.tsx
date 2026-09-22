import { useState } from 'react'
import './index.css'
import TemplatesScreen from './TemplatesScreen'
import CourseWizard from './CourseWizard'
import ScheduleView from './ScheduleView'
import { scheduleGenerator } from './scheduleGenerator'
import type { CourseConfig, CourseSchedule, NamedTemplate, Student } from './types'

function weekdaysInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const cur = new Date(startDate + 'T00:00:00Z')
  const end = new Date(endDate + 'T00:00:00Z')
  while (cur <= end) {
    const dow = cur.getUTCDay()
    if (dow >= 1 && dow <= 5) {
      dates.push(cur.toISOString().slice(0, 10))
    }
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

type AppContent = 'templates' | 'schedule' | null

export default function App() {
  const [content, setContent] = useState<AppContent>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardTemplates, setWizardTemplates] = useState<NamedTemplate[]>([])

  const [schedule, setSchedule] = useState<CourseSchedule | null>(null)
  const [scheduleStudents, setScheduleStudents] = useState<Student[]>([])
  const [activeWeekIndex, setActiveWeekIndex] = useState(0)
  const [instructors, setInstructors] = useState<string[]>([])
  const [simulators, setSimulators] = useState<string[]>([])

  async function handleNewCourse() {
    const data = await window.api.getAll()
    setWizardTemplates(data.templates)
    setInstructors(data.instructors)
    setSimulators(data.simulators)
    setShowWizard(true)
  }

  function handleWizardComplete(config: CourseConfig) {
    const courseDates = weekdaysInRange(config.startDate, config.endDate)
    const generated = scheduleGenerator({
      template: config.templateSnapshot,
      students: config.students,
      courseDates,
      daysOff: config.extraDaysOff,
    })
    setSchedule(generated)
    setScheduleStudents(config.students)
    setActiveWeekIndex(0)
    setContent('schedule')
    setShowWizard(false)
  }

  function handleWizardCancel() {
    setShowWizard(false)
  }

  function handleWeekTabClick(index: number) {
    setActiveWeekIndex(index)
    setContent('schedule')
  }

  function handleTemplatesTabToggle() {
    const fallback: AppContent = schedule ? 'schedule' : null
    setContent(c => c === 'templates' ? fallback : 'templates')
  }

  return (
    <div className="app">
      <div role="tablist" className="tab-bar" aria-label="Navigation tabs">
        <button
          role="tab"
          className={`tab${content === 'templates' ? ' tab-active' : ''}`}
          aria-selected={content === 'templates'}
          onClick={handleTemplatesTabToggle}
        >
          Templates
        </button>
        {schedule ? (
          schedule.weeks.map((w, i) => (
            <button
              key={w.weekNumber}
              role="tab"
              className={`tab${content === 'schedule' && activeWeekIndex === i ? ' tab-active' : ''}`}
              aria-selected={content === 'schedule' && activeWeekIndex === i}
              onClick={() => handleWeekTabClick(i)}
            >
              Week {w.weekNumber}
            </button>
          ))
        ) : (
          content !== 'templates' && (
            <span className="tab-bar-empty">No courses open</span>
          )
        )}
        <button className="tab tab-new-course" onClick={handleNewCourse}>
          + New Course
        </button>
      </div>
      <main className="content">
        {content === 'templates' && <TemplatesScreen />}
        {content === 'schedule' && schedule && (
          <ScheduleView
            week={schedule.weeks[activeWeekIndex]}
            students={scheduleStudents}
            instructors={instructors}
            simulators={simulators}
          />
        )}
        {content === null && (
          <div className="empty-state">
            <p className="empty-state-msg">No course open.</p>
            <button className="btn btn-large" onClick={handleNewCourse}>New Course</button>
          </div>
        )}
      </main>
      {showWizard && (
        <CourseWizard
          templates={wizardTemplates}
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      )}
    </div>
  )
}
