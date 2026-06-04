import { Injectable, Logger } from '@nestjs/common'
import { DocumentRecordsRepository } from '../documents/document-records.repository'
import { ParserService } from '../parser/parser.service'
import { DocumentStatusEventsService } from '../documents/document-status-events.service'
import { DocumentContentsRepository } from '../documents/document-contents.repository'
import { chankMarkdown } from '../chunking/markdown-chunker'

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name)

  constructor(
    private readonly parserService: ParserService,
    private readonly documentRecordsRepository: DocumentRecordsRepository,
    private readonly documentStatusEvents: DocumentStatusEventsService,
    private readonly documentContentsRepository: DocumentContentsRepository
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

      this.documentContentsRepository.saveParsedContent(documentId, parsedDocument.text)
      const chunks = chankMarkdown(parsedDocument.text, { maxChunkSize: 2000 })
      this.logger.log(`Created document chunks: ${chunks.length}`)

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
