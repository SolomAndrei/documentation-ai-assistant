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
