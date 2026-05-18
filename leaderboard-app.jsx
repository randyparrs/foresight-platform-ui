/* global React, ReactDOM, Topbar, FooterStrip */

const TOP = [
  { rank: 1, name: "oracle.eth",       addr: "0x7a4f…c1de", roi: "+412.8%", pts: "184,210", wr: 73, best: "CRYPTO",   streak: 14 },
  { rank: 2, name: "delphi_node",      addr: "0x9128…b04a", roi: "+318.4%", pts: "162,940", wr: 68, best: "TECH",     streak: 9  },
  { rank: 3, name: "vc_alpha",         addr: "0x42c0…87f1", roi: "+274.1%", pts: "141,200", wr: 64, best: "POLITICS", streak: 6  },
];

const ROWS = [
  { rank: 4,  name: "macro_priestess",addr: "0x1f88…be20", roi: "+218%", pts: "118,400", wr: 61, best: "POLITICS" },
  { rank: 5,  name: "agent_alpha",    addr: "0x3320…f019", roi: "+187%", pts: "102,310", wr: 59, best: "CRYPTO" },
  { rank: 6,  name: "starmind",       addr: "0x67dd…99e2", roi: "+154%", pts: "96,810",  wr: 57, best: "TECH" },
  { rank: 7,  name: "the_house",      addr: "0x2bb1…32cf", roi: "+132%", pts: "88,200",  wr: 55, best: "SPORTS" },
  { rank: 8,  name: "sleepless.eth",  addr: "0xee49…ad11", roi: "+118%", pts: "82,140",  wr: 53, best: "OTHER" },
  { rank: 9,  name: "neon_signal",    addr: "0xa017…5b03", roi: "+96%",  pts: "74,920",  wr: 52, best: "TECH" },
  { rank: 10, name: "rho_predictor",  addr: "0x6cab…1180", roi: "+84%",  pts: "70,510",  wr: 51, best: "CRYPTO" },
  { rank: 11, name: "tail_risker",    addr: "0xb802…7e49", roi: "+72%",  pts: "63,210",  wr: 50, best: "POLITICS" },
  { rank: 12, name: "deepforecast",   addr: "0x4421…2c19", roi: "+58%",  pts: "57,940",  wr: 49, best: "CRYPTO" },
  { rank: 13, name: "calibrator",     addr: "0x1188…9af0", roi: "+44%",  pts: "52,180",  wr: 48, best: "OTHER" },
  { rank: 14, name: "lateral_bet",    addr: "0x9912…00ab", roi: "+31%",  pts: "47,810",  wr: 47, best: "SPORTS" },
  { rank: 15, name: "edge_only",      addr: "0x0042…ff7b", roi: "+18%",  pts: "41,920",  wr: 45, best: "CRYPTO" },
];

const { useState: useLBState, useEffect: useLBEffect } = React;

const App = () => {
  const [stats, setStats] = useLBState({ totalMarkets: '—', openMarkets: '—', totalArticles: '—' });

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
    };
    if (window.__glAPI) run();
    else document.addEventListener('glReady', run, { once: true });
    return () => document.removeEventListener('glReady', run);
  }, []);

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
              Live standings de los mejores forecasters en Foresight.
              Rankings actualizan en cada mercado resuelto.
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
            <span className="fchip">SEASON 01</span>
            <span className="fchip">LAST 30D</span>
            <span className="fchip">LAST 7D</span>
          </div>
          <div className="chips">
            <span className="fchip">SORT · ROI ↓</span>
          </div>
        </div>

        <div className="lb-grid">
          {/* Podium */}
          <div className="lb-podium">
            {TOP.map((t) => (
              <div key={t.rank} className={`podium-card p${t.rank}`}>
                <div className="rank">{String(t.rank).padStart(2, "0")}</div>
                <div>
                  <div className="name">{t.name}</div>
                  <div className="addr">{t.addr}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                    <span className={`cat-tag ${t.best}`}>{t.best}</span>
                    <span className="badge" style={{
                      fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                      letterSpacing: "0.2em",
                      padding: "3px 8px", borderRadius: 2,
                      border: "1px solid var(--line-2)", color: "var(--ink-1)"
                    }}>{t.streak}W STREAK</span>
                  </div>
                </div>
                <div className="right">
                  <div className="roi">{t.roi}</div>
                  <div className="lbl">{t.pts} PTS</div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="lb-table-wrap">
            <div className="lb-table-head">
              <span>#</span>
              <span>PREDICTOR</span>
              <span>ROI</span>
              <span>WIN_RATE</span>
              <span>POINTS</span>
              <span>BEST_CAT</span>
              <span>STATUS</span>
            </div>
            {ROWS.map((r) => (
              <div key={r.rank} className="lb-table-row">
                <span className="rank">{String(r.rank).padStart(2, "0")}</span>
                <span>
                  <div className="name">{r.name}</div>
                  <div className="addr">{r.addr}</div>
                </span>
                <span className="wr">{r.roi}</span>
                <span className="wr">{r.wr}%</span>
                <span className="pts">{r.pts}</span>
                <span><span className={`cat-tag ${r.best}`}>{r.best}</span></span>
                <span className="badge">● ACTIVE</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <FooterStrip />
  </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
