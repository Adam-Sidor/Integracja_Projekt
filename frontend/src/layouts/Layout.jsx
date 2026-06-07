import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

const NAV_LINKS = [
  { to: '/',            label: 'Dashboard' },
  { to: '/regiony',     label: 'Regiony' },
  { to: '/o-projekcie', label: 'O projekcie' },
]

function Navbar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const { session, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">📊</span>
        <span className="brand-name">RynekMieszkań</span>
      </Link>

      <ul className="navbar-links">
        {NAV_LINKS.map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              className={pathname === to ? 'nav-link nav-link--active' : 'nav-link'}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="navbar-actions">
        {session ? (
          <>
            <span className="nav-user">
              👤 {session.user.username}
              {session.user.role === 'ADMIN' && (
                <span className="nav-badge">Admin</span>
              )}
            </span>
            <button
              id="navbar-logout"
              className="btn btn-ghost"
              onClick={handleLogout}
            >
              Wyloguj
            </button>
          </>
        ) : (
          <Link id="navbar-login" to="/auth" className="btn btn-primary">
            Zaloguj się
          </Link>
        )}
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-icon">📊</span>
          <span className="brand-name">RynekMieszkań</span>
        </div>
        <p className="footer-copy">© 2026 Projekt — Integracja Systemów</p>
        <ul className="footer-links">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <Link to={to}>{label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}

export default function Layout({ children }) {
  return (
    <div className="page-wrapper">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
