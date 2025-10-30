import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import 'primeflex/primeflex.css'
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import './index.css'
import LandingPage from './pages/LandingPage'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LandingPage />
  </React.StrictMode>
)
