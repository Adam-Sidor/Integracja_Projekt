import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

const API = 'http://localhost:8080'

/* ── Tab switcher ──────────────────────────────────────────── */
function TabBar({ active, onChange }) {
  return (
    <div className="auth-tabs" role="tablist">
      <button
        id="tab-login"
        role="tab"
        aria-selected={active === 'login'}
        className={`auth-tab${active === 'login' ? ' auth-tab--active' : ''}`}
        onClick={() => onChange('login')}
      >
        Logowanie
      </button>
      <button
        id="tab-register"
        role="tab"
        aria-selected={active === 'register'}
        className={`auth-tab${active === 'register' ? ' auth-tab--active' : ''}`}
        onClick={() => onChange('register')}
      >
        Rejestracja
      </button>
    </div>
  )
}

/* ── Login form ────────────────────────────────────────────── */
function LoginForm() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [fields, setFields]   = useState({ username: '', password: '' })
  const [error,  setError]    = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd logowania')
      login(data.token, { username: data.username, role: data.role })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label className="form-label" htmlFor="login-username">Nazwa użytkownika</label>
        <input
          id="login-username"
          type="text"
          className="form-input"
          placeholder="np. jan_kowalski"
          value={fields.username}
          onChange={set('username')}
          required
          autoComplete="username"
        />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="login-password">Hasło</label>
        <input
          id="login-password"
          type="password"
          className="form-input"
          placeholder="••••••••"
          value={fields.password}
          onChange={set('password')}
          required
          autoComplete="current-password"
        />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button
        id="login-submit"
        type="submit"
        className="btn btn-primary btn-full"
        disabled={loading}
      >
        {loading ? 'Logowanie…' : 'Zaloguj się'}
      </button>
    </form>
  )
}

/* ── Register form ─────────────────────────────────────────── */
function RegisterForm({ onSuccess }) {
  const [fields, setFields]   = useState({ username: '', email: '', password: '', confirm: '' })
  const [error,  setError]    = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setFields(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (fields.password.length < 6) {
      return setError('Hasło musi mieć co najmniej 6 znaków.')
    }
    if (fields.password !== fields.confirm) {
      return setError('Hasła nie są zgodne.')
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          username: fields.username,
          email:    fields.email,
          password: fields.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Błąd rejestracji')
      setSuccess(true)
      setTimeout(() => onSuccess(), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="form-success" role="status">
        <span className="form-success-icon">✓</span>
        <p>Konto zostało utworzone!</p>
        <p className="form-success-sub">Przekierowuję do logowania…</p>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label className="form-label" htmlFor="reg-username">Nazwa użytkownika</label>
        <input
          id="reg-username"
          type="text"
          className="form-input"
          placeholder="min. 3 znaki"
          value={fields.username}
          onChange={set('username')}
          required
          minLength={3}
          autoComplete="username"
        />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="reg-email">Adres e-mail</label>
        <input
          id="reg-email"
          type="email"
          className="form-input"
          placeholder="jan@example.com"
          value={fields.email}
          onChange={set('email')}
          required
          autoComplete="email"
        />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="reg-password">Hasło</label>
        <input
          id="reg-password"
          type="password"
          className="form-input"
          placeholder="min. 6 znaków"
          value={fields.password}
          onChange={set('password')}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="reg-confirm">Powtórz hasło</label>
        <input
          id="reg-confirm"
          type="password"
          className="form-input"
          placeholder="••••••••"
          value={fields.confirm}
          onChange={set('confirm')}
          required
          autoComplete="new-password"
        />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button
        id="register-submit"
        type="submit"
        className="btn btn-primary btn-full"
        disabled={loading}
      >
        {loading ? 'Tworzenie konta…' : 'Zarejestruj się'}
      </button>
    </form>
  )
}

/* ── Page ──────────────────────────────────────────────────── */
export default function AuthPage() {
  const [tab, setTab] = useState('login')

  return (
    <div className="auth-page">
      {/* Decorative glow */}
      <div className="auth-glow" aria-hidden="true" />

      <div className="auth-card">
        {/* Brand */}
        <Link to="/" className="auth-brand">
          <span>📊</span>
          <span>RynekMieszkań</span>
        </Link>

        <h1 className="auth-title">
          {tab === 'login' ? 'Witaj z powrotem' : 'Utwórz konto'}
        </h1>
        <p className="auth-subtitle">
          {tab === 'login'
            ? 'Zaloguj się, aby uzyskać dostęp do dashboardu.'
            : 'Dołącz i analizuj dane rynku nieruchomości.'}
        </p>

        <TabBar active={tab} onChange={setTab} />

        {tab === 'login'
          ? <LoginForm />
          : <RegisterForm onSuccess={() => setTab('login')} />
        }
      </div>
    </div>
  )
}
