import { apiClient } from './api-client'

export type LocalAiSetupItemStatus = 'ready' | 'missing' | 'pending' | 'installing' | 'error'

export interface LocalAiSetupItem {
  id: string
  label: string
  status: LocalAiSetupItemStatus
  message?: string
}

export interface LocalAiStatusResponse {
  ready: boolean
  items: LocalAiSetupItem[]
}

export type LocalAiSetupEventStatus = 'running' | 'completed' | 'failed'

export interface LocalAiSetupEvent {
  status: LocalAiSetupEventStatus
  itemId: string
  message: string
  progress: number
}

interface StartLocalAiSetupResponse {
  started: boolean
}

export async function getLocalAiStatus(): Promise<LocalAiStatusResponse> {
  return apiClient.request<LocalAiStatusResponse>('/local-ai/status')
}

export async function startLocalAiSetup(): Promise<StartLocalAiSetupResponse> {
  return apiClient.request<StartLocalAiSetupResponse>('/local-ai/setup', {
    method: 'POST'
  })
}

export function subscribeToLocalAiSetupEvents(): EventSource {
  return apiClient.stream('/local-ai/setup-events')
}
