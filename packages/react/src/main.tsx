import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { FedimintWalletProvider } from '../lib/contexts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FedimintWalletProvider lazy={false}>
      <App />
    </FedimintWalletProvider>
  </React.StrictMode>,
)
