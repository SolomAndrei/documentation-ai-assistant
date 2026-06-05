import 'multer'
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import type { Express } from 'express'
import { DocumentCollection } from './document-collections.repository'
import { DocumentRecord } from './document-records.repository'
import {
  DeleteDocumentResult,
  DocumentsService,
  UploadDocumentCollectionResult,
  UploadDocumentResult
} from './documents.service'
import { Observable, map } from 'rxjs'
import { MessageEvent, Sse } from '@nestjs/common'
import { DocumentStatusEventsService } from './document-status-events.service'

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly documentStatusEvents: DocumentStatusEventsService
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File): Promise<UploadDocumentResult> {
    if (!file) {
      throw new BadRequestException('File is required')
    }
    return this.documentsService.uploadDocument(file)
  }

  @Post('collections/upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadDocumentCollection(
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<UploadDocumentCollectionResult> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required')
    }

    return this.documentsService.uploadDocumentCollection(files)
  }

  @Get()
  listDocuments(): DocumentRecord[] {
    return this.documentsService.listDocuments()
  }

  @Get('collections')
  listCollections(): DocumentCollection[] {
    return this.documentsService.listCollections()
  }

  @Post('collections/:collectionId/documents')
  @UseInterceptors(FilesInterceptor('files'))
  async addDocumentsToCollection(
    @Param('collectionId') collectionId: string,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<UploadDocumentCollectionResult> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required')
    }

    return this.documentsService.addDocumentsToCollection(collectionId, files)
  }

  @Post('collections/:collectionId/parse')
  async parseCollection(@Param('collectionId') collectionId: string): Promise<DocumentRecord[]> {
    return this.documentsService.queueCollectionParsing(collectionId)
  }

  @Post(':id/parse')
  async parseDocument(@Param('id') id: string): Promise<DocumentRecord> {
    return this.documentsService.queueDocumentParsing(id)
  }

  @Delete(':id/original-file')
  async deleteOriginalFile(@Param('id') id: string): Promise<DocumentRecord> {
    return this.documentsService.deleteOriginalFile(id)
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string): Promise<DeleteDocumentResult> {
    return this.documentsService.deleteDocument(id)
  }

  @Sse('status-events')
  sendDocumentStatusEvents(): Observable<MessageEvent> {
    return this.documentStatusEvents.statusChanged$.pipe(map((document) => ({ data: document })))
  }
}
