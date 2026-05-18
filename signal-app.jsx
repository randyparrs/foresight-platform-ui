/* global React, ReactDOM, Topbar, FooterStrip */

// =============================================================
//  THE SIGNAL — AI journalist publication
//  Reads from The Signal intelligent contract on GenLayer.
//  Contract: 0xCb20df465C11BcB67e87b68A5B936453340c9d01
// =============================================================

// ── Mock fallback ─────────────────────────────────────────────────────────────
const FEATURE_MOCK = {
  id: 142,
  category: "CRYPTO",
  sentiment: "BULLISH",
  title: "Bitcoin breaches $138,000 as spot ETFs absorb record weekly inflows",
  headline: "A surge in institutional flows and a softer-than-expected core PCE print sent BTC to fresh highs, with desks reporting thin sell-side liquidity through the weekend.",
  body: "Bitcoin punched through $138K on Friday after spot ETFs reported $4.2B in net inflows over the trailing five sessions — the largest weekly haul on record. Desks at major venues described the move as a momentum break against thin orderbooks, with sellers concentrated above $142K.\n\nThe rally coincided with a cooler-than-expected core PCE print, reviving expectations of a July rate cut and pulling DXY 0.6% lower. Risk assets followed: SOL closed +9.4%, ETH +6.1%, and the broader CoinShares CMI rose 7.8% on the week.\n\nForesight markets repriced the YES side of \"BTC closes above $150K by Dec 31\" from 54% to 68% on the news, with $12.4K in fresh stakes in the first hour after publication.",
  tags: ["btc", "etf-flows", "fed-pivot", "ltf-breakout"],
  sources: ["bloomberg.com/news/articles/2026-05-12/bitcoin-etf-flows", "ft.com/content/btc-138k-rally", "coindesk.com/markets/2026/05/12/etf-inflows"],
  block: 184312,
  publishedAt: "2026.05.12 · 14:32 UTC",
};

const ARTICLES_MOCK = [
  { id: 141, category: "POLITICS", sentiment: "POSITIVE",  title: "Powell hints at July cut as core PCE cools to 2.4%",           headline: "The Fed chair stopped short of committing to action but bond markets quickly priced in a 71% chance of a July move.", tags: ["fed","rates","fomc"],  sources: 3, block: 184298, publishedAt: "2h ago" },
  { id: 140, category: "TECH",     sentiment: "NEGATIVE",  title: "Apple delays Vision-class glasses to 2027, supply chain sources say", headline: "Two component partners confirmed an internal slip; Cupertino has yet to publicly acknowledge the change.", tags: ["aapl","ar","vision"], sources: 2, block: 184277, publishedAt: "6h ago" },
  { id: 139, category: "MARKETS",  sentiment: "NEUTRAL",   title: "S&P 500 closes at 6,420 after late-day chop on Powell speech",  headline: "Tech outperformed but breadth deteriorated, with the equal-weight index lagging the cap-weighted close by 38 bps.", tags: ["spx","equities","breadth"], sources: 4, block: 184251, publishedAt: "9h ago" },
  { id: 138, category: "SPORTS",   sentiment: "POSITIVE",  title: "Real Madrid edge Bayern 3-1 on aggregate to reach UCL final",   headline: "Vinicius and Bellingham combined for two first-half goals at the Bernabéu; Foresight YES on Real wins UCL jumped to 54%.", tags: ["ucl","rmadrid","bayern"], sources: 2, block: 184240, publishedAt: "12h ago" },
  { id: 137, category: "CRYPTO",   sentiment: "BEARISH",   title: "Ethereum L2 gas spike triggers brief 9% slide before recovery", headline: "An attempted mass-mint on Base congested the network; ETH retraced to $4,180 before bouncing into the close.", tags: ["eth","l2","base"], sources: 3, block: 184215, publishedAt: "14h ago" },
  { id: 136, category: "TECH",     sentiment: "POSITIVE",  title: "OpenAI ships GPT-6 preview API for enterprise, public release in July", headline: "The new model adds a 2M-token context window and native tool calling; pricing matches GPT-4o at launch.", tags: ["openai","gpt-6","api"], sources: 3, block: 184198, publishedAt: "18h ago" },
];

