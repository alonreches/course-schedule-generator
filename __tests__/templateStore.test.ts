import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createTemplateStore } from '../electron/store'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'templateStore-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('templateStore round-trip', () => {
  it('create → persist → reload → template is intact', () => {
    const store1 = createTemplateStore(tmpDir)
    const created = store1.createTemplate('My Template')
    store1.updateTemplate(created.id, {
      items: [
        { name: 'BSP-01', type: 'run' },
        { name: 'BSP-02', type: 'run' },
      ],
    })

    const store2 = createTemplateStore(tmpDir)
    const all = store2.getAll()
    expect(all.templates).toHaveLength(1)
    expect(all.templates[0].name).toBe('My Template')
    expect(all.templates[0].items).toEqual([
      { name: 'BSP-01', type: 'run' },
      { name: 'BSP-02', type: 'run' },
    ])
  })

  it('duplicate template creates a copy', () => {
    const store = createTemplateStore(tmpDir)
    const t = store.createTemplate('Original')
    store.updateTemplate(t.id, { items: [{ name: 'X', type: 'assessment' }] })
    const copy = store.duplicateTemplate(t.id)
    expect(copy).not.toBeNull()
    expect(copy!.name).toBe('Original (copy)')
    expect(copy!.items).toEqual([{ name: 'X', type: 'assessment' }])
    expect(copy!.id).not.toBe(t.id)
    expect(store.getAll().templates).toHaveLength(2)
  })

  it('delete template removes it', () => {
    const store = createTemplateStore(tmpDir)
    const t = store.createTemplate('ToDelete')
    store.deleteTemplate(t.id)
    expect(store.getAll().templates).toHaveLength(0)
  })

  it('instructor list persists across reloads', () => {
    const store1 = createTemplateStore(tmpDir)
    store1.addInstructor('Alice')
    store1.addInstructor('Bob')

    const store2 = createTemplateStore(tmpDir)
    expect(store2.getAll().instructors).toEqual(['Alice', 'Bob'])
  })

  it('rename instructor updates the name', () => {
    const store = createTemplateStore(tmpDir)
    store.addInstructor('Alice')
    store.renameInstructor(0, 'Alicia')
    expect(store.getAll().instructors[0]).toBe('Alicia')
  })

  it('remove instructor removes by index', () => {
    const store = createTemplateStore(tmpDir)
    store.addInstructor('Alice')
    store.addInstructor('Bob')
    store.removeInstructor(0)
    expect(store.getAll().instructors).toEqual(['Bob'])
  })

  it('simulator list persists across reloads', () => {
    const store1 = createTemplateStore(tmpDir)
    store1.addSimulator('Sim-A')

    const store2 = createTemplateStore(tmpDir)
    expect(store2.getAll().simulators).toEqual(['Sim-A'])
  })

  it('rename simulator updates the name', () => {
    const store = createTemplateStore(tmpDir)
    store.addSimulator('Sim-A')
    store.renameSimulator(0, 'Sim-Alpha')
    expect(store.getAll().simulators[0]).toBe('Sim-Alpha')
  })

  it('remove simulator removes by index', () => {
    const store = createTemplateStore(tmpDir)
    store.addSimulator('Sim-A')
    store.addSimulator('Sim-B')
    store.removeSimulator(1)
    expect(store.getAll().simulators).toEqual(['Sim-A'])
  })

  it('returns empty store when file does not exist', () => {
    const store = createTemplateStore(tmpDir)
    const all = store.getAll()
    expect(all.templates).toEqual([])
    expect(all.instructors).toEqual([])
    expect(all.simulators).toEqual([])
  })

  it('item reordering is persisted', () => {
    const store = createTemplateStore(tmpDir)
    const t = store.createTemplate('Ordered')
    store.updateTemplate(t.id, {
      items: [
        { name: 'A', type: 'run' },
        { name: 'B', type: 'run' },
        { name: 'C', type: 'run' },
      ],
    })
    store.updateTemplate(t.id, {
      items: [
        { name: 'C', type: 'run' },
        { name: 'A', type: 'run' },
        { name: 'B', type: 'run' },
      ],
    })
    const reloaded = createTemplateStore(tmpDir).getAll()
    expect(reloaded.templates[0].items.map(i => i.name)).toEqual(['C', 'A', 'B'])
  })
})
