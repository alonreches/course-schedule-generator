import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs'
import { createTemplateStore } from './store'
import { saveProjectFile, loadProjectFile } from './projectStore'
import type { TemplateUpdates, ProjectFile, TemplateItem, TemplateImportOutcome } from '../src/types'

function isValidTemplateFile(obj: unknown): obj is { name: string; items: TemplateItem[] } {
  if (!obj || typeof obj !== 'object') return false
  const t = obj as Record<string, unknown>
  if (typeof t.name !== 'string') return false
  if (!Array.isArray(t.items)) return false
  return t.items.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      typeof (item as Record<string, unknown>).name === 'string' &&
      ((item as Record<string, unknown>).type === 'run' ||
        (item as Record<string, unknown>).type === 'assessment'),
  )
}

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

  ipcMain.handle('project:exportHtml', async (_e, html: string) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showSaveDialog(win, {
      filters: [{ name: 'HTML File', extensions: ['html'] }],
      defaultPath: 'schedule.html',
    })
    if (result.canceled || !result.filePath) return null
    fs.writeFileSync(result.filePath, html, 'utf-8')
    return { filePath: result.filePath }
  })

  ipcMain.handle('template:export', async (_e, id: string) => {
    const exported = store.exportTemplate(id)
    if (!exported) return null
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showSaveDialog(win, {
      filters: [{ name: 'Template', extensions: ['json'] }],
      defaultPath: `${exported.name}.json`,
    })
    if (result.canceled || !result.filePath) return null
    fs.writeFileSync(result.filePath, JSON.stringify(exported, null, 2), 'utf-8')
    return { filePath: result.filePath }
  })

  ipcMain.handle('template:import', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { outcome: 'cancelled' }
    const result = await dialog.showOpenDialog(win, {
      filters: [{ name: 'Template', extensions: ['json'] }],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) return { outcome: 'cancelled' }

    let parsed: unknown
    try {
      const raw = fs.readFileSync(result.filePaths[0], 'utf-8')
      parsed = JSON.parse(raw)
    } catch {
      await dialog.showMessageBox(win, {
        type: 'error',
        message: 'Could not read template file.',
        detail: 'The file could not be read or is not valid JSON.',
      })
      return { outcome: 'error' }
    }

    if (!isValidTemplateFile(parsed)) {
      await dialog.showMessageBox(win, {
        type: 'error',
        message: 'Invalid template file.',
        detail: 'The file does not contain a valid template.',
      })
      return { outcome: 'error' }
    }

    const all = store.getAll()
    const collision = all.templates.find(t => t.name === parsed.name)
    let resolvedName = parsed.name

    if (collision) {
      const { response } = await dialog.showMessageBox(win, {
        type: 'question',
        message: `A template named "${parsed.name}" already exists.`,
        detail: 'Do you want to import it with a different name, or cancel?',
        buttons: ['Import as Copy', 'Cancel'],
        defaultId: 0,
        cancelId: 1,
      })
      if (response === 1) return { outcome: 'cancelled' as TemplateImportOutcome }
      resolvedName = `${parsed.name} (imported)`
    }

    const imported = store.importTemplate(resolvedName, parsed.items)
    return { outcome: 'imported' as TemplateImportOutcome, template: imported }
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
