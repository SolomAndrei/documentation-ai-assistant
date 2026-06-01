import { Module } from '@nestjs/common'
import { DocumentQueueService } from './document-queue.service'
import { DocumentQueueWorkerService } from './document-queue-worker.service'
import { QueueEventsService } from './queue-events.service'
import { ProcessingModule } from '../processing/processing.module'

@Module({
  imports: [ProcessingModule],
  providers: [DocumentQueueService, DocumentQueueWorkerService, QueueEventsService],
  exports: [DocumentQueueService]
})
export class QueueModule {}
