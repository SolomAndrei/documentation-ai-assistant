import { join } from 'path'
import { Global, Module } from '@nestjs/common'
import Database from 'better-sqlite3'
import { Queue } from '@minnzen/sqliteq'
import * as lancedb from '@lancedb/lancedb'
import { getDatabaseDir } from '../common/paths'

export const SQLITE_QUEUE_TOKEN = 'SQLITE_QUEUE_TOKEN'
export const LANCE_DB_TOKEN = 'LANCE_DB_TOKEN'
export const DOCUMENTS_DB_TOKEN = 'DOCUMENTS_DB_TOKEN'

@Global()
@Module({
  providers: [
    {
      provide: SQLITE_QUEUE_TOKEN,
      useFactory: () => {
        const baseDir = getDatabaseDir()
        const dbPath = join(baseDir, 'sqlite-queue.db')
        const db = new Database(dbPath)
        db.pragma('journal_mode = WAL')
        return new Queue(db, 'document-processing-queue')
      }
    },
    {
      provide: LANCE_DB_TOKEN,
      useFactory: async () => {
        const baseDir = getDatabaseDir()
        const lancePath = join(baseDir, 'lancedb-data')
        const lanceDb = await lancedb.connect(lancePath)
        return lanceDb
      }
    },
    {
      provide: DOCUMENTS_DB_TOKEN,
      useFactory: () => {
        const baseDir = getDatabaseDir()
        const dbPath = join(baseDir, 'documents.db')
        const db = new Database(dbPath)
        db.pragma('journal_mode = WAL')
        return db
      }
    }
  ],
  exports: [SQLITE_QUEUE_TOKEN, LANCE_DB_TOKEN, DOCUMENTS_DB_TOKEN]
})
export class DatabaseModule {}
