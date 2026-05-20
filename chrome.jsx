/* global React */

// =============================================================
//  Shared chrome — Topbar + Footer
//  Wallet: MetaMask + Rabby (EIP-1193 via window.ethereum)
//  Network: GenLayer Studio Testnet (chainId 61999)
// =============================================================

const GL_NETWORK = {
  chainId:         '0xF25F',          // 61999 in hex
  chainName:       'GenLayer Studio',
  nativeCurrency:  { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls:         ['https://studio.genlayer.com/api'],
  blockExplorerUrls: [],
};

const NAV_ITEMS = [
  { id: "home",    label: "HOME",         href: "Home.html" },
  { id: "markets", label: "MARKETS",      href: "Markets.html" },
  { id: "leader",  label: "LEADERBOARD",  href: "Leaderboard.html" },
  { id: "signal",  label: "THE SIGNAL",   href: "TheSignal.html" },
  { id: "how",     label: "HOW IT WORKS", href: "HowItWorks.html" },
  { id: "docs",    label: "DOCS",         href: "Docs.html" },
];

const { useState, useEffect, useRef } = React;

// ── NotificationBell ─────────────────────────────────────────────────────────
const BellIcon = ({ active }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
      fill={active ? 'var(--cyan)' : 'var(--ink-3)'}
    />
  </svg>
);

const NotificationBell = ({ account }) => {
  const [open,   setOpen]   = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [seen,   setSeen]   = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('gl_seen_notifs') || '[]')); }
    catch { return new Set(); }
  });
  const panelRef = useRef(null);

  useEffect(() => {
    if (!account || !window.__glAPI) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [raw, markets] = await Promise.all([
          window.__glAPI.loadMyPredictions(account),
          window.__glAPI.loadMarkets().catch(() => []),
        ]);
        if (cancelled) return;
        const parsed = window.__glAPI.parseMyPredictions(raw) || [];
        const list = [];
        for (const p of parsed) {
          const m = (markets || []).find(mm => mm.id === p.marketId);
          if (!m) continue;
          const status = m.status || p.status;
          const result = m.result || p.result;
          if (status === 'RESOLVED' && result) {
            const won = p.side === result;
            list.push({
              id:       `${p.marketId}_${p.side}_${won ? 'win' : 'loss'}`,
              type:     won ? 'WIN' : 'LOSS',
              marketId: p.marketId,
              question: m.question,
              side:     p.side,
              result,
            });
          } else if (status === 'EXPIRED') {
            list.push({
              id:       `${p.marketId}_expired`,
              type:     'REFUND',
              marketId: p.marketId,
              question: m.question,
            });
          }
        }
        setNotifs(list);
      } catch (_) { /* silent */ }
    };
    load();
    return () => { cancelled = true; };
  }, [account]);

  const unread = notifs.filter(n => !seen.has(n.id)).length;

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      const allIds = notifs.map(n => n.id);
      setSeen(new Set(allIds));
      localStorage.setItem('gl_seen_notifs', JSON.stringify(allIds));
    }
  };

  const typeProps = (type) => ({
    WIN:    { color: 'var(--yes)',  icon: '✓', bg: 'rgba(76,232,110,0.07)',  border: 'rgba(76,232,110,0.3)' },
    LOSS:   { color: 'var(--bear)', icon: '✕', bg: 'rgba(255,80,80,0.07)',   border: 'rgba(255,80,80,0.3)' },
    REFUND: { color: 'var(--acc)',  icon: '↩', bg: 'rgba(234,179,68,0.07)',  border: 'rgba(234,179,68,0.3)' },
  }[type] || { color: 'var(--ink-3)', icon: '·', bg: 'transparent', border: 'var(--line-2)' });

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        style={{
          background: open ? 'rgba(76,232,230,0.06)' : 'transparent',
          border: `1px solid ${open ? 'var(--cyan)' : 'var(--line-2)'}`,
          borderRadius: 4, padding: '6px 8px', cursor: 'pointer',
          position: 'relative', display: 'flex', alignItems: 'center',
          justifyContent: 'center', transition: 'border-color 0.15s',
        }}
      >
        <BellIcon active={unread > 0 || open} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: 'var(--yes)', color: '#000',
            borderRadius: '50%', width: 15, height: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 8, fontWeight: 700, lineHeight: 1,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setOpen(false)} />
          <div ref={panelRef} style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: 300, background: 'var(--bg, #060e1a)',
            border: '1px solid var(--line-2)', borderRadius: 4,
            zIndex: 200, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              padding: '9px 14px', borderBottom: '1px solid var(--line-2)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.14em',
              color: 'var(--ink-3)', display: 'flex', justifyContent: 'space-between',
            }}>
              <span>// NOTIFICATIONS</span>
              <span>{notifs.length} TOTAL</span>
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {notifs.length === 0 ? (
                <div style={{
                  padding: '22px 14px', textAlign: 'center',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  color: 'var(--ink-3)', letterSpacing: '0.12em',
                }}>
                  // NO EVENTS YET
                </div>
              ) : notifs.map(n => {
                const s = typeProps(n.type);
                return (
                  <div key={n.id} style={{
                    padding: '10px 14px', borderBottom: '1px solid var(--line-2)',
                    background: s.bg, borderLeft: `2px solid ${s.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                        fontWeight: 700, color: s.color, letterSpacing: '0.1em',
                      }}>
                        {s.icon} {n.type}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--ink-3)' }}>
                        MKT_{String(n.marketId).padStart(4, '0')}
                      </span>
                      {n.side && (
                        <span style={{
                          marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                          fontWeight: 700, color: n.side === 'YES' ? 'var(--yes)' : 'var(--bear)',
                        }}>
                          {n.side}
                        </span>
                      )}
                    </div>
                    {n.question && (
                      <div style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                        color: 'var(--ink-2)', lineHeight: 1.45,
                      }}>
                        {n.question.length > 72 ? n.question.slice(0, 72) + '…' : n.question}
                      </div>
                    )}
                    {n.result && (
                      <div style={{
                        marginTop: 4, fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 9, color: 'var(--ink-3)',
                      }}>
                        RESULT: <b style={{ color: 'var(--acc)' }}>{n.result}</b>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ── ProfilePanel ──────────────────────────────────────────────────────────────
const ProfilePanel = ({ account, onClose, onDisconnect }) => {
  const [predictions, setPredictions] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [openOpen,    setOpenOpen]    = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [claiming,    setClaiming]    = useState(null);
  const [tx,          setTx]          = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!window.__glAPI || !window.__glAPI.loadMyPredictions) {
        setLoading(false);
        return;
      }
      try {
        // Load predictions + markets in parallel
        const [raw, markets] = await Promise.all([
          window.__glAPI.loadMyPredictions(account),
          window.__glAPI.loadMarkets().catch(() => []),
        ]);
        const parsed = window.__glAPI.parseMyPredictions(raw) || [];

        // Enrich each prediction with status/result/question from the live markets list
        const enriched = parsed.map(p => {
          const m = (markets || []).find(mm => mm.id === p.marketId);
          if (!m) return p;
          return {
            ...p,
            status:   m.status   || p.status,
            result:   m.result   || p.result,
            question: m.question || '',
            category: m.category || '',
          };
        });
        if (!cancelled) {
          setPredictions(enriched);
          setLoading(false);
        }
      } catch (e) {
        console.error('[ProfilePanel] load error:', e);
        if (!cancelled) { setPredictions([]); setLoading(false); }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [account]);

  const list    = predictions || [];
  const open    = list.filter(p => p.status === 'OPEN');
  const history = list.filter(p => p.status !== 'OPEN');

  // Pending Rewards: bets in RESOLVED markets where user's side matches result
  const pending = history.filter(p =>
    p.status === 'RESOLVED' && p.result && p.side === p.result
  );

  const totalBets = list.length;
  const wins      = pending.length;
  const losses    = history.filter(p =>
    p.status === 'RESOLVED' && p.result && p.side !== p.result
  ).length;
  // 1 pt per bet, +1 pt per win (best-effort, real payout depends on pool ratio)
  const pnl = wins - losses;

  const claim = async (marketId) => {
    setClaiming(marketId);
    setTx(null);
    try {
      const hash = await window.__glAPI.claimWinnings(marketId);
      setTx('TX: ' + String(hash).slice(0, 20) + '…');
    } catch (e) {
      setTx('ERR: ' + (e.message || String(e)));
    } finally {
      setClaiming(null);
    }
  };

  const short = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';

  return (
    <>
      <div className="profile-overlay" onClick={onClose}></div>
      <aside className="profile-panel">
        <div className="profile-head">
          <div className="profile-avatar-big">{(account || '?').slice(2, 3).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div className="profile-wallet">{short(account)}</div>
            <div className="profile-tag">FORESIGHT · TESTNET</div>
          </div>
          <button className="profile-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="profile-cards">
          <div className="profile-card">
            <div className="lbl">TOTAL BETS</div>
            <div className="val">{loading ? '—' : totalBets}</div>
          </div>
          <div className="profile-card">
            <div className="lbl">ALL-TIME P&amp;L</div>
            <div className="val acc">{loading ? '—' : (pnl >= 0 ? '+' : '') + pnl + ' pts'}</div>
          </div>
        </div>

        <div className="profile-card pending">
          <div className="row">
            <div>
              <div className="lbl">PENDING REWARDS</div>
              <div className="val">{loading ? '—' : pending.length + ' market' + (pending.length === 1 ? '' : 's')}</div>
            </div>
            <div className="claim-list">
              {pending.length === 0
                ? <span className="muted">No claims pending</span>
                : pending.map(p => (
                  <button
                    key={p.marketId}
                    className="btn-claim"
                    disabled={claiming === String(p.marketId)}
                    onClick={() => claim(p.marketId)}
                  >
                    {claiming === String(p.marketId) ? '…' : `Claim MKT_${String(p.marketId).padStart(4, '0')}`}
                  </button>
                ))
              }
            </div>
          </div>
          {tx && <div className="profile-tx">{tx}</div>}
        </div>

        {/* Open positions collapsible */}
        <button className="profile-collapse" onClick={() => setOpenOpen(!openOpen)}>
          <span>OPEN POSITIONS · {loading ? '—' : open.length}</span>
          <span className="arr">{openOpen ? '▾' : '▸'}</span>
        </button>
        {openOpen && (
          <div className="profile-list">
            {open.length === 0
              ? <div className="muted">No open positions.</div>
              : open.map((p, i) => (
                <div key={i} className="profile-row">
                  <span className="mkt">MKT_{String(p.marketId).padStart(4, '0')}</span>
                  <span className={`side ${p.side === 'YES' ? 'yes' : 'no'}`}>{p.side}</span>
                  <span className="stat">{p.status}</span>
                </div>
              ))
            }
          </div>
        )}

        {/* History collapsible */}
        <button className="profile-collapse" onClick={() => setOpenHistory(!openHistory)}>
          <span>HISTORY · {loading ? '—' : history.length}</span>
          <span className="arr">{openHistory ? '▾' : '▸'}</span>
        </button>
        {openHistory && (
          <div className="profile-list">
            {history.length === 0
              ? <div className="muted">No history yet.</div>
              : history.map((p, i) => {
                const won = p.status === 'RESOLVED' && p.result && p.side === p.result;
                return (
                  <div key={i} className="profile-row">
                    <span className="mkt">MKT_{String(p.marketId).padStart(4, '0')}</span>
                    <span className={`side ${p.side === 'YES' ? 'yes' : 'no'}`}>{p.side}</span>
                    <span className="stat">{p.status}</span>
                    <span className={won ? 'win' : 'loss'}>{won ? '✓' : p.status === 'EXPIRED' ? '↩' : '✕'}</span>
                  </div>
                );
              })
            }
          </div>
        )}

        <button className="profile-disconnect" onClick={() => { onDisconnect(); onClose(); }}>
          Disconnect
        </button>
      </aside>
    </>
  );
};

// ── Topbar ────────────────────────────────────────────────────────────────────
const Topbar = ({ active = "home" }) => {
  const [account,  setAccount]     = useState(null);
  const [loading,  setLoading]     = useState(false);
  const [error,    setError]       = useState(null);
  const [panelOpen, setPanelOpen]  = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('gl_account');
    if (saved) { setAccount(saved); window.__glAccount = saved; }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          sessionStorage.setItem('gl_account', accounts[0]);
          window.__glAccount = accounts[0];
        } else {
          setAccount(null);
          sessionStorage.removeItem('gl_account');
          window.__glAccount = null;
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    setError(null);
    if (!window.ethereum) { setError('Instala MetaMask o Rabby.'); return; }
    setLoading(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: GL_NETWORK.chainId }],
        });
      } catch (sw) {
        if (sw.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [GL_NETWORK],
          });
        }
      }
      const addr = accounts[0];
      setAccount(addr);
      sessionStorage.setItem('gl_account', addr);
      window.__glAccount = addr;
    } catch (err) {
      setError(err.code === 4001 ? 'Rechazado.' : 'No se pudo conectar.');
    }
    setLoading(false);
  };

  const disconnect = () => {
    setAccount(null);
    sessionStorage.removeItem('gl_account');
    window.__glAccount = null;
  };

  const short = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';

  return (
    <div className="topbar">
      <a href="Home.html" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="brand-mark"></div>
        <div>
          <div className="brand-name">Foresight</div>
          <div className="brand-tag">
            <span className="build-chip">
              <span className="gl-mark"></span>
              Building on GenLayer
            </span>
          </div>
        </div>
      </a>

      <div className="nav">
        {NAV_ITEMS.map((item) => (
          <a key={item.id} href={item.href} className={item.id === active ? "active" : ""}>
            {item.label}
          </a>
        ))}
      </div>

      <div className="topbar-right">
        <div className="live-chip">
          <span className="dot"></span>
          <span className="net">TESTNET</span>
          <span className="sep">·</span>
          <span>STUDIONET</span>
        </div>

        {error && (
          <span style={{ color: "var(--bear)", fontFamily: "JetBrains Mono,monospace", fontSize: 10, maxWidth: 160 }}>
            {error}
          </span>
        )}

        {account && <NotificationBell account={account} />}

        {account ? (
          <button
            className="profile-avatar-btn"
            onClick={() => setPanelOpen(true)}
            title={short(account)}
            aria-label="Open profile"
          >
            <span className="avatar-letter">{account.slice(2, 3).toUpperCase()}</span>
            <span className="avatar-addr">{short(account)}</span>
          </button>
        ) : (
          <button className="btn-wallet" onClick={connectWallet} disabled={loading}>
            {loading ? 'Conectando…' : 'Connect wallet'}
          </button>
        )}
      </div>

      {panelOpen && account && (
        <ProfilePanel
          account={account}
          onClose={() => setPanelOpen(false)}
          onDisconnect={disconnect}
        />
      )}
    </div>
  );
};

const FooterStrip = () => (
  <div className="foot">
    <div className="foot-col">
      <div className="foot-brand">
        <span className="foot-brand-mark"></span>
        Foresight
      </div>
      <div className="foot-tag">
        AI-powered prediction markets. Authored from real news,
        resolved by optimistic AI consensus on GenLayer.
      </div>
      <div className="foot-meta">
        <span className="acc">v0.1.0</span> · <span className="net">TESTNET STUDIO</span>
      </div>
    </div>
    <div className="foot-col">
      <h5>Protocol</h5>
      <a href="Markets.html">Markets</a>
      <a href="Leaderboard.html">Leaderboard</a>
      <a href="HowItWorks.html">How it works</a>
      <a href="TheSignal.html">The Signal</a>
    </div>
    <div className="foot-col">
      <h5>Developers</h5>
      <a href="Docs.html">Docs</a>
      <a href="https://github.com/randyparrs/foresight-platform" target="_blank" rel="noopener noreferrer">Contract</a>
      <a href="https://github.com/randyparrs/foresight-platform" target="_blank" rel="noopener noreferrer">GitHub</a>
    </div>
    <div className="foot-col">
      <h5>Community</h5>
      <a href="https://discord.gg/8Jm4v89VAu" target="_blank" rel="noopener noreferrer">Discord</a>
      <a href="https://x.com/genlayer" target="_blank" rel="noopener noreferrer">Twitter / X</a>
      <span className="foot-text">Telegram</span>
    </div>
    <div className="foot-bottom">
      <span>© 2026 <span className="acc">FORESIGHT</span> // BUILT ON <span className="vio">GENLAYER</span></span>
      <div className="foot-socials">
        <a href="#" aria-label="X">𝕏</a>
        <a href="#" aria-label="Discord">⌬</a>
        <a href="#" aria-label="GitHub">⌥</a>
      </div>
      <span>NON-CUSTODIAL · TESTNET STUDIO</span>
    </div>
  </div>
);

Object.assign(window, { Topbar, FooterStrip, NAV_ITEMS });
