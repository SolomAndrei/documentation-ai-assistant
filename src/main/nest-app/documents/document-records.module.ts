import { Module } from '@nestjs/common'
import { DocumentRecordsRepository } from './document-records.repository'
import { DocumentStatusEventsService } from './document-status-events.service'
import { DocumentContentsRepository } from './document-contents.repository'

@Module({
  providers: [DocumentRecordsRepository, DocumentStatusEventsService, DocumentContentsRepository],
  exports: [DocumentRecordsRepository, DocumentStatusEventsService, DocumentContentsRepository]
})
export class DocumentRecordsModule {}
