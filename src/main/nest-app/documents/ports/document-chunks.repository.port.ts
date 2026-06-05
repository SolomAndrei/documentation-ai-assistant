export interface DocumentChunk {
  id: string
  collectionId: string
  documentId: string
  chunkIndex: number
  text: string
  createdAt: string
}

export interface ReplaceDocumentChunksInput {
  collectionId: string
  documentId: string
  chunks: string[]
}

export interface DocumentChunksRepositoryPort {
  replaceChunksForDocument(input: ReplaceDocumentChunksInput): void
  listByDocumentId(documentId: string): DocumentChunk[]
  deleteByDocumentId(documentId: string): void
}

export const DOCUMENT_CHUNKS_REPOSITORY = Symbol('DOCUMENT_CHUNKS_REPOSITORY')
