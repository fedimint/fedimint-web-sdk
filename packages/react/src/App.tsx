import React, { useState } from 'react'
import './App.css'
import { useBalance } from '../lib'
import { FedimintWallet } from '@fedimint/core-web'
import reactImage from './assets/react.svg'

function App() {
  const [count, setCount] = useState(0)

  const wallet = new FedimintWallet()

  const balance = useBalance(wallet)

  return (
    <>
      <img height={300} src={reactImage} />
      <h1>Fedimint Web SDK - React</h1>
      <div>
        <b>Balance: {balance}</b>
      </div>
    </>
  )
}

export default App
