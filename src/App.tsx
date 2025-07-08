import { useState, useEffect, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { createPhaserGame } from './Game'

function App() {
  const [count, setCount] = useState(0)
  const phaserRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phaserRef.current) {
      const game = createPhaserGame(phaserRef.current)
      return () => {
        game.destroy(true)
      }
    }
  }, [])

  return (
    <>
      <div ref={phaserRef} style={{ width: 800, height: 600, margin: '0 auto' }} />
    </>
  )
}

export default App
