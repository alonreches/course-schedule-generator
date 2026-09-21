import { useState } from 'react'
import './index.css'
import TemplatesScreen from './TemplatesScreen'

type ActiveView = 'templates' | null

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>(null)

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
      </main>
    </div>
  )
}
