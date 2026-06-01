import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { DocumentRecord, DocumentRecordsRepository } from './document-records.repository'
import { DocumentQueueService } from '../queue/document-queue.service'
import { LocalStorageService } from '../storage/storage.service'
import { DocumentStatusEventsService } from './document-status-events.service'

export interface UploadDocumentResult {
  success: boolean
  document: DocumentRecord
}

export interface DeleteDocumentResult {
  success: boolean
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name)

  constructor(
    private readonly storageService: LocalStorageService,
    private readonly documentRecordsRepository: DocumentRecordsRepository,
    private readonly documentQueueService: DocumentQueueService,
    private readonly documentStatusEvents: DocumentStatusEventsService
  ) {}

  async uploadDocument(file: Express.Multer.File): Promise<UploadDocumentResult> {
    this.logger.log(`Received document upload: ${file.originalname}`)

    let savedFilePath: string | null = null

    try {
      savedFilePath = await this.storageService.saveFile(file)
      const document = this.documentRecordsRepository.createDocument({
        originalName: file.originalname,
        filePath: savedFilePath,
        mimeType: file.mimetype || null,
        size: file.size
      })

      this.logger.log(`Document saved: ${document.id}`)

      return {
        success: true,
        document
      }
    } catch (error) {
      this.logUploadError(error)
      if (savedFilePath) {
        await this.cleanupSavedFile(savedFilePath)
      }

      throw new InternalServerErrorException('Failed to save document')
    }
  }

  listDocuments(): DocumentRecord[] {
    return this.documentRecordsRepository.listDocuments()
  }

  async queueDocumentParsing(documentId: string): Promise<DocumentRecord> {
    const document = this.documentRecordsRepository.findById(documentId)

    if (!document) {
      throw new NotFoundException('Document not found')
    }

    const queuedDocument = this.documentRecordsRepository.updateStatus(document.id, 'queued')

    if (!queuedDocument) {
      throw new NotFoundException('Document not found')
    }
    if (queuedDocument) {
      this.documentStatusEvents.notifyStatusChanged(queuedDocument)
    }

    try {
      await this.documentQueueService.addDocumentJob(document.id, document.filePath)
      return queuedDocument
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.documentRecordsRepository.updateStatus(document.id, 'failed', errorMessage)
      throw new InternalServerErrorException('Failed to add document to processing queue')
    }
  }

  async deleteDocument(documentId: string): Promise<DeleteDocumentResult> {
    const document = this.documentRecordsRepository.findById(documentId)

    if (!document) {
      throw new NotFoundException('Document not found')
    }

    await this.cleanupSavedFile(document.filePath)
    this.documentRecordsRepository.deleteById(document.id)
    this.logger.log(`Document deleted: ${document.id}`)

    return { success: true }
  }

  private logUploadError(error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`Failed to process document upload: ${error.message}`, error.stack)
      return
    }
    this.logger.error(`Failed to process document upload: ${String(error)}`)
  }
  private async cleanupSavedFile(filePath: string): Promise<void> {
    try {
      await this.storageService.deleteFile(filePath)
    } catch (cleanupError) {
      this.logger.error(`Failed to cleanup file: ${filePath}, ${String(cleanupError)}`)
    }
  }
}
