import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async' // 👈 Import this

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider> {/* 👈 Wrap everything here */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)