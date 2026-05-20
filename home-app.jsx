/* global React, ReactDOM, ForecastCore, Topbar, FooterStrip, TweaksPanel, useTweaks, TweakRadio, TweakSection */

const { useMemo, useState, useEffect } = React;

// =============================================================
//  TWEAK DEFAULTS — persisted via host
// =============================================================
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "bg": "aurora"
}/*EDITMODE-END*/;

// =============================================================
//  BG VARIANT 4 — Aurora
// =============================================================
const BGAurora = () => (
  <div className="layer bg-aurora">
    <div className="band b1"></div>
    <div className="band b2"></div>
    <div className="band b3"></div>
    <div className="band b4"></div>
  </div>
);

// =============================================================
//  BG VARIANT 5 — Halo
// =============================================================
const BGHalo = () => (
  <div className="layer bg-halo">
    <div className="core"></div>
    <div className="arc"></div>
    <div className="arc inner"></div>
    <div className="satellite"></div>
    <div className="satellite s2"></div>
  </div>
);

// =============================================================
//  BG VARIANT 1 — Probability curve
// =============================================================
const BGCurve = () => {
  const { mainPath, fillPath, echoPath, ticks } = useMemo(() => {
    const W = 1600, H = 700;
    // Smooth curve via cubic-Bezier between random anchor points
    const seed = 42;
    let s = seed;
    const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const anchors = [];
    const COUNT = 8;
    for (let i = 0; i <= COUNT; i++) {
      anchors.push({
        x: (i / COUNT) * W,
        y: H * 0.55 + (rand() - 0.5) * H * 0.4,
      });
    }
    const cp = (a, b, dir = 1) => ({ x: (a.x + b.x) / 2, y: a.y });
    let mainD = `M ${anchors[0].x} ${anchors[0].y}`;
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1];
      const b = anchors[i];
      const c1x = a.x + (b.x - a.x) * 0.5;
      mainD += ` C ${c1x} ${a.y}, ${c1x} ${b.y}, ${b.x} ${b.y}`;
    }
    // Fill version (close to baseline)
    let fillD = mainD + ` L ${W} ${H + 100} L 0 ${H + 100} Z`;
    // Echo offset version
    let echoD = mainD;

    // Tick markers
    const ticks = anchors.map((a, i) => ({ x: a.x, y: a.y, i }));
    return { mainPath: mainD, fillPath: fillD, echoPath: echoD, ticks };
  }, []);

  // Grid horizontal lines
  const gridLines = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => ({ y: 100 + i * 110 }));
  }, []);

  return (
    <div className="layer bg-curve">
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="none">
        <defs>
          <linearGradient id="curve-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#4ce8e6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#4ce8e6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8a7cff" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="curve-fill-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4ce8e6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#4ce8e6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines.map((g, i) => (
          <line key={i} className="grid-line" x1="0" y1={g.y} x2="1600" y2={g.y} />
        ))}
        {/* Y-axis labels */}
        {[100, 30, 50, 70, 90, 110].map((p, i) => (
          <text key={i} x="20" y={120 + i * 110}>{p}%</text>
        ))}
        <path className="curve-fill" d={fillPath} />
        <path className="curve-echo" d={echoPath} transform="translate(0, 40)" />
        <path className="curve-echo" d={echoPath} transform="translate(0, -40)" />
        <path className="curve-main" d={mainPath} />
        {ticks.map((t, i) => (
          <circle key={i} className="tick" cx={t.x} cy={t.y} r={i % 2 === 0 ? 4 : 3} style={{ animationDelay: `-${i * 0.4}s` }} />
        ))}
        {/* Drifting labels along curve */}
        <text className="drift-label" x="380" y="220">+12.4%</text>
        <text className="drift-label" x="900" y="380">68% YES</text>
        <text className="drift-label" x="1280" y="280">+3.2%</text>
      </svg>
    </div>
  );
};

// =============================================================
//  BG VARIANT 2 — Glow rings
// =============================================================
const BGRings = () => (
  <div className="layer bg-rings">
    <div className="ring r1"></div>
    <div className="ring r2"></div>
    <div className="ring r3"></div>
    <div className="ring r4"></div>
    <div className="focal"></div>
  </div>
);

