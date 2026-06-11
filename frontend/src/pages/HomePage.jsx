import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import './HomePage.css'

const API = 'http://localhost:8080'

/* ─── Helpers ────────────────────────────────────────────────────── */
function pct(val, ref) {
  if (!ref) return '0.0%'
  const d = ((val - ref) / ref) * 100
  return (d >= 0 ? '+' : '') + d.toFixed(1) + '%'
}

function formatPrice(n) {
  return Math.round(n).toLocaleString('pl-PL') + ' zł/m²'
}

/* ─── Mini charts ────────────────────────────────────────────────── */
function BarChart({ data, labels, color, unit }) {
  const max = Math.max(...data, 1)
  return (
    <div className="bar-chart">
      {data.map((val, i) => (
        <div className="bar-col" key={i}>
          <div
            className="bar-fill"
            style={{ height: `${(val / max) * 100}%`, background: color }}
            title={`${labels[i]}: ${val}${unit}`}
          />
          <span className="bar-label">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

function LineChart({ series, labels, colors }) {
  const W = 480, H = 180, PAD = { t: 12, r: 12, b: 28, l: 48 }
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b

  const allVals = series.flatMap(s => s.data)
  const minV = Math.min(...allVals, 0)
  const maxV = Math.max(...allVals, 1)
  const range = maxV - minV || 1

  const xScale = i => PAD.l + (i / (labels.length - 1 || 1)) * innerW
  const yScale = v => PAD.t + innerH - ((v - minV) / range) * innerH

  const toPath = data =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ')

  const ticks = 4
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => minV + (range / ticks) * i)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="line-chart-svg" role="img" aria-label="Wykres liniowy cen mieszkań">
      {tickVals.map((tv, i) => (
        <g key={i}>
          <line
            x1={PAD.l} y1={yScale(tv).toFixed(1)}
            x2={W - PAD.r} y2={yScale(tv).toFixed(1)}
            stroke="rgba(255,255,255,.07)" strokeWidth="1"
          />
          <text x={PAD.l - 6} y={yScale(tv) + 4} fill="rgba(255,255,255,.35)" fontSize="9" textAnchor="end">
            {Math.round(tv / 1000)}k
          </text>
        </g>
      ))}

      {series.map((s, si) => (
        <g key={si}>
          <path d={toPath(s.data)} fill="none" stroke={colors[si]} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {s.data.map((v, i) => (
            <circle key={i} cx={xScale(i)} cy={yScale(v)} r="3.5" fill={colors[si]} stroke="#0f1117" strokeWidth="1.5">
              <title>{s.label} ({labels[i]}): {formatPrice(v)}</title>
            </circle>
          ))}
        </g>
      ))}

      {labels.map((l, i) => (
        <text key={i} x={xScale(i)} y={H - 6} fill="rgba(255,255,255,.35)" fontSize="9" textAnchor="middle">
          {l}
        </text>
      ))}
    </svg>
  )
}

/* ─── Sections ───────────────────────────────────────────────────── */
function Dashboard() {
  const { session } = useAuth()
  const [prices, setPrices] = useState([])
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [region, setRegion] = useState('Warszawa')
  const [market, setMarket] = useState('both')

  // Pobieranie danych przy wejściu na stronę
  useEffect(() => {
    async function fetchData() {
      try {
        const headers = { 'Authorization': `Bearer ${session?.token}` }
        const [pricesRes, ratesRes] = await Promise.all([
          fetch(`${API}/api/prices`, { headers }),
          fetch(`${API}/api/rates`, { headers })
        ])

        if (!pricesRes.ok || !ratesRes.ok) {
          throw new Error('Nie udało się pobrać danych z serwera.')
        }

        const pricesData = await pricesRes.json()
        const ratesData = await ratesRes.json()

        setPrices(pricesData)
        setRates(ratesData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (session?.token) {
      fetchData()
    }
  }, [session])

  // Wyciągamy unikalne dostępne regiony/miasta z danych cenowych
  const regions = useMemo(() => {
    const set = new Set(prices.map(p => p.city))
    return set.size > 0 ? Array.from(set).sort() : ['Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk', 'Łódź']
  }, [prices])

  // Wyciągamy unikalne lata dostępne w systemie
  const years = useMemo(() => {
    const yearsSet = new Set()
    prices.forEach(p => yearsSet.add(p.year))
    rates.forEach(r => {
      if (r.validFrom) {
        const y = new Date(r.validFrom).getFullYear()
        if (!isNaN(y)) yearsSet.add(y)
      }
    })

    const arr = Array.from(yearsSet).sort()
    // Domyślny fallback na wypadek braku danych
    return arr.length > 0 ? arr : [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
  }, [prices, rates])

  // Ustawienie regionu na pierwszy dostępny po załadowaniu
  useEffect(() => {
    if (regions.length > 0 && !regions.includes(region)) {
      setRegion(regions[0])
    }
  }, [regions, region])

  // Wyliczanie danych wykresów i KPI dla wybranego regionu i lat
  const processedData = useMemo(() => {
    const primaryData = []
    const secondaryData = []
    const interestRates = []

    // Określamy dostępny typ ceny (preferując 'transakcyjna', inaczej bierzemy pierwszy napotkany, np. 'ofertowa')
    const availablePriceTypes = Array.from(new Set(prices.map(p => p.priceType?.toLowerCase()))).filter(Boolean)
    const activePriceType = availablePriceTypes.includes('transakcyjna') 
      ? 'transakcyjna' 
      : (availablePriceTypes[0] || '')

    // Filtrujemy ceny tylko dla wybranego miasta i ustalonego typu ceny
    const cityPrices = prices.filter(p => 
      p.city.toLowerCase() === region.toLowerCase() && 
      p.priceType?.toLowerCase() === activePriceType
    )
    // Filtrujemy tylko stopę referencyjną 'ref'
    const refRates = rates.filter(r => r.rateId === 'ref')

    years.forEach(year => {
      // 1. Rynek Pierwotny (pierwotny) - wyliczamy średnią cenę w roku
      const primInYear = cityPrices.filter(p => p.year === year && p.marketType.toLowerCase() === 'pierwotny')
      const primAvg = primInYear.length > 0
        ? primInYear.reduce((acc, curr) => acc + curr.pricePerSqm, 0) / primInYear.length
        : (primaryData[primaryData.length - 1] || 0) // fallback do poprzedniego roku
      primaryData.push(primAvg)

      // 2. Rynek Wtórny (wtórny) - wyliczamy średnią cenę w roku
      const secInYear = cityPrices.filter(p => p.year === year && p.marketType.toLowerCase() === 'wtórny')
      const secAvg = secInYear.length > 0
        ? secInYear.reduce((acc, curr) => acc + curr.pricePerSqm, 0) / secInYear.length
        : (secondaryData[secondaryData.length - 1] || 0) // fallback do poprzedniego roku
      secondaryData.push(secAvg)

      // 3. Stopy procentowe - wartość na koniec danego roku (lub średnia z roku)
      // Bierzemy stopę referencyjną aktywną w dniu 31 grudnia danego roku
      const endOfYearDate = new Date(`${year}-12-31`)
      const activeRate = refRates
        .filter(r => {
          const from = new Date(r.validFrom)
          const to = r.validTo ? new Date(r.validTo) : null
          return from <= endOfYearDate && (!to || to >= endOfYearDate)
        })
        .sort((a, b) => new Date(b.validFrom) - new Date(a.validFrom))[0]

      const rateVal = activeRate ? activeRate.value : (interestRates[interestRates.length - 1] || 0)
      interestRates.push(rateVal)
    })

    return { primaryData, secondaryData, interestRates }
  }, [prices, rates, region, years])

  const { primaryData, secondaryData, interestRates } = processedData

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Ładowanie danych analitycznych z backendu...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p className="error-msg">⚠️ {error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary"> Spróbuj ponownie</button>
      </div>
    )
  }

  const lastIdx = years.length - 1
  const activePrimary = market !== 'secondary'
  const activeSecondary = market !== 'primary'

  const series = [
    ...(activePrimary ? [{ data: primaryData, label: 'Rynek pierwotny' }] : []),
    ...(activeSecondary ? [{ data: secondaryData, label: 'Rynek wtórny' }] : []),
  ]
  const colors = ['#6c63ff', '#ff6584']

  const latestPrimary = primaryData[lastIdx] || 0
  const latestSecondary = secondaryData[lastIdx] || 0
  const latestRate = interestRates[lastIdx] || 0
  const peakRate = interestRates.length > 0 ? Math.max(...interestRates) : 0
  const peakYear = years[interestRates.indexOf(peakRate)] || '-'

  return (
    <section className="dashboard" id="dashboard">
      <div className="section-container">
        <p className="section-eyebrow">Dashboard analityczny</p>
        <h2 className="section-title">Dane dla regionu i rynku</h2>

        {/* Controls */}
        <div className="controls-row">
          <div className="control-group">
            <label className="control-label">Region</label>
            <div className="btn-group">
              {regions.map(r => (
                <button
                  key={r}
                  className={`btn btn-filter${region === r ? ' active' : ''}`}
                  onClick={() => setRegion(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="control-group">
            <label className="control-label">Typ rynku</label>
            <div className="btn-group">
              {[['both', 'Oba'], ['primary', 'Pierwotny'], ['secondary', 'Wtórny']].map(([val, label]) => (
                <button
                  key={val}
                  className={`btn btn-filter${market === val ? ' active' : ''}`}
                  onClick={() => setMarket(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Cena (pierwotny) {years[lastIdx]}</span>
            <span className="kpi-value">{formatPrice(latestPrimary)}</span>
            <span className="kpi-change positive">{pct(latestPrimary, primaryData[0])} od {years[0]}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Cena (wtórny) {years[lastIdx]}</span>
            <span className="kpi-value">{formatPrice(latestSecondary)}</span>
            <span className="kpi-change positive">{pct(latestSecondary, secondaryData[0])} od {years[0]}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Stopa ref. NBP ({years[lastIdx]})</span>
            <span className="kpi-value">{latestRate}%</span>
            <span className="kpi-change neutral">Szczyt: {peakRate}% ({peakYear})</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Różnica pier./wt. {years[lastIdx]}</span>
            <span className="kpi-value">{formatPrice(Math.abs(latestPrimary - latestSecondary))}</span>
            <span className="kpi-change neutral">
              {latestPrimary > latestSecondary
                ? `${pct(latestPrimary, latestSecondary)} drożej pierwotny`
                : `${pct(latestSecondary, latestPrimary)} drożej wtórny`}
            </span>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Ceny mieszkań – {region}</h3>
              <div className="chart-legend">
                {activePrimary && <span className="legend-dot" style={{ '--dot-clr': '#6c63ff' }}>Pierwotny</span>}
                {activeSecondary && <span className="legend-dot" style={{ '--dot-clr': '#ff6584' }}>Wtórny</span>}
              </div>
            </div>
            <LineChart series={series} labels={years} colors={colors} />
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Referencyjna stopa NBP (%)</h3>
            </div>
            <BarChart
              data={interestRates}
              labels={years}
              color="linear-gradient(180deg, #6c63ff 0%, #8a5cf7 100%)"
              unit="%"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Page export ────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <Dashboard />
    </>
  )
}
