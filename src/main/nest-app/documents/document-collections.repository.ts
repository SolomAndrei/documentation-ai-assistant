import { Inject, Injectable } from '@nestjs/common'
import Database from 'better-sqlite3'
import { DOCUMENTS_DB_TOKEN } from '../database/database.tokens'
import { randomUUID } from 'crypto'

export interface DocumentCollection {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface DocumentCollectionRow {
  id: string
  name: string
  created_at: string
  updated_at: string
}

@Injectable()
export class DocumentCollectionsRepository {
  constructor(@Inject(DOCUMENTS_DB_TOKEN) private readonly db: Database.Database) {
    this.ensureSchema()
  }

  createCollection(name: string): DocumentCollection {
    const now = new Date().toISOString()
    const id = randomUUID()

    this.db
      .prepare(
        `INSERT INTO document_collections (
        id,
        name,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?)
    `
      )
      .run(id, name, now, now)

    return {
      id,
      name,
      createdAt: now,
      updatedAt: now
    }
  }

  findCollectionById(id: string): DocumentCollection | null {
    const row = this.db.prepare(`SELECT * FROM document_collections WHERE id = ?`).get(id) as
      | DocumentCollectionRow
      | undefined

    return row ? this.mapRow(row) : null
  }

  listCollections(): DocumentCollection[] {
    const rows = this.db
      .prepare(`SELECT * FROM document_collections ORDER BY created_at DESC`)
      .all() as DocumentCollectionRow[]
    return rows.map((row) => this.mapRow(row))
  }

  renameCollection(id: string, name: string): DocumentCollection | null {
    const now = new Date().toISOString()
    this.db
      .prepare('UPDATE document_collections SET name = ?, updated_at = ? WHERE id = ?')
      .run(name, now, id)
    return this.findCollectionById(id)
  }

  deleteById(id: string): void {
    this.db.prepare('DELETE FROM document_collections WHERE id = ?').run(id)
  }

  private ensureSchema(): void {
    this.db.exec(`
        CREATE TABLE IF NOT EXISTS document_collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
        );
    `)
  }

  private mapRow(row: DocumentCollectionRow): DocumentCollection {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }
}
