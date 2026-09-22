import fs from 'fs'
import type { ProjectFile } from '../src/types'

export function saveProjectFile(filePath: string, data: ProjectFile): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export function loadProjectFile(filePath: string): ProjectFile {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as ProjectFile
}
