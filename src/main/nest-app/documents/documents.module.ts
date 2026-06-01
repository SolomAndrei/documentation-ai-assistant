import { Module } from '@nestjs/common'
import { DocumentRecordsModule } from './document-records.module'
import { QueueModule } from '../queue/queue.module'
import { StorageModule } from '../storage/storage.module'
import { DocumentsController } from './documents.controller'
import { DocumentsService } from './documents.service'

@Module({
  imports: [DocumentRecordsModule, StorageModule, QueueModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService]
})
export class DocumentsModule {}
