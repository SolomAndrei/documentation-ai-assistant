import { useEffect, useState } from 'react'

function App(): React.JSX.Element {
  const [message, setMessage] = useState<string>('Loading...')

  useEffect(() => {
    async function fetchFromNest(): Promise<void> {
      const port = await window.api.getApiPort()
      const apiUrl = `http://localhost:${port}/api`
      try {
        const response = await fetch(`${apiUrl}/hello`)
        const data = await response.json()
        setMessage(data.message)
      } catch (error) {
        setMessage('Ошибка подключения к бэкенду')
        console.error(error)
      }
    }
    fetchFromNest()
  }, [])
  return (
    <div>
      <h1>RAG Application</h1>
      <p>Ответ сервера: {message}</p>
    </div>
  )
}

export default App
