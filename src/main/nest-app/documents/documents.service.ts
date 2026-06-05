import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { DocumentRecord, DocumentRecordsRepository } from './document-records.repository'
import { DocumentQueueService } from '../queue/document-queue.service'
import { LocalStorageService } from '../storage/storage.service'
import { DocumentStatusEventsService } from './document-status-events.service'
import {
  DocumentCollection,
  DocumentCollectionsRepository
} from './document-collections.repository'
import { DatabaseUnitOfWork } from '../database/database-unit-of-work.service'
import { DocumentContentsRepository } from './document-contents.repository'

export interface UploadDocumentResult {
  success: boolean
  document: DocumentRecord
}

export interface UploadDocumentCollectionResult {
  success: boolean
  collection: DocumentCollection
  documents: DocumentRecord[]
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
    private readonly documentStatusEvents: DocumentStatusEventsService,
    private readonly documentCollectionsRepository: DocumentCollectionsRepository,
    private readonly documentContentsRepository: DocumentContentsRepository,
    private readonly databaseUnitOfWork: DatabaseUnitOfWork
  ) {}

  async uploadDocument(file: Express.Multer.File): Promise<UploadDocumentResult> {
    this.logger.log(`Received document upload: ${file.originalname}`)

    let savedFilePath: string | null = null

    try {
      savedFilePath = await this.storageService.saveFile(file)
      const filePath = savedFilePath
      const document = this.databaseUnitOfWork.run(() => {
        const collection = this.documentCollectionsRepository.createCollection(file.originalname)
        return this.documentRecordsRepository.createDocument({
          originalName: file.originalname,
          collectionId: collection.id,
          filePath,
          mimeType: file.mimetype || null,
          size: file.size
        })
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

  async uploadDocumentCollection(
    files: Express.Multer.File[]
  ): Promise<UploadDocumentCollectionResult> {
    if (files.length === 0) {
      throw new BadRequestException('At least one file is required')
    }

    return this.createCollectionWithFiles(files[0].originalname, files)
  }

  async addDocumentsToCollection(
    collectionId: string,
    files: Express.Multer.File[]
  ): Promise<UploadDocumentCollectionResult> {
    if (files.length === 0) {
      throw new BadRequestException('At least one file is required')
    }

    const collection = this.documentCollectionsRepository.findCollectionById(collectionId)

    if (!collection) {
      throw new NotFoundException('Collection not found')
    }

    const documents = await this.saveDocumentsInCollection(collection.id, files)

    return {
      success: true,
      collection,
      documents
    }
  }

  listDocuments(): DocumentRecord[] {
    return this.documentRecordsRepository.listDocuments()
  }

  listCollections(): DocumentCollection[] {
    return this.documentCollectionsRepository.listCollections()
  }

  async queueDocumentParsing(documentId: string): Promise<DocumentRecord> {
    const document = this.documentRecordsRepository.findById(documentId)

    if (!document) {
      throw new NotFoundException('Document not found')
    }

    if (document.originalFileDeletedAt) {
      throw new BadRequestException('Original file has been deleted')
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

  async queueCollectionParsing(collectionId: string): Promise<DocumentRecord[]> {
    const collection = this.documentCollectionsRepository.findCollectionById(collectionId)

    if (!collection) {
      throw new NotFoundException('Collection not found')
    }

    const documents = this.documentRecordsRepository
      .listByCollectionId(collection.id)
      .filter((document) => document.status === 'uploaded' || document.status === 'failed')
      .filter((document) => !document.originalFileDeletedAt)

    const queuedDocuments: DocumentRecord[] = []

    for (const document of documents) {
      queuedDocuments.push(await this.queueDocumentParsing(document.id))
    }

    return queuedDocuments
  }

  async deleteDocument(documentId: string): Promise<DeleteDocumentResult> {
    const document = this.documentRecordsRepository.findById(documentId)

    if (!document) {
      throw new NotFoundException('Document not found')
    }

    if (!document.originalFileDeletedAt) {
      await this.storageService.deleteFile(document.filePath)
    }

    this.databaseUnitOfWork.run(() => {
      this.documentContentsRepository.deleteByDocumentId(document.id)
      this.documentRecordsRepository.deleteById(document.id)
    })

    this.logger.log(`Document deleted: ${document.id}`)

    return { success: true }
  }

  async deleteOriginalFile(documentId: string): Promise<DocumentRecord> {
    const document = this.documentRecordsRepository.findById(documentId)

    if (!document) {
      throw new NotFoundException('Document not found')
    }

    if (document.status !== 'completed') {
      throw new BadRequestException('Original file can be deleted after parsing completes')
    }

    if (document.originalFileDeletedAt) {
      return document
    }

    await this.storageService.deleteFile(document.filePath)

    const updatedDocument = this.documentRecordsRepository.markOriginalFileDeleted(document.id)

    if (!updatedDocument) {
      throw new NotFoundException('Document not found')
    }

    this.documentStatusEvents.notifyStatusChanged(updatedDocument)
    this.logger.log(`Original file deleted for document: ${document.id}`)

    return updatedDocument
  }

  private async createCollectionWithFiles(
    collectionName: string,
    files: Express.Multer.File[]
  ): Promise<UploadDocumentCollectionResult> {
    const savedFilePaths: string[] = []

    try {
      for (const file of files) {
        savedFilePaths.push(await this.storageService.saveFile(file))
      }

      const { collection, documents } = this.databaseUnitOfWork.run(() => {
        const collection = this.documentCollectionsRepository.createCollection(collectionName)
        const documents = this.createDocumentRecordsForFiles(collection.id, files, savedFilePaths)

        return { collection, documents }
      })

      this.logger.log(`Document collection saved: ${collection.id}`)

      return {
        success: true,
        collection,
        documents
      }
    } catch (error) {
      this.logUploadError(error)
      await this.cleanupSavedFiles(savedFilePaths)
      throw new InternalServerErrorException('Failed to save document collection')
    }
  }

  private async saveDocumentsInCollection(
    collectionId: string,
    files: Express.Multer.File[]
  ): Promise<DocumentRecord[]> {
    const savedFilePaths: string[] = []

    try {
      for (const file of files) {
        savedFilePaths.push(await this.storageService.saveFile(file))
      }

      return this.databaseUnitOfWork.run(() =>
        this.createDocumentRecordsForFiles(collectionId, files, savedFilePaths)
      )
    } catch (error) {
      this.logUploadError(error)
      await this.cleanupSavedFiles(savedFilePaths)
      throw new InternalServerErrorException('Failed to add documents to collection')
    }
  }

  private createDocumentRecordsForFiles(
    collectionId: string,
    files: Express.Multer.File[],
    savedFilePaths: string[]
  ): DocumentRecord[] {
    return files.map((file, index) =>
      this.documentRecordsRepository.createDocument({
        originalName: file.originalname,
        collectionId,
        filePath: savedFilePaths[index],
        mimeType: file.mimetype || null,
        size: file.size
      })
    )
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

  private async cleanupSavedFiles(filePaths: string[]): Promise<void> {
    await Promise.all(filePaths.map((filePath) => this.cleanupSavedFile(filePath)))
  }
}
