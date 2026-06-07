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
    const items: LocalAiSetupItem[] = [
      this.getPlatformItem(),
      await this.getOllamaRuntimeItem(),
      await this.getOllamaServerItem(),
      await this.getEmbeddingModelItem()
    ]

    return {
      ready: this.areAllSetupItemsReady(items),
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
      await this.installOllamaRuntimeIfMissing()
      await this.startOllamaServerIfMissing()
      await this.installEmbeddingModelIfMissing()

      this.emit({
        status: 'completed',
        itemId: 'local-ai',
        message: 'Local AI setup completed.',
        progress: 100
      })
    } catch (error) {
      this.emit({
        status: 'failed',
        itemId: 'local-ai',
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

  private async getOllamaRuntimeItem(): Promise<LocalAiSetupItem> {
    return {
      id: 'ollama',
      label: 'Ollama runtime',
      status: (await this.ollamaRuntimeService.isOllamaRuntimeInstalled()) ? 'ready' : 'missing'
    }
  }

  private async getOllamaServerItem(): Promise<LocalAiSetupItem> {
    if (!(await this.ollamaRuntimeService.isOllamaRuntimeInstalled())) {
      return {
        id: 'ollama-server',
        label: 'Ollama server',
        status: 'pending',
        message: 'Ollama runtime must be installed before starting the server.'
      }
    }

    return {
      id: 'ollama-server',
      label: 'Ollama server',
      status: (await this.ollamaRuntimeService.isOllamaServerRunning()) ? 'ready' : 'missing'
    }
  }

  private async getEmbeddingModelItem(): Promise<LocalAiSetupItem> {
    const embeddingModelName = this.ollamaRuntimeService.getEmbeddingModelName()

    if (!(await this.ollamaRuntimeService.isOllamaRuntimeInstalled())) {
      return {
        id: 'embedding-model',
        label: `Embedding model: ${embeddingModelName}`,
        status: 'pending',
        message: 'Ollama runtime must be installed before downloading the embedding model.'
      }
    }

    if (!(await this.ollamaRuntimeService.isOllamaServerRunning())) {
      return {
        id: 'embedding-model',
        label: `Embedding model: ${embeddingModelName}`,
        status: 'pending',
        message: 'Ollama server must be running before checking the embedding model.'
      }
    }

    return {
      id: 'embedding-model',
      label: `Embedding model: ${embeddingModelName}`,
      status: (await this.ollamaRuntimeService.isEmbeddingModelInstalled()) ? 'ready' : 'missing'
    }
  }

  private async installOllamaRuntimeIfMissing(): Promise<void> {
    if (!this.ollamaRuntimeService.isAutoInstallSupported()) {
      throw new Error('Automatic setup is currently supported on macOS only.')
    }

    if (await this.ollamaRuntimeService.isOllamaRuntimeInstalled()) {
      this.emitReady('ollama', 'Ollama runtime is already installed.', 25)
      return
    }

    this.emitRunning('ollama', 'Installing Ollama runtime...', 10)

    await this.ollamaRuntimeService.installOllamaRuntime((message) => {
      this.emitRunning('ollama', this.normalizeInstallerOutput(message), 20)
    })

    if (!(await this.ollamaRuntimeService.isOllamaRuntimeInstalled())) {
      throw new Error('Ollama installer finished, but the binary was not found.')
    }

    this.emitReady('ollama', 'Ollama runtime installed.', 25)
  }

  private async startOllamaServerIfMissing(): Promise<void> {
    if (await this.ollamaRuntimeService.isOllamaServerRunning()) {
      this.emitReady('ollama-server', 'Ollama server is already running.', 50)
      return
    }

    this.emitRunning('ollama-server', 'Starting Ollama server...', 35)

    await this.ollamaRuntimeService.startOllamaServer((message) => {
      this.emitRunning('ollama-server', this.normalizeInstallerOutput(message), 45)
    })

    if (!(await this.ollamaRuntimeService.isOllamaServerRunning())) {
      throw new Error('Ollama server did not start.')
    }

    this.emitReady('ollama-server', 'Ollama server is running.', 50)
  }

  private async installEmbeddingModelIfMissing(): Promise<void> {
    const embeddingModelName = this.ollamaRuntimeService.getEmbeddingModelName()

    if (await this.ollamaRuntimeService.isEmbeddingModelInstalled()) {
      this.emitReady(
        'embedding-model',
        `Embedding model ${embeddingModelName} is already installed.`,
        100
      )
      return
    }

    this.emitRunning('embedding-model', `Downloading ${embeddingModelName}...`, 65)

    await this.ollamaRuntimeService.installEmbeddingModel((message) => {
      this.emitRunning('embedding-model', this.normalizeInstallerOutput(message), 80)
    })

    if (!(await this.ollamaRuntimeService.isEmbeddingModelInstalled())) {
      throw new Error(`Embedding model ${embeddingModelName} was not found after download.`)
    }

    this.emitReady('embedding-model', `Embedding model ${embeddingModelName} installed.`, 100)
  }

  private areAllSetupItemsReady(items: LocalAiSetupItem[]): boolean {
    return items.every((item) => item.status === 'ready')
  }

  private emitRunning(itemId: string, message: string, progress: number): void {
    this.emit({
      status: 'running',
      itemId,
      message,
      progress
    })
  }

  private emitReady(itemId: string, message: string, progress: number): void {
    this.emit({
      status: 'running',
      itemId,
      message,
      progress
    })
  }

  private emit(event: LocalAiSetupEvent): void {
    this.lastEvent = event
    this.setupEventsSubject.next(event)
  }

  private normalizeInstallerOutput(message: string): string {
    const normalizedMessage = message.trim().split('\n').filter(Boolean).at(-1)

    return normalizedMessage || 'Working...'
  }
}
