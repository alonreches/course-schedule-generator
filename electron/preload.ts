import { contextBridge, ipcRenderer } from 'electron'
import type { AppStore, NamedTemplate, TemplateUpdates } from '../src/types'

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
})
