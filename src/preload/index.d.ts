import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getApiPort: () => Promise<number>
      quitApp: () => Promise<void>
    }
  }
}
