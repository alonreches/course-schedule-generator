import { useState, useEffect, useRef } from 'react'
import './index.css'
import TemplatesScreen from './TemplatesScreen'
import CourseWizard from './CourseWizard'
import ScheduleView from './ScheduleView'
import StatsTab from './StatsTab'
import { scheduleGenerator } from './scheduleGenerator'
import type { CircuitDay, CourseConfig, CourseSchedule, NamedTemplate, SlotAssignment, Student } from './types'

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

function snapshot(schedule: CourseSchedule | null, courseConfig: CourseConfig | null): string {
  return JSON.stringify({ schedule, courseConfig })
}

type AppContent = 'templates' | 'schedule' | 'stats' | null

export default function App() {
  const [content, setContent] = useState<AppContent>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardTemplates, setWizardTemplates] = useState<NamedTemplate[]>([])

  const [schedule, setSchedule] = useState<CourseSchedule | null>(null)
  const [courseConfig, setCourseConfig] = useState<CourseConfig | null>(null)
  const [scheduleStudents, setScheduleStudents] = useState<Student[]>([])
  const [activeWeekIndex, setActiveWeekIndex] = useState(0)
  const [instructors, setInstructors] = useState<string[]>([])
  const [simulators, setSimulators] = useState<string[]>([])
  const [projectPath, setProjectPath] = useState<string | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)

  const isDirty = schedule !== null && snapshot(schedule, courseConfig) !== savedSnapshot

  const scheduleRef = useRef(schedule)
  scheduleRef.current = schedule
  const courseConfigRef = useRef(courseConfig)
  courseConfigRef.current = courseConfig
  const projectPathRef = useRef(projectPath)
  projectPathRef.current = projectPath
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty
  const instructorsRef = useRef(instructors)
  instructorsRef.current = instructors
  const simulatorsRef = useRef(simulators)
  simulatorsRef.current = simulators

  useEffect(() => {
    const basename = projectPath ? projectPath.split(/[\\/]/).pop() ?? projectPath : null
    document.title = basename
      ? isDirty ? `*${basename}` : basename
      : isDirty ? '*Untitled' : 'Course Scheduler'
  }, [projectPath, isDirty])

  async function checkUnsaved(): Promise<boolean> {
    if (!isDirtyRef.current) return true
    const response = await window.api.confirmUnsaved()
    if (response === 0) {
      await handleSave()
      return true
    } else if (response === 1) {
      return true
    }
    return false
  }

  async function handleSave() {
    const sched = scheduleRef.current
    const config = courseConfigRef.current
    const filePath = projectPathRef.current
    if (!sched || !config) return
    if (filePath) {
      await window.api.saveProject(filePath, { version: 1, courseConfig: config, schedule: sched })
      setSavedSnapshot(snapshot(sched, config))
    } else {
      await handleSaveAs()
    }
  }

  async function handleSaveAs() {
    const sched = scheduleRef.current
    const config = courseConfigRef.current
    if (!sched || !config) return
    const result = await window.api.saveAsProject({ version: 1, courseConfig: config, schedule: sched })
    if (result) {
      setProjectPath(result.filePath)
      setSavedSnapshot(snapshot(sched, config))
    }
  }

  async function handleOpen() {
    const canProceed = await checkUnsaved()
    if (!canProceed) return
    const result = await window.api.openProject()
    if (!result) return
    const { filePath, data } = result
    const config = data.courseConfig
    const sched = data.schedule
    setCourseConfig(config)
    setSchedule(sched)
    setScheduleStudents(config.students)
    setProjectPath(filePath)
    setSavedSnapshot(snapshot(sched, config))
    setActiveWeekIndex(0)
    setContent('schedule')
    const appData = await window.api.getAll()
    setInstructors(appData.instructors)
    setSimulators(appData.simulators)
  }

  async function handleNew() {
    const canProceed = await checkUnsaved()
    if (!canProceed) return
    setSchedule(null)
    setCourseConfig(null)
    setScheduleStudents([])
    setProjectPath(null)
    setSavedSnapshot(null)
    setContent(null)
    setActiveWeekIndex(0)
    await openWizard()
  }

  useEffect(() => {
    const unsubNew = window.api.onMenuNew(handleNew)
    const unsubOpen = window.api.onMenuOpen(handleOpen)
    const unsubSave = window.api.onMenuSave(handleSave)
    const unsubSaveAs = window.api.onMenuSaveAs(handleSaveAs)
    return () => {
      unsubNew()
      unsubOpen()
      unsubSave()
      unsubSaveAs()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function openWizard() {
    const data = await window.api.getAll()
    setWizardTemplates(data.templates)
    setInstructors(data.instructors)
    setSimulators(data.simulators)
    setShowWizard(true)
  }

  async function handleNewCourse() {
    const canProceed = await checkUnsaved()
    if (!canProceed) return
    setSchedule(null)
    setCourseConfig(null)
    setScheduleStudents([])
    setProjectPath(null)
    setSavedSnapshot(null)
    setContent(null)
    setActiveWeekIndex(0)
    await openWizard()
  }

  function handleWizardComplete(config: CourseConfig) {
    const courseDates = weekdaysInRange(config.startDate, config.endDate)
    const generated = scheduleGenerator({
      template: config.templateSnapshot,
      students: config.students,
      courseDates,
      daysOff: config.extraDaysOff,
    })
    setCourseConfig(config)
    setSchedule(generated)
    setScheduleStudents(config.students)
    setSavedSnapshot(null)
    setActiveWeekIndex(0)
    setContent('schedule')
    setShowWizard(false)
  }

  function handleWizardCancel() {
    setShowWizard(false)
  }

  function handleSlotChange(weekIndex: number, dayIndex: number, circuitIndex: number, slotIndex: number, patch: Partial<SlotAssignment>) {
    setSchedule(prev => {
      if (!prev) return prev
      return {
        weeks: prev.weeks.map((w, wi) =>
          wi !== weekIndex ? w : {
            ...w,
            days: w.days.map((d, di) =>
              di !== dayIndex ? d : {
                ...d,
                circuits: d.circuits.map((c, ci) =>
                  ci !== circuitIndex ? c : {
                    ...c,
                    slots: c.slots.map((s, si) =>
                      si !== slotIndex ? s : { ...s, ...patch }
                    ),
                  }
                ),
              }
            ),
          }
        ),
      }
    })
  }

  function handleCircuitDayChange(weekIndex: number, dayIndex: number, circuitIndex: number, patch: Partial<CircuitDay>) {
    setSchedule(prev => {
      if (!prev) return prev
      return {
        weeks: prev.weeks.map((w, wi) =>
          wi !== weekIndex ? w : {
            ...w,
            days: w.days.map((d, di) =>
              di !== dayIndex ? d : {
                ...d,
                circuits: d.circuits.map((c, ci) =>
                  ci !== circuitIndex ? c : { ...c, ...patch }
                ),
              }
            ),
          }
        ),
      }
    })
  }

  function handleWeekTabClick(index: number) {
    setActiveWeekIndex(index)
    setContent('schedule')
  }

  function handleTemplatesTabToggle() {
    const fallback: AppContent = schedule ? 'schedule' : null
    setContent(c => c === 'templates' ? fallback : 'templates')
  }

  function handleStatsTabClick() {
    setContent('stats')
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
        <button
          role="tab"
          className={`tab${content === 'stats' ? ' tab-active' : ''}`}
          aria-selected={content === 'stats'}
          onClick={handleStatsTabClick}
        >
          Stats
        </button>
        <button className="tab tab-new-course" onClick={handleNewCourse}>
          + New Course
        </button>
        <span className="tab-bar-spacer" />
        <button className="ribbon-btn" onClick={handleOpen}>Open</button>
        <button className="ribbon-btn" onClick={handleSave} disabled={!schedule}>Save</button>
        <button className="ribbon-btn" onClick={handleSaveAs} disabled={!schedule}>Export</button>
      </div>
      <main className="content">
        {content === 'templates' && <TemplatesScreen />}
        {content === 'schedule' && schedule && (
          <ScheduleView
            week={schedule.weeks[activeWeekIndex]}
            students={scheduleStudents}
            instructors={instructors}
            simulators={simulators}
            onSlotChange={(di, ci, si, patch) => handleSlotChange(activeWeekIndex, di, ci, si, patch)}
            onCircuitDayChange={(di, ci, patch) => handleCircuitDayChange(activeWeekIndex, di, ci, patch)}
          />
        )}
        {content === 'stats' && (
          schedule
            ? <StatsTab schedule={schedule} students={scheduleStudents} instructors={instructors} />
            : <div className="empty-state"><p className="empty-state-msg">No course open.</p><button className="btn btn-large" onClick={handleNewCourse}>New Course</button></div>
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
