/* global React, ReactDOM, Topbar, FooterStrip */

const { useState: useLBState, useEffect: useLBEffect } = React;

const short = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';

const RANK_COLORS = [
  { color: 'var(--cyan)', glow: 'rgba(76,232,230,0.12)', border: 'rgba(76,232,230,0.4)' },
  { color: 'var(--vio)',  glow: 'rgba(138,124,255,0.10)', border: 'rgba(138,124,255,0.35)' },
  { color: 'var(--acc)',  glow: 'rgba(234,179,68,0.08)',  border: 'rgba(234,179,68,0.3)' },
];

const WinBar = ({ rate }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
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

const PnlValue = ({ pts, size = 14 }) => (
  <span style={{
    fontFamily: 'JetBrains Mono, monospace', fontSize: size, fontWeight: 700,
    color: pts >= 0 ? 'var(--yes)' : 'var(--bear)',
  }}>
    {pts >= 0 ? '+' : ''}{pts}
    <span style={{ fontSize: size - 3, fontWeight: 400, opacity: 0.65, marginLeft: 2 }}>pts</span>
  </span>
);

const RankBadge = ({ rank }) => {
  const rc = RANK_COLORS[rank - 1] || {};
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
      border: `1.5px solid ${rc.border || 'var(--line-2)'}`,
      background: rc.glow || 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700,
      color: rc.color || 'var(--ink-3)',
    }}>
      {String(rank).padStart(2, '0')}
    </div>
  );
};

const PodiumCard = ({ rank, p, isYou }) => {
  const rc = RANK_COLORS[rank - 1] || {};
  return (
    <div
      className={`podium-card p${rank}`}
      style={{ borderTop: `2px solid ${rc.color || 'var(--line-2)'}`, position: 'relative', overflow: 'hidden' }}
    >
      {isYou && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 8, letterSpacing: '0.15em',
          color: 'var(--cyan)', border: '1px solid var(--cyan)', borderRadius: 2,
          padding: '2px 6px', background: 'rgba(76,232,230,0.08)',
        }}>YOU</div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <RankBadge rank={rank} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700,
            color: 'var(--ink-1)', marginBottom: 2,
          }}>
            {isYou ? '— YOU —' : short(p.address)}
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--ink-3)',
            letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {p.address}
          </div>
          <WinBar rate={p.winRate} />
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 0,
        paddingTop: 12, borderTop: '1px solid var(--line-2)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 4 }}>NET P&L</div>
          <PnlValue pts={p.pts} size={14} />
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid var(--line-2)', paddingLeft: 14 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 4 }}>RECORD</div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
            <span style={{ color: 'var(--yes)', fontWeight: 700 }}>{p.wins}W</span>
            <span style={{ color: 'var(--ink-3)', margin: '0 4px' }}>/</span>
            <span style={{ color: 'var(--bear)', fontWeight: 700 }}>{p.losses}L</span>
          </span>
        </div>
        <div style={{ flex: 1, borderLeft: '1px solid var(--line-2)', paddingLeft: 14 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: 'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 4 }}>BETS</div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700 }}>{p.totalBets}</span>
        </div>
      </div>
    </div>
  );
};

const TableRow = ({ rank, p, isYou }) => {
  const rc = RANK_COLORS[rank - 1] || {};
  return (
    <div
      className="lb-table-row"
      style={isYou ? { borderLeft: '2px solid var(--cyan)', background: 'rgba(76,232,230,0.025)' } : null}
    >
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
        color: rc.color || 'var(--ink-3)', fontWeight: rc.color ? 700 : 400,
      }}>
        {String(rank).padStart(2, '0')}
      </span>
      <span>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
          color: isYou ? 'var(--cyan)' : 'var(--ink-1)', marginBottom: 3,
        }}>
          {isYou ? '— YOU —' : short(p.address)}
        </div>
        <WinBar rate={p.winRate} />
      </span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: 'var(--yes)' }}>
        {p.wins}
      </span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: 'var(--bear)' }}>
        {p.losses}
      </span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
        {p.totalBets}
      </span>
      <span>
        <PnlValue pts={p.pts} size={12} />
      </span>
    </div>
  );
};

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
        <PnlValue pts={p.pts} size={13} />
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
  const rest   = list.slice(3, 18);

  const myEntry = list.find(p => p.address.toLowerCase() === me);
  const myRank  = myEntry ? list.indexOf(myEntry) + 1 : null;

  return (
    <div className="page" style={{ paddingBottom: 32 }}>
      <Topbar active="leader" />

      <div className="inner-stage">
        <div className="inner-body">
          <div className="sec-header">
            <div>
              <div className="sec-eyebrow">// FORESIGHT_MARKETS · TOP PREDICTORS</div>
              <h1 className="sec-title">Leader<span className="accent">board</span>.</h1>
              <p className="sec-sub">
                Ranking of predictors by wins and net P&amp;L. Aggregated live
                from on-chain bets across every Foresight market.
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
            </div>
            <div className="chips">
              <span className="fchip">SORT · WINS ↓</span>
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
                    <span>PREDICTOR · WIN RATE</span>
                    <span>W</span>
                    <span>L</span>
                    <span>BETS</span>
                    <span>NET PTS</span>
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
