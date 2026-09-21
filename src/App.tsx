import './index.css'

export default function App() {
  return (
    <div className="app">
      <div role="tablist" className="tab-bar" aria-label="Course tabs">
        <span className="tab-bar-empty">No courses open</span>
      </div>
      <main className="content" />
    </div>
  )
}
