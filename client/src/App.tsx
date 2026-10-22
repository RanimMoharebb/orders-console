import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import type { AuthSession, UserRole } from './types'

import './App.css'

const TOKEN_KEY = 'accessToken'
const ROLE_KEY = 'userRole'

export function App() {
const [session, setSession] = useState<AuthSession | null>(() => {
const token = sessionStorage.getItem(TOKEN_KEY)
const role = sessionStorage.getItem(ROLE_KEY) as UserRole | null


if (!token || !role) {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(ROLE_KEY)
  return null
}

return { token, role }


})

function handleLoginSuccess(token: string, role: UserRole) {
sessionStorage.setItem(TOKEN_KEY, token)
sessionStorage.setItem(ROLE_KEY, role)
setSession({ token, role })
}

function handleLogout() {
sessionStorage.removeItem(TOKEN_KEY)
sessionStorage.removeItem(ROLE_KEY)
setSession(null)
}

if (!session) {
return <Login onLoginSuccess={handleLoginSuccess} />
}

return ( <Dashboard
   token={session.token}
   role={session.role}
   onLogout={handleLogout}
 />
)
}

export default App
