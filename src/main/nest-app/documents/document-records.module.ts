import { Module } from '@nestjs/common'
import { DocumentRecordsRepository } from './document-records.repository'
import { DocumentStatusEventsService } from './document-status-events.service'

@Module({
  providers: [DocumentRecordsRepository, DocumentStatusEventsService],
  exports: [DocumentRecordsRepository, DocumentStatusEventsService]
})
export class DocumentRecordsModule {}
