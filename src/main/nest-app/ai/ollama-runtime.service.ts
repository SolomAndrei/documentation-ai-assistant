import { Injectable } from '@nestjs/common'
import { access } from 'fs/promises'
import { constants } from 'fs'
import type { ChildProcess } from 'child_process'
import { getPort } from 'get-port-please'
import { CommandRunnerService } from './command-runner.service'

@Injectable()
export class OllamaRuntimeService {
  private readonly knownBinaryPaths = [
    '/opt/homebrew/opt/ollama/bin/ollama',
    '/usr/local/bin/ollama'
  ]
  private readonly knownHomebrewPaths = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew']
  private readonly embeddingModelName = 'nomic-embed-text'
  private ollamaServerProcess: ChildProcess | null = null
  private ollamaBaseUrl = 'http://127.0.0.1:11434'

  constructor(private readonly commandRunner: CommandRunnerService) {}

  getBaseUrl(): string {
    return this.ollamaBaseUrl
  }

  getEmbeddingModelName(): string {
    return this.embeddingModelName
  }

  isAutoInstallSupported(): boolean {
    return process.platform === 'darwin'
  }

  getPlatform(): NodeJS.Platform {
    return process.platform
  }

  async isOllamaRuntimeInstalled(): Promise<boolean> {
    if (process.env.LOCAL_AI_FORCE_OLLAMA_MISSING === '1') {
      return false
    }

    return (await this.findExecutable(this.knownBinaryPaths)) !== null
  }

  async isEmbeddingModelInstalled(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000)
      })

      if (!response.ok) {
        return false
      }

      const data = (await response.json()) as {
        models?: Array<{ name?: string }>
      }

      return data.models?.some((model) => model.name?.startsWith(this.embeddingModelName)) ?? false
    } catch {
      return false
    }
  }

  async isOllamaServerRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
        signal: AbortSignal.timeout(1000)
      })

      return response.ok
    } catch {
      return false
    }
  }

  async installOllamaRuntime(onOutput: (message: string) => void): Promise<void> {
    if (!this.isAutoInstallSupported()) {
      throw new Error('Automatic Ollama runtime installation is currently supported on macOS only.')
    }

    const brewPath = await this.findExecutable(this.knownHomebrewPaths)

    if (!brewPath) {
      throw new Error('Homebrew is required to install Ollama automatically on macOS')
    }

    await this.commandRunner.run(brewPath, ['install', 'ollama'], onOutput)
  }

  async installEmbeddingModel(onOutput: (message: string) => void): Promise<void> {
    const binaryPath = await this.findExecutable(this.knownBinaryPaths)

    if (!binaryPath) {
      throw new Error('Ollama runtime is required before downloading the embedding model.')
    }

    await this.commandRunner.run(binaryPath, ['pull', this.embeddingModelName], onOutput)
  }

  async startOllamaServer(onOutput: (message: string) => void): Promise<void> {
    if (await this.isOllamaServerRunning()) {
      return
    }

    if (this.ollamaServerProcess) {
      await this.waitForOllamaServer()
      return
    }

    const binaryPath = await this.findExecutable(this.knownBinaryPaths)

    if (!binaryPath) {
      throw new Error('Ollama runtime is required before starting the server.')
    }

    const port = await getPort({ port: 11434 })
    this.ollamaBaseUrl = `http://127.0.0.1:${port}`

    const serverProcess = this.commandRunner.start({
      command: binaryPath,
      args: ['serve'],
      env: {
        ...process.env,
        OLLAMA_HOST: `127.0.0.1:${port}`
      },
      onOutput,
      onExit: () => {
        this.ollamaServerProcess = null
      }
    })

    this.ollamaServerProcess = serverProcess

    await this.waitForOllamaServer()
  }

  private async findExecutable(paths: string[]): Promise<string | null> {
    for (const binaryPath of paths) {
      try {
        await access(binaryPath, constants.X_OK)
        return binaryPath
      } catch {
        // Try next known path.
      }
    }

    return null
  }

  private async waitForOllamaServer(): Promise<void> {
    const startedAt = Date.now()
    const timeoutMs = 15000

    while (Date.now() - startedAt < timeoutMs) {
      if (await this.isOllamaServerRunning()) {
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    throw new Error('Ollama server did not become ready in time.')
  }
}
