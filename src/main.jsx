import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (err) {
  document.getElementById('root').innerHTML =
    '<div style="padding:20px;color:red;font-family:monospace;white-space:pre-wrap;word-break:break-word;">' +
    '<h2>Startup Error</h2><p>' + err.message + '</p><pre>' + err.stack + '</pre></div>';
}
