import { ipcMain, dialog, BrowserWindow } from 'electron'
import { createTemplateStore } from './store'
import { saveProjectFile, loadProjectFile } from './projectStore'
import type { TemplateUpdates, ProjectFile } from '../src/types'

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

  ipcMain.handle('project:save', (_e, filePath: string, data: ProjectFile) => {
    saveProjectFile(filePath, data)
  })

  ipcMain.handle('project:saveAs', async (_e, data: ProjectFile) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showSaveDialog(win, {
      filters: [{ name: 'Course Project', extensions: ['json'] }],
      defaultPath: 'course.json',
    })
    if (result.canceled || !result.filePath) return null
    saveProjectFile(result.filePath, data)
    return { filePath: result.filePath }
  })

  ipcMain.handle('project:open', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      filters: [{ name: 'Course Project', extensions: ['json'] }],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const data = loadProjectFile(result.filePaths[0])
    return { filePath: result.filePaths[0], data }
  })

  ipcMain.handle('dialog:confirmUnsaved', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return 2
    const { response } = await dialog.showMessageBox(win, {
      type: 'warning',
      buttons: ['Save', "Don't Save", 'Cancel'],
      defaultId: 0,
      cancelId: 2,
      message: 'You have unsaved changes. Save before continuing?',
    })
    return response
  })
}
