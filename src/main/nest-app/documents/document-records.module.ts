import { Module } from '@nestjs/common'
import { DocumentRecordsRepository } from './document-records.repository'
import { DocumentStatusEventsService } from './document-status-events.service'
import { DocumentContentsRepository } from './document-contents.repository'
import { DocumentCollectionsRepository } from './document-collections.repository'
import { DocumentChunksRepository } from './document-chunks.repository'
import { DOCUMENT_CHUNKS_REPOSITORY } from './ports/document-chunks.repository.port'

@Module({
  providers: [
    DocumentRecordsRepository,
    DocumentStatusEventsService,
    DocumentContentsRepository,
    DocumentCollectionsRepository,
    {
      provide: DOCUMENT_CHUNKS_REPOSITORY,
      useClass: DocumentChunksRepository
    }
  ],
  exports: [
    DocumentRecordsRepository,
    DocumentStatusEventsService,
    DocumentContentsRepository,
    DocumentCollectionsRepository,
    DOCUMENT_CHUNKS_REPOSITORY
  ]
})
export class DocumentRecordsModule {}
