import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const rootElement = document.getElementById('root')
const root = createRoot(rootElement)

function RootComponent() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    import('playroomkit')
      .then(({ insertCoin }) => insertCoin())
      .then(() => setIsInitialized(true))
      .catch(setError)
  }, [])

  if (error) {
    return (
      <div style={{color: 'white', textAlign: 'center', padding: '2rem'}}>
        <h2>Ошибка подключения</h2>
        <p>{error.message}</p>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <div style={{color: 'white', textAlign: 'center', padding: '2rem'}}>
        Загрузка...
      </div>
    )
  }

  return <App />
}

root.render(
  <StrictMode>
    <RootComponent />
  </StrictMode>
)