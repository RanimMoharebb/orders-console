
import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import './App.css'

const TOKEN_KEY = 'accessToken'

export function App() {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem(TOKEN_KEY),
  )

  function handleLoginSuccess(accessToken: string) {
    sessionStorage.setItem(TOKEN_KEY, accessToken)
    setToken(accessToken)
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <Dashboard
      token={token}
      onLogout={handleLogout}
    />
  )
}

export default App


