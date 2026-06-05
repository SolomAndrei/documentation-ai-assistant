import { EmptyState } from '../atoms/EmptyState'
import { ErrorMessage } from '../atoms/ErrorMessage'
import { Button } from '../atoms/Button'
import { DocumentCard } from '../molecules/DocumentCard'
import { FileDropzone } from '../molecules/FileDropzone'
import { useDocumentsList } from '../../features/documents/useDocuments'

export function DocumentsSidebar(): React.JSX.Element {
  const documents = useDocumentsList()

  return (
    <aside className="flex min-h-screen flex-col gap-5 border-r border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-7">
      <header>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-300">
          Documentation AI
        </p>
        <h1 className="text-2xl font-bold text-white">Documents</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Upload local documentation as collections, then parse documents individually or together.
        </p>
      </header>

      <FileDropzone
        isUploading={documents.isUploading}
        label="Drop files to create a collection"
        multiple
        onFilesSelected={documents.uploadDocumentCollection}
      />

      {documents.error ? (
        <ErrorMessage
          message={
            documents.error instanceof Error ? documents.error.message : String(documents.error)
          }
        />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {documents.isLoading ? (
          <EmptyState message="Loading documents..." />
        ) : documents.collections.length === 0 ? (
          <EmptyState message="No document collections yet." />
        ) : (
          documents.collections.map((collection) => {
            const collectionDocuments = documents.documents.filter(
              (document) => document.collectionId === collection.id
            )

            return (
              <section
                key={collection.id}
                className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.035] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-white" title={collection.name}>
                      {collection.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {collectionDocuments.length}{' '}
                      {collectionDocuments.length === 1 ? 'document' : 'documents'}
                    </p>
                  </div>
                  <Button
                    disabled={
                      !collectionDocuments.some(
                        (document) =>
                          (document.status === 'uploaded' || document.status === 'failed') &&
                          !document.originalFileDeletedAt
                      )
                    }
                    variant="secondary"
                    onClick={() => documents.parseCollection(collection.id)}
                  >
                    Parse all
                  </Button>
                </div>

                <FileDropzone
                  isUploading={documents.isUploading}
                  label="Add files to this collection"
                  multiple
                  onFilesSelected={(files) =>
                    documents.addDocumentsToCollection({ collectionId: collection.id, files })
                  }
                />

                {collectionDocuments.length === 0 ? (
                  <EmptyState message="No documents in this collection." />
                ) : (
                  collectionDocuments.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      isSelected={documents.selectedDocumentId === document.id}
                      onDelete={documents.deleteDocument}
                      onDeleteOriginal={documents.deleteOriginalFile}
                      onParse={documents.parseDocument}
                      onSelect={documents.selectDocument}
                    />
                  ))
                )}
              </section>
            )
          })
        )}
      </div>
    </aside>
  )
}
