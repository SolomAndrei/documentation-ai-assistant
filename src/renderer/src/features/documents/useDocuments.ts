import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../../api/documents'
import { useDocumentsUiStore } from '../../store/documents-ui.store'
import type { DocumentRecord } from '../../types/documents'

export const documentsQueryKey = ['documents'] as const

interface UseDocumentsListResult {
  documents: DocumentRecord[]
  selectedDocumentId: string | null
  isLoading: boolean
  isUploading: boolean
  error: unknown
  uploadDocument: (file: File) => void
  parseDocument: (documentId: string) => void
  deleteDocument: (documentId: string) => void
  selectDocument: (documentId: string | null) => void
}

interface UseSelectedDocumentResult {
  selectedDocument: DocumentRecord | null
}

export function useDocumentsList(): UseDocumentsListResult {
  const queryClient = useQueryClient()
  const selectedDocumentId = useDocumentsUiStore((state) => state.selectedDocumentId)
  const selectDocument = useDocumentsUiStore((state) => state.setSelectedDocumentId)

  const documentsQuery = useQuery({
    queryKey: documentsQueryKey,
    queryFn: documentsApi.listDocuments
  })

  const uploadMutation = useMutation({
    mutationFn: documentsApi.uploadDocument,
    onSuccess: async ({ document }) => {
      selectDocument(document.id)
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey })
    }
  })

  const parseMutation = useMutation({
    mutationFn: documentsApi.parseDocument,
    onSuccess: async (document) => {
      selectDocument(document.id)
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: documentsApi.deleteDocument,
    onSuccess: async (_, documentId) => {
      if (selectedDocumentId === documentId) {
        selectDocument(null)
      }

      await queryClient.invalidateQueries({ queryKey: documentsQueryKey })
    }
  })

  const documents = documentsQuery.data ?? []
  const error =
    documentsQuery.error ?? uploadMutation.error ?? parseMutation.error ?? deleteMutation.error

  return {
    documents,
    selectedDocumentId,
    isLoading: documentsQuery.isLoading,
    isUploading: uploadMutation.isPending,
    error,
    uploadDocument: uploadMutation.mutate,
    parseDocument: parseMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    selectDocument
  }
}

export function useSelectedDocument(): UseSelectedDocumentResult {
  const selectedDocumentId = useDocumentsUiStore((state) => state.selectedDocumentId)

  const documentsQuery = useQuery({
    queryKey: documentsQueryKey,
    queryFn: documentsApi.listDocuments
  })

  const documents = documentsQuery.data ?? []
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null

  return {
    selectedDocument
  }
}
