import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

const container = document.getElementById('root')
if (!container) throw new Error('#root bulunamadı')

createRoot(container).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

// Açılış ekranını uygulama boyandıktan sonra kaldır
requestAnimationFrame(() => {
  const splash = document.getElementById('splash')
  if (!splash) return
  splash.style.opacity = '0'
  window.setTimeout(() => splash.remove(), 400)
})

// PWA: yalnızca üretim derlemesinde service worker kaydet
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => undefined)
  })
}
