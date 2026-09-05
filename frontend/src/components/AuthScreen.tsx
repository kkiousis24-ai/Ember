import { useState, type FormEvent } from 'react'
import {
  getCurrentUser,
  login,
  register,
  type AuthUser,
} from '../services/auth'
import './AuthScreen.css'

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void
}

function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (isRegistering && password !== confirmPassword) {
      setError('Οι κωδικοί πρόσβασης δεν ταιριάζουν.')
      return
    }

    setIsLoading(true)

    try {
      if (isRegistering) {
        await register(email, password)
      }

      await login(email, password)

      const user = await getCurrentUser()

      if (!user) {
        throw new Error('Δεν ήταν δυνατή η επιβεβαίωση του λογαριασμού.')
      }

      onAuthenticated(user)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Κάτι πήγε στραβά. Δοκίμασε ξανά.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-flame">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path
                fill="currentColor"
                d="M17.4 2.5c.5 4.7-3.2 6.3-3.2 9.4 0 1.5.8 2.8 2.2 3.6-.2-2.5 1.1-4.5 3.4-6.2 3.2 2.5 5.2 5.7 5.2 9.1 0 4.8-3.9 8.6-8.8 8.6S7.4 23.2 7.4 18.4c0-3.7 2.1-6.9 5.1-9.6-.3 3.4 1.2 5.1 2.2 5.8-.2-4.4 2.4-6.7 2.7-12.1Z"
              />
              <path
                fill="#ffd0b8"
                d="M16.4 16.1c2 1.7 3.1 3.3 3.1 5.1a3.3 3.3 0 0 1-6.6 0c0-1.5.8-2.9 2.1-4.1 0 1.4.5 2.2 1.1 2.7-.1-1.5.2-2.6.3-3.7Z"
              />
            </svg>
          </div>
          <strong>Ember</strong>
        </div>

        <div className="auth-heading">
          <span className="section-label">BURN & CASH FLOW</span>
          <h1>{isRegistering ? 'Δημιούργησε λογαριασμό' : 'Καλώς ήρθες πίσω'}</h1>
          <p>
            {isRegistering
              ? 'Ξεκίνα τη δωρεάν δοκιμή 14 ημερών.'
              : 'Συνδέσου στον χώρο εργασίας σου.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Κωδικός πρόσβασης</label>
          <input
            id="password"
            type="password"
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            placeholder="Τουλάχιστον 8 χαρακτήρες"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />

          {isRegistering && (
            <>
              <label htmlFor="confirm-password">Επιβεβαίωση κωδικού</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Επανάλαβε τον κωδικό"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={isLoading}>
            {isLoading
              ? 'Παρακαλώ περίμενε...'
              : isRegistering
                ? 'Δημιουργία λογαριασμού'
                : 'Σύνδεση'}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {isRegistering ? 'Έχεις ήδη λογαριασμό;' : 'Δεν έχεις λογαριασμό;'}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering)
              setError('')
            }}
          >
            {isRegistering ? 'Σύνδεση' : 'Ξεκίνα δωρεάν'}
          </button>
        </div>
      </section>
    </main>
  )
}

export default AuthScreen