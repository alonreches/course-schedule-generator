import type { AppStore, NamedTemplate, TemplateUpdates } from './types'

declare global {
  interface Window {
    api: {
      getAll(): Promise<AppStore>
      createTemplate(name: string): Promise<NamedTemplate>
      updateTemplate(id: string, updates: TemplateUpdates): Promise<void>
      deleteTemplate(id: string): Promise<void>
      duplicateTemplate(id: string): Promise<NamedTemplate | null>
      addInstructor(name: string): Promise<void>
      renameInstructor(index: number, name: string): Promise<void>
      removeInstructor(index: number): Promise<void>
      addSimulator(name: string): Promise<void>
      renameSimulator(index: number, name: string): Promise<void>
      removeSimulator(index: number): Promise<void>
    }
  }
}
