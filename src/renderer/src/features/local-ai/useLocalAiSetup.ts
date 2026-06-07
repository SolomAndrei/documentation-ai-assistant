import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getLocalAiStatus,
  startLocalAiSetup,
  subscribeToLocalAiSetupEvents,
  type LocalAiSetupEvent,
  type LocalAiStatusResponse
} from '../../api/localAi'

const localAiStatusQueryKey = ['local-ai-status'] as const

interface UseLocalAiSetupResult {
  status: LocalAiStatusResponse | null
  setupEvent: LocalAiSetupEvent | null
  isChecking: boolean
  isInstalling: boolean
  refresh: () => Promise<void>
  install: () => void
  cancel: () => void
}

export function useLocalAiSetup(isEnabled: boolean): UseLocalAiSetupResult {
  const queryClient = useQueryClient()
  const [setupEvent, setSetupEvent] = useState<LocalAiSetupEvent | null>(null)

  const statusQuery = useQuery({
    queryKey: localAiStatusQueryKey,
    queryFn: getLocalAiStatus,
    enabled: isEnabled,
    refetchInterval: (query) => (query.state.data?.ready === false ? 3000 : false)
  })

  const setupMutation = useMutation({
    mutationFn: startLocalAiSetup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: localAiStatusQueryKey })
    }
  })

  useEffect(() => {
    if (!isEnabled) {
      return
    }

    const eventSource = subscribeToLocalAiSetupEvents()

    eventSource.onmessage = (event) => {
      const setupEvent = JSON.parse(event.data) as LocalAiSetupEvent
      setSetupEvent(setupEvent)

      if (setupEvent.status === 'completed' || setupEvent.status === 'failed') {
        void queryClient.invalidateQueries({ queryKey: localAiStatusQueryKey })
      }
    }

    return () => {
      eventSource.close()
    }
  }, [isEnabled, queryClient])

  return {
    status: statusQuery.data ?? null,
    setupEvent,
    isChecking: statusQuery.isFetching,
    isInstalling: setupMutation.isPending || setupEvent?.status === 'running',
    refresh: async () => {
      await statusQuery.refetch()
    },
    install: () => {
      setupMutation.mutate()
    },
    cancel: () => {
      void window.api.quitApp()
    }
  }
}
