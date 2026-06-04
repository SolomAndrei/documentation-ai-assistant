import { Inject, Injectable } from '@nestjs/common'
import Database from 'better-sqlite3'
import { DOCUMENTS_DB_TOKEN } from '../database/database.module'

export interface DocumentContent {
  documentId: string
  markdown: string
  createdAt: string
  updatedAt: string
}

@Injectable()
export class DocumentContentsRepository {
  constructor(@Inject(DOCUMENTS_DB_TOKEN) private readonly db: Database.Database) {
    this.ensureSchema()
  }

  saveParsedContent(documentId: string, markdown: string): void {
    const now = new Date().toISOString()
    this.db
      .prepare(
        `INSERT INTO document_contents (
          document_id,
          markdown,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?)
        ON CONFLICT(document_id) DO UPDATE SET
          markdown = excluded.markdown,
          updated_at = excluded.updated_at`
      )
      .run(documentId, markdown, now, now)
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS document_contents (
        document_id TEXT PRIMARY KEY,
        markdown TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `)
  }
}
