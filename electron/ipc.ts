import { ipcMain } from 'electron'
import { createTemplateStore } from './store'
import type { TemplateUpdates } from '../src/types'

export function registerIpcHandlers(userDataDir: string): void {
  const store = createTemplateStore(userDataDir)

  ipcMain.handle('store:getAll', () => store.getAll())
  ipcMain.handle('store:createTemplate', (_e, name: string) => store.createTemplate(name))
  ipcMain.handle('store:updateTemplate', (_e, id: string, updates: TemplateUpdates) =>
    store.updateTemplate(id, updates),
  )
  ipcMain.handle('store:deleteTemplate', (_e, id: string) => store.deleteTemplate(id))
  ipcMain.handle('store:duplicateTemplate', (_e, id: string) => store.duplicateTemplate(id))
  ipcMain.handle('store:addInstructor', (_e, name: string) => store.addInstructor(name))
  ipcMain.handle('store:renameInstructor', (_e, index: number, name: string) => store.renameInstructor(index, name))
  ipcMain.handle('store:removeInstructor', (_e, index: number) => store.removeInstructor(index))
  ipcMain.handle('store:addSimulator', (_e, name: string) => store.addSimulator(name))
  ipcMain.handle('store:renameSimulator', (_e, index: number, name: string) => store.renameSimulator(index, name))
  ipcMain.handle('store:removeSimulator', (_e, index: number) => store.removeSimulator(index))
}
