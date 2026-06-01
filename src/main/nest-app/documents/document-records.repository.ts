import { Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import Database from 'better-sqlite3'
import { DOCUMENTS_DB_TOKEN } from '../database/database.module'

export type DocumentStatus = 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed'

export interface DocumentRecord {
  id: string
  originalName: string
  filePath: string
  mimeType: string | null
  size: number
  status: DocumentStatus
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateDocumentInput {
  originalName: string
  filePath: string
  mimeType: string | null
  size: number
}

interface DocumentRow {
  id: string
  original_name: string
  file_path: string
  mime_type: string | null
  size: number
  status: DocumentStatus
  error_message: string | null
  created_at: string
  updated_at: string
}

@Injectable()
export class DocumentRecordsRepository {
  constructor(@Inject(DOCUMENTS_DB_TOKEN) private readonly db: Database.Database) {
    this.ensureSchema()
  }

  createDocument(input: CreateDocumentInput): DocumentRecord {
    const now = new Date().toISOString()
    const id = randomUUID()

    this.db
      .prepare(
        `INSERT INTO documents (
          id,
          original_name,
          file_path,
          mime_type,
          size,
          status,
          error_message,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.originalName,
        input.filePath,
        input.mimeType,
        input.size,
        'uploaded',
        null,
        now,
        now
      )

    const document = this.findById(id)

    if (!document) {
      throw new Error(`Failed to create document record: ${id}`)
    }

    return document
  }

  listDocuments(): DocumentRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM documents ORDER BY created_at DESC')
      .all() as DocumentRow[]

    return rows.map((row) => this.mapRow(row))
  }

  findById(id: string): DocumentRecord | null {
    const row = this.db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as
      | DocumentRow
      | undefined

    return row ? this.mapRow(row) : null
  }

  updateStatus(
    id: string,
    status: DocumentStatus,
    errorMessage: string | null = null
  ): DocumentRecord | null {
    const now = new Date().toISOString()

    this.db
      .prepare('UPDATE documents SET status = ?, error_message = ?, updated_at = ? WHERE id = ?')
      .run(status, errorMessage, now, id)

    return this.findById(id)
  }

  deleteById(id: string): void {
    this.db.prepare('DELETE FROM documents WHERE id = ?').run(id)
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        mime_type TEXT,
        size INTEGER NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
    `)
  }

  private mapRow(row: DocumentRow): DocumentRecord {
    return {
      id: row.id,
      originalName: row.original_name,
      filePath: row.file_path,
      mimeType: row.mime_type,
      size: row.size,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}
