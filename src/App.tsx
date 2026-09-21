import { useState } from 'react'
import './index.css'
import TemplatesScreen from './TemplatesScreen'
import CourseWizard from './CourseWizard'
import type { CourseConfig, NamedTemplate } from './types'

type ActiveView = 'templates' | null

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [courseConfig, setCourseConfig] = useState<CourseConfig | null>(null)
  const [wizardTemplates, setWizardTemplates] = useState<NamedTemplate[]>([])

  async function handleNewCourse() {
    const data = await window.api.getAll()
    setWizardTemplates(data.templates)
    setShowWizard(true)
  }

  function handleWizardComplete(config: CourseConfig) {
    setCourseConfig(config)
    setShowWizard(false)
  }

  function handleWizardCancel() {
    setShowWizard(false)
  }

  return (
    <div className="app">
      <div role="tablist" className="tab-bar" aria-label="Course tabs">
        <button
          role="tab"
          className={`tab${activeView === 'templates' ? ' tab-active' : ''}`}
          aria-selected={activeView === 'templates'}
          onClick={() => setActiveView(v => v === 'templates' ? null : 'templates')}
        >
          Templates
        </button>
        {activeView !== 'templates' && (
          <span className="tab-bar-empty">No courses open</span>
        )}
      </div>
      <main className="content">
        {activeView === 'templates' && <TemplatesScreen />}
        {activeView === null && !courseConfig && (
          <div className="empty-state">
            <p className="empty-state-msg">No course open.</p>
            <button className="btn btn-large" onClick={handleNewCourse}>New Course</button>
          </div>
        )}
        {activeView === null && courseConfig && (
          <div className="course-ready">
            <p>Course <strong>{courseConfig.courseName}</strong> is ready for schedule generation.</p>
            <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={handleNewCourse}>
              New Course
            </button>
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
