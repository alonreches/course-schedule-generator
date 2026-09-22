import fs from 'fs'
import path from 'path'
import type { AppStore, NamedTemplate, TemplateUpdates } from '../src/types'

const STORE_FILE = 'app-store.json'

function emptyStore(): AppStore {
  return { templates: [], instructors: [], simulators: [] }
}

function load(dir: string): AppStore {
  const file = path.join(dir, STORE_FILE)
  try {
    const raw = fs.readFileSync(file, 'utf-8')
    return JSON.parse(raw) as AppStore
  } catch {
    return emptyStore()
  }
}

function save(dir: string, data: AppStore): void {
  const file = path.join(dir, STORE_FILE)
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function createTemplateStore(dir: string) {
  return {
    getAll(): AppStore {
      return load(dir)
    },

    createTemplate(name: string): NamedTemplate {
      const data = load(dir)
      const template: NamedTemplate = { id: newId(), name, items: [] }
      data.templates.push(template)
      save(dir, data)
      return template
    },

    updateTemplate(id: string, updates: TemplateUpdates): void {
      const data = load(dir)
      const t = data.templates.find(t => t.id === id)
      if (!t) return
      if (updates.name !== undefined) t.name = updates.name
      if (updates.items !== undefined) t.items = updates.items
      save(dir, data)
    },

    deleteTemplate(id: string): void {
      const data = load(dir)
      data.templates = data.templates.filter(t => t.id !== id)
      save(dir, data)
    },

    duplicateTemplate(id: string): NamedTemplate | null {
      const data = load(dir)
      const original = data.templates.find(t => t.id === id)
      if (!original) return null
      const copy: NamedTemplate = {
        id: newId(),
        name: `${original.name} (copy)`,
        items: original.items.map(i => ({ ...i })),
      }
      data.templates.push(copy)
      save(dir, data)
      return copy
    },

    addInstructor(name: string): void {
      const data = load(dir)
      data.instructors.push(name)
      save(dir, data)
    },

    renameInstructor(index: number, name: string): void {
      const data = load(dir)
      if (index >= 0 && index < data.instructors.length) {
        data.instructors[index] = name
        save(dir, data)
      }
    },

    removeInstructor(index: number): void {
      const data = load(dir)
      data.instructors.splice(index, 1)
      save(dir, data)
    },

    addSimulator(name: string): void {
      const data = load(dir)
      data.simulators.push(name)
      save(dir, data)
    },

    renameSimulator(index: number, name: string): void {
      const data = load(dir)
      if (index >= 0 && index < data.simulators.length) {
        data.simulators[index] = name
        save(dir, data)
      }
    },

    removeSimulator(index: number): void {
      const data = load(dir)
      data.simulators.splice(index, 1)
      save(dir, data)
    },

    exportTemplate(id: string): { name: string; items: NamedTemplate['items'] } | null {
      const data = load(dir)
      const t = data.templates.find(t => t.id === id)
      if (!t) return null
      return { name: t.name, items: t.items.map(i => ({ ...i })) }
    },

    importTemplate(name: string, items: NamedTemplate['items']): NamedTemplate {
      const data = load(dir)
      const template: NamedTemplate = { id: newId(), name, items: items.map(i => ({ ...i })) }
      data.templates.push(template)
      save(dir, data)
      return template
    },
  }
}