// ── Components ────────────────────────────────────────────────────────────────
const SignalAgentAvatar = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="agent-glow" cx="50%" cy="40%" r="55%">
        <stop offset="0%"  stopColor="#3d5a85" />
        <stop offset="60%" stopColor="#0d1a30" />
        <stop offset="100%" stopColor="#06101c" />
      </radialGradient>
      <linearGradient id="agent-rim" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%"  stopColor="#4ce8e6" />
        <stop offset="100%" stopColor="#8a7cff" />
      </linearGradient>
      <filter id="agent-soft" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.6" />
      </filter>
    </defs>
    <circle cx="100" cy="100" r="94" fill="none" stroke="url(#agent-rim)" strokeWidth="1.5" opacity="0.6" />
    <circle cx="100" cy="100" r="88" fill="url(#agent-glow)" />
    <g>
      <ellipse cx="100" cy="98" rx="42" ry="52" fill="#0a1326" stroke="#4ce8e6" strokeWidth="1.4" opacity="0.95" />
      <rect x="68" y="84" width="64" height="18" rx="9" fill="#04080f" stroke="#4ce8e6" strokeWidth="1.2" />
      <circle cx="84" cy="93" r="3.6" fill="#4ce8e6" filter="url(#agent-soft)" />
      <circle cx="116" cy="93" r="3.6" fill="#4ce8e6" filter="url(#agent-soft)" />
      <line x1="100" y1="86" x2="100" y2="100" stroke="#4ce8e6" strokeWidth="0.8" opacity="0.4" />
      <line x1="86" y1="124" x2="94" y2="124" stroke="#8a7cff" strokeWidth="1.4" />
      <line x1="96" y1="120" x2="96" y2="128" stroke="#8a7cff" strokeWidth="1.4" />
      <line x1="98" y1="118" x2="98" y2="130" stroke="#8a7cff" strokeWidth="1.4" />
      <line x1="100" y1="122" x2="100" y2="126" stroke="#8a7cff" strokeWidth="1.4" />
      <line x1="102" y1="118" x2="102" y2="130" stroke="#8a7cff" strokeWidth="1.4" />
      <line x1="104" y1="120" x2="104" y2="128" stroke="#8a7cff" strokeWidth="1.4" />
      <line x1="106" y1="124" x2="114" y2="124" stroke="#8a7cff" strokeWidth="1.4" />
      <line x1="100" y1="50" x2="100" y2="38" stroke="#4ce8e6" strokeWidth="1.5" />
      <circle cx="100" cy="34" r="3.5" fill="#4ce8e6">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <rect x="50" y="92" width="14" height="22" rx="3" fill="#1a2238" stroke="#27314f" strokeWidth="1" />
      <rect x="136" y="92" width="14" height="22" rx="3" fill="#1a2238" stroke="#27314f" strokeWidth="1" />
      <circle cx="57" cy="103" r="2" fill="#8a7cff" />
      <circle cx="143" cy="103" r="2" fill="#8a7cff" />
      <rect x="76" y="148" width="48" height="14" rx="2" fill="#04080f" stroke="#4ce8e6" strokeWidth="1" />
      <text x="100" y="158" fontFamily="JetBrains Mono, monospace" fontSize="7" fill="#4ce8e6" textAnchor="middle" letterSpacing="0.18em">PRESS</text>
    </g>
    <g style={{ transformOrigin: "100px 100px", animation: "agent-orbit 8s linear infinite" }}>
      <circle cx="100" cy="12" r="3" fill="#8a7cff">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
    <style>{`@keyframes agent-orbit { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const SignalAgentHero = ({ totalArticles, live }) => (
  <div className="signal-agent">
    <div className="agent-avatar"><SignalAgentAvatar /></div>
    <div className="agent-info">
      <div className="agent-status">● {live ? "BROADCASTING · ON-CHAIN" : "BROADCASTING · DEMO"}</div>
      <h3>Meet <span className="accent">SIG-01</span>, your on-chain journalist.</h3>
      <div className="agent-byline">AGENT_ID 0xCb20…9d01 · DEPLOYED 2026 · FORESIGHT/THESIGNAL.V1</div>
      <p className="agent-bio">
        SIG-01 reads breaking news, drafts factual articles in three paragraphs,
        tags every story with sentiment, and writes it to chain — only after
        an independent validator panel agrees on the verdict.
      </p>
    </div>
    <div className="agent-stats">
      <div className="agent-stat">
        <div className="lbl">PUBLISHED</div>
        <div className="val"><em>{totalArticles}</em></div>
      </div>
      <div className="agent-stat">
        <div className="lbl">VALIDATORS</div>
        <div className="val">3.<em>0</em> / 3</div>
      </div>
      <div className="agent-stat">
        <div className="lbl">CONSENSUS</div>
        <div className="val"><span className="vio">OD</span></div>
      </div>
      <div className="agent-stat">
        <div className="lbl">NETWORK</div>
        <div className="val"><span className="acc">STUDIO</span></div>
      </div>
    </div>
  </div>
);

const Source = ({ url }) => {
  const domain = url.replace(/^https?:\/\//, '').split('/')[0];
  return (
    <div className="signal-source">
      <span className="signal-source-mark">{domain[0].toUpperCase()}</span>
      <span className="signal-source-url">{url.length > 50 ? url.slice(0, 50) + '…' : url}</span>
    </div>
  );
};

const ArticleBody = ({ body }) => {
  const paras = body.split(/\n+/).filter(Boolean);
  return (
    <div className="signal-hero-body">
      {paras.length > 1
        ? paras.map((p, i) => <p key={i}>{p}</p>)
        : <p>{body}</p>
      }
    </div>
  );
};

const ArticleCard = ({ a }) => (
  <div className="signal-card">
    <div className="top">
      <span className={`cat-tag ${a.category}`}>{a.category}</span>
      <span className={`sentiment ${a.sentiment}`}>{a.sentiment}</span>
    </div>
    <h3>{a.title}</h3>
    <p className="headline">{a.headline}</p>
    <div className="tags">
      {(a.tags || []).map((t) => <span key={t} className="signal-tag">#{t}</span>)}
    </div>
    <div className="article-meta">
      <span>ART_{String(a.id).padStart(4, "0")} · <b>BLK {(a.block || 0).toLocaleString()}</b></span>
      <span>{Array.isArray(a.sources) ? a.sources.length : (a.sources || 0)} SRC · {a.publishedAt || ""}</span>
    </div>
  </div>
);

// ── App ───────────────────────────────────────────────────────────────────────
const { useState, useEffect } = React;

const App = () => {
  const [feature, setFeature]       = useState(FEATURE_MOCK);
  const [articles, setArticles]     = useState(ARTICLES_MOCK);
  const [summary, setSummary]       = useState({ crypto: 312, markets: 218, tech: 174, politics: 164, sports: 312, other: 104 });
  const [totalArticles, setTotal]   = useState('1,284');
  const [live, setLive]             = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const applyArticles = (data) => {
      if (data && data.length > 0) {
        setFeature(data[0]);
        setArticles(data.slice(1));
        setTotal(String(data.length));
        setLive(true);
      }
      setLoading(false);
    };

    const applySignalSummary = (s) => {
      if (!s) return;
      const total = parseInt(s['Total Articles'] || '0');
      if (total > 0) {
        setTotal(total.toLocaleString());
        setSummary({
          crypto:   parseInt(s['CRYPTO']   || '0'),
          markets:  parseInt(s['MARKETS']  || '0'),
          tech:     parseInt(s['TECH']     || '0'),
          politics: parseInt(s['POLITICS'] || '0'),
          sports:   parseInt(s['SPORTS']   || '0'),
          other:    parseInt(s['OTHER']    || '0'),
        });
      }
    };

    const run = () => {
      if (window.__glArticlesPromise) {
        window.__glArticlesPromise.then(applyArticles);
        window.__glSignalSummaryPromise && window.__glSignalSummaryPromise.then(applySignalSummary);
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

  const feed = articles.slice(0, 6).map(a => ({
    block: a.block, category: a.category, title: a.title,
  }));

  return (
    <div className="page" style={{ paddingBottom: 32 }}>
      <Topbar active="signal" />

      <div className="inner-stage">
        <div className="inner-body">
          <div className="sec-header">
            <div>
              <div className="sec-eyebrow">// THE SIGNAL · AI JOURNALIST · {live ? "ON-CHAIN" : "DEMO"}</div>
              <h1 className="sec-title">The <span className="accent">Signal</span>.</h1>
              <p className="sec-sub">
                An AI journalist that writes every article on-chain. Each story is sourced from
                public news, validated by an independent panel before publication, and
                tagged with sentiment so Foresight can price news in real time.
              </p>
            </div>
            <div className="sec-meta">
              <span className="big"><em>{totalArticles}</em></span>
              <span>ARTICLES · {live ? "LIVE ON-CHAIN" : "UPDATED EVERY BLOCK"}</span>
            </div>
          </div>

          <SignalAgentHero totalArticles={totalArticles} live={live} />

          <div className="signal-meta-row">
            <div className="signal-cat-row">
              <span className="signal-cat-chip ALL on">ALL</span>
              <span className="signal-cat-chip CRYPTO on">CRYPTO</span>
              <span className="signal-cat-chip MARKETS on">MARKETS</span>
              <span className="signal-cat-chip TECH on">TECH</span>
              <span className="signal-cat-chip POLITICS on">POLITICS</span>
              <span className="signal-cat-chip SPORTS on">SPORTS</span>
              <span className="signal-cat-chip OTHER">OTHER</span>
            </div>
            <div className="signal-summary">
              <span>CRYPTO <b>{summary.crypto}</b></span>
              <span>MARKETS <b className="acc">{summary.markets}</b></span>
              <span>TECH <b className="vio">{summary.tech}</b></span>
              <span>POLITICS <b>{summary.politics}</b></span>
              <span>SPORTS <b>{summary.sports}</b></span>
              <span>OTHER <b>{summary.other}</b></span>
            </div>
          </div>

          {loading && (
            <div style={{ padding: "16px 0", color: "var(--ink-3)", fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.15em" }}>
              // SYNCING ON-CHAIN ARTICLES...
            </div>
          )}

          <div className="signal-layout">
            {/* Main column */}
            <div>
              {/* Featured article */}
              <article className="signal-hero">
                <div>
                  <div className="signal-hero-head">
                    <span className={`cat-tag ${feature.category}`}>{feature.category}</span>
                    <span className={`sentiment ${feature.sentiment}`}>{feature.sentiment}</span>
                    <span>ART_{String(feature.id).padStart(4, "0")}</span>
                    <span>·</span>
                    <span>{feature.publishedAt || `BLK ${(feature.block || 0).toLocaleString()}`}</span>
                  </div>
                  <h2 className="signal-hero-title">{feature.title}</h2>
                  <p className="signal-hero-headline">{feature.headline}</p>
                  <ArticleBody body={feature.body || ''} />
                  <div className="signal-hero-tags">
                    {(feature.tags || []).map((t) => <span key={t} className="signal-tag">#{t}</span>)}
                  </div>
                </div>
                <aside className="signal-hero-side">
                  <h6>SOURCES · {Array.isArray(feature.sources) ? feature.sources.length : 0}</h6>
                  {Array.isArray(feature.sources) && feature.sources.map((s, i) => (
                    <Source key={i} url={s} />
                  ))}
                  <div className="signal-block">
                    <span>BLOCK</span>
                    <span><b>{(feature.block || 0).toLocaleString()}</b></span>
                  </div>
                  <div className="signal-block">
                    <span>VALIDATORS</span>
                    <span><b>3 / 3</b> AGREED</span>
                  </div>
                  {live && (
                    <div className="signal-block" style={{ marginTop: 8 }}>
                      <span>CONTRACT</span>
                      <span style={{ color: "var(--acc)", fontSize: 9 }}>0xCb20…9d01</span>
                    </div>
                  )}
                </aside>
              </article>

              <div className="signal-grid">
                {articles.map((a) => <ArticleCard key={a.id} a={a} />)}
              </div>
            </div>

            {/* Side rail */}
            <aside className="signal-rail">
              <div className="signal-stat">
                <div className="lbl">PUBLISHED · TOTAL</div>
                <div className="val"><em>{totalArticles}</em></div>
                <div className="delta">{live ? "● LIVE ON-CHAIN" : "● DEMO MODE"}</div>
              </div>

              <div className="signal-sentiment-bar">
                <h6>SENTIMENT · BREAKDOWN</h6>
                <div className="bar">
                  <div className="b1" style={{ width: "44%" }}></div>
                  <div className="b2" style={{ width: "32%" }}></div>
                  <div className="b3" style={{ width: "24%" }}></div>
                </div>
                <div className="legend">
                  <div><b className="v1">44%</b><span>BULL+POS</span></div>
                  <div><b className="v2">32%</b><span>NEUTRAL</span></div>
                  <div><b className="v3">24%</b><span>BEAR+NEG</span></div>
                </div>
              </div>

              <div className="signal-feed">
                <h6>RECENT BLOCKS</h6>
                {feed.map((f, i) => (
                  <div key={i} className="signal-feed-item">
                    <span className="blk">{f.block}</span>
                    <span className="ttl">{f.title && f.title.length > 56 ? f.title.slice(0, 56) + "…" : f.title}</span>
                    <span className={`cat-mini ${f.category}`}>{f.category}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <FooterStrip />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
