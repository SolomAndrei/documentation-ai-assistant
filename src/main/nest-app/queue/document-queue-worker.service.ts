import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Queue } from '@minnzen/sqliteq'
import { SQLITE_QUEUE_TOKEN } from '../database/database.module'
import type { DocumentProcessingJob } from './document-queue.service'
import { Subscription } from 'rxjs'
import { QueueEventsService } from './queue-events.service'
import { DocumentProcessingService } from '../processing/document-processing.service'

@Injectable()
export class DocumentQueueWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DocumentQueueWorkerService.name)

  constructor(
    @Inject(SQLITE_QUEUE_TOKEN) private readonly queue: Queue<DocumentProcessingJob>,
    private readonly queueEvents: QueueEventsService,
    private readonly documentProcessingService: DocumentProcessingService
  ) {}
  private isRunning = false
  private queueEventsSubscription?: Subscription

  onModuleInit(): void {
    this.isRunning = true
    void this.processAvailableJobs()
    this.queueEventsSubscription = this.queueEvents.changed$.subscribe(() => {
      void this.processAvailableJobs()
    })
    this.logger.log('Document queue worker started')
  }
  onModuleDestroy(): void {
    this.isRunning = false
    this.queueEventsSubscription?.unsubscribe()
    this.logger.log('Document queue worker stopped')
  }

  private async processAvailableJobs(): Promise<void> {
    if (!this.isRunning) return
    let job = this.queue.receive()
    while (job && this.isRunning) {
      try {
        this.logger.log(`Processing document job: ${job.body.documentId}`)
        await this.documentProcessingService.processDocument(job.body.documentId, job.body.filePath)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const stack = error instanceof Error ? error.stack : undefined
        this.logger.error(
          `Error processing document job: ${job.body.documentId}: ${message}`,
          stack
        )
      } finally {
        this.queue.delete(job.id, job.received)
      }
      job = this.queue.receive()
    }
  }
}
