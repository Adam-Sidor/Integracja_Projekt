import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { session, logout } = useAuth()

  const links = [
    { to: '/dashboard', label: 'Dashboard' }
  ]

  if (session?.user?.role === 'ADMIN') {
    links.push({ to: '/admin', label: 'Panel Admina' })
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <span className="brand-icon">📊</span>
        <span className="brand-name">RynekMieszkań</span>
      </Link>

      <ul className="navbar-links">
        {links.map(({ to, label }) => (
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
  const { session } = useAuth()
  const links = [
    { to: '/dashboard', label: 'Dashboard' }
  ]

  if (session?.user?.role === 'ADMIN') {
    links.push({ to: '/admin', label: 'Panel Admina' })
  }

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-icon">📊</span>
          <span className="brand-name">RynekMieszkań</span>
        </div>
        <p className="footer-copy">© 2026 Projekt — Integracja Systemów</p>
        <ul className="footer-links">
          {links.map(({ to, label }) => (
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
