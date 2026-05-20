/* global React, ReactDOM, Topbar, FooterStrip */

const { useState: useLBState, useEffect: useLBEffect } = React;

const short = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';
const fmtNet = (pts) => (pts >= 0 ? '+' : '') + pts + ' pts';

// ── Win rate bar ──────────────────────────────────────────────────────────────
const WinBar = ({ rate }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
    <div style={{ flex: 1, height: 3, background: 'var(--line-2)', borderRadius: 2 }}>
      <div style={{
        width: `${Math.min(rate, 100)}%`, height: '100%',
        background: rate >= 60 ? 'var(--yes)' : rate >= 40 ? 'var(--acc)' : 'var(--bear)',
        borderRadius: 2, transition: 'width 0.6s ease',
      }} />
    </div>
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--ink-3)', minWidth: 26 }}>
      {rate}%
    </span>
  </div>
);

// ── Podium card (top 3) ───────────────────────────────────────────────────────
const PodiumCard = ({ rank, p, isYou }) => (
  <div className={`podium-card p${rank}`}>
    <div className="rank">{String(rank).padStart(2, '0')}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="name">{isYou ? 'YOU' : short(p.address)}</div>
      <div className="addr">{p.address}</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className="badge" style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.18em',
          padding: '3px 8px', borderRadius: 2,
          border: '1px solid var(--yes)', color: 'var(--yes)',
        }}>
          {p.wins}W / {p.losses}L
        </span>
        <span className="badge" style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.18em',
          padding: '3px 8px', borderRadius: 2,
          border: '1px solid var(--line-2)', color: 'var(--ink-1)',
        }}>
          {p.totalBets} BETS
        </span>
      </div>
      <WinBar rate={p.winRate} />
    </div>
    <div className="right">
      <div className="roi" style={{ color: p.pts >= 0 ? 'var(--yes)' : 'var(--bear)' }}>
        {fmtNet(p.pts)}
      </div>
      <div className="lbl">{p.winRate}% WIN RATE</div>
    </div>
  </div>
);

// ── Table row (rank 4+) ───────────────────────────────────────────────────────
const TableRow = ({ rank, p, isYou }) => (
  <div className="lb-table-row" style={isYou ? { borderLeft: '2px solid var(--cyan)' } : null}>
    <span className="rank">{String(rank).padStart(2, '0')}</span>
    <span>
      <div className="name">{isYou ? 'YOU' : short(p.address)}</div>
      <div className="addr">{p.address}</div>
    </span>
    <span className="wr" style={{ color: p.pts >= 0 ? 'var(--yes)' : 'var(--bear)', fontWeight: 600 }}>
      {fmtNet(p.pts)}
    </span>
    <span className="wr">{p.winRate}%</span>
    <span className="pts">{p.totalBets}</span>
    <span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--yes)' }}>{p.wins}W</span>
      {' / '}
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--bear)' }}>{p.losses}L</span>
    </span>
    <span className="badge" style={{
      fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
      letterSpacing: '0.12em', color: 'var(--yes)',
    }}>
      ● ACTIVE
    </span>
  </div>
);

