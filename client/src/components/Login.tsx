import { useState, type FormEvent } from 'react'
import { request, ApiError } from '../api/apiClient'
import type { ApiResponse, LoginProps, LoginResponseData } from '../types'

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const result = await request<ApiResponse<LoginResponseData>>(
        '/api/auth/login',
        {
          method: 'POST',
          body: { email, password },
        },
      )

      const accessToken = result.data?.token
      const role = result.data?.user?.role

      if (typeof accessToken !== 'string' || !accessToken) {
        throw new Error('The server did not return an access token.')
      }

      if (role !== 'ADMIN' && role !== 'AGENT') {
        throw new Error('The server returned an invalid user role.')
      }

      onLoginSuccess(accessToken, role)
    } catch (err) {
      setLoginError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'An unexpected error occurred during login.',
      )
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Orders Console home">
          <span className="brand-icon">O</span>
          <span>Orders Console</span>
        </a>
        <span className="environment-label">LOCAL ENVIRONMENT</span>
      </header>

      <section className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <p className="eyebrow">OPERATIONS / SECURE ACCESS</p>
          <h1>Welcome back</h1>
          <p className="login-description">
            Sign in to access the orders console.
          </p>

          {loginError && (
            <div className="login-error" role="alert">
              {loginError}
            </div>
          )}

          <label className="login-field">
            <span>Email address</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          <button
            className="login-button"
            type="submit"
            disabled={loginLoading}
          >
            {loginLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="login-footnote">
            Use your seeded administrator account for local testing.
          </p>
        </form>
      </section>
    </main>
  )
}
