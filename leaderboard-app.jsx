/* global React, ReactDOM, Topbar, FooterStrip */

const { useState: useLBState, useEffect: useLBEffect } = React;

const fmtPool = (n) =>
  n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(n || 0);

const PodiumCard = ({ rank, m }) => {
  const no = 100 - (m.yes_pct || 0);
  return (
    <div className={`podium-card p${rank}`}>
      <div className="rank">{String(rank).padStart(2, '0')}</div>
      <div>
        <div className="name" style={{ maxWidth: 360 }}>{m.question}</div>
        <div className="addr">MKT_{String(m.id).padStart(4, '0')}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          <span className={`cat-tag ${m.category}`}>{m.category}</span>
          <span className="badge" style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
            letterSpacing: '0.2em', padding: '3px 8px', borderRadius: 2,
            border: '1px solid var(--line-2)', color: 'var(--ink-1)',
          }}>{m.status}</span>
        </div>
      </div>
      <div className="right">
        <div className="roi">{fmtPool(m.pool_total)} pts</div>
        <div className="lbl">{m.yes_pct}% YES · {no}% NO</div>
      </div>
    </div>
  );
};

const TableRow = ({ rank, m }) => {
  const no = 100 - (m.yes_pct || 0);
  return (
    <div className="lb-table-row">
      <span className="rank">{String(rank).padStart(2, '0')}</span>
      <span>
        <div className="name" style={{ maxWidth: 320 }}>{m.question}</div>
        <div className="addr">MKT_{String(m.id).padStart(4, '0')}</div>
      </span>
      <span className="wr">{m.yes_pct}%</span>
      <span className="wr">{no}%</span>
      <span className="pts">{fmtPool(m.pool_total)}</span>
      <span><span className={`cat-tag ${m.category}`}>{m.category}</span></span>
      <span className="badge">● {m.status}</span>
    </div>
  );
};

const App = () => {
  const [stats,   setStats]   = useLBState({ totalMarkets: '—', openMarkets: '—', totalArticles: '—' });
  const [markets, setMarkets] = useLBState([]);
  const [filter,  setFilter]  = useLBState('ALL');

  useLBEffect(() => {
    const run = () => {
      window.__glMarketSummaryPromise && window.__glMarketSummaryPromise.then(s => {
        if (!s) return;
        setStats(prev => ({
          ...prev,
          totalMarkets: s['Total Markets'] || '—',
          openMarkets:  s['Open']          || '—',
        }));
      });
      window.__glSignalSummaryPromise && window.__glSignalSummaryPromise.then(s => {
        if (!s) return;
        setStats(prev => ({
          ...prev,
          totalArticles: s['Total Articles'] || '—',
        }));
      });
      window.__glMarketsPromise && window.__glMarketsPromise.then(data => {
        if (!data) return;
        const sorted = [...data].sort((a, b) => (b.pool_total || 0) - (a.pool_total || 0));
        setMarkets(sorted);
      });
    };
    if (window.__glAPI) run();
    else document.addEventListener('glReady', run, { once: true });
    return () => document.removeEventListener('glReady', run);
  }, []);

  const filtered = filter === 'ALL'
    ? markets
    : markets.filter(m => (m.category || '').toUpperCase() === filter);

  const podium = filtered.slice(0, 3);
  const rest   = filtered.slice(3, 18);

  return (
  <div className="page" style={{ paddingBottom: 32 }}>
    <Topbar active="leader" />

    <div className="inner-stage">
      <div className="inner-body">
        <div className="sec-header">
          <div>
            <div className="sec-eyebrow">// FORESIGHT_MARKETS · LIVE STANDINGS</div>
            <h1 className="sec-title">Leader<span className="accent">board</span>.</h1>
            <p className="sec-sub">
              Markets ranked by total pool size — the bigger the pool, the
              louder the signal. Updates with every new prediction.
            </p>
          </div>
          <div className="sec-meta" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color: 'var(--yes)' }}>{stats.totalMarkets}</div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>MARKETS TOTAL</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color: 'var(--acc)' }}>{stats.openMarkets}</div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>OPEN NOW</div>
              </div>
              <div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color: 'var(--vio)' }}>{stats.totalArticles}</div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>ARTICLES</div>
              </div>
            </div>
          </div>
        </div>

        <div className="filter-row">
          <div className="chips">
            {['ALL', 'CRYPTO', 'TECH', 'POLITICS', 'SPORTS', 'OTHER'].map(c => (
              <span key={c}
                    className={`fchip ${filter === c ? 'on' : ''} ${c !== 'ALL' ? c : ''}`}
                    onClick={() => setFilter(c)}
                    style={{ cursor: 'pointer' }}>
                {c}
              </span>
            ))}
          </div>
          <div className="chips">
            <span className="fchip">SORT · POOL ↓</span>
          </div>
        </div>

        {markets.length === 0 ? (
          <div style={{ padding: '24px 0', color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.15em' }}>
            // SYNCING ON-CHAIN DATA...
          </div>
        ) : (
          <div className="lb-grid">
            <div className="lb-podium">
              {podium.map((m, i) => (
                <PodiumCard key={m.id} rank={i + 1} m={m} />
              ))}
            </div>

            {rest.length > 0 && (
              <div className="lb-table-wrap">
                <div className="lb-table-head">
                  <span>#</span>
                  <span>MARKET</span>
                  <span>YES</span>
                  <span>NO</span>
                  <span>POOL</span>
                  <span>CATEGORY</span>
                  <span>STATUS</span>
                </div>
                {rest.map((m, i) => (
                  <TableRow key={m.id} rank={i + 4} m={m} />
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 16, color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em' }}>
          // DATA FROM GENLAYER · CONTRACT 0xC22D…7903
        </div>
      </div>
    </div>

    <FooterStrip />
  </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
