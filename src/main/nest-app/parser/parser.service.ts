import { Inject, Injectable } from '@nestjs/common'
import { Queue } from '@minnzen/sqliteq'
import { SQLITE_QUEUE_TOKEN, LANCE_DB_TOKEN } from '../database/database.module'
import { Connection } from '@lancedb/lancedb'

export interface DocumentJob {
  filePath: string
}

@Injectable()
export class ParserService {
  constructor(
    @Inject(SQLITE_QUEUE_TOKEN) private readonly sqliteQueue: Queue<DocumentJob>,
    @Inject(LANCE_DB_TOKEN) private readonly lanceDb: Connection
  ) {}

  async addJob(filePath: string): Promise<void> {
    this.sqliteQueue.send({ filePath })
    console.log(`[Queue] Added job for file: ${filePath}`)
  }
}
