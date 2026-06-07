import { Injectable } from '@nestjs/common'
import { spawn, type ChildProcess } from 'child_process'

export interface StartProcessInput {
  command: string
  args: string[]
  env?: NodeJS.ProcessEnv
  onOutput: (message: string) => void
  onExit?: () => void
}

@Injectable()
export class CommandRunnerService {
  run(command: string, args: string[], onOutput: (message: string) => void): Promise<void> {
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

  start(input: StartProcessInput): ChildProcess {
    const child = spawn(input.command, input.args, {
      env: input.env,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    child.stdout?.on('data', (chunk: Buffer) => {
      input.onOutput(chunk.toString())
    })

    child.stderr?.on('data', (chunk: Buffer) => {
      input.onOutput(chunk.toString())
    })

    if (input.onExit) {
      child.on('exit', input.onExit)
    }

    return child
  }
}
