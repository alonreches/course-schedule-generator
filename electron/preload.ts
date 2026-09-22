import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type { AppStore, NamedTemplate, ProjectFile, TemplateUpdates, TemplateImportOutcome } from '../src/types'

contextBridge.exposeInMainWorld('api', {
  getAll: (): Promise<AppStore> => ipcRenderer.invoke('store:getAll'),
  createTemplate: (name: string): Promise<NamedTemplate> => ipcRenderer.invoke('store:createTemplate', name),
  updateTemplate: (id: string, updates: TemplateUpdates): Promise<void> =>
    ipcRenderer.invoke('store:updateTemplate', id, updates),
  deleteTemplate: (id: string): Promise<void> => ipcRenderer.invoke('store:deleteTemplate', id),
  duplicateTemplate: (id: string): Promise<NamedTemplate | null> => ipcRenderer.invoke('store:duplicateTemplate', id),
  addInstructor: (name: string): Promise<void> => ipcRenderer.invoke('store:addInstructor', name),
  renameInstructor: (index: number, name: string): Promise<void> =>
    ipcRenderer.invoke('store:renameInstructor', index, name),
  removeInstructor: (index: number): Promise<void> => ipcRenderer.invoke('store:removeInstructor', index),
  addSimulator: (name: string): Promise<void> => ipcRenderer.invoke('store:addSimulator', name),
  renameSimulator: (index: number, name: string): Promise<void> =>
    ipcRenderer.invoke('store:renameSimulator', index, name),
  removeSimulator: (index: number): Promise<void> => ipcRenderer.invoke('store:removeSimulator', index),

  exportTemplate: (id: string): Promise<{ filePath: string } | null> =>
    ipcRenderer.invoke('template:export', id),
  importTemplate: (): Promise<{ outcome: 'imported'; template: NamedTemplate } | { outcome: Exclude<TemplateImportOutcome, 'imported'> }> =>
    ipcRenderer.invoke('template:import'),

  saveProject: (filePath: string, data: ProjectFile): Promise<void> =>
    ipcRenderer.invoke('project:save', filePath, data),
  saveAsProject: (data: ProjectFile): Promise<{ filePath: string } | null> =>
    ipcRenderer.invoke('project:saveAs', data),
  openProject: (): Promise<{ filePath: string; data: ProjectFile } | null> =>
    ipcRenderer.invoke('project:open'),
  confirmUnsaved: (): Promise<number> =>
    ipcRenderer.invoke('dialog:confirmUnsaved'),
  exportHtml: (html: string): Promise<{ filePath: string } | null> =>
    ipcRenderer.invoke('project:exportHtml', html),

  onMenuNew: (cb: () => void): (() => void) => {
    const handler = (_e: IpcRendererEvent) => cb()
    ipcRenderer.on('menu:new', handler)
    return () => ipcRenderer.removeListener('menu:new', handler)
  },
  onMenuOpen: (cb: () => void): (() => void) => {
    const handler = (_e: IpcRendererEvent) => cb()
    ipcRenderer.on('menu:open', handler)
    return () => ipcRenderer.removeListener('menu:open', handler)
  },
  onMenuSave: (cb: () => void): (() => void) => {
    const handler = (_e: IpcRendererEvent) => cb()
    ipcRenderer.on('menu:save', handler)
    return () => ipcRenderer.removeListener('menu:save', handler)
  },
  onMenuSaveAs: (cb: () => void): (() => void) => {
    const handler = (_e: IpcRendererEvent) => cb()
    ipcRenderer.on('menu:saveAs', handler)
    return () => ipcRenderer.removeListener('menu:saveAs', handler)
  },
  onMenuExportHtml: (cb: () => void): (() => void) => {
    const handler = (_e: IpcRendererEvent) => cb()
    ipcRenderer.on('menu:exportHtml', handler)
    return () => ipcRenderer.removeListener('menu:exportHtml', handler)
  },
})
