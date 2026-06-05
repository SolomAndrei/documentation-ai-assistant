import type {
  DeleteDocumentResult,
  DocumentCollection,
  DocumentRecord,
  UploadDocumentCollectionResult,
  UploadDocumentResult
} from '../types/documents'
import { apiClient, ApiClient } from './api-client'

export interface DocumentsApi {
  listDocuments: () => Promise<DocumentRecord[]>
  listCollections: () => Promise<DocumentCollection[]>
  uploadDocument: (file: File) => Promise<UploadDocumentResult>
  uploadDocumentCollection: (files: File[]) => Promise<UploadDocumentCollectionResult>
  addDocumentsToCollection: (
    collectionId: string,
    files: File[]
  ) => Promise<UploadDocumentCollectionResult>
  parseDocument: (documentId: string) => Promise<DocumentRecord>
  parseCollection: (collectionId: string) => Promise<DocumentRecord[]>
  deleteDocument: (documentId: string) => Promise<DeleteDocumentResult>
  deleteOriginalFile: (documentId: string) => Promise<DocumentRecord>
  subscribeToStatusEvents: () => EventSource
}

function createFilesFormData(files: File[]): FormData {
  const formData = new FormData()

  for (const file of files) {
    formData.append('files', file)
  }

  return formData
}

export function createDocumentsApi(apiClient: ApiClient): DocumentsApi {
  return {
    listDocuments: (): Promise<DocumentRecord[]> => {
      return apiClient.request<DocumentRecord[]>('/documents')
    },

    listCollections: (): Promise<DocumentCollection[]> => {
      return apiClient.request<DocumentCollection[]>('/documents/collections')
    },

    uploadDocument: (file: File): Promise<UploadDocumentResult> => {
      const formData = new FormData()
      formData.append('file', file)

      return apiClient.request<UploadDocumentResult>('/documents/upload', {
        method: 'POST',
        body: formData
      })
    },

    uploadDocumentCollection: (files: File[]): Promise<UploadDocumentCollectionResult> => {
      return apiClient.request<UploadDocumentCollectionResult>('/documents/collections/upload', {
        method: 'POST',
        body: createFilesFormData(files)
      })
    },

    addDocumentsToCollection: (
      collectionId: string,
      files: File[]
    ): Promise<UploadDocumentCollectionResult> => {
      return apiClient.request<UploadDocumentCollectionResult>(
        `/documents/collections/${collectionId}/documents`,
        {
          method: 'POST',
          body: createFilesFormData(files)
        }
      )
    },

    parseDocument: (documentId: string): Promise<DocumentRecord> => {
      return apiClient.request<DocumentRecord>(`/documents/${documentId}/parse`, {
        method: 'POST'
      })
    },

    parseCollection: (collectionId: string): Promise<DocumentRecord[]> => {
      return apiClient.request<DocumentRecord[]>(`/documents/collections/${collectionId}/parse`, {
        method: 'POST'
      })
    },

    deleteDocument: (documentId: string): Promise<DeleteDocumentResult> => {
      return apiClient.request<DeleteDocumentResult>(`/documents/${documentId}`, {
        method: 'DELETE'
      })
    },

    deleteOriginalFile: (documentId: string): Promise<DocumentRecord> => {
      return apiClient.request<DocumentRecord>(`/documents/${documentId}/original-file`, {
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

export async function listCollections(): Promise<DocumentCollection[]> {
  return documentsApi.listCollections()
}

export async function uploadDocument(file: File): Promise<UploadDocumentResult> {
  return documentsApi.uploadDocument(file)
}

export async function uploadDocumentCollection(
  files: File[]
): Promise<UploadDocumentCollectionResult> {
  return documentsApi.uploadDocumentCollection(files)
}

export async function addDocumentsToCollection(
  collectionId: string,
  files: File[]
): Promise<UploadDocumentCollectionResult> {
  return documentsApi.addDocumentsToCollection(collectionId, files)
}

export async function parseDocument(documentId: string): Promise<DocumentRecord> {
  return documentsApi.parseDocument(documentId)
}

export async function parseCollection(collectionId: string): Promise<DocumentRecord[]> {
  return documentsApi.parseCollection(collectionId)
}

export async function deleteDocument(documentId: string): Promise<DeleteDocumentResult> {
  return documentsApi.deleteDocument(documentId)
}

export async function deleteOriginalFile(documentId: string): Promise<DocumentRecord> {
  return documentsApi.deleteOriginalFile(documentId)
}
