/* global React, ReactDOM, Topbar, FooterStrip */

const { useState: useLBState, useEffect: useLBEffect } = React;

const short = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';

const PodiumCard = ({ rank, p, isYou }) => (
  <div className={`podium-card p${rank}`}>
    <div className="rank">{String(rank).padStart(2, '0')}</div>
    <div>
      <div className="name">{isYou ? 'YOU' : short(p.address)}</div>
      <div className="addr">{p.address}</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
        <span className="badge" style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.2em',
          padding: '3px 8px', borderRadius: 2, border: '1px solid var(--line-2)', color: 'var(--ink-1)',
        }}>{p.totalBets} BETS</span>
        <span className="badge" style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.2em',
          padding: '3px 8px', borderRadius: 2, border: '1px solid var(--yes)', color: 'var(--yes)',
        }}>{p.wins}W / {p.losses}L</span>
      </div>
    </div>
    <div className="right">
      <div className="roi">{p.pts >= 0 ? '+' : ''}{p.pts} pts</div>
      <div className="lbl">{p.winRate}% WIN RATE</div>
    </div>
  </div>
);

const TableRow = ({ rank, p, isYou }) => (
  <div className="lb-table-row" style={isYou ? { borderLeft: '2px solid var(--cyan)' } : null}>
    <span className="rank">{String(rank).padStart(2, '0')}</span>
    <span>
      <div className="name">{isYou ? 'YOU' : short(p.address)}</div>
      <div className="addr">{p.address}</div>
    </span>
    <span className="wr">{p.wins}</span>
    <span className="wr">{p.losses}</span>
    <span className="wr">{p.winRate}%</span>
    <span className="pts">{p.totalBets}</span>
    <span className="pts" style={{ color: p.pts >= 0 ? 'var(--yes)' : 'var(--bear)' }}>
      {p.pts >= 0 ? '+' : ''}{p.pts}
    </span>
  </div>
);

const App = () => {
  const [stats,    setStats]    = useLBState({ totalMarkets: '—', openMarkets: '—', totalArticles: '—' });
  const [ranking,  setRanking]  = useLBState(null);
  const [loading,  setLoading]  = useLBState(true);

  useLBEffect(() => {
    const run = async () => {
      // Header stats
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
        setStats(prev => ({ ...prev, totalArticles: s['Total Articles'] || '—' }));
      });

      // Predictor ranking — load connected wallet's data joined with markets
      try {
        if (window.__glAccount && window.__glAPI && window.__glAPI.loadMyPredictions) {
          const [myRaw, markets] = await Promise.all([
            window.__glAPI.loadMyPredictions(window.__glAccount),
            window.__glAPI.loadMarkets().catch(() => []),
          ]);
          const myPreds = (window.__glAPI.parseMyPredictions(myRaw) || []).map(p => {
            const m = (markets || []).find(mm => mm.id === p.marketId);
            return m ? { ...p, status: m.status, result: m.result } : p;
          });
          const wins    = myPreds.filter(p => p.status === 'RESOLVED' && p.result && p.side === p.result).length;
          const losses  = myPreds.filter(p => p.status === 'RESOLVED' && p.result && p.side !== p.result).length;
          const total   = myPreds.length;
          const wr      = (wins + losses) > 0 ? Math.round((wins * 100) / (wins + losses)) : 0;
          setRanking([{ address: window.__glAccount.toLowerCase(), totalBets: total, wins, losses, winRate: wr, pts: wins - losses }]);
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

  const me      = (window.__glAccount || '').toLowerCase();
  const list    = ranking || [];
  const podium  = list.slice(0, 3);
  const rest    = list.slice(3, 18);

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
              Ranking of users by wins and total predictions. Aggregated live
              from on-chain bets across every Foresight market.
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
            // CONNECT YOUR WALLET TO SEE YOUR PREDICTOR STATS
          </div>
        ) : (
          <div className="lb-grid">
            <div className="lb-podium">
              {podium.map((p, i) => (
                <PodiumCard key={p.address} rank={i + 1} p={p} isYou={p.address === me} />
              ))}
            </div>

            {rest.length > 0 && (
              <div className="lb-table-wrap">
                <div className="lb-table-head">
                  <span>#</span>
                  <span>PREDICTOR</span>
                  <span>WINS</span>
                  <span>LOSSES</span>
                  <span>WIN_RATE</span>
                  <span>TOTAL_BETS</span>
                  <span>NET</span>
                </div>
                {rest.map((p, i) => (
                  <TableRow key={p.address} rank={i + 4} p={p} isYou={p.address === me} />
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
