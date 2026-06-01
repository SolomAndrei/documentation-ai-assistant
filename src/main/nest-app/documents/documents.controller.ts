import 'multer'
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Express } from 'express'
import { DocumentRecord } from './document-records.repository'
import { DeleteDocumentResult, DocumentsService, UploadDocumentResult } from './documents.service'
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

  @Get()
  listDocuments(): DocumentRecord[] {
    return this.documentsService.listDocuments()
  }

  @Post(':id/parse')
  async parseDocument(@Param('id') id: string): Promise<DocumentRecord> {
    return this.documentsService.queueDocumentParsing(id)
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
