import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface DocumentsUiState {
  selectedDocumentId: string | null
  setSelectedDocumentId: (documentId: string | null) => void
}

export const useDocumentsUiStore = create<DocumentsUiState>()(
  devtools(
    (set) => ({
      selectedDocumentId: null,
      setSelectedDocumentId: (selectedDocumentId) =>
        set({ selectedDocumentId }, false, 'documentsUi/setSelectedDocumentId')
    }),
    {
      name: 'Documents UI Store'
    }
  )
)
