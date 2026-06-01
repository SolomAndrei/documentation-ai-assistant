import { EmptyState } from '../atoms/EmptyState'
import { ErrorMessage } from '../atoms/ErrorMessage'
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
          Upload local documentation, review processing status, and start parsing when ready.
        </p>
      </header>

      <FileDropzone isUploading={documents.isUploading} onFileSelected={documents.uploadDocument} />

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
        ) : documents.documents.length === 0 ? (
          <EmptyState message="No documents uploaded yet." />
        ) : (
          documents.documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              isSelected={documents.selectedDocumentId === document.id}
              onDelete={documents.deleteDocument}
              onParse={documents.parseDocument}
              onSelect={documents.selectDocument}
            />
          ))
        )}
      </div>
    </aside>
  )
}
