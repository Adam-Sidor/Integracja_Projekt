import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './AdminPage.css'

const API = 'http://localhost:8080'

export default function AdminPage() {
  const { session } = useAuth()
  const [stats, setStats] = useState(null)
<<<<<<< HEAD
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingAction, setLoadingAction] = useState(null)
  const [notification, setNotification] = useState(null)

  // File inputs state
  const [yamlFile, setYamlFile] = useState(null)
  const [ratesXmlFile, setRatesXmlFile] = useState(null)
  const [pricesXmlFile, setPricesXmlFile] = useState(null)
  const [dbJsonFile, setDbJsonFile] = useState(null)

  function showNotification(text, type = 'success') {
    setNotification({ text, type })
    setTimeout(() => {
      setNotification(null)
    }, 8000)
  }

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
    }
  }

  async function fetchConfig() {
    try {
      const res = await fetch(`${API}/api/config`, {
        headers: {
          'Authorization': `Bearer ${session?.token}`
        }
      })
      if (!res.ok) {
        throw new Error('Nie udało się pobrać aktywnej konfiguracji systemu.')
      }
      const data = await res.json()
      setConfig(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        setError('')
        await Promise.all([fetchStats(), fetchConfig()])
=======
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
>>>>>>> 7fed03088020042c1ee44000d189c6dc08ca8ce2
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (session?.token) {
<<<<<<< HEAD
      loadData()
    }
  }, [session])

  // General POST / DELETE actions
  async function handleAction(url, method = 'POST', successMsg = 'Akcja wykonana pomyślnie', confirmText = null) {
    if (confirmText && !window.confirm(confirmText)) return

    setNotification(null)
    setLoadingAction(url)
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session?.token}`
        }
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Wystąpił błąd podczas przetwarzania żądania.')
      }

      let extra = ''
      if (data.saved !== undefined) extra = ` (Zapisano: ${data.saved})`
      else if (data.deleted !== undefined) extra = ` (Usunięto: ${data.deleted})`
      else if (data.savedRates !== undefined) extra = ` (Stopy: ${data.savedRates}, Ceny: ${data.savedPrices})`
      else if (data.deletedPrices !== undefined) extra = ` (Ceny: ${data.deletedPrices}, Stopy: ${data.deletedRates})`

      showNotification(`${successMsg}${extra}`, 'success')
      await fetchStats()
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  // Handle files download
  async function handleDownload(url, defaultFilename) {
    setNotification(null)
    setLoadingAction(url)
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.token}`
        }
      })
      if (!res.ok) {
        throw new Error(`Pobieranie nie powiodło się: ${res.statusText}`)
      }
      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', defaultFilename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      showNotification(`Pomyślnie pobrano plik: ${defaultFilename}`, 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setLoadingAction(null)
    }
  }

  // Handle file uploads
  async function handleUpload(url, file, fileParamName, successMsg, clearStateFn) {
    if (!file) {
      showNotification('Wybierz plik przed zatwierdzeniem.', 'error')
      return
    }
    setNotification(null)
    setLoadingAction(url)
    try {
      const formData = new FormData()
      formData.append(fileParamName, file)

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.token}`
        },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Wystąpił błąd podczas importowania pliku.')
      }

      let extra = ''
      if (data.imported !== undefined) {
        if (typeof data.imported === 'object') {
          extra = ` (Import: Regiony: ${data.imported.regions}, Typy: ${data.imported.propertyTypes}, Stopy: ${data.imported.interestRates}, Ceny: ${data.imported.apartmentPrices})`
        } else {
          extra = ` (Importowano: ${data.imported})`
        }
      }

      showNotification(`${successMsg}${extra}`, 'success')
      clearStateFn()
      await fetchStats()
      if (url.includes('config')) {
        await fetchConfig()
      }
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setLoadingAction(null)
    }
  }

=======
      fetchStats()
    }
  }, [session])

>>>>>>> 7fed03088020042c1ee44000d189c6dc08ca8ce2
  return (
    <div className="admin-page-container">
      <div className="admin-wrapper">
        <header className="admin-header">
          <span className="admin-shield">🛡️</span>
          <h1 className="admin-title">Panel Administratora</h1>
<<<<<<< HEAD
          <p className="admin-subtitle">Kompleksowe zarządzanie systemem, konfiguracją i danymi</p>
        </header>

        {/* Global Notification Toast */}
        {notification && (
          <div className={`admin-notification-toast ${notification.type}`} id="admin-toast">
            <span className="toast-icon">
              {notification.type === 'success' ? '✅' : '⚠️'}
            </span>
            <span className="toast-message">{notification.text}</span>
            <button onClick={() => setNotification(null)} className="toast-close">×</button>
          </div>
        )}

        {loading && (
          <div className="admin-loading">
            <div className="spinner"></div>
            <p>Ładowanie panelu administratora...</p>
=======
          <p className="admin-subtitle">Statystyki systemu i bazy danych</p>
        </header>

        {loading && (
          <div className="admin-loading">
            <div className="spinner"></div>
            <p>Ładowanie statystyk...</p>
>>>>>>> 7fed03088020042c1ee44000d189c6dc08ca8ce2
          </div>
        )}

        {error && (
          <div className="admin-error">
            <p className="error-msg">⚠️ {error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">Spróbuj ponownie</button>
          </div>
        )}

<<<<<<< HEAD
        {!loading && !error && (
          <>
            {/* 1. Statystyki bazodanowe */}
            {stats && (
              <section className="admin-section">
                <h2 className="section-title">📊 Statystyki bazy danych</h2>
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <span className="stat-card-icon">🏠</span>
                    <div className="stat-card-content">
                      <span className="stat-card-label">Ceny mieszkań</span>
                      <span className="stat-card-value">{stats.prices.toLocaleString('pl-PL')}</span>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <span className="stat-card-icon">📈</span>
                    <div className="stat-card-content">
                      <span className="stat-card-label">Stopy procentowe NBP</span>
                      <span className="stat-card-value">{stats.rates.toLocaleString('pl-PL')}</span>
                    </div>
                  </div>

                  <div className="admin-stat-card">
                    <span className="stat-card-icon">👤</span>
                    <div className="stat-card-content">
                      <span className="stat-card-label">Użytkownicy</span>
                      <span className="stat-card-value">{stats.users.toLocaleString('pl-PL')}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 2. Konfiguracja YAML */}
            {config && (
              <section className="admin-section card-box">
                <h2 className="section-title">⚙️ Konfiguracja systemu (YAML)</h2>
                <div className="config-container">
                  <div className="config-details">
                    <div className="config-item">
                      <span className="config-label">Lata wstecz (NBP):</span>
                      <span className="config-value">{config.yearsBack}</span>
                    </div>
                    <div className="config-item">
                      <span className="config-label">API stóp procentowych:</span>
                      <span className="config-value code-text">{config.ratesUrl}</span>
                    </div>
                    <div className="config-item">
                      <span className="config-label">API cen mieszkań:</span>
                      <span className="config-value code-text">{config.pricesUrl}</span>
                    </div>
                  </div>

                  <div className="config-actions">
                    <div className="action-row">
                      <button
                        id="btn-export-config"
                        disabled={loadingAction !== null}
                        onClick={() => handleDownload(`${API}/api/config/export`, 'config.yaml')}
                        className="btn btn-primary"
                      >
                        📥 Eksportuj config.yaml
                      </button>
                    </div>

                    <div className="action-row upload-row">
                      <div className="file-input-wrapper">
                        <input
                          type="file"
                          id="config-file-upload"
                          accept=".yaml,.yml"
                          onChange={(e) => setYamlFile(e.target.files[0])}
                        />
                        <label htmlFor="config-file-upload" className="btn btn-ghost">
                          {yamlFile ? `📁 ${yamlFile.name}` : 'Wybierz config.yaml'}
                        </label>
                      </div>
                      <button
                        id="btn-import-config"
                        disabled={!yamlFile || loadingAction !== null}
                        onClick={() => handleUpload(
                          `${API}/api/config/import`,
                          yamlFile,
                          'file',
                          'Ustawienia zostały zaktualizowane z pliku YAML',
                          () => setYamlFile(null)
                        )}
                        className="btn btn-outline"
                      >
                        🚀 Importuj i nadpisz
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 3. Pobieranie z NBP & Czyszczenie bazy */}
            <section className="admin-section card-box">
              <h2 className="section-title">⚡ Synchronizacja i czyszczenie bazy</h2>
              <div className="operations-grid">
                <div className="operations-card">
                  <h3>🔄 Pobieranie danych z NBP</h3>
                  <p className="operations-desc">Zaciągnij najnowsze dane ze zdefiniowanych źródeł zewnętrznych.</p>
                  <div className="buttons-group">
                    <button
                      id="btn-fetch-rates"
                      disabled={loadingAction !== null}
                      onClick={() => handleAction(`${API}/api/admin/fetch-rates`, 'POST', 'Pomyślnie pobrano stopy procentowe')}
                      className="btn btn-outline"
                    >
                      📈 Pobierz stopy NBP
                    </button>
                    <button
                      id="btn-fetch-prices"
                      disabled={loadingAction !== null}
                      onClick={() => handleAction(`${API}/api/admin/fetch-prices`, 'POST', 'Pomyślnie pobrano ceny mieszkań')}
                      className="btn btn-outline"
                    >
                      🏠 Pobierz ceny mieszkań
                    </button>
                    <button
                      id="btn-fetch-all"
                      disabled={loadingAction !== null}
                      onClick={() => handleAction(`${API}/api/admin/fetch-all`, 'POST', 'Pomyślnie zsynchronizowano wszystkie dane')}
                      className="btn btn-primary"
                    >
                      ⚡ Pobierz wszystko
                    </button>
                  </div>
                </div>

                <div className="operations-card border-accent">
                  <h3>🚨 Czyszczenie bazy danych</h3>
                  <p className="operations-desc">Usuń trwale pobrane rekordy. Ta operacja jest nieodwracalna!</p>
                  <div className="buttons-group">
                    <button
                      id="btn-clear-prices"
                      disabled={loadingAction !== null}
                      onClick={() => handleAction(
                        `${API}/api/admin/clear/prices`,
                        'DELETE',
                        'Pomyślnie usunięto ceny mieszkań',
                        'Czy na pewno chcesz usunąć WSZYSTKIE rekordy cen mieszkań z bazy danych?'
                      )}
                      className="btn btn-ghost danger-btn"
                    >
                      🗑️ Wyczyść ceny
                    </button>
                    <button
                      id="btn-clear-rates"
                      disabled={loadingAction !== null}
                      onClick={() => handleAction(
                        `${API}/api/admin/clear/rates`,
                        'DELETE',
                        'Pomyślnie usunięto stopy procentowe',
                        'Czy na pewno chcesz usunąć WSZYSTKIE rekordy stóp procentowych z bazy danych?'
                      )}
                      className="btn btn-ghost danger-btn"
                    >
                      🗑️ Wyczyść stopy
                    </button>
                    <button
                      id="btn-clear-all"
                      disabled={loadingAction !== null}
                      onClick={() => handleAction(
                        `${API}/api/admin/clear/all`,
                        'DELETE',
                        'Pomyślnie wyczyszczono całą bazę danych',
                        'Ostrzeżenie: Ta akcja usunie wszystkie ceny i stopy procentowe. Czy kontynuować?'
                      )}
                      className="btn btn-accent"
                    >
                      💥 Wyczyść wszystko
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Import / Eksport XML i JSON */}
            <section className="admin-section card-box">
              <h2 className="section-title">📂 Eksport i Import plików danych (XML / JSON)</h2>
              <div className="data-exchange-grid">

                {/* XML Section */}
                <div className="exchange-card">
                  <h3>📄 Format XML</h3>
                  <div className="exchange-actions">
                    <div className="exchange-subsect">
                      <h4>Eksport</h4>
                      <div className="buttons-group">
                        <button
                          id="btn-export-xml-rates"
                          disabled={loadingAction !== null}
                          onClick={() => handleDownload(`${API}/api/export/xml/rates`, 'interest_rates.xml')}
                          className="btn btn-ghost"
                        >
                          📥 XML Stopy
                        </button>
                        <button
                          id="btn-export-xml-prices"
                          disabled={loadingAction !== null}
                          onClick={() => handleDownload(`${API}/api/export/xml/prices`, 'apartment_prices.xml')}
                          className="btn btn-ghost"
                        >
                          📥 XML Ceny
                        </button>
                      </div>
                    </div>

                    <div className="exchange-subsect">
                      <h4>Import</h4>

                      <div className="upload-inline-row">
                        <div className="file-input-wrapper">
                          <input
                            type="file"
                            id="rates-xml-upload"
                            accept=".xml"
                            onChange={(e) => setRatesXmlFile(e.target.files[0])}
                          />
                          <label htmlFor="rates-xml-upload" className="btn btn-ghost btn-sm">
                            {ratesXmlFile ? `📁 ${ratesXmlFile.name}` : 'Wybierz stopy XML'}
                          </label>
                        </div>
                        <button
                          id="btn-import-xml-rates"
                          disabled={!ratesXmlFile || loadingAction !== null}
                          onClick={() => handleUpload(
                            `${API}/api/export/xml/rates/import`,
                            ratesXmlFile,
                            'file',
                            'Zaimportowano stopy procentowe z pliku XML',
                            () => setRatesXmlFile(null)
                          )}
                          className="btn btn-outline btn-sm"
                        >
                          Prześlij XML
                        </button>
                      </div>

                      <div className="upload-inline-row">
                        <div className="file-input-wrapper">
                          <input
                            type="file"
                            id="prices-xml-upload"
                            accept=".xml"
                            onChange={(e) => setPricesXmlFile(e.target.files[0])}
                          />
                          <label htmlFor="prices-xml-upload" className="btn btn-ghost btn-sm">
                            {pricesXmlFile ? `📁 ${pricesXmlFile.name}` : 'Wybierz ceny XML'}
                          </label>
                        </div>
                        <button
                          id="btn-import-xml-prices"
                          disabled={!pricesXmlFile || loadingAction !== null}
                          onClick={() => handleUpload(
                            `${API}/api/export/xml/prices/import`,
                            pricesXmlFile,
                            'file',
                            'Zaimportowano ceny mieszkań z pliku XML',
                            () => setPricesXmlFile(null)
                          )}
                          className="btn btn-outline btn-sm"
                        >
                          Prześlij XML
                        </button>
                      </div>

                    </div>
                  </div>
                </div>

                {/* JSON Section */}
                <div className="exchange-card">
                  <h3>📦 Kopia zapasowa bazy (JSON)</h3>
                  <div className="exchange-actions">
                    <div className="exchange-subsect">
                      <h4>Eksport pełnego dumpu</h4>
                      <button
                        id="btn-export-db-json"
                        disabled={loadingAction !== null}
                        onClick={() => handleDownload(`${API}/api/export/db`, 'database_export.json')}
                        className="btn btn-primary"
                      >
                        📥 Pobierz pełny dump JSON
                      </button>
                    </div>

                    <div className="exchange-subsect">
                      <h4>Przywracanie / Import dumpu</h4>
                      <div className="upload-inline-row">
                        <div className="file-input-wrapper">
                          <input
                            type="file"
                            id="db-json-upload"
                            accept=".json"
                            onChange={(e) => setDbJsonFile(e.target.files[0])}
                          />
                          <label htmlFor="db-json-upload" className="btn btn-ghost">
                            {dbJsonFile ? `📁 ${dbJsonFile.name}` : 'Wybierz dump JSON'}
                          </label>
                        </div>
                        <button
                          id="btn-import-db-json"
                          disabled={!dbJsonFile || loadingAction !== null}
                          onClick={() => handleUpload(
                            `${API}/api/export/db/import`,
                            dbJsonFile,
                            'file',
                            'Baza danych została zaktualizowana z kopii JSON',
                            () => setDbJsonFile(null)
                          )}
                          className="btn btn-outline"
                        >
                          Przywróć JSON
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* 5. Usługi SOAP (WSDL) */}
            <section className="admin-section card-box soap-wsdl-section">
              <h2 className="section-title">🌐 SOAP Web Service</h2>
              <p className="wsdl-desc">
                Usługa SOAP udostępnia aktualne stopy procentowe. Kliknij poniższy przycisk, aby wyświetlić wygenerowany dokument WSDL w nowej karcie.
              </p>
              <a
                href="http://localhost:8080/ws/rates.wsdl"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary wsdl-btn"
                id="btn-wsdl-rates"
              >
                📡 Otwórz Rates WSDL Document
              </a>
            </section>
          </>
=======
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
>>>>>>> 7fed03088020042c1ee44000d189c6dc08ca8ce2
        )}
      </div>
    </div>
  )
}
