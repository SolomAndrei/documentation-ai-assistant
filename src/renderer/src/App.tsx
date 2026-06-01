import { useEffect, useState } from 'react'
import { configureApiClient } from './api/api-client'
import { DocumentsSidebar } from './components/organisms/DocumentsSidebar'
import { Workspace } from './components/organisms/Workspace'
import { useDocumentStatusEvents } from './features/documents/useDocumentStatusEvents'

function App(): React.JSX.Element {
  const [isApiReady, setIsApiReady] = useState(false)

  useEffect(() => {
    async function initApi(): Promise<void> {
      const port = await window.api.getApiPort()
      configureApiClient(`http://localhost:${port}`)
      setIsApiReady(true)
    }

    initApi().catch((error) => {
      console.error(error)
      setIsApiReady(false)
    })
  }, [])

  if (!isApiReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        Connecting to local API...
      </div>
    )
  }

  return <AppShell />
}

function AppShell(): React.JSX.Element {
  useDocumentStatusEvents()

  return (
    <div className="grid min-h-screen grid-cols-[380px_1fr] bg-slate-950 text-slate-100 max-[900px]:grid-cols-1">
      <DocumentsSidebar />
      <Workspace />
    </div>
  )
}

export default App
