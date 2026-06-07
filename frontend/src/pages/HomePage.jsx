import { useState } from 'react'
import './HomePage.css'

/* ─── Static demo data ────────────────────────────────────────────── */
const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

const REGIONS = ['Warszawa', 'Kraków', 'Wrocław', 'Poznań', 'Gdańsk', 'Łódź']

const INTEREST_RATES = [1.5, 1.5, 1.5, 1.5, 1.5, 0.1, 0.1, 6.75, 5.75, 5.75]

const PRICES = {
  Warszawa:  { primary: [7200,7500,8000,8800,9700,10500,11800,13500,14200,15100], secondary: [6800,7000,7400,8100,9000,9800,11000,12500,13200,14000] },
  Kraków:    { primary: [5800,6000,6400,7000,7900,8500,9800,11500,12400,13200], secondary: [5400,5600,6000,6600,7400,8000,9200,10800,11600,12400] },
  Wrocław:   { primary: [5500,5700,6100,6700,7500,8100,9400,11000,11900,12700], secondary: [5100,5300,5700,6300,7000,7600,8800,10200,11000,11800] },
  Poznań:    { primary: [5000,5200,5500,6100,6800,7400,8500,9900,10700,11400], secondary: [4700,4900,5200,5700,6400,7000,8000,9300,10000,10700] },
  Gdańsk:    { primary: [5600,5800,6300,7000,7900,8600,9900,11600,12500,13300], secondary: [5200,5400,5900,6500,7300,8000,9200,10800,11600,12400] },
  Łódź:     { primary: [3800,3900,4100,4500,5000,5400,6300,7400,8000,8600],  secondary: [3500,3600,3800,4200,4700,5100,5900,6900,7500,8100]  },
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function pct(val, ref) {
  const d = ((val - ref) / ref) * 100
  return (d >= 0 ? '+' : '') + d.toFixed(1) + '%'
}

function formatPrice(n) {
  return n.toLocaleString('pl-PL') + ' zł/m²'
}

/* ─── Mini charts ────────────────────────────────────────────────── */
function BarChart({ data, labels, color, unit }) {
  const max = Math.max(...data)
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
  const minV = Math.min(...allVals)
  const maxV = Math.max(...allVals)
  const range = maxV - minV || 1

  const xScale = i => PAD.l + (i / (labels.length - 1)) * innerW
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
              <title>{labels[i]}: {formatPrice(v)}</title>
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
function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-content">
        <p className="hero-eyebrow">Analiza rynku nieruchomości · 2015–2024</p>
        <h1 className="hero-title">
          Stopy procentowe<br />
          <span className="hero-highlight">a ceny mieszkań</span>
        </h1>
        <p className="hero-subtitle">
          Interaktywne zestawienie danych o wysokości stóp procentowych NBP
          i cenach transakcyjnych mieszkań w Polsce w ostatnim dziesięcioleciu.
          Analizuj trendy według regionu i typu rynku.
        </p>
        <div className="hero-badges">
          <span className="badge">📅 10 lat danych</span>
          <span className="badge">🗺️ 6 regionów</span>
          <span className="badge">🏗️ Rynek pierwotny &amp; wtórny</span>
        </div>
      </div>
    </section>
  )
}

function Dashboard() {
  const [region, setRegion] = useState('Warszawa')
  const [market, setMarket] = useState('both')

  const primaryData   = PRICES[region].primary
  const secondaryData = PRICES[region].secondary
  const lastIdx = YEARS.length - 1

  const activePrimary   = market !== 'secondary'
  const activeSecondary = market !== 'primary'

  const series = [
    ...(activePrimary   ? [{ data: primaryData,   label: 'Rynek pierwotny' }] : []),
    ...(activeSecondary ? [{ data: secondaryData, label: 'Rynek wtórny' }]    : []),
  ]
  const colors = ['#6c63ff', '#ff6584']

  const latestPrimary   = primaryData[lastIdx]
  const latestSecondary = secondaryData[lastIdx]
  const latestRate      = INTEREST_RATES[lastIdx]
  const peakRate        = Math.max(...INTEREST_RATES)
  const peakYear        = YEARS[INTEREST_RATES.indexOf(peakRate)]

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
              {REGIONS.map(r => (
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
            <span className="kpi-label">Cena (pierwotny) 2024</span>
            <span className="kpi-value">{formatPrice(latestPrimary)}</span>
            <span className="kpi-change positive">{pct(latestPrimary, primaryData[0])} od 2015</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Cena (wtórny) 2024</span>
            <span className="kpi-value">{formatPrice(latestSecondary)}</span>
            <span className="kpi-change positive">{pct(latestSecondary, secondaryData[0])} od 2015</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Stopa ref. NBP (2024)</span>
            <span className="kpi-value">{latestRate}%</span>
            <span className="kpi-change neutral">Szczyt: {peakRate}% ({peakYear})</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Różnica pier./wt. 2024</span>
            <span className="kpi-value">{formatPrice(latestPrimary - latestSecondary)}</span>
            <span className="kpi-change neutral">{pct(latestPrimary, latestSecondary)} drożej pierwotny</span>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Ceny mieszkań – {region}</h3>
              <div className="chart-legend">
                {activePrimary   && <span className="legend-dot" style={{ '--dot-clr': '#6c63ff' }}>Pierwotny</span>}
                {activeSecondary && <span className="legend-dot" style={{ '--dot-clr': '#ff6584' }}>Wtórny</span>}
              </div>
            </div>
            <LineChart series={series} labels={YEARS} colors={colors} />
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Referencyjna stopa NBP (%)</h3>
            </div>
            <BarChart
              data={INTEREST_RATES}
              labels={YEARS}
              color="linear-gradient(180deg, #6c63ff 0%, #8a5cf7 100%)"
              unit="%"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section className="about-section" id="o-projekcie">
      <div className="about-inner">
        <h2 className="section-title">O projekcie</h2>
        <p className="about-text">
          Projekt realizowany w ramach kursu <strong>Integracja Systemów</strong>.
          Celem jest zestawienie i wizualizacja publicznie dostępnych danych
          o stopach procentowych NBP oraz cenach transakcyjnych mieszkań
          w Polsce w latach 2015–2024, z podziałem na regiony
          i typ rynku (pierwotny / wtórny).
        </p>
        <div className="source-tags">
          <span className="source-tag">Źródło: NBP</span>
          <span className="source-tag">Źródło: GUS</span>
          <span className="source-tag">Źródło: BaRN</span>
        </div>
      </div>
    </section>
  )
}

/* ─── Page export ────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Dashboard />
      <AboutSection />
    </>
  )
}
