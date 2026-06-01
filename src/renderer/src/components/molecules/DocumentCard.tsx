import { Button } from '../atoms/Button'
import { StatusBadge } from '../atoms/StatusBadge'
import type { DocumentRecord } from '../../types/documents'

interface DocumentCardProps {
  document: DocumentRecord
  isSelected: boolean
  onDelete: (documentId: string) => void
  onParse: (documentId: string) => void
  onSelect: (documentId: string) => void
}

function formatFileSize(size: number): string {
  return `${(size / 1024).toFixed(1)} KB`
}

function canStartParsing(document: DocumentRecord): boolean {
  return document.status === 'uploaded' || document.status === 'failed'
}

export function DocumentCard({
  document,
  isSelected,
  onDelete,
  onParse,
  onSelect
}: DocumentCardProps): React.JSX.Element {
  return (
    <article
      className={`flex flex-col gap-3 rounded-2xl border p-4 transition ${
        isSelected
          ? 'border-indigo-300/70 bg-indigo-400/10'
          : 'border-white/10 bg-white/[0.045] hover:border-white/20'
      }`}
      onClick={() => onSelect(document.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="truncate text-sm font-bold text-white" title={document.originalName}>
          {document.originalName}
        </h2>
        <StatusBadge status={document.status} />
      </div>

      <div className="text-xs text-slate-400">
        {formatFileSize(document.size)} · {new Date(document.createdAt).toLocaleString()}
      </div>

      {document.errorMessage && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-2 text-xs text-red-100">
          {document.errorMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button
          disabled={!canStartParsing(document)}
          variant={document.status === 'failed' ? 'secondary' : 'primary'}
          onClick={(event) => {
            event.stopPropagation()
            onParse(document.id)
          }}
        >
          {document.status === 'failed' ? 'Retry parsing' : 'Start parsing'}
        </Button>
        <Button
          variant="danger"
          onClick={(event) => {
            event.stopPropagation()
            onDelete(document.id)
          }}
        >
          Delete
        </Button>
      </div>
    </article>
  )
}
