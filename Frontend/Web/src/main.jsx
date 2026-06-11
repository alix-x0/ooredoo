import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@/styles/globals.css'
import App from '@/App.jsx'
import { ThemeProvider } from '@/components/theme-provider'
import { ToastProvider } from '@/components/ui/custom-toast'
import { LanguageProvider } from '@/components/language-provider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="ooredoo-ui-theme">
        <LanguageProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
