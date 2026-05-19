/* global React, ReactDOM, Topbar, FooterStrip */

// ── Mock fallback ─────────────────────────────────────────────────────────────
const MARKETS_MOCK = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
const { useState, useEffect, useCallback } = React;

const fmtPool = (n) =>
  n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(n || 0);

// ── Sub-components ────────────────────────────────────────────────────────────
const QualityBar = ({ n }) => (
  <span className="quality-bar">
    {Array.from({ length: 10 }, (_, i) => (
      <span key={i} className={i < n ? "dot" : "dot off"}></span>
    ))}
  </span>
);

// Small status badge for tx feedback
const TxStatus = ({ tx }) => {
  if (!tx) return null;
  const isErr = tx.startsWith('ERR:');
  return (
    <div style={{
      marginTop: 8, padding: '6px 10px', borderRadius: 3,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
      letterSpacing: '0.05em', wordBreak: 'break-all',
      background: isErr ? 'rgba(255,80,80,0.08)' : 'rgba(76,232,110,0.08)',
      color: isErr ? 'var(--bear)' : 'var(--yes)',
      border: `1px solid ${isErr ? 'var(--bear)' : 'var(--yes)'}`,
    }}>
      {isErr ? '✕ ' + tx.slice(4) : '✓ TX: ' + tx.slice(0, 20) + '…'}
    </div>
  );
};

