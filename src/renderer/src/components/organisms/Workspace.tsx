import { useSelectedDocument } from '../../features/documents/useDocuments'

export function Workspace(): React.JSX.Element {
  const { selectedDocument } = useSelectedDocument()

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.18),transparent_34%),#0f1117] p-10">
      <section className="max-w-2xl rounded-[28px] border border-white/10 bg-white/[0.055] p-9 shadow-2xl shadow-black/30">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-300">
          RAG Workspace
        </p>
        {selectedDocument ? (
          <>
            <h2 className="text-2xl font-bold text-white">{selectedDocument.originalName}</h2>
            <p className="mt-3 leading-7 text-slate-400">
              Current status: <span className="text-slate-100">{selectedDocument.status}</span>.
              Chat, chunks, and retrieval previews will appear here as the next product area.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white">AI chat will appear here</h2>
            <p className="mt-3 leading-7 text-slate-400">
              Use the document panel to upload files, start parsing, and track document states. The
              next step is connecting parsing progress and chunk previews.
            </p>
          </>
        )}
      </section>
    </main>
  )
}
