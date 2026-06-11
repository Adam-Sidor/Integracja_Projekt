import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './AdminPage.css'

const API = 'http://localhost:8080'

export default function AdminPage() {
  const { session } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${session?.token}`
          }
        })
        if (!res.ok) {
          throw new Error('Nie udało się pobrać statystyk administratora.')
        }
        const data = await res.json()
        setStats(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (session?.token) {
      fetchStats()
    }
  }, [session])

  return (
    <div className="admin-page-container">
      <div className="admin-wrapper">
        <header className="admin-header">
          <span className="admin-shield">🛡️</span>
          <h1 className="admin-title">Panel Administratora</h1>
          <p className="admin-subtitle">Statystyki systemu i bazy danych</p>
        </header>

        {loading && (
          <div className="admin-loading">
            <div className="spinner"></div>
            <p>Ładowanie statystyk...</p>
          </div>
        )}

        {error && (
          <div className="admin-error">
            <p className="error-msg">⚠️ {error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">Spróbuj ponownie</button>
          </div>
        )}

        {stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <span className="stat-card-icon">🏠</span>
              <div className="stat-card-content">
                <span className="stat-card-label">Rekordy cen mieszkań</span>
                <span className="stat-card-value">{stats.prices.toLocaleString('pl-PL')}</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <span className="stat-card-icon">📈</span>
              <div className="stat-card-content">
                <span className="stat-card-label">Rekordy stóp NBP</span>
                <span className="stat-card-value">{stats.rates.toLocaleString('pl-PL')}</span>
              </div>
            </div>

            <div className="admin-stat-card">
              <span className="stat-card-icon">👤</span>
              <div className="stat-card-content">
                <span className="stat-card-label">Użytkownicy w systemie</span>
                <span className="stat-card-value">{stats.users.toLocaleString('pl-PL')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
