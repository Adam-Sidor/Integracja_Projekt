import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './AdminPage.css'

const API = 'http://localhost:8080'

const SectionNotificationAlert = ({ notification, onClose }) => {
  if (!notification) return null
  return (
    <div style={{
      padding: '12px 16px',
      margin: '10px 0 15px 0',
      background: notification.type === 'success' ? 'rgba(24, 180, 105, 0.15)' : 'rgba(255, 101, 132, 0.15)',
      border: `1px solid ${notification.type === 'success' ? 'rgba(24, 180, 105, 0.4)' : 'rgba(255, 101, 132, 0.4)'}`,
      borderRadius: 'var(--radius-md)',
      color: notification.type === 'success' ? '#52fa9a' : '#ff8fa5',
      fontSize: '0.9rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span>{notification.type === 'success' ? '✅' : '⚠️'} {notification.text}</span>
      <button 
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '0 4px',
          opacity: 0.7
        }}
      >
        ×
      </button>
    </div>
  )
}

export default function AdminPage() {
  const { session } = useAuth()
  const [stats, setStats] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingAction, setLoadingAction] = useState(null)
  const [notification, setNotification] = useState(null)
  const [yamlNotification, setYamlNotification] = useState(null)
  const [syncNotification, setSyncNotification] = useState(null)
  const [exchangeNotification, setExchangeNotification] = useState(null)

  // File inputs state
  const [yamlFile, setYamlFile] = useState(null)
  const [ratesXmlFile, setRatesXmlFile] = useState(null)
  const [pricesXmlFile, setPricesXmlFile] = useState(null)
  const [dbJsonFile, setDbJsonFile] = useState(null)

  // SOAP Test state
  const [soapRateId, setSoapRateId] = useState('')
  const [soapLoading, setSoapLoading] = useState(false)
  const [soapResults, setSoapResults] = useState(null)
  const [soapError, setSoapError] = useState('')
  const [soapRequestXml, setSoapRequestXml] = useState('')
  const [soapResponseXml, setSoapResponseXml] = useState('')

  function showNotification(text, type = 'success', section = 'global') {
    const setFn = 
      section === 'yaml' ? setYamlNotification :
      section === 'sync' ? setSyncNotification :
      section === 'exchange' ? setExchangeNotification :
      setNotification;

    if (!text) {
      setFn(null)
      return
    }

    setFn({ text, type })
    setTimeout(() => {
      setFn(null)
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
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (session?.token) {
      loadData()
    }
  }, [session])

  // General POST / DELETE actions
  async function handleAction(url, method = 'POST', successMsg = 'Akcja wykonana pomyślnie', confirmText = null, section = 'sync') {
    if (confirmText && !window.confirm(confirmText)) return
 
    showNotification(null, null, section)
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
 
      showNotification(`${successMsg}${extra}`, 'success', section)
      await fetchStats()
    } catch (err) {
      showNotification(err.message, 'error', section)
    } finally {
      setLoadingAction(null)
    }
  }

  // Handle files download
  async function handleDownload(url, defaultFilename, section = 'exchange') {
    showNotification(null, null, section)
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
      showNotification(`Pomyślnie pobrano plik: ${defaultFilename}`, 'success', section)
    } catch (err) {
      showNotification(err.message, 'error', section)
    } finally {
      setLoadingAction(null)
    }
  }

  // Handle file uploads
  async function handleUpload(url, file, fileParamName, successMsg, clearStateFn, section = 'exchange') {
    if (!file) {
      showNotification('Wybierz plik przed zatwierdzeniem.', 'error', section)
      return
    }
    showNotification(null, null, section)
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

      showNotification(`${successMsg}${extra}`, 'success', section)
      clearStateFn()
      await fetchStats()
      if (url.includes('config')) {
        await fetchConfig()
      }
    } catch (err) {
      showNotification(err.message, 'error', section)
    } finally {
      setLoadingAction(null)
    }
  }

  async function testSoapEndpoint() {
    setSoapLoading(true)
    setSoapError('')
    setSoapResults(null)
    setSoapRequestXml('')
    setSoapResponseXml('')
    try {
      const xmlPayload = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:rat="http://projekt.example.com/rates">
   <soapenv:Header/>
   <soapenv:Body>
      <rat:GetInterestRatesRequest>
         ${soapRateId ? `<rat:rateId>${soapRateId}</rat:rateId>` : ''}
      </rat:GetInterestRatesRequest>
   </soapenv:Body>
</soapenv:Envelope>
      `.trim()

      setSoapRequestXml(xmlPayload)

      const res = await fetch(`${API}/ws`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8'
        },
        body: xmlPayload
      })

      if (!res.ok) {
        throw new Error(`Błąd HTTP: ${res.status} ${res.statusText}`)
      }

      const text = await res.text()
      setSoapResponseXml(text)
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(text, 'text/xml')
      
      const faultElement = xmlDoc.querySelector('Fault') || xmlDoc.querySelector('faultstring')
      if (faultElement) {
        throw new Error(faultElement.textContent || 'Wystąpił błąd SOAP Fault')
      }

      const ratesNodes = xmlDoc.getElementsByTagNameNS('*', 'rates')
      const parsedRates = []
      for (let i = 0; i < ratesNodes.length; i++) {
        const node = ratesNodes[i]
        const getVal = (tag) => {
          const el = node.getElementsByTagNameNS('*', tag)[0]
          return el ? el.textContent : ''
        }
        parsedRates.push({
          id: getVal('id'),
          rateId: getVal('rateId'),
          rateName: getVal('rateName'),
          value: getVal('value'),
          validFrom: getVal('validFrom'),
          validTo: getVal('validTo')
        })
      }

      setSoapResults(parsedRates)
    } catch (err) {
      setSoapError(err.message)
    } finally {
      setSoapLoading(false)
    }
  }

  return (
    <div className="admin-page-container">
      <div className="admin-wrapper">
        <header className="admin-header">
          <span className="admin-shield">🛡️</span>
          <h1 className="admin-title">Panel Administratora</h1>
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
          </div>
        )}

        {error && (
          <div className="admin-error">
            <p className="error-msg">⚠️ {error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">Spróbuj ponownie</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* 1. Statystyki bazodanowe */}
            {stats && (
              <section className="admin-section card-box">
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
                <SectionNotificationAlert notification={yamlNotification} onClose={() => setYamlNotification(null)} />
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
                        onClick={() => handleDownload(`${API}/api/config/export`, 'config.yaml', 'yaml')}
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
                          () => setYamlFile(null),
                          'yaml'
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
              <SectionNotificationAlert notification={syncNotification} onClose={() => setSyncNotification(null)} />
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
              <SectionNotificationAlert notification={exchangeNotification} onClose={() => setExchangeNotification(null)} />
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
              <p className="wsdl-desc" style={{ marginBottom: '15px' }}>
                Usługa SOAP udostępnia aktualne stopy procentowe pobierane bezpośrednio z bazy danych.
              </p>
              
              <div className="soap-test-wrapper" style={{ marginTop: '10px', width: '100%', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '10px', color: 'var(--clr-text)' }}>🧪 Test endpointu SOAP</h3>
                <p className="wsdl-desc" style={{ textAlign: 'left', margin: '0 0 15px 0', fontSize: '0.9rem' }}>
                  Wyślij zapytanie XML (Document/Literal) bezpośrednio z poziomu przeglądarki, filtrując wyniki opcjonalnym kodem stopy.
                </p>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap' }}>
                  <label htmlFor="soap-rate-select" style={{ fontWeight: '600', fontSize: '0.9rem' }}>Typ stopy (rateId):</label>
                  <select
                    id="soap-rate-select"
                    value={soapRateId}
                    onChange={(e) => setSoapRateId(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--clr-text)',
                      border: '1px solid var(--clr-border)',
                      minWidth: '160px',
                      outline: 'none'
                    }}
                  >
                    <option value="" style={{ background: 'var(--clr-surface)' }}>Wszystkie</option>
                    <option value="ref" style={{ background: 'var(--clr-surface)' }}>Referencyjna (ref)</option>
                    <option value="lom" style={{ background: 'var(--clr-surface)' }}>Lombardowa (lom)</option>
                    <option value="dep" style={{ background: 'var(--clr-surface)' }}>Depozytowa (dep)</option>
                    <option value="red" style={{ background: 'var(--clr-surface)' }}>Redyskontowa (red)</option>
                    <option value="dys" style={{ background: 'var(--clr-surface)' }}>Dyskontowa (dys)</option>
                  </select>
                  
                  <button
                    onClick={testSoapEndpoint}
                    disabled={soapLoading}
                    className="btn btn-primary"
                    style={{ margin: 0 }}
                  >
                    {soapLoading ? 'Wysyłanie...' : 'Wyślij zapytanie SOAP'}
                  </button>
                  
                  <a
                    href="http://localhost:8080/ws/rates.wsdl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    id="btn-wsdl-rates"
                    style={{ margin: 0 }}
                  >
                    📡 Otwórz dokument WSDL
                  </a>
                </div>

                {/* SOAP Envelope Preview */}
                {(soapRequestXml || soapResponseXml) && (
                  <details style={{ marginTop: '15px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', padding: '10px 15px' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', color: 'var(--clr-text-muted)', outline: 'none' }}>
                      🔍 Podgląd koperty SOAP (XML)
                    </summary>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginTop: '12px' }}>
                      <div>
                        <h5 style={{ marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--clr-text-muted)' }}>SOAP Request (Żądanie)</h5>
                        <pre style={{
                          margin: 0,
                          padding: '10px',
                          background: 'rgba(0,0,0,0.4)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          overflowX: 'auto',
                          maxHeight: '200px',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.05)',
                          textAlign: 'left'
                        }}>{soapRequestXml}</pre>
                      </div>
                      <div>
                        <h5 style={{ marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--clr-text-muted)' }}>SOAP Response (Odpowiedź)</h5>
                        <pre style={{
                          margin: 0,
                          padding: '10px',
                          background: 'rgba(0,0,0,0.4)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          overflowX: 'auto',
                          maxHeight: '450px',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.05)',
                          textAlign: 'left'
                        }}>{soapResponseXml}</pre>
                      </div>
                    </div>
                  </details>
                )}

                {soapError && (
                  <div style={{ padding: '12px 16px', background: 'rgba(255, 101, 132, 0.15)', border: '1px solid rgba(255, 101, 132, 0.4)', borderRadius: 'var(--radius-md)', color: '#ff8fa5', marginBottom: '15px', fontSize: '0.9rem' }}>
                    <strong>Błąd komunikacji SOAP:</strong> {soapError}
                  </div>
                )}

                {soapResults && (
                  <div style={{ marginTop: '15px' }}>
                    <h4 style={{ marginBottom: '10px', fontSize: '0.95rem', fontWeight: '600' }}>
                      Wynik zapytania SOAP (znaleziono rekordów: {soapResults.length}):
                    </h4>
                    {soapResults.length === 0 ? (
                      <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Brak danych w bazie dla podanych kryteriów.</p>
                    ) : (
                      <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--clr-border)' }}>
                              <th style={{ padding: '10px 12px' }}>ID</th>
                              <th style={{ padding: '10px 12px' }}>Kod (rateId)</th>
                              <th style={{ padding: '10px 12px' }}>Nazwa stopy</th>
                              <th style={{ padding: '10px 12px' }}>Wartość (%)</th>
                              <th style={{ padding: '10px 12px' }}>Obowiązuje od</th>
                              <th style={{ padding: '10px 12px' }}>Obowiązuje do</th>
                            </tr>
                          </thead>
                          <tbody>
                            {soapResults.map((r) => (
                              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '10px 12px', color: 'var(--clr-text-muted)' }}>{r.id}</td>
                                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 'bold' }}>{r.rateId}</td>
                                <td style={{ padding: '10px 12px' }}>{r.rateName}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: 'var(--clr-primary)' }}>{r.value}%</td>
                                <td style={{ padding: '10px 12px' }}>{r.validFrom}</td>
                                <td style={{ padding: '10px 12px' }}>{r.validTo || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
