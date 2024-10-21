import React from 'react'
import './App.css'
import HooksDemo from './components/HooksDemo'
// @ts-ignore
import reactImage from './assets/react.svg'

function App() {
  return (
    <>
      <img height={200} src={reactImage} />
      <h2>Fedimint Web SDK - React</h2>
      <HooksDemo />
    </>
  )
}

export default App
