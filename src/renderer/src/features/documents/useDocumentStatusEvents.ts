import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../../api/documents'
import type { DocumentRecord } from '../../types/documents'
import { documentsQueryKey } from './useDocuments'

export function useDocumentStatusEvents(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const eventSource = documentsApi.subscribeToStatusEvents()

    eventSource.onmessage = (event) => {
      const updatedDocument = JSON.parse(event.data) as DocumentRecord

      queryClient.setQueryData<DocumentRecord[]>(documentsQueryKey, (currentDocuments) => {
        if (!currentDocuments) {
          return currentDocuments
        }

        return currentDocuments.map((document) =>
          document.id === updatedDocument.id ? updatedDocument : document
        )
      })
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [queryClient])
}
