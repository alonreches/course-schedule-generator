import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { saveProjectFile, loadProjectFile } from '../electron/projectStore'
import { scheduleGenerator } from '../src/scheduleGenerator'
import { generateHtml } from '../src/htmlExport'
import type { CourseConfig, ProjectFile } from '../src/types'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'projectStore-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('projectStore round-trip', () => {
  it('saves and reloads a project file with schedule equal to the saved one', () => {
    const config: CourseConfig = {
      templateId: 'tmpl-1',
      templateName: 'Basic',
      templateSnapshot: { items: [{ name: 'BSP-01', type: 'run' }, { name: 'BSP-02', type: 'assessment' }] },
      courseName: 'Course A',
      students: [{ id: 's1', name: 'Alice' }, { id: 's2', name: 'Bob' }, { id: 's3', name: 'Charlie' }],
      startDate: '2025-01-06',
      endDate: '2025-01-10',
      extraDaysOff: [],
    }

    const courseDates = ['2025-01-06', '2025-01-07', '2025-01-08', '2025-01-09', '2025-01-10']
    const schedule = scheduleGenerator({
      template: config.templateSnapshot,
      students: config.students,
      courseDates,
      daysOff: [],
    })

    const projectFile: ProjectFile = { version: 1, courseConfig: config, schedule }
    const filePath = path.join(tmpDir, 'test-project.json')

    saveProjectFile(filePath, projectFile)
    const loaded = loadProjectFile(filePath)

    expect(loaded.version).toBe(1)
    expect(loaded.courseConfig).toEqual(config)
    expect(loaded.schedule).toEqual(schedule)
  })
})

const htmlTestStudents = [
  { id: 's1', name: 'Alice' },
  { id: 's2', name: 'Bob' },
  { id: 's3', name: 'Charlie' },
]

describe('generateHtml', () => {
  it('places student names and run names inside circuit-block cells', () => {
    const schedule = scheduleGenerator({
      template: { items: [{ name: 'BSP-01', type: 'run' }, { name: 'BSP-02', type: 'assessment' }] },
      students: htmlTestStudents,
      courseDates: ['2025-01-06', '2025-01-07'],
      daysOff: [],
    })

    const html = generateHtml(schedule, htmlTestStudents)

    // Split on circuit-block boundaries to verify names land inside cells, not elsewhere
    const circuitBlocks = html.split('<td class="circuit-block')
    expect(circuitBlocks.length).toBeGreaterThan(1)

    const blockContent = circuitBlocks.slice(1).join('')
    expect(blockContent).toContain('Alice')
    expect(blockContent).toContain('Bob')
    expect(blockContent).toContain('Charlie')
    expect(blockContent).toContain('BSP-01')
    expect(blockContent).toContain('BSP-02')

    // Week section and circuit column headers appear outside circuit blocks
    expect(html).toContain('Week 1')
    expect(html).toContain('Circuit')
  })

  it('applies night-shift background colour to night blocks and labels them Night', () => {
    const schedule = scheduleGenerator({
      template: { items: [{ name: 'BSP-01', type: 'run' }] },
      students: htmlTestStudents,
      courseDates: ['2025-01-06'],
      daysOff: [],
    })

    schedule.weeks[0].days[0].circuits[0].shift = 'night'
    const html = generateHtml(schedule, htmlTestStudents)

    // Night block must carry inline background matching the in-app colour
    expect(html).toContain('background:#12122a')
    // The shift label must read Night
    expect(html).toContain('Night')
    // Day blocks must not receive the night background
    const nightBlocks = html.split('background:#12122a')
    expect(nightBlocks.length - 1).toBe(
      schedule.weeks[0].days[0].circuits.filter(c => c.shift === 'night').length + 1, // +1 for the CSS rule
    )
  })

  it('includes instructor, simulator, and notes in the correct circuit-day block', () => {
    const schedule = scheduleGenerator({
      template: { items: [{ name: 'RUN-A', type: 'run' }] },
      students: htmlTestStudents,
      courseDates: ['2025-03-10'],
      daysOff: [],
    })

    schedule.weeks[0].days[0].circuits[0].instructor = 'Dr Smith'
    schedule.weeks[0].days[0].circuits[0].simulator = 'Sim-7'
    schedule.weeks[0].days[0].circuits[0].notes = 'Bring checklist'

    const html = generateHtml(schedule, htmlTestStudents)
    const circuitBlocks = html.split('<td class="circuit-block')
    const firstBlock = circuitBlocks[1]

    expect(firstBlock).toContain('Dr Smith')
    expect(firstBlock).toContain('Sim-7')
    expect(firstBlock).toContain('Bring checklist')
  })
})
