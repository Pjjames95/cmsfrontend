import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Test Supabase connection on startup
import { testConnection } from './lib/supabase.js'

testConnection().then(success => {
  if (!success) {
    console.warn('Please check your Supabase configuration')
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
