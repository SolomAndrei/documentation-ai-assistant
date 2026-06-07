import { Injectable } from '@nestjs/common'
import { Subject } from 'rxjs'
import { OllamaRuntimeService } from './ollama-runtime.service'
import type { LocalAiSetupEvent, LocalAiSetupItem, LocalAiStatusResponse } from './local-ai.types'

@Injectable()
export class LocalAiSetupService {
  private readonly setupEventsSubject = new Subject<LocalAiSetupEvent>()
  readonly setupEvents$ = this.setupEventsSubject.asObservable()

  private isInstalling = false
  private lastEvent: LocalAiSetupEvent | null = null

  constructor(private readonly ollamaRuntimeService: OllamaRuntimeService) {}

  async getStatus(): Promise<LocalAiStatusResponse> {
    const items: LocalAiSetupItem[] = [this.getPlatformItem(), await this.getOllamaItem()]

    return {
      ready: items.every((item) => item.status === 'ready'),
      items
    }
  }

  getLastEvent(): LocalAiSetupEvent | null {
    return this.lastEvent
  }

  async startSetup(): Promise<void> {
    if (this.isInstalling) {
      this.emit({
        status: 'running',
        itemId: 'ollama',
        message: 'Local AI setup is already running.',
        progress: 10
      })
      return
    }

    this.isInstalling = true

    try {
      this.emit({
        status: 'running',
        itemId: 'platform',
        message: `Detected ${this.ollamaRuntimeService.getPlatform()}.`,
        progress: 5
      })

      if (!this.ollamaRuntimeService.isAutoInstallSupported()) {
        throw new Error(
          `Automatic local AI setup is not supported on ${this.ollamaRuntimeService.getPlatform()}`
        )
      }

      if (await this.ollamaRuntimeService.isInstalled()) {
        this.emit({
          status: 'completed',
          itemId: 'ollama',
          message: 'Ollama runtime is already installed.',
          progress: 100
        })
        return
      }

      this.emit({
        status: 'running',
        itemId: 'ollama',
        message: 'Installing Ollama runtime...',
        progress: 15
      })

      let installProgress = 20
      await this.ollamaRuntimeService.installOllama((message) => {
        installProgress = Math.min(90, installProgress + 5)
        this.emit({
          status: 'running',
          itemId: 'ollama',
          message: this.normalizeInstallerOutput(message),
          progress: installProgress
        })
      })

      if (!(await this.ollamaRuntimeService.isInstalled())) {
        throw new Error('Ollama installer finished, but the binary was not found.')
      }

      this.emit({
        status: 'completed',
        itemId: 'ollama',
        message: 'Ollama runtime installed.',
        progress: 100
      })
    } catch (error) {
      this.emit({
        status: 'failed',
        itemId: 'ollama',
        message: error instanceof Error ? error.message : String(error),
        progress: 0
      })
    } finally {
      this.isInstalling = false
    }
  }

  private getPlatformItem(): LocalAiSetupItem {
    const platform = this.ollamaRuntimeService.getPlatform()
    const isSupported = this.ollamaRuntimeService.isAutoInstallSupported()

    return {
      id: 'platform',
      label: `Operating system: ${platform}`,
      status: isSupported ? 'ready' : 'error',
      message: isSupported ? undefined : 'Automatic setup is currently supported on macOS only.'
    }
  }

  private async getOllamaItem(): Promise<LocalAiSetupItem> {
    try {
      const ollamaInstalled = await this.ollamaRuntimeService.isInstalled()

      return {
        id: 'ollama',
        label: 'Ollama runtime',
        status: ollamaInstalled ? 'ready' : this.isInstalling ? 'installing' : 'missing',
        message: this.lastEvent?.itemId === 'ollama' ? this.lastEvent.message : undefined
      }
    } catch (error) {
      return {
        id: 'ollama',
        label: 'Ollama runtime',
        status: 'error',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private emit(event: LocalAiSetupEvent): void {
    this.lastEvent = event
    this.setupEventsSubject.next(event)
  }

  private normalizeInstallerOutput(message: string): string {
    const normalizedMessage = message.trim().split('\n').filter(Boolean).at(-1)

    return normalizedMessage || 'Installing Ollama runtime...'
  }
}
