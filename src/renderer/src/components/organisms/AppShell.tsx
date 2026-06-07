import { DocumentsSidebar } from './DocumentsSidebar'
import { Workspace } from './Workspace'
import { useDocumentStatusEvents } from '../../features/documents/useDocumentStatusEvents'

export function AppShell(): React.JSX.Element {
  useDocumentStatusEvents()

  return (
    <div className="grid min-h-screen grid-cols-[380px_1fr] bg-slate-950 text-slate-100 max-[900px]:grid-cols-1">
      <DocumentsSidebar />
      <Workspace />
    </div>
  )
}
