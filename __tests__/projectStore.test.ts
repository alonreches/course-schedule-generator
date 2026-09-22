import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { saveProjectFile, loadProjectFile } from '../electron/projectStore'
import { scheduleGenerator } from '../src/scheduleGenerator'
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