// =============================================================
//  BG VARIANT 3 — Data streams
// =============================================================
const BGStreams = () => {
  const cols = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 22; i++) {
      const chars = [];
      for (let j = 0; j < 26; j++) {
        const isBright = Math.random() < 0.12;
        const val = Math.random() < 0.5
          ? `${Math.floor(Math.random() * 100)}%`
          : `0x${Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0")}`;
        chars.push({ v: val, bright: isBright });
      }
      arr.push({
        left: 2 + i * 4.5 + (Math.random() * 1.5 - 0.75),
        delay: -(Math.random() * 18),
        duration: 22 + Math.random() * 18,
        violet: Math.random() < 0.45,
        chars,
      });
    }
    return arr;
  }, []);
  return (
    <div className="layer bg-streams">
      {cols.map((c, i) => (
        <div
          key={i}
          className={`col ${c.violet ? "violet" : "cyan"}`}
          style={{
            left: `${c.left}%`,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
          }}
        >
          {c.chars.map((ch, j) => (
            <div key={j}>
              <span className={ch.bright ? "bright" : ""}>{ch.v}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// =============================================================
//  Mini market pills around the orb
// =============================================================
const PILLS = [
  { pos: "p1", cat: "CRYPTO",   q: "BTC > $150K by Dec 31?",          yes: 68 },
  { pos: "p2", cat: "POLITICS", q: "Fed cut at July FOMC?",            yes: 71 },
  { pos: "p3", cat: "TECH",     q: "AAPL ships AR glasses in 2026?",   yes: 31 },
  { pos: "p4", cat: "SPORTS",   q: "Real Madrid wins UCL 2026?",       yes: 54 },
];

const CATEGORY_COLORS = {
  CRYPTO:   { color: "#f7a23d", border: "rgba(247, 162, 61, 0.35)", bg: "rgba(247, 162, 61, 0.08)" },
  TECH:     { color: "#8a7cff", border: "rgba(138, 124, 255, 0.35)", bg: "rgba(138, 124, 255, 0.08)" },
  POLITICS: { color: "#ff6e8a", border: "rgba(255, 110, 138, 0.35)", bg: "rgba(255, 110, 138, 0.08)" },
  SPORTS:   { color: "#5cffa1", border: "rgba(92, 255, 161, 0.35)",  bg: "rgba(92, 255, 161, 0.08)" },
  OTHER:    { color: "#a5adc8", border: "var(--line-2)",             bg: "rgba(255,255,255,0.02)" },
};

const ShowcasePill = ({ p }) => {
  const c = CATEGORY_COLORS[p.cat] || CATEGORY_COLORS.OTHER;
  const no = 100 - p.yes;
  return (
    <div className={`showcase-pill ${p.pos}`}>
      <div className="top">
        <span className="cat" style={{ color: c.color, border: `1px solid ${c.border}`, background: c.bg }}>{p.cat}</span>
        <span className="pct yes">{p.yes}%</span>
      </div>
      <div className="q">{p.q}</div>
      <div className="bar">
        <div className="track">
          <div className="fill" style={{ "--pct": `${p.yes}%` }}></div>
        </div>
        <span className="pct no">{no}%</span>
      </div>
    </div>
  );
};

// =============================================================
//  Featured market row
// =============================================================
const FEATURED = [
  { id: 12, cat: "CRYPTO",   q: "Will BTC close above $150,000 by Dec 31, 2026?",   yes: 68, pool: "12.4K", closes: "47d" },
  { id: 31, cat: "POLITICS", q: "Will the US Fed cut rates at the July FOMC?",      yes: 71, pool: "22.1K", closes: "12d" },
  { id: 22, cat: "TECH",     q: "Will Apple ship AR glasses to consumers in 2026?", yes: 31, pool: "8.9K",  closes: "23d" },
  { id: 47, cat: "SPORTS",   q: "Will Real Madrid win the UEFA Champions 2026?",    yes: 54, pool: "5.2K",  closes: "8d"  },
];

const FeaturedCard = ({ m }) => {
  const no = 100 - m.yes;
  return (
    <div className="mcard">
      <div className="mcard-head">
        <span>MKT_{String(m.id).padStart(4, "0")}</span>
        <span className={`cat-tag ${m.cat}`}>{m.cat}</span>
      </div>
      <div className="mcard-q">{m.q}</div>
      <div className="mcard-row">
        <div className="mcard-side yes">
          <span className="lbl">YES</span>
          <span className="pct">{m.yes}%</span>
        </div>
        <div className="mcard-side no">
          <span className="lbl">NO</span>
          <span className="pct">{no}%</span>
        </div>
      </div>
      <div className="mcard-foot">
        <span>POOL <b>{m.pool}</b></span>
        <span>CLOSES <b>{m.closes}</b></span>
      </div>
    </div>
  );
};

// =============================================================
//  Featured Signal articles (latest by SIG-01)
// =============================================================
const NEWS = [
  {
    feature: true,
    cat: "CRYPTO",
    sentiment: "BULLISH",
    time: "2h ago",
    block: 184_312,
    title: "Bitcoin breaches $138K as spot ETFs absorb record weekly inflows",
    headline:
      "A surge in institutional flows and a softer core PCE print sent BTC to fresh highs, with desks reporting thin sell-side liquidity through the weekend.",
    tags: ["btc", "etf-flows", "fed-pivot"],
    sources: 3,
    count: 7,
  },
  {
    cat: "POLITICS",
    sentiment: "POSITIVE",
    time: "4h ago",
    block: 184_298,
    title: "Powell hints at July cut as core PCE cools to 2.4%",
    headline:
      "The Fed chair stopped short of committing to action but bond markets priced in a 71% chance of a July move.",
    tags: ["fed", "rates", "fomc"],
    sources: 3,
    count: 4,
  },
  {
    cat: "TECH",
    sentiment: "NEGATIVE",
    time: "9h ago",
    block: 184_277,
    title: "Apple delays Vision-class glasses to 2027",
    headline:
      "Two component partners confirmed an internal slip; Cupertino has yet to publicly acknowledge the change.",
    tags: ["aapl", "ar", "vision"],
    sources: 2,
    count: 3,
  },
  {
    cat: "SPORTS",
    sentiment: "POSITIVE",
    time: "12h ago",
    block: 184_240,
    title: "Real Madrid edge Bayern 3-1 on aggregate to reach UCL final",
    headline:
      "Vinícius and Bellingham combined for two first-half goals; Foresight YES on \"Real wins UCL\" jumped to 54%.",
    tags: ["ucl", "rmadrid"],
    sources: 2,
    count: 2,
  },
];

const NewsCard = ({ n }) => (
  <div className={`ncard ${n.feature ? "feature" : ""}`}>
    <div className="ncard-head">
      <span className="ncard-source sig01">
        <span className="sd">S</span>
        SIG-01
      </span>
      <span>BLK {n.block.toLocaleString()} · {n.time}</span>
    </div>
    <h3 className="ncard-headline">{n.title}</h3>
    {n.feature && <p className="ncard-excerpt">{n.headline}</p>}
    <div className="ncard-meta">
      <span className={`cat-tag ${n.cat}`}>{n.cat}</span>
      <span className={`sentiment ${n.sentiment}`}>{n.sentiment}</span>
    </div>
    <div className="ncard-foot">
      <span className="mk-count"><b>{n.count}</b> MARKETS · {n.sources} SOURCES</span>
      <span style={{ color: "var(--cyan)" }}>READ →</span>
    </div>
  </div>
);

// =============================================================
//  Ticker — only real on-chain markets, no mock
// =============================================================
const Ticker = ({ liveMarkets }) => {
  const hasData = liveMarkets && liveMarkets.length > 0;
  const items   = hasData ? liveMarkets.map(m => ({
    cat: m.category, q: m.question, yes: m.yes_pct,
  })) : [];
  // Duplicate enough to fill the marquee even with few items
  const doubled = hasData
    ? (items.length >= 4 ? [...items, ...items] : [...items, ...items, ...items, ...items])
    : [];
  return (
    <div className="ticker">
      <div className="ticker-label">LIVE MARKETS</div>
      <div className="ticker-track">
        {hasData ? (
          <div className="ticker-list">
            {doubled.map((t, i) => (
              <a key={i} href="Markets.html" className="ticker-item" style={{ textDecoration: "none", color: "inherit" }}>
                <span className="cat">{t.cat}</span>
                <span>{t.q}</span>
                <span className={t.yes >= 50 ? "yes" : "no"}>{t.yes}% YES</span>
                <span className="sep">·</span>
              </a>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '14px 18px', color: 'var(--ink-3)',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, letterSpacing: '0.18em',
          }}>
            // SYNCING ON-CHAIN MARKETS…
          </div>
        )}
      </div>
    </div>
  );
};

const AgentCalloutMini = () => (
  <svg width="34" height="34" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="cm-glow" cx="50%" cy="40%" r="55%">
        <stop offset="0%"  stopColor="#3d5a85" />
        <stop offset="60%" stopColor="#0d1a30" />
        <stop offset="100%" stopColor="#06101c" />
      </radialGradient>
    </defs>
    <ellipse cx="100" cy="100" rx="58" ry="68" fill="url(#cm-glow)" stroke="#4ce8e6" strokeWidth="2.5" opacity="0.9" />
    <rect x="58" y="80" width="84" height="22" rx="11" fill="#04080f" stroke="#4ce8e6" strokeWidth="2" />
    <circle cx="78" cy="91" r="4.5" fill="#4ce8e6" />
    <circle cx="122" cy="91" r="4.5" fill="#4ce8e6" />
    <line x1="100" y1="44" x2="100" y2="28" stroke="#4ce8e6" strokeWidth="2.5" />
    <circle cx="100" cy="24" r="5" fill="#4ce8e6">
      <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
    </circle>
    <rect x="68" y="138" width="64" height="16" rx="3" fill="#04080f" stroke="#8a7cff" strokeWidth="1.6" />
  </svg>
);

const AgentCallout = () => (
  <a className="agent-callout" href="TheSignal.html">
    <div className="agent-callout-avatar">
      <AgentCalloutMini />
      <span className="agent-callout-status-dot"></span>
    </div>
    <div className="agent-callout-info">
      <div className="agent-callout-label">MEET YOUR AI JOURNALIST</div>
      <div className="agent-callout-name">
        <span className="id">SIG-01</span> · writing the news, live on-chain
      </div>
    </div>
    <span className="agent-callout-cta">READ THE SIGNAL</span>
  </a>
);
const Hero = ({ totalMarkets, openMarkets, totalBets, liveStats }) => (
  <div className="hero-wrap">
    <div>
      <div className="hero-eyebrow">
        <span className="glyph"></span>
        <b>AI-POWERED PREDICTION MARKETS</b>
        <span className="sep">/</span>
        <span className="vio">GENLAYER</span>
      </div>
      <h1 className="hero-title">
        <span className="fore">Fore</span><span className="sight">s<span className="dot-target"><span className="i-letter">i</span><span className="period">.</span></span>ght</span>
      </h1>
      <p className="hero-tagline">
        <span className="accent">Markets</span> that read the news.{" "}
        <span className="italic">And bet on it.</span>
      </p>
      <p className="hero-sub">
        Real news in. <span className="acc">YES / NO markets</span> out.
        Authored and resolved by an optimistic AI consensus.
      </p>
      <div className="cta-row">
        <a href="Markets.html" className="cta primary" style={{ textDecoration: "none" }}>
          Explore markets <span className="arrow">→</span>
        </a>
        <a href="HowItWorks.html" className="cta" style={{ textDecoration: "none" }}>How it works</a>
      </div>
      <div className="hero-stats">
        <div className="hero-stat">
          <div className="num">{liveStats ? totalMarkets : "—"}</div>
          <div className="lbl">MARKETS · ALL TIME</div>
        </div>
        <div className="hero-stat">
          <div className="num">{liveStats ? openMarkets : "—"}</div>
          <div className="lbl">OPEN NOW</div>
        </div>
        <div className="hero-stat">
          <div className="num">{liveStats ? totalBets : "—"}</div>
          <div className="lbl">PREDICTIONS</div>
        </div>
      </div>

      <AgentCallout />
    </div>

    <div className="showcase">
      <div className="showcase-frame">
        <ForecastCore pctYes={67} category="CRYPTO" />
        {PILLS.map((p) => (
          <ShowcasePill key={p.pos} p={p} />
        ))}
      </div>
    </div>
  </div>
);

// =============================================================
//  APP
// =============================================================
const { useState: useStateApp, useEffect: useEffectApp } = React;

const App = () => {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [featured,     setFeatured]     = useStateApp(FEATURED);
  const [news,         setNews]         = useStateApp(NEWS);
  const [live,         setLive]         = useStateApp(false);
  const [liveMarkets,  setLiveMarkets]  = useStateApp(null);
  const [totalMarkets, setTotalMarkets] = useStateApp('—');
  const [openMarkets,  setOpenMarkets]  = useStateApp('—');
  const [totalBets,    setTotalBets]    = useStateApp('—');

  useEffectApp(() => {
    const applyMarketSummary = (s) => {
      if (!s) return;
      // Only "Total Predictions" comes from the summary — Markets/Open counts
      // use the filtered list (so MKT_0000 doesn't inflate the visible numbers).
      if (s['Total Predictions']) setTotalBets(s['Total Predictions']);
      setLive(true);
    };

    const applyMarkets = (data) => {
      if (!data || data.length === 0) return;
      setLiveMarkets(data);
      setTotalMarkets(String(data.length));
      const open = data.filter(m => m.status === 'OPEN').length;
      setOpenMarkets(String(open));
      const cards = data.slice(0, 4).map(m => ({
        id:     m.id,
        cat:    m.category,
        q:      m.question,
        yes:    m.yes_pct,
        pool:   m.pool_total >= 1000
                  ? (m.pool_total / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
                  : String(m.pool_total),
        closes: m.status,
      }));
      setFeatured(cards);
      setLive(true);
    };

    const applyArticles = (data) => {
      if (!data || data.length === 0) return;
      const cards = data.slice(0, 4).map((a, i) => ({
        feature:   i === 0,
        cat:       a.category,
        sentiment: a.sentiment || 'NEUTRAL',
        time:      `BLK ${(a.block || 0).toLocaleString()}`,
        block:     a.block || 0,
        title:     a.title,
        headline:  a.headline,
        tags:      a.tags || [],
        sources:   Array.isArray(a.sources) ? a.sources.length : 0,
        count:     0,
      }));
      setNews(cards);
    };

    const run = () => {
      window.__glMarketsPromise       && window.__glMarketsPromise.then(applyMarkets);
      window.__glMarketSummaryPromise && window.__glMarketSummaryPromise.then(applyMarketSummary);
      window.__glArticlesPromise      && window.__glArticlesPromise.then(applyArticles);
    };

    if (window.__glAPI) {
      run();
    } else {
      document.addEventListener('glReady', run, { once: true });
    }

    return () => document.removeEventListener('glReady', run);
  }, []);

  const Bg =
    t.bg === "rings"   ? <BGRings />   :
    t.bg === "streams" ? <BGStreams /> :
    t.bg === "aurora"  ? <BGAurora />  :
    t.bg === "halo"    ? <BGHalo />    :
                         <BGCurve />;

  return (
    <div className="page" style={{ paddingBottom: 32 }}>
      <Topbar active="home" />

      {/* Ticker moved to top — below topbar, above hero */}
      <Ticker liveMarkets={liveMarkets} />

      <div className="home-shell">
        {/* BG layers */}
        <div className="layer layer-base"></div>
        {Bg}
        <div className="layer layer-grain"></div>

        <Hero totalMarkets={totalMarkets} openMarkets={openMarkets} totalBets={totalBets} liveStats={live} />

        <div className="section-hr"></div>

        {/* Featured markets */}
        <div className="section">
          <div className="section-head">
            <div className="left">
              <div className="eye">{live ? "LIVE · ON-CHAIN" : "LIVE · FORESIGHT MARKETS"}</div>
              <h2>
                <span className="accent">Foresight</span> markets,{" "}
                <em>worth watching.</em>
              </h2>
            </div>
            <div className="right">
              <a href="Markets.html" className="pill-link">VIEW ALL  →</a>
            </div>
          </div>
          <div className="market-row">
            {featured.map((m) => <FeaturedCard key={m.id} m={m} />)}
          </div>
        </div>

        <div className="section-hr"></div>

        {/* Featured news */}
        <div className="section">
          <div className="section-head">
            <div className="left">
              <div className="eye">FROM THE SIGNAL · LATEST ARTICLES</div>
              <h2>
                Markets <span className="accent">from the news.</span> Written by <span className="accent">SIG-01.</span>
              </h2>
            </div>
            <div className="right">
              <a href="TheSignal.html" className="pill-link">READ THE SIGNAL  →</a>
            </div>
          </div>
          <div className="news-grid">
            {news.map((n, i) => <NewsCard key={i} n={n} />)}
          </div>
        </div>
      </div>

      <FooterStrip />

      {/* Tweaks panel */}
      <TweaksPanel>
        <TweakSection title="Background">
          <TweakRadio
            label="Style"
            value={t.bg}
            options={[
              { value: "curve",   label: "Curve" },
              { value: "aurora",  label: "Aurora" },
              { value: "halo",    label: "Halo" },
              { value: "rings",   label: "Rings" },
              { value: "streams", label: "Streams" },
            ]}
            onChange={(v) => setTweak("bg", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
