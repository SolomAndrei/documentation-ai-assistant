import { Module } from '@nestjs/common'
import { DocumentProcessingService } from './document-processing.service'
import { DocumentRecordsModule } from '../documents/document-records.module'
import { ParserModule } from '../parser/parser.module'

@Module({
  imports: [DocumentRecordsModule, ParserModule],
  providers: [DocumentProcessingService],
  exports: [DocumentProcessingService]
})
export class ProcessingModule {}
