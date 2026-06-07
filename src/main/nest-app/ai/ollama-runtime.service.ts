import { Injectable } from '@nestjs/common'
import { access } from 'fs/promises'
import { constants } from 'fs'
import { spawn } from 'child_process'

@Injectable()
export class OllamaRuntimeService {
  private readonly knownBinaryPaths = [
    '/opt/homebrew/opt/ollama/bin/ollama',
    '/usr/local/bin/ollama'
  ]

  private readonly knownHomebrewPaths = ['/opt/homebrew/bin/brew', '/usr/local/bin/brew']

  getPlatform(): NodeJS.Platform {
    return process.platform
  }

  isAutoInstallSupported(): boolean {
    return this.getPlatform() === 'darwin'
  }

  async isInstalled(): Promise<boolean> {
    if (process.env.LOCAL_AI_FORCE_OLLAMA_MISSING === '1') {
      return false
    }

    for (const binaryPath of this.knownBinaryPaths) {
      try {
        await access(binaryPath, constants.X_OK)
        return true
      } catch {
        // Try next known path.
      }
    }

    return false
  }

  async installOllama(onOutput: (message: string) => void): Promise<void> {
    if (!this.isAutoInstallSupported()) {
      throw new Error(`Automatic Ollama installation is not supported on ${this.getPlatform()}`)
    }

    const brewPath = await this.findExecutable(this.knownHomebrewPaths)

    if (!brewPath) {
      throw new Error('Homebrew is required to install Ollama automatically on macOS')
    }

    await this.runCommand(brewPath, ['install', 'ollama'], onOutput)
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

  private runCommand(
    command: string,
    args: string[],
    onOutput: (message: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe']
      })

      child.stdout.on('data', (chunk: Buffer) => {
        onOutput(chunk.toString())
      })

      child.stderr.on('data', (chunk: Buffer) => {
        onOutput(chunk.toString())
      })

      child.on('error', reject)

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
          return
        }

        reject(new Error(`Command failed with exit code ${code}`))
      })
    })
  }
}