// ── Your position card ────────────────────────────────────────────────────────
const YourPositionCard = ({ p, rank }) => (
  <div style={{
    marginBottom: 24, padding: '14px 20px', borderRadius: 4,
    background: 'rgba(76,232,230,0.04)', border: '1px solid rgba(76,232,230,0.22)',
    display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
  }}>
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--cyan)', letterSpacing: '0.15em' }}>
      YOUR POSITION
    </div>
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: 'var(--ink-1)' }}>
      #{rank}
    </div>
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 2 }}>NET P&amp;L</div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: p.pts >= 0 ? 'var(--yes)' : 'var(--bear)' }}>
          {fmtNet(p.pts)}
        </span>
      </div>
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 2 }}>RECORD</div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
          <span style={{ color: 'var(--yes)', fontWeight: 700 }}>{p.wins}W</span>
          <span style={{ color: 'var(--ink-3)', margin: '0 4px' }}>/</span>
          <span style={{ color: 'var(--bear)', fontWeight: 700 }}>{p.losses}L</span>
        </span>
      </div>
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 2 }}>WIN RATE</div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700 }}>{p.winRate}%</span>
      </div>
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 2 }}>TOTAL BETS</div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700 }}>{p.totalBets}</span>
      </div>
    </div>
  </div>
);

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => {
  const [stats,   setStats]   = useLBState({ totalMarkets: '—', openMarkets: '—', totalArticles: '—', totalPredictions: '—' });
  const [ranking, setRanking] = useLBState(null);
  const [loading, setLoading] = useLBState(true);

  useLBEffect(() => {
    const run = async () => {
      window.__glMarketSummaryPromise && window.__glMarketSummaryPromise.then(s => {
        if (!s) return;
        setStats(prev => ({
          ...prev,
          totalMarkets:     s['Total Markets']     || '—',
          openMarkets:      s['Open']              || '—',
          totalPredictions: s['Total Predictions'] || '—',
        }));
      });
      window.__glSignalSummaryPromise && window.__glSignalSummaryPromise.then(s => {
        if (!s) return;
        setStats(prev => ({ ...prev, totalArticles: s['Total Articles'] || '—' }));
      });

      try {
        if (window.__glAPI && window.__glAPI.loadTopPredictors) {
          const data = await window.__glAPI.loadTopPredictors();
          setRanking(data || []);
        } else {
          setRanking([]);
        }
      } catch (e) {
        console.error('[Leaderboard] error:', e);
        setRanking([]);
      }
      setLoading(false);
    };
    if (window.__glAPI) run();
    else document.addEventListener('glReady', run, { once: true });
    return () => document.removeEventListener('glReady', run);
  }, []);

  const me     = (window.__glAccount || '').toLowerCase();
  const list   = ranking || [];
  const podium = list.slice(0, 3);
  const rest   = list.slice(3, 15);

  const myEntry = list.find(p => p.address.toLowerCase() === me);
  const myRank  = myEntry ? list.indexOf(myEntry) + 1 : null;

  return (
    <div className="page" style={{ paddingBottom: 32 }}>
      <Topbar active="leader" />

      <div className="inner-stage">
        <div className="inner-body">
          <div className="sec-header">
            <div>
              <div className="sec-eyebrow">// SEASON_01 · TOP PREDICTORS</div>
              <h1 className="sec-title">Leader<span className="accent">board</span>.</h1>
              <p className="sec-sub">
                Live standings of the sharpest forecasters on Foresight.
                Rankings update on every settled market.
              </p>
            </div>
            <div className="sec-meta" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color: 'var(--yes)' }}>{stats.totalMarkets}</div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>MARKETS</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color: 'var(--acc)' }}>{stats.openMarkets}</div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>OPEN</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color: 'var(--vio)' }}>{stats.totalArticles}</div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>ARTICLES</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 22, fontWeight: 700, color: 'var(--cyan)' }}>{stats.totalPredictions}</div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>BETS PLACED</div>
                </div>
              </div>
            </div>
          </div>

          {myEntry && myRank && <YourPositionCard p={myEntry} rank={myRank} />}

          <div className="filter-row">
            <div className="chips">
              <span className="fchip on">ALL TIME</span>
              <span className="fchip">SEASON 01</span>
              <span className="fchip">LAST 30D</span>
              <span className="fchip">LAST 7D</span>
            </div>
            <div className="chips">
              <span className="fchip">SORT · NET PTS ↓</span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '24px 0', color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.15em' }}>
              // SYNCING ON-CHAIN PREDICTORS…
            </div>
          ) : list.length === 0 ? (
            <div style={{ padding: '24px 0', color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.15em' }}>
              // NO PREDICTIONS YET — BE THE FIRST TO BET
            </div>
          ) : (
            <div className="lb-grid">
              <div className="lb-podium">
                {podium.map((p, i) => (
                  <PodiumCard key={p.address} rank={i + 1} p={p} isYou={p.address.toLowerCase() === me} />
                ))}
              </div>

              {rest.length > 0 && (
                <div className="lb-table-wrap">
                  <div className="lb-table-head">
                    <span>#</span>
                    <span>PREDICTOR</span>
                    <span>NET PTS</span>
                    <span>WIN_RATE</span>
                    <span>BETS</span>
                    <span>RECORD</span>
                    <span>STATUS</span>
                  </div>
                  {rest.map((p, i) => (
                    <TableRow key={p.address} rank={i + 4} p={p} isYou={p.address.toLowerCase() === me} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 16, color: 'var(--ink-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em' }}>
            // DATA FROM GENLAYER · CONTRACT 0x705e…B359
          </div>
        </div>
      </div>

      <FooterStrip />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
