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

export interface UploadDocumentResult {
  success: boolean
  document: DocumentRecord
}

export interface DeleteDocumentResult {
  success: boolean
}
