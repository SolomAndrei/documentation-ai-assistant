import { Inject, Injectable } from '@nestjs/common'
import Database from 'better-sqlite3'
import { DOCUMENTS_DB_TOKEN } from './database.tokens'

@Injectable()
export class DatabaseUnitOfWork {
  constructor(@Inject(DOCUMENTS_DB_TOKEN) private readonly db: Database.Database) {}
  run<T>(operation: () => T): T {
    return this.db.transaction(operation)()
  }
}
