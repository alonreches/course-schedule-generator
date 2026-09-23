import { useState } from 'react'
import type { CourseConfig, NamedTemplate, Student } from './types'

interface Props {
  templates: NamedTemplate[]
  onComplete: (config: CourseConfig) => void
  onCancel: () => void
}

type Step = 1 | 2 | 3

export default function CourseWizard({ templates, onComplete, onCancel }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [templateId, setTemplateId] = useState('')
  const [courseName, setCourseName] = useState('')
  const [studentCount, setStudentCount] = useState(1)
  const [studentNames, setStudentNames] = useState<string[]>([''])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [extraDaysOff, setExtraDaysOff] = useState<string[]>([])
  const [dayOffInput, setDayOffInput] = useState('')

  const selectedTemplate = templates.find(t => t.id === templateId) ?? null

  const step1Valid = templateId !== ''
  const step2Valid = studentCount >= 1
  const step3Valid = startDate !== '' && endDate !== '' && endDate > startDate

  function buildStudents(): Student[] {
    return Array.from({ length: studentCount }, (_, i) => ({
      id: `student-${i + 1}`,
      name: studentNames[i]?.trim() || `S${i + 1}`,
    }))
  }

  function handleStudentCountChange(count: number) {
    setStudentCount(count)
    setStudentNames(prev => {
      if (count > prev.length) return [...prev, ...Array(count - prev.length).fill('')]
      return prev.slice(0, count)
    })
  }

  function handleFinish() {
    if (!selectedTemplate || !step3Valid) return
    onComplete({
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      templateSnapshot: { items: selectedTemplate.items.map(item => ({ ...item })) },
      courseName: courseName.trim() || 'Untitled Course',
      students: buildStudents(),
      startDate,
      endDate,
      extraDaysOff,
    })
  }

  function addDayOff() {
    if (dayOffInput && !extraDaysOff.includes(dayOffInput)) {
      setExtraDaysOff(prev => [...prev, dayOffInput].sort())
      setDayOffInput('')
    }
  }

  function removeDayOff(date: string) {
    setExtraDaysOff(prev => prev.filter(d => d !== date))
  }

  const stepValid = [step1Valid, step2Valid, step3Valid][step - 1]

  return (
    <div className="wizard-overlay">
      <div className="wizard-modal">
        <div className="wizard-header">
          <h2 className="wizard-title">New Course</h2>
          <div className="wizard-steps" aria-label={`Step ${step} of 3`}>
            <span className={`wizard-step-dot${step >= 1 ? ' active' : ''}`} />
            <span className={`wizard-step-dot${step >= 2 ? ' active' : ''}`} />
            <span className={`wizard-step-dot${step >= 3 ? ' active' : ''}`} />
          </div>
        </div>

        <div className="wizard-body">
          {step === 1 && (
            <WizardStep1
              templates={templates}
              templateId={templateId}
              onTemplateChange={setTemplateId}
            />
          )}
          {step === 2 && (
            <WizardStep2
              courseName={courseName}
              onCourseNameChange={setCourseName}
              studentCount={studentCount}
              onStudentCountChange={handleStudentCountChange}
              studentNames={studentNames}
              onStudentNamesChange={setStudentNames}
            />
          )}
          {step === 3 && (
            <WizardStep3
              startDate={startDate}
              endDate={endDate}
              extraDaysOff={extraDaysOff}
              dayOffInput={dayOffInput}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onDayOffInputChange={setDayOffInput}
              onAddDayOff={addDayOff}
              onRemoveDayOff={removeDayOff}
            />
          )}
        </div>

        <div className="wizard-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <div className="wizard-nav">
            {step > 1 && (
              <button className="btn btn-ghost" onClick={() => setStep(prevStep => (prevStep - 1) as Step)}>
                Back
              </button>
            )}
            {step < 3 && (
              <button className="btn" disabled={!stepValid} onClick={() => setStep(prevStep => (prevStep + 1) as Step)}>
                Next
              </button>
            )}
            {step === 3 && (
              <button className="btn" disabled={!stepValid} onClick={handleFinish}>
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 1: template picker ────────────────────────────────────────────────────

interface Step1Props {
  templates: NamedTemplate[]
  templateId: string
  onTemplateChange: (id: string) => void
}

function WizardStep1({ templates, templateId, onTemplateChange }: Step1Props) {
  return (
    <div className="wizard-step">
      <h3 className="wizard-step-title">Pick a template</h3>
      {templates.length === 0 ? (
        <p className="wizard-hint">No templates available. Create one in the Templates screen first.</p>
      ) : (
        <div className="wizard-field">
          <label htmlFor="wizard-template" className="wizard-label">Template</label>
          <select
            id="wizard-template"
            className="input-sm wizard-select"
            value={templateId}
            onChange={e => onTemplateChange(e.target.value)}
          >
            <option value="">— select a template —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

// ── Step 2: course details ─────────────────────────────────────────────────────

interface Step2Props {
  courseName: string
  onCourseNameChange: (value: string) => void
  studentCount: number
  onStudentCountChange: (count: number) => void
  studentNames: string[]
  onStudentNamesChange: (names: string[]) => void
}

function WizardStep2({
  courseName, onCourseNameChange,
  studentCount, onStudentCountChange,
  studentNames, onStudentNamesChange,
}: Step2Props) {
  return (
    <div className="wizard-step">
      <h3 className="wizard-step-title">Course details</h3>
      <div className="wizard-field">
        <label htmlFor="wizard-course-name" className="wizard-label">Course name</label>
        <input
          id="wizard-course-name"
          className="input-sm wizard-input"
          value={courseName}
          onChange={e => onCourseNameChange(e.target.value)}
          placeholder="e.g. January 2025"
        />
      </div>
      <div className="wizard-field">
        <label htmlFor="wizard-student-count" className="wizard-label">Student count</label>
        <input
          id="wizard-student-count"
          className="input-sm input-number"
          type="number"
          min={1}
          value={studentCount}
          onChange={e => onStudentCountChange(Math.max(0, parseInt(e.target.value) || 0))}
        />
      </div>
      <div className="wizard-field">
        <span className="wizard-label">
          Student names <span className="wizard-optional">(optional)</span>
        </span>
        <div className="wizard-name-list">
          {Array.from({ length: studentCount }, (_, i) => (
            <div key={i} className="wizard-name-row">
              <span className="wizard-name-number">{i + 1}</span>
              <input
                className="input-sm wizard-input"
                aria-label={`Student name ${i + 1}`}
                value={studentNames[i] ?? ''}
                onChange={e => {
                  const next = [...studentNames]
                  next[i] = e.target.value
                  onStudentNamesChange(next)
                }}
                placeholder={`S${i + 1}`}
              />
            </div>
          ))}
        </div>
        <p className="wizard-hint">Leave blank to auto-label students S1, S2, S3…</p>
      </div>
    </div>
  )
}

// ── Step 3: dates ─────────────────────────────────────────────────────────────

interface Step3Props {
  startDate: string
  endDate: string
  extraDaysOff: string[]
  dayOffInput: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onDayOffInputChange: (value: string) => void
  onAddDayOff: () => void
  onRemoveDayOff: (date: string) => void
}

function WizardStep3({
  startDate, endDate, extraDaysOff, dayOffInput,
  onStartDateChange, onEndDateChange,
  onDayOffInputChange, onAddDayOff, onRemoveDayOff,
}: Step3Props) {
  const dateError =
    startDate && endDate && endDate <= startDate
      ? 'End date must be after start date'
      : null

  return (
    <div className="wizard-step">
      <h3 className="wizard-step-title">Dates</h3>
      <div className="wizard-field-row">
        <div className="wizard-field">
          <label htmlFor="wizard-start-date" className="wizard-label">Start date</label>
          <input
            id="wizard-start-date"
            className="input-sm"
            type="date"
            value={startDate}
            onChange={e => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="wizard-field">
          <label htmlFor="wizard-end-date" className="wizard-label">End date</label>
          <input
            id="wizard-end-date"
            className="input-sm"
            type="date"
            value={endDate}
            onChange={e => onEndDateChange(e.target.value)}
          />
        </div>
      </div>
      {dateError && <p className="wizard-error">{dateError}</p>}
      <p className="wizard-hint">Saturdays and Sundays are automatically excluded from the schedule.</p>
      <div className="wizard-field">
        <span className="wizard-label">Additional days off</span>
        <div className="add-row">
          <input
            className="input-sm"
            type="date"
            value={dayOffInput}
            onChange={e => onDayOffInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAddDayOff()}
          />
          <button className="btn" onClick={onAddDayOff} disabled={!dayOffInput}>
            Add
          </button>
        </div>
        {extraDaysOff.length > 0 && (
          <ul className="items-list wizard-daysoff-list">
            {extraDaysOff.map(d => (
              <li key={d} className="item-row">
                <span className="item-name">{d}</span>
                <button className="btn-icon btn-danger" onClick={() => onRemoveDayOff(d)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
