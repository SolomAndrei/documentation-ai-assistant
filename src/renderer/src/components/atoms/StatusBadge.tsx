import type { DocumentStatus } from '../../types/documents'

interface StatusBadgeProps {
  status: DocumentStatus
}

const statusClasses: Record<DocumentStatus, string> = {
  uploaded: 'bg-slate-400/15 text-slate-200',
  queued: 'bg-amber-400/15 text-amber-200',
  processing: 'bg-cyan-400/15 text-cyan-200',
  completed: 'bg-emerald-400/15 text-emerald-200',
  failed: 'bg-red-400/15 text-red-200'
}

const statusLabels: Record<DocumentStatus, string> = {
  uploaded: 'Uploaded',
  queued: 'Queued',
  processing: 'Parsing',
  completed: 'Parsed',
  failed: 'Failed'
}

export function StatusBadge({ status }: StatusBadgeProps): React.JSX.Element {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  )
}
