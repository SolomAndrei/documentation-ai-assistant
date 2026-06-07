import { Controller, Get, MessageEvent, Post, Sse } from '@nestjs/common'
import { Observable, map, startWith } from 'rxjs'
import { LocalAiSetupService } from './local-ai-setup.service'
import type { LocalAiSetupEvent, LocalAiStatusResponse } from './local-ai.types'

interface StartLocalAiSetupResponse {
  started: boolean
}

@Controller('local-ai')
export class LocalAiController {
  constructor(private readonly localAiSetupService: LocalAiSetupService) {}

  @Get('status')
  async getStatus(): Promise<LocalAiStatusResponse> {
    return this.localAiSetupService.getStatus()
  }

  @Post('setup')
  async startSetup(): Promise<StartLocalAiSetupResponse> {
    void this.localAiSetupService.startSetup()
    return {
      started: true
    }
  }

  @Sse('setup-events')
  sendSetupEvents(): Observable<MessageEvent> {
    const lastEvent = this.localAiSetupService.getLastEvent()

    return this.localAiSetupService.setupEvents$.pipe(
      lastEvent ? startWith(lastEvent) : (source) => source,
      map((event: LocalAiSetupEvent) => ({ data: event }))
    )
  }
}
