import { Link } from 'react-router-dom'
import './StartPage.css'

export default function StartPage() {
  return (
    <div className="start-page">
      {/* Background orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />

      <header className="start-header">
        <div className="start-brand">
          <span className="start-brand-icon">📊</span>
          <span className="start-brand-name">RynekMieszkań</span>
        </div>
      </header>

      <main className="start-main">
        <div className="start-hero">
          <div className="start-badge">Integracja Systemów · 2026</div>

          <h1 className="start-title">
            Analityka rynku<br />
            <span className="start-title-accent">nieruchomości</span>
          </h1>

          <p className="start-subtitle">
            Zaloguj się, aby uzyskać dostęp do interaktywnego dashboardu
            z danymi o cenach mieszkań i stopach procentowych NBP w Polsce.
          </p>

          <div className="start-actions">
            <Link id="start-login-btn" to="/auth" className="start-btn-primary">
              <span>Zaloguj się</span>
              <span className="btn-arrow">→</span>
            </Link>
            <Link id="start-register-btn" to="/auth?tab=register" className="start-btn-ghost">
              Utwórz konto
            </Link>
          </div>
        </div>
      </main>

      <footer className="start-footer">
        <p>© 2026 RynekMieszkań · Projekt — Integracja Systemów</p>
      </footer>
    </div>
  )
}
