import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../../api/documents'
import { useDocumentsUiStore } from '../../store/documents-ui.store'
import type { DocumentCollection, DocumentRecord } from '../../types/documents'

export const documentsQueryKey = ['documents'] as const
export const documentCollectionsQueryKey = ['document-collections'] as const

interface UseDocumentsListResult {
  collections: DocumentCollection[]
  documents: DocumentRecord[]
  selectedDocumentId: string | null
  isLoading: boolean
  isUploading: boolean
  error: unknown
  uploadDocumentCollection: (files: File[]) => void
  addDocumentsToCollection: (input: { collectionId: string; files: File[] }) => void
  parseDocument: (documentId: string) => void
  parseCollection: (collectionId: string) => void
  deleteDocument: (documentId: string) => void
  deleteOriginalFile: (documentId: string) => void
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

  const collectionsQuery = useQuery({
    queryKey: documentCollectionsQueryKey,
    queryFn: documentsApi.listCollections
  })

  async function invalidateDocumentsAndCollections(): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: documentsQueryKey }),
      queryClient.invalidateQueries({ queryKey: documentCollectionsQueryKey })
    ])
  }

  const uploadCollectionMutation = useMutation({
    mutationFn: documentsApi.uploadDocumentCollection,
    onSuccess: async ({ documents }) => {
      selectDocument(documents[0]?.id ?? null)
      await invalidateDocumentsAndCollections()
    }
  })

  const addDocumentsToCollectionMutation = useMutation({
    mutationFn: ({ collectionId, files }: { collectionId: string; files: File[] }) =>
      documentsApi.addDocumentsToCollection(collectionId, files),
    onSuccess: async ({ documents }) => {
      if (documents[0]) {
        selectDocument(documents[0].id)
      }
      await invalidateDocumentsAndCollections()
    }
  })

  const parseMutation = useMutation({
    mutationFn: documentsApi.parseDocument,
    onSuccess: async (document) => {
      selectDocument(document.id)
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey })
    }
  })

  const parseCollectionMutation = useMutation({
    mutationFn: documentsApi.parseCollection,
    onSuccess: async () => {
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

  const deleteOriginalFileMutation = useMutation({
    mutationFn: documentsApi.deleteOriginalFile,
    onSuccess: async (document) => {
      selectDocument(document.id)
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey })
    }
  })

  const documents = documentsQuery.data ?? []
  const collections = collectionsQuery.data ?? []
  const error =
    documentsQuery.error ??
    collectionsQuery.error ??
    uploadCollectionMutation.error ??
    addDocumentsToCollectionMutation.error ??
    parseMutation.error ??
    parseCollectionMutation.error ??
    deleteMutation.error ??
    deleteOriginalFileMutation.error

  return {
    collections,
    documents,
    selectedDocumentId,
    isLoading: documentsQuery.isLoading || collectionsQuery.isLoading,
    isUploading: uploadCollectionMutation.isPending || addDocumentsToCollectionMutation.isPending,
    error,
    uploadDocumentCollection: uploadCollectionMutation.mutate,
    addDocumentsToCollection: addDocumentsToCollectionMutation.mutate,
    parseDocument: parseMutation.mutate,
    parseCollection: parseCollectionMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    deleteOriginalFile: deleteOriginalFileMutation.mutate,
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
