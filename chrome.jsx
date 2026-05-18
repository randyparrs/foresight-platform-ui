/* global React */

// =============================================================
//  Shared chrome — v2 editorial topbar + multi-column footer.
// =============================================================

const NAV_ITEMS = [
  { id: "home",    label: "HOME",         href: "Home.html" },
  { id: "markets", label: "MARKETS",      href: "Markets.html" },
  { id: "leader",  label: "LEADERBOARD",  href: "Leaderboard.html" },
  { id: "signal",  label: "THE SIGNAL",   href: "TheSignal.html" },
  { id: "how",     label: "HOW IT WORKS", href: "HowItWorks.html" },
  { id: "docs",    label: "DOCS",         href: "Docs.html" },
];

const Topbar = ({ active = "home" }) => (
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
        <a
          key={item.id}
          href={item.href}
          className={item.id === active ? "active" : ""}
        >
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
      <button className="btn-wallet">Connect wallet</button>
    </div>
  </div>
);

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
      <a href="#">Contract</a>
      <a href="#">API reference</a>
      <a href="#">GitHub</a>
    </div>
    <div className="foot-col">
      <h5>Community</h5>
      <a href="#">Discord</a>
      <a href="#">Twitter / X</a>
      <a href="#">Telegram</a>
      <a href="#">Brand kit</a>
    </div>

    <div className="foot-bottom">
      <span>© 2026 <span className="acc">FORESIGHT</span> // BUILT ON <span className="vio">GENLAYER</span></span>
      <div className="foot-socials">
        <a href="#" aria-label="X">𝕏</a>
        <a href="#" aria-label="Discord">⌬</a>
        <a href="#" aria-label="GitHub">⌥</a>
        <a href="#" aria-label="Mirror">≋</a>
      </div>
      <span>NON-CUSTODIAL · AUDITED 2026.05</span>
    </div>
  </div>
);

Object.assign(window, { Topbar, FooterStrip, NAV_ITEMS });
