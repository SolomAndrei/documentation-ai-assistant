import { create } from 'zustand'

interface DocumentsUiState {
  selectedDocumentId: string | null
  setSelectedDocumentId: (documentId: string | null) => void
}

export const useDocumentsUiStore = create<DocumentsUiState>((set) => ({
  selectedDocumentId: null,
  setSelectedDocumentId: (selectedDocumentId) => set({ selectedDocumentId })
}))
