import type { DeleteDocumentResult, DocumentRecord, UploadDocumentResult } from '../types/documents'
import { apiClient, ApiClient } from './api-client'

export interface DocumentsApi {
  listDocuments: () => Promise<DocumentRecord[]>
  uploadDocument: (file: File) => Promise<UploadDocumentResult>
  parseDocument: (documentId: string) => Promise<DocumentRecord>
  deleteDocument: (documentId: string) => Promise<DeleteDocumentResult>
  subscribeToStatusEvents: () => EventSource
}

export function createDocumentsApi(apiClient: ApiClient): DocumentsApi {
  return {
    listDocuments: (): Promise<DocumentRecord[]> => {
      return apiClient.request<DocumentRecord[]>('/documents')
    },

    uploadDocument: (file: File): Promise<UploadDocumentResult> => {
      const formData = new FormData()
      formData.append('file', file)

      return apiClient.request<UploadDocumentResult>('/documents/upload', {
        method: 'POST',
        body: formData
      })
    },

    parseDocument: (documentId: string): Promise<DocumentRecord> => {
      return apiClient.request<DocumentRecord>(`/documents/${documentId}/parse`, {
        method: 'POST'
      })
    },

    deleteDocument: (documentId: string): Promise<DeleteDocumentResult> => {
      return apiClient.request<DeleteDocumentResult>(`/documents/${documentId}`, {
        method: 'DELETE'
      })
    },

    subscribeToStatusEvents: (): EventSource => {
      return apiClient.stream('/documents/status-events')
    }
  }
}

export const documentsApi = createDocumentsApi(apiClient)

export async function listDocuments(): Promise<DocumentRecord[]> {
  return documentsApi.listDocuments()
}

export async function uploadDocument(file: File): Promise<UploadDocumentResult> {
  return documentsApi.uploadDocument(file)
}

export async function parseDocument(documentId: string): Promise<DocumentRecord> {
  return documentsApi.parseDocument(documentId)
}

export async function deleteDocument(documentId: string): Promise<DeleteDocumentResult> {
  return documentsApi.deleteDocument(documentId)
}
