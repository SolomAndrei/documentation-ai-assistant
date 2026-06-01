import { Injectable, Logger } from '@nestjs/common'
import { DocumentRecordsRepository } from '../documents/document-records.repository'
import { ParserService } from '../parser/parser.service'
import { DocumentStatusEventsService } from '../documents/document-status-events.service'

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name)

  constructor(
    private readonly parserService: ParserService,
    private readonly documentRecordsRepository: DocumentRecordsRepository,
    private readonly documentStatusEvents: DocumentStatusEventsService
  ) {}

  async processDocument(documentId: string, filePath: string): Promise<void> {
    const document = this.documentRecordsRepository.findById(documentId)

    if (!document) {
      this.logger.warn(`Skipping deleted document job: ${documentId}`)
      return
    }

    this.logger.log(`Processing document: ${documentId}`)
    const processingDocument = this.documentRecordsRepository.updateStatus(documentId, 'processing')

    if (processingDocument) {
      this.documentStatusEvents.notifyStatusChanged(processingDocument)
    }
    try {
      const parsedDocument = await this.parserService.parseDocument(filePath)

      const completedDocument = this.documentRecordsRepository.updateStatus(documentId, 'completed')
      if (completedDocument) {
        this.documentStatusEvents.notifyStatusChanged(completedDocument)
      }

      this.logger.log(
        `Parsed document: ${parsedDocument.filePath}, text length: ${parsedDocument.text.length}`
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const failedDocument = this.documentRecordsRepository.updateStatus(
        documentId,
        'failed',
        errorMessage
      )
      if (failedDocument) {
        this.documentStatusEvents.notifyStatusChanged(failedDocument)
      }
      throw error
    }
  }
}
