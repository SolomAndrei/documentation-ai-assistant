import 'reflect-metadata'
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './nest-app/app.module'
import { getPort } from 'get-port-please'

let nestPort: number

async function bootstrapNest(): Promise<number> {
  nestPort = await getPort({ port: 3000 })
  const nestApp = await NestFactory.create(AppModule)

  nestApp.enableCors()

  await nestApp.listen(nestPort)
  console.log(`[Main] NestJS is running on: http://localhost:${nestPort}`)
  return nestPort
}
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }
}
app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  await bootstrapNest()
  ipcMain.handle('get-api-port', () => nestPort)
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
