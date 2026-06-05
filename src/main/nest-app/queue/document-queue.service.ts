import { Inject, Injectable, Logger } from '@nestjs/common'
import { Queue } from '@minnzen/sqliteq'
import { SQLITE_QUEUE_TOKEN } from '../database/database.tokens'
import { QueueEventsService } from './queue-events.service'

export interface DocumentProcessingJob {
  documentId: string
  filePath: string
}

@Injectable()
export class DocumentQueueService {
  private readonly logger = new Logger(DocumentQueueService.name)

  constructor(
    @Inject(SQLITE_QUEUE_TOKEN) private readonly queue: Queue<DocumentProcessingJob>,
    private readonly queueEvents: QueueEventsService
  ) {}

  async addDocumentJob(documentId: string, filePath: string): Promise<void> {
    await this.queue.send({ documentId, filePath })
    this.logger.log(`Added document processing job for document: ${documentId}`)
    this.queueEvents.notifyChanged()
  }
}
