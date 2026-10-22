
import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import './App.css'

export function App() {
  const [token, setToken] = useState<string | null>(null)

  if (!token) {
    return <Login onLoginSuccess={(accessToken) => setToken(accessToken)} />
  }

  return (
    <Dashboard
      token={token}
      onLogout={() => {
        setToken(null)
      }}
    />
  )
}

export default App


