import React, { useState } from 'react'
import { useTranslations } from '@lazy-lion/react'
import messages from './App.messages.yaml';
import logo from './logo.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const t = useTranslations();

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{t(messages.hello)}</p>
        <p>
          <button onClick={() => setCount(count => count + 1)}>count is: {count}</button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  )
}

export default App
