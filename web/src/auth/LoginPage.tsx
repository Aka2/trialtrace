import { useState } from 'react'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError('Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark"><span></span></div>
          <div className="brand-name" style={{ color: '#0C1F26' }}>TrialTrace<small style={{ color: '#0E6E6E' }}>Data Review</small></div>
        </div>

        <h1>Connexion</h1>
        <p className="login-hint">Accédez à la plateforme de revue.</p>

        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="login-input"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />

        {error && <p className="login-error">{error}</p>}

        <button className="login-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </div>
    </div>
  )
}