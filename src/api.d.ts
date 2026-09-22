import type { AppStore, NamedTemplate, ProjectFile, TemplateUpdates, TemplateImportOutcome } from './types'

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
      exportTemplate(id: string): Promise<{ filePath: string } | null>
      importTemplate(): Promise<{ outcome: 'imported'; template: NamedTemplate } | { outcome: Exclude<TemplateImportOutcome, 'imported'> }>
      saveProject(filePath: string, data: ProjectFile): Promise<void>
      saveAsProject(data: ProjectFile): Promise<{ filePath: string } | null>
      openProject(): Promise<{ filePath: string; data: ProjectFile } | null>
      confirmUnsaved(): Promise<number>
      exportHtml(html: string): Promise<{ filePath: string } | null>
      onMenuNew(cb: () => void): () => void
      onMenuOpen(cb: () => void): () => void
      onMenuSave(cb: () => void): () => void
      onMenuSaveAs(cb: () => void): () => void
      onMenuExportHtml(cb: () => void): () => void
    }
  }
}
