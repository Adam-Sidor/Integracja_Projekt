import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

const NAV_LINKS = [
  { to: '/',         label: 'Dashboard' },
  { to: '/regiony',  label: 'Regiony' },
  { to: '/o-projekcie', label: 'O projekcie' },
]

function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">📊</span>
        <span className="brand-name">RynekMieszkań</span>
      </div>
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
