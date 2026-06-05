import { Module } from '@nestjs/common'
import { DocumentRecordsRepository } from './document-records.repository'
import { DocumentStatusEventsService } from './document-status-events.service'
import { DocumentContentsRepository } from './document-contents.repository'
import { DocumentCollectionsRepository } from './document-collections.repository'

@Module({
  providers: [
    DocumentRecordsRepository,
    DocumentStatusEventsService,
    DocumentContentsRepository,
    DocumentCollectionsRepository
  ],
  exports: [
    DocumentRecordsRepository,
    DocumentStatusEventsService,
    DocumentContentsRepository,
    DocumentCollectionsRepository
  ]
})
export class DocumentRecordsModule {}
