/* global React, ReactDOM, Topbar, FooterStrip */

// ── Mock fallback (shown while contract loads or if offline) ─────────────────
const MARKETS_MOCK = [
  { id: 12, category: "CRYPTO",   question: "Will BTC close above $150,000 by Dec 31, 2026?",             yes_pct: 68, pool_total: 12420, quality: 9, status: "OPEN"   },
  { id: 31, category: "POLITICS", question: "Will the US Fed cut rates at the July 2026 FOMC meeting?",   yes_pct: 71, pool_total: 22180, quality: 8, status: "OPEN"   },
  { id: 22, category: "TECH",     question: "Will Apple ship AR glasses to consumers in 2026?",           yes_pct: 31, pool_total: 8930,  quality: 7, status: "OPEN"   },
  { id: 47, category: "SPORTS",   question: "Will Real Madrid win the UEFA Champions League 2026?",       yes_pct: 54, pool_total: 5210,  quality: 9, status: "OPEN"   },
  { id: 18, category: "CRYPTO",   question: "Will ETH/BTC ratio exceed 0.07 by end of Q3?",              yes_pct: 44, pool_total: 3610,  quality: 7, status: "OPEN"   },
  { id: 51, category: "TECH",     question: "Will OpenAI release GPT-6 with public API before September?",yes_pct: 41, pool_total: 11750, quality: 8, status: "OPEN"   },
  { id: 8,  category: "POLITICS", question: "Will the EU pass the foundation-model FLOP cap into law?",  yes_pct: 19, pool_total: 6400,  quality: 8, status: "OPEN"   },
  { id: 60, category: "SPORTS",   question: "Will Max Verstappen win the F1 2026 Drivers Championship?",  yes_pct: 62, pool_total: 4890,  quality: 9, status: "OPEN"   },
  { id: 27, category: "OTHER",    question: "Will SpaceX Starship complete two orbital missions in May?", yes_pct: 77, pool_total: 9210,  quality: 8, status: "OPEN"   },
];

// ── Components ───────────────────────────────────────────────────────────────
const QualityBar = ({ n }) => (
  <span className="quality-bar">
    {Array.from({ length: 10 }, (_, i) => (
      <span key={i} className={i < n ? "dot" : "dot off"}></span>
    ))}
  </span>
);

const MarketCard = ({ m }) => {
  const no = 100 - m.yes_pct;
  const pool = m.pool_total >= 1000
    ? (m.pool_total / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
    : String(m.pool_total);
  const statusColor = m.status === "OPEN"
    ? "var(--yes)"
    : m.status === "RESOLVED" ? "var(--acc)"
    : "var(--ink-3)";

  return (
    <div className="mcard">
      <div className="mcard-head">
        <span>MKT_{String(m.id).padStart(4, "0")}</span>
        <span className={`cat-tag ${m.category}`}>{m.category}</span>
      </div>
      <div className="mcard-q">{m.question}</div>
      <div className="mcard-row">
        <div className="mcard-side yes">
          <span className="lbl">YES</span>
          <span className="pct">{m.yes_pct}%</span>
        </div>
        <div className="mcard-side no">
          <span className="lbl">NO</span>
          <span className="pct">{no}%</span>
        </div>
      </div>
      <div className="mcard-foot">
        <span>POOL <b>{pool}</b> pts</span>
        {m.result
          ? <span style={{ color: "var(--acc)" }}>RESULT: <b>{m.result}</b></span>
          : <span>STAKES <b>{m.yes_pool || 0}Y / {m.no_pool || 0}N</b></span>
        }
      </div>
      <div className="mcard-foot" style={{ marginTop: 8 }}>
        <span>QUALITY <QualityBar n={m.quality} /></span>
        <span style={{ color: statusColor }}>● {m.status}</span>
      </div>
    </div>
  );
};

// ── App ───────────────────────────────────────────────────────────────────────
const { useState, useEffect } = React;

const App = () => {
  const [markets, setMarkets]     = useState(MARKETS_MOCK);
  const [summary, setSummary]     = useState({ open: 372, total: 912 });
  const [live, setLive]           = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const applyMarkets = (data) => {
      if (data && data.length > 0) {
        setMarkets(data);
        setLive(true);
      }
      setLoading(false);
    };

    const applyMktSummary = (s) => {
      if (!s) return;
      const open  = parseInt(s['Open'] || '0');
      const total = parseInt(s['Total Markets'] || '0');
      if (total > 0) setSummary({ open, total });
    };

    const run = () => {
      if (window.__glMarketsPromise) {
        window.__glMarketsPromise.then(applyMarkets);
        window.__glMarketSummaryPromise && window.__glMarketSummaryPromise.then(applyMktSummary);
      } else {
        setLoading(false);
      }
    };

    if (window.__glAPI) {
      run();
    } else {
      document.addEventListener('glReady', run, { once: true });
      // fallback timeout — keep mock if module never loads
      setTimeout(() => setLoading(false), 3000);
    }

    return () => document.removeEventListener('glReady', run);
  }, []);

  return (
    <div className="page" style={{ paddingBottom: 32 }}>
      <Topbar active="markets" />

      <div className="inner-stage">
        <div className="inner-body">
          <div className="sec-header">
            <div>
              <div className="sec-eyebrow">
                // MARKETS_INDEX · {live ? "LIVE · ON-CHAIN" : "DEMO"}
              </div>
              <h1 className="sec-title">Browse <span className="accent">markets</span>.</h1>
              <p className="sec-sub">
                Every market is generated from a real news article and quality-graded
                by an AI panel. Pick a side. Settlement is automatic.
              </p>
            </div>
            <div className="sec-meta">
              <span className="big">{summary.open} <em>OPEN</em></span>
              <span>{summary.total} ALL-TIME</span>
            </div>
          </div>

          <div className="filter-row">
            <div className="chips">
              <span className="fchip on">ALL</span>
              <span className="fchip crypto on">CRYPTO</span>
              <span className="fchip tech on">TECH</span>
              <span className="fchip politics on">POLITICS</span>
              <span className="fchip sports on">SPORTS</span>
              <span className="fchip">OTHER</span>
            </div>
            <div className="chips">
              <span className="fchip">SORT · POOL ↓</span>
              <div className="search-box">
                <span>⌕</span>
                <input type="text" placeholder="search markets..." />
              </div>
            </div>
          </div>

          {loading && (
            <div style={{ padding: "24px 0", color: "var(--ink-3)", fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.15em" }}>
              // SYNCING ON-CHAIN DATA...
            </div>
          )}

          <div className="market-grid">
            {markets.map((m) => <MarketCard key={m.id} m={m} />)}
          </div>

          {live && (
            <div style={{ marginTop: 16, color: "var(--ink-3)", fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.15em" }}>
              // DATA FROM GENLAYER · CONTRACT 0xC22D…7903
            </div>
          )}
        </div>
      </div>

      <FooterStrip />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