// ── MarketCard with full interaction panel ────────────────────────────────────
const MarketCard = ({ m, onRefresh }) => {
  const [amount, setAmount]   = useState('100');
  const [busy,   setBusy]     = useState(false);
  const [tx,     setTx]       = useState(null);
  const no = 100 - m.yes_pct;
  const statusColor = m.status === 'OPEN'
    ? 'var(--yes)'
    : m.status === 'RESOLVED' ? 'var(--acc)'
    : 'var(--ink-3)';

  const run = useCallback(async (fn) => {
    setBusy(true);
    setTx(null);
    try {
      const hash = await fn();
      setTx(hash);
      // Reload market data tras 5s para que el contrato actualice
      setTimeout(() => onRefresh && onRefresh(), 5000);
    } catch (e) {
      setTx('ERR:' + (e.message || String(e)));
    } finally {
      setBusy(false);
    }
  }, [onRefresh]);

  const bet = (side) =>
    run(() => window.__glAPI.placePrediction(m.id, side));

  return (
    <div className="mcard">
      {/* Header */}
      <div className="mcard-head">
        <span>MKT_{String(m.id).padStart(4, '0')}</span>
        <span className={`cat-tag ${m.category}`}>{m.category}</span>
      </div>

      {/* Question */}
      <div className="mcard-q">{m.question}</div>

      {/* YES / NO bar */}
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

      {/* Pool info */}
      <div className="mcard-foot">
        <span>POOL <b>{fmtPool(m.pool_total)}</b> pts</span>
        {m.result
          ? <span style={{ color: 'var(--acc)' }}>RESULT: <b>{m.result}</b></span>
          : <span>STAKES <b>{m.yes_pool || 0}Y / {m.no_pool || 0}N</b></span>
        }
      </div>
      <div className="mcard-foot" style={{ marginTop: 8 }}>
        <span>QUALITY <QualityBar n={m.quality} /></span>
        <span style={{ color: statusColor }}>● {m.status}</span>
      </div>

      {/* ── Action panel ── */}
      <div style={{
        marginTop: 14, paddingTop: 14,
        borderTop: '1px solid var(--line-2)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>

        {/* Bet row — only shown when OPEN. Cada apuesta = 1 punto fijo */}
        {m.status === 'OPEN' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-bet yes"
              onClick={() => bet('YES')}
              disabled={busy}
              style={{
                flex: 1, padding: '5px 10px', borderRadius: 3,
                background: 'rgba(76,232,110,0.12)', color: 'var(--yes)',
                border: '1px solid var(--yes)', cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
              }}
            >
              {busy ? '…' : '▲ BET 1pt YES'}
            </button>
            <button
              className="btn-bet no"
              onClick={() => bet('NO')}
              disabled={busy}
              style={{
                flex: 1, padding: '5px 10px', borderRadius: 3,
                background: 'rgba(255,80,80,0.12)', color: 'var(--bear)',
                border: '1px solid var(--bear)', cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
              }}
            >
              {busy ? '…' : '▼ BET 1pt NO'}
            </button>
          </div>
        )}

        {/* Admin / resolution row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {m.status === 'OPEN' && (
            <>
              <button onClick={() => run(() => window.__glAPI.resolveMarket(m.id))} disabled={busy}
                style={btnStyle('var(--vio)')}>
                {busy ? '…' : '⚙ RESOLVE AI'}
              </button>
              <button onClick={() => run(() => window.__glAPI.expireMarket(m.id))} disabled={busy}
                style={btnStyle('var(--ink-3)')}>
                {busy ? '…' : '⏱ EXPIRE'}
              </button>
            </>
          )}
          {m.status === 'RESOLVED' && (
            <>
              <button onClick={() => run(() => window.__glAPI.reResolveMarket(m.id))} disabled={busy}
                style={btnStyle('var(--vio)')}>
                {busy ? '…' : '⚙ RE-RESOLVE'}
              </button>
              <button onClick={() => run(() => window.__glAPI.claimWinnings(m.id))} disabled={busy}
                style={btnStyle('var(--yes)')}>
                {busy ? '…' : '💰 CLAIM WIN'}
              </button>
              <button onClick={() => run(() => window.__glAPI.claimRefund(m.id))} disabled={busy}
                style={btnStyle('var(--acc)')}>
                {busy ? '…' : '↩ CLAIM REFUND'}
              </button>
            </>
          )}
          {m.status === 'EXPIRED' && (
            <button onClick={() => run(() => window.__glAPI.claimRefund(m.id))} disabled={busy}
              style={btnStyle('var(--acc)')}>
              {busy ? '…' : '↩ CLAIM REFUND'}
            </button>
          )}
        </div>

        <TxStatus tx={tx} />

        {/* Refresh manual */}
        <button onClick={() => onRefresh && onRefresh()} disabled={busy}
          style={{
            marginTop: 6, padding: '3px 8px', borderRadius: 3, cursor: 'pointer',
            background: 'transparent', color: 'var(--ink-3)',
            border: '1px solid var(--line-2)',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
          }}>
          ↺ REFRESH
        </button>
      </div>
    </div>
  );
};

const btnStyle = (color) => ({
  padding: '4px 10px', borderRadius: 3,
  background: 'transparent', color,
  border: `1px solid ${color}`, cursor: 'pointer',
  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600,
  letterSpacing: '0.06em',
});

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => {
  const [markets, setMarkets] = useState([]);
  const [summary, setSummary] = useState({ open: 0, total: 0 });
  const [live,    setLive]    = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMarkets = useCallback(() => {
    if (!window.__glAPI) return;
    window.__glAPI.loadMarkets().then(data => {
      if (data && data.length > 0) {
        const filtered = data.filter(m => m.id !== 0);
        setMarkets(filtered);
        setLive(true);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const applyMarkets = (data) => {
      if (data && data.length > 0) {
        // Hide the legacy test market (MKT_0000) created at contract deployment
        const filtered = data.filter(m => m.id !== 0);
        setMarkets(filtered);
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
                // MARKETS_INDEX · {live ? 'LIVE · ON-CHAIN' : 'DEMO'}
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
            <div style={{ padding: '24px 0', color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.15em' }}>
              // SYNCING ON-CHAIN DATA...
            </div>
          )}

          <div className="market-grid">
            {markets.map((m) => (
              <MarketCard key={m.id} m={m} onRefresh={fetchMarkets} />
            ))}
          </div>

          {live && (
            <div style={{ marginTop: 16, color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em' }}>
              // DATA FROM GENLAYER · CONTRACT 0xC22D…7903
            </div>
          )}
        </div>
      </div>

      <FooterStrip />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
