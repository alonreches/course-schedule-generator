import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

Object.defineProperty(window, 'api', {
  value: {
    getAll: async () => ({ templates: [], instructors: [], simulators: [] }),
    createTemplate: async (name: string) => ({ id: 'test-id', name, items: [] }),
    updateTemplate: async () => {},
    deleteTemplate: async () => {},
    duplicateTemplate: async () => null,
    addInstructor: async () => {},
    renameInstructor: async () => {},
    removeInstructor: async () => {},
    addSimulator: async () => {},
    renameSimulator: async () => {},
    removeSimulator: async () => {},
    saveProject: async () => {},
    saveAsProject: async () => null,
    openProject: async () => null,
    confirmUnsaved: async () => 2,
    onMenuNew: () => () => {},
    onMenuOpen: () => () => {},
    onMenuSave: () => () => {},
    onMenuSaveAs: () => () => {},
  },
  writable: true,
})
