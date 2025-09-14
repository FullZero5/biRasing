import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { insertCoin } from 'playroomkit'

insertCoin()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  }).catch(error => {
    console.error("Ошибка инициализации:", error)
    rootElement.innerHTML = `<div style="color: white; text-align: center; padding: 2rem;">
    <h2>Ошибка подключения</h2>
    <p>${error.message}</p>
  </div>`
  })
