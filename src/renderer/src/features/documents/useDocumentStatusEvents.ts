import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../../api/documents'
import type { DocumentRecord } from '../../types/documents'
import { documentsQueryKey } from './useDocuments'

const baseReconnectDelayMs = 1000
const maxReconnectDelayMs = 30000

const getReconnectDelay = (attempt: number): number => {
  const exponentialDelay = baseReconnectDelayMs * 2 ** attempt
  return Math.min(exponentialDelay, maxReconnectDelayMs)
}

export function useDocumentStatusEvents(): void {
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)
  const isDisposedRef = useRef(false)

  useEffect(() => {
    function clearReconnectTimeout(): void {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
    function closeEventSource(): void {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
    function scheduleReconnect(): void {
      if (isDisposedRef.current || reconnectTimeoutRef.current) {
        return
      }
      const delay = getReconnectDelay(reconnectAttemptRef.current)
      reconnectAttemptRef.current += 1
      console.warn(`Document status SSE disconnected. Reconnecting in ${delay}ms.`)
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null
        if (!isDisposedRef.current) {
          connect()
        }
      }, delay)
    }
    function connect(): void {
      closeEventSource()
      const eventSource = documentsApi.subscribeToStatusEvents()
      eventSourceRef.current = eventSource
      eventSource.onopen = () => {
        reconnectAttemptRef.current = 0
        console.info('Document status SSE connected')
      }
      eventSource.onmessage = (event) => {
        try {
          const updatedDocument = JSON.parse(event.data) as DocumentRecord
          queryClient.setQueryData<DocumentRecord[]>(documentsQueryKey, (currentDocuments) => {
            if (!currentDocuments) {
              return currentDocuments
            }
            return currentDocuments.map((document) =>
              document.id === updatedDocument.id ? updatedDocument : document
            )
          })
        } catch (error) {
          console.error('Failed to parse document status SSE event', error)
        }
      }
      eventSource.onerror = () => {
        closeEventSource()
        scheduleReconnect()
      }
    }
    isDisposedRef.current = false
    connect()
    return () => {
      isDisposedRef.current = true
      clearReconnectTimeout()
      closeEventSource()
    }
  }, [queryClient])
}
