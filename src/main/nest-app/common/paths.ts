import { app } from 'electron'
import { join } from 'path'
import * as fs from 'fs'

export function getAppDataDir(): string {
  const appDataDir = join(app.getPath('userData'), 'app-data')

  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir, { recursive: true })
  }

  return appDataDir
}

export function getDatabaseDir(): string {
  return join(getAppDataDir(), 'databases')
}

export function getOriginalDocumentsDir(): string {
  return join(getAppDataDir(), 'original_documents')
}
