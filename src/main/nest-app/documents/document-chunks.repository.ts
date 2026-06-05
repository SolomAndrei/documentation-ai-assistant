import { Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import Database from 'better-sqlite3'
import { DOCUMENTS_DB_TOKEN } from '../database/database.tokens'
import type {
  DocumentChunk,
  DocumentChunksRepositoryPort,
  ReplaceDocumentChunksInput
} from './ports/document-chunks.repository.port'

interface DocumentChunkRow {
  id: string
  collection_id: string
  document_id: string
  chunk_index: number
  text: string
  created_at: string
}

interface TableInfoRow {
  name: string
}

@Injectable()
export class DocumentChunksRepository implements DocumentChunksRepositoryPort {
  constructor(@Inject(DOCUMENTS_DB_TOKEN) private readonly db: Database.Database) {
    this.ensureSchema()
  }

  replaceChunksForDocument({ collectionId, documentId, chunks }: ReplaceDocumentChunksInput): void {
    const now = new Date().toISOString()

    const deleteOldChunks = this.db.prepare('DELETE FROM document_chunks WHERE document_id = ?')
    const insertChunk = this.db.prepare(
      `INSERT INTO document_chunks (
        id,
        collection_id,
        document_id,
        chunk_index,
        text,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`
    )

    deleteOldChunks.run(documentId)

    for (const [index, text] of chunks.entries()) {
      insertChunk.run(randomUUID(), collectionId, documentId, index, text, now)
    }
  }

  listByDocumentId(documentId: string): DocumentChunk[] {
    const rows = this.db
      .prepare('SELECT * FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC')
      .all(documentId) as DocumentChunkRow[]

    return rows.map((row) => this.mapRow(row))
  }

  deleteByDocumentId(documentId: string): void {
    this.db.prepare('DELETE FROM document_chunks WHERE document_id = ?').run(documentId)
  }

  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL,
        document_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
        ON document_chunks(document_id);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_document_chunks_document_index
        ON document_chunks(document_id, chunk_index);
    `)

    this.ensureCollectionIdColumn()

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_document_chunks_collection_id
        ON document_chunks(collection_id);
    `)
  }

  private ensureCollectionIdColumn(): void {
    const columns = this.db.prepare('PRAGMA table_info(document_chunks)').all() as TableInfoRow[]
    const hasCollectionId = columns.some((column) => column.name === 'collection_id')

    if (hasCollectionId) {
      return
    }

    this.db.exec(`
      ALTER TABLE document_chunks ADD COLUMN collection_id TEXT;

      UPDATE document_chunks
      SET collection_id = (
        SELECT documents.collection_id
        FROM documents
        WHERE documents.id = document_chunks.document_id
      )
      WHERE collection_id IS NULL;
    `)
  }

  private mapRow(row: DocumentChunkRow): DocumentChunk {
    return {
      id: row.id,
      collectionId: row.collection_id,
      documentId: row.document_id,
      chunkIndex: row.chunk_index,
      text: row.text,
      createdAt: row.created_at
    }
  }
}
