import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { DatabaseModule } from './database/database.module'
import { DocumentsModule } from './documents/documents.module'
import { ParserModule } from './parser/parser.module'

@Module({
  imports: [DatabaseModule, DocumentsModule, ParserModule],
  controllers: [AppController],
  providers: []
})
export class AppModule {}
