export type DocumentStatus = 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed'

export interface DocumentRecord {
  id: string
  collectionId: string
  originalName: string
  filePath: string
  mimeType: string | null
  size: number
  status: DocumentStatus
  errorMessage: string | null
  originalFileDeletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DocumentCollection {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface UploadDocumentResult {
  success: boolean
  document: DocumentRecord
}

export interface UploadDocumentCollectionResult {
  success: boolean
  collection: DocumentCollection
  documents: DocumentRecord[]
}

export interface DeleteDocumentResult {
  success: boolean
}
