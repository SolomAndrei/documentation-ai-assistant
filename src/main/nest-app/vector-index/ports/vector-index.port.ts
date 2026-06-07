export interface VectorChunk {
  chunkId: string
  documentId: string
  collectionId: string
  chunkIndex: number
  text: string
  embedding: number[]
}

export interface VectorSearchInput {
  queryEmbedding: number[]
  collectionIds: string[]
  limit: number
}

export interface VectorSearchResult {
  chunkId: string
  documentId: string
  collectionId: string
  text: string
  score: number
}

export interface VectorIndexPort {
  upsertChunks(chunks: VectorChunk[]): Promise<void>
  deleteDocument(documentId: string): Promise<void>
  search(input: VectorSearchInput): Promise<VectorSearchResult[]>
}

export const VECTOR_INDEX = Symbol('VECTOR_INDEX')
