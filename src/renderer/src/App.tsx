import { useEffect, useState } from 'react'
import { configureApiClient } from './api/api-client'
import { AppLoadingScreen } from './components/organisms/AppLoadingScreen'
import { AppShell } from './components/organisms/AppShell'
import { LocalAiSetupScreen } from './components/organisms/LocalAiSetupScreen'
import { useLocalAiSetup } from './features/local-ai/useLocalAiSetup'

function App(): React.JSX.Element {
  const [isApiReady, setIsApiReady] = useState(false)
  const localAiSetup = useLocalAiSetup(isApiReady)

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
    return <AppLoadingScreen message="Connecting to local API..." />
  }

  if (!localAiSetup.status) {
    return <AppLoadingScreen message="Checking local AI dependencies..." />
  }

  if (!localAiSetup.status.ready) {
    return (
      <LocalAiSetupScreen
        items={localAiSetup.status.items}
        setupEvent={localAiSetup.setupEvent}
        onCancel={localAiSetup.cancel}
        onInstall={localAiSetup.install}
        isChecking={localAiSetup.isChecking}
        isInstalling={localAiSetup.isInstalling}
      />
    )
  }

  return <AppShell />
}

export default App
