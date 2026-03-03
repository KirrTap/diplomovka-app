import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './translations/LanguageContext.tsx'

createRoot(document.getElementById('root')!).render(
<React.StrictMode>
  <LanguageProvider>
    <App />
  </LanguageProvider>
</React.StrictMode>
)