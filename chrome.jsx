/* global React */

// =============================================================
//  Shared chrome — Topbar + Footer
//  Wallet: MetaMask + Rabby (EIP-1193 via window.ethereum)
//  Network: GenLayer Studio Testnet (chainId 1337)
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

const { useState, useEffect } = React;

const Topbar = ({ active = "home" }) => {
  const [account,  setAccount]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // Restore session
  useEffect(() => {
    const saved = sessionStorage.getItem('gl_account');
    if (saved) setAccount(saved);

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          sessionStorage.setItem('gl_account', accounts[0]);
        } else {
          setAccount(null);
          sessionStorage.removeItem('gl_account');
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    setError(null);

    if (!window.ethereum) {
      setError('No wallet detected. Install MetaMask or Rabby.');
      return;
    }

    setLoading(true);
    try {
      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Switch / add GenLayer network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: GL_NETWORK.chainId }],
        });
      } catch (switchErr) {
        // Chain not added yet — add it
        if (switchErr.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [GL_NETWORK],
          });
        }
      }

      const addr = accounts[0];
      setAccount(addr);
      sessionStorage.setItem('gl_account', addr);
      // Expose for other scripts
      window.__glAccount = addr;
    } catch (err) {
      setError(err.code === 4001 ? 'Connection rejected.' : 'Could not connect wallet.');
    }
    setLoading(false);
  };

  const disconnect = () => {
    setAccount(null);
    sessionStorage.removeItem('gl_account');
    window.__glAccount = null;
  };

  const shortAddr = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';

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
          <span>STUDIO</span>
        </div>

        {error && (
          <span style={{ color: "var(--bear)", fontFamily: "JetBrains Mono,monospace", fontSize: 10, maxWidth: 160 }}>
            {error}
          </span>
        )}

        {account ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: "JetBrains Mono,monospace", fontSize: 11,
              color: "var(--yes)", letterSpacing: "0.05em"
            }}>
              ● {shortAddr(account)}
            </span>
            <button className="btn-wallet" onClick={disconnect}
              style={{ fontSize: 10, padding: "4px 10px" }}>
              Disconnect
            </button>
          </div>
        ) : (
          <button className="btn-wallet" onClick={connectWallet} disabled={loading}>
            {loading ? 'Connecting…' : 'Connect wallet'}
          </button>
        )}
      </div>
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
      <a href="https://github.com/randyparrs/foresight-platform" target="_blank">Contract</a>
      <a href="https://github.com/randyparrs/foresight-platform-ui" target="_blank">GitHub</a>
    </div>
    <div className="foot-col">
      <h5>Community</h5>
      <a href="#">Discord</a>
      <a href="#">Twitter / X</a>
      <a href="#">Telegram</a>
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
