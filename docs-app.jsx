/* global React, ReactDOM, Topbar, FooterStrip */

const { useState: useDocsState } = React;

// ── Content blocks per section ────────────────────────────────────────────────
const SECTIONS = {
  // GETTING STARTED
  quickstart: {
    group: 'GETTING STARTED',
    title: 'Quickstart',
    body: (
      <>
        <p className="lead">
          Foresight is a prediction-market protocol deployed on GenLayer. Markets
          are authored by AI from a news article and settled by an AI panel that
          reads source URLs. You only need a GenLayer-compatible wallet to start.
        </p>

        <h3>1. Connect a wallet</h3>
        <p>
          Any GenLayer-compatible wallet works. Make sure you're on{" "}
          <code>testnet_studio</code> while we're in beta. The connect button is
          at the top-right of every page.
        </p>

        <h3>2. Browse the markets</h3>
        <p>
          Markets live at <code>/markets</code>. New markets are authored
          automatically by an off-chain bot every 15 minutes from real news
          articles. Each market is YES/NO with a quality score 1-10.
        </p>

        <h3>3. Place a prediction</h3>
        <p>
          Pick YES or NO. Each bet costs 1 point. Pools update on the next block.
          No order book — your payout is computed pro-rata at settlement.
        </p>

        <h3>4. Resolution</h3>
        <p>
          Anyone can call <code>resolve_market(market_id)</code>. The AI panel
          reads the source articles and outputs <code>YES</code>, <code>NO</code>,
          or <code>DISPUTED</code> with a confidence percentage.
        </p>

        <h3>5. Claim</h3>
        <p>
          On resolved markets, winners call <code>claim_winnings(market_id)</code>{" "}
          once. On expired markets, all bettors call{" "}
          <code>claim_refund(market_id)</code> to recover their stake.
        </p>
      </>
    ),
  },

  architecture: {
    group: 'GETTING STARTED',
    title: 'Architecture',
    body: (
      <>
        <p className="lead">
          Foresight runs on two intelligent contracts plus a frontend and a bot.
          All consensus happens on-chain via GenLayer's Optimistic Democracy.
        </p>

        <h3>Components</h3>
        <ul>
          <li><b>Foresight Markets</b> — prediction market contract. Generates markets, accepts predictions, runs AI resolution.</li>
          <li><b>The Signal</b> — on-chain AI journalist. Publishes articles from news URLs.</li>
          <li><b>Frontend</b> — React/JSX dApp at <code>foresight-platform-ui</code>. Talks to both contracts via JSON-RPC.</li>
          <li><b>Bot</b> — GitHub Actions cron, every 15 min. Calls <code>generate_market</code> and <code>publish_article</code> from a dedicated testnet wallet.</li>
        </ul>

        <h3>Data flow</h3>
        <p>
          Bot picks a news URL → calls the contract → leader LLM proposes a
          YES/NO question → validator LLMs re-run the prompt → if quality &gt; 6
          and validators agree, the market is published on-chain. Same flow for
          articles in The Signal.
        </p>
      </>
    ),
  },

  glossary: {
    group: 'GETTING STARTED',
    title: 'Glossary',
    body: (
      <>
        <p className="lead">Common terms used across the protocol.</p>
        <ul>
          <li><b>Market</b> — a YES/NO question authored from a news article.</li>
          <li><b>Pool</b> — the sum of YES and NO bets for a market. Drives payout odds.</li>
          <li><b>Quality score</b> — 1-10 grade given by the AI panel at authoring time. Markets below 6 are auto-rejected.</li>
          <li><b>Optimistic Democracy</b> — GenLayer's consensus model. Leader proposes, validators re-run and challenge if they disagree.</li>
          <li><b>Disputed</b> — market status when validators can't agree on resolution. Allows <code>re_resolve_market</code> up to 3 times.</li>
          <li><b>Expired</b> — market that ran out of resolution attempts. Bettors get refunds.</li>
          <li><b>SIG-01</b> — the AI journalist that authors articles in The Signal.</li>
        </ul>
      </>
    ),
  },

  // CONTRACT API
  generate_market: {
    group: 'CONTRACT API',
    title: 'generate_market(source_url, search_terms)',
    body: (
      <>
        <p className="lead">
          Authors a new prediction market from a news URL. The contract fetches
          the article on-chain, runs an LLM to propose a YES/NO question, and
          validators re-run for agreement.
        </p>

        <h3>Parameters</h3>
        <ul>
          <li><code>source_url: str</code> — full URL of the news article (min 10 chars)</li>
          <li><code>search_terms: str</code> — short topic hint to focus the LLM (min 3 chars)</li>
        </ul>

        <h3>Behavior</h3>
        <p>
          Returns nothing — the new market is appended at index{" "}
          <code>get_market_count() - 1</code>. Quality scores below 6 are
          auto-rejected and the call no-ops.
        </p>

        <div className="callout">
          <b>Note —</b> only used by the bot in production. The user-facing UI
          for generating markets was removed in v0.1.
        </div>
      </>
    ),
  },

  place_prediction: {
    group: 'CONTRACT API',
    title: 'place_prediction(market_id, side)',
    body: (
      <>
        <p className="lead">
          Place a 1-point bet on YES or NO for an open market.
        </p>

        <h3>Parameters</h3>
        <ul>
          <li><code>market_id: str</code> — id of the market (as string)</li>
          <li><code>side: str</code> — must be <code>"YES"</code> or <code>"NO"</code> (uppercase)</li>
        </ul>

        <h3>Behavior</h3>
        <p>
          Adds 1 to either the YES pool or the NO pool. Each call equals 1 point.
          To stake more on the same side, call multiple times.
        </p>

        <div className="callout">
          <b>Note —</b> only works while market status is <code>OPEN</code>.
          Returns an error if the market is RESOLVED, DISPUTED or EXPIRED.
        </div>
      </>
    ),
  },

  resolve_market: {
    group: 'CONTRACT API',
    title: 'resolve_market(market_id)',
    body: (
      <>
        <p className="lead">
          Triggers the AI resolution panel for an open market.
        </p>

        <h3>Behavior</h3>
        <p>
          The leader validator reads up to 3 source URLs, runs an LLM, and outputs{" "}
          <code>YES</code>, <code>NO</code>, or <code>DISPUTED</code> with a
          confidence percentage. Validators re-run and must agree on the verdict
          (confidence drift up to ±20% is tolerated).
        </p>

        <p>
          Status transitions: <code>OPEN → RESOLVED</code> or{" "}
          <code>OPEN → DISPUTED</code>.
        </p>
      </>
    ),
  },

  re_resolve_market: {
    group: 'CONTRACT API',
    title: 're_resolve_market(market_id)',
    body: (
      <>
        <p className="lead">
          Re-runs the AI resolution panel on a disputed market with fresh
          sources.
        </p>

        <h3>Behavior</h3>
        <p>
          Allowed up to 3 times per market. Each attempt increments{" "}
          <code>resolve_attempts</code>. If all 3 attempts result in DISPUTED,
          the market expires and bettors can claim refunds.
        </p>

        <div className="callout">
          <b>Note —</b> only works while market status is{" "}
          <code>DISPUTED</code> or <code>RESOLVED</code>.
        </div>
      </>
    ),
  },

  claim_winnings: {
    group: 'CONTRACT API',
    title: 'claim_winnings(market_id)',
    body: (
      <>
        <p className="lead">
          Claim your share of the prize pool on a resolved market.
        </p>

        <h3>Behavior</h3>
        <p>
          If you bet on the winning side, payout is computed pro-rata:{" "}
          <code>your_stake × total_pool / winning_pool</code>. Each address can
          only claim once per market.
        </p>

        <div className="callout">
          <b>Note —</b> only works while market status is{" "}
          <code>RESOLVED</code>.
        </div>
      </>
    ),
  },

  claim_refund: {
    group: 'CONTRACT API',
    title: 'claim_refund(market_id)',
    body: (
      <>
        <p className="lead">
          Recover your stake from an expired market.
        </p>

        <h3>Behavior</h3>
        <p>
          On expired markets every bettor gets their original stake back, no
          gains, no losses. Each address can only claim once per market.
        </p>
      </>
    ),
  },

  // THE SIGNAL
  sig_01: {
    group: 'THE SIGNAL',
    title: 'Meet SIG-01',
    body: (
      <>
        <p className="lead">
          SIG-01 is the on-chain AI journalist. It reads breaking news, drafts
          three-paragraph articles, tags them with sentiment, and writes the
          result to chain — but only after an independent validator panel agrees
          on the verdict.
        </p>
        <p>
          The output feeds both human readers and the market-generation
          pipeline.
        </p>
      </>
    ),
  },

  publish_article: {
    group: 'THE SIGNAL',
    title: 'publish_article(category, url1, url2, url3)',
    body: (
      <>
        <p className="lead">
          Submit a category plus up to 3 source URLs. The contract fetches each
          URL on-chain via <code>gl.nondet.web.get</code>, asks SIG-01 to draft
          a story, and stores it under a new <code>article_id</code>.
        </p>

        <h3>Parameters</h3>
        <ul>
          <li><code>category: str</code> — one of <code>CRYPTO</code>, <code>TECH</code>, <code>MARKETS</code>, <code>POLITICS</code>, <code>SPORTS</code>, <code>OTHER</code> (uppercase)</li>
          <li><code>url1: str</code> — primary source URL (required)</li>
          <li><code>url2: str</code> — secondary URL (optional, can be empty string)</li>
          <li><code>url3: str</code> — tertiary URL (optional, can be empty string)</li>
        </ul>

        <p>
          The draft must pass a validator pass that re-runs the prompt — if the
          proposed category or sentiment drifts between nodes, publication is
          rejected.
        </p>
      </>
    ),
  },

  article_schema: {
    group: 'THE SIGNAL',
    title: 'Article schema',
    body: (
      <>
        <p>Every article stored on-chain has the following fields:</p>
        <ul>
          <li><code>title</code> — concise headline (&lt; 120 chars)</li>
          <li><code>headline</code> — one-sentence lede with the why</li>
          <li><code>body</code> — exactly three paragraphs of factual context</li>
          <li><code>category</code> — <code>CRYPTO</code>, <code>TECH</code>, <code>MARKETS</code>, <code>POLITICS</code>, <code>SPORTS</code>, or <code>OTHER</code></li>
          <li><code>sentiment</code> — see Sentiment tags below</li>
          <li><code>tags</code> — up to 6 lowercase tokens for indexing</li>
          <li><code>sources</code> — the URLs SIG-01 quoted</li>
          <li><code>block</code> — settlement block; auto-stamped</li>
        </ul>
      </>
    ),
  },

  sentiment_tags: {
    group: 'THE SIGNAL',
    title: 'Sentiment tags',
    body: (
      <>
        <p>
          Sentiment is category-aware. Financial categories (<code>CRYPTO</code>,{" "}
          <code>MARKETS</code>) use{" "}
          <code>BULLISH</code> / <code>BEARISH</code> / <code>NEUTRAL</code>.
        </p>
        <p>
          All other categories use{" "}
          <code>POSITIVE</code> / <code>NEGATIVE</code> / <code>NEUTRAL</code>.
        </p>
        <p>
          The market generator reads this tag to weight YES probability priors
          when it spawns a market from the same news URL.
        </p>
      </>
    ),
  },

  validator_agreement: {
    group: 'THE SIGNAL',
    title: 'Validator agreement',
    body: (
      <>
        <p>
          SIG-01 runs under the same optimistic-AI consensus as the market
          contract. Validator nodes re-execute the draft prompt and must match
          the leader on <code>category</code> and <code>sentiment</code>.
        </p>
        <p>
          The body and tags are allowed to differ — they're treated as soft
          fields. Quorum is 3 of 3.
        </p>

        <div className="callout">
          <b>Why the split —</b> hard fields (category, sentiment) drive
          downstream market logic and must be deterministic. Soft fields (body,
          tags) are stylistic and tolerate model drift.
        </div>
      </>
    ),
  },

  // CONSENSUS
  optimistic_ai: {
    group: 'CONSENSUS',
    title: 'Optimistic AI',
    body: (
      <>
        <p className="lead">
          GenLayer's Optimistic Democracy is the consensus model that lets
          non-deterministic LLM output land on-chain reliably.
        </p>
        <p>
          The leader validator proposes a result. Other validators re-run the
          same prompt independently. If they agree (within tolerance), the
          result is accepted. If they disagree, the round restarts with a new
          leader. After N rotations, the transaction fails.
        </p>
      </>
    ),
  },

  validator_rules: {
    group: 'CONSENSUS',
    title: 'Validator rules',
    body: (
      <>
        <ul>
          <li>Validators run the same code as the leader, with the same inputs.</li>
          <li>External calls (web fetch, LLM) are mediated by GenVM so results are reproducible.</li>
          <li>Each validator returns either AGREE or DISAGREE on the leader's output.</li>
          <li>Quorum is 3 of 5 for resolution, 3 of 3 for The Signal.</li>
          <li>Validators that disagree without justification lose reputation over time.</li>
        </ul>
      </>
    ),
  },

  tolerances: {
    group: 'CONSENSUS',
    title: 'Tolerances',
    body: (
      <>
        <p>How much drift validators tolerate between runs:</p>
        <ul>
          <li><b>Confidence percentage</b> — ±20% drift accepted</li>
          <li><b>Category</b> — exact match required</li>
          <li><b>Sentiment</b> — exact match required</li>
          <li><b>Verdict (YES / NO / DISPUTED)</b> — exact match required</li>
          <li><b>Quality score</b> — ±1 drift accepted</li>
          <li><b>Body / tags / wording</b> — no agreement enforced (soft fields)</li>
        </ul>
      </>
    ),
  },

  // RESOURCES
  examples: {
    group: 'RESOURCES',
    title: 'Examples',
    body: (
      <>
        <p className="lead">Common usage patterns.</p>

        <h3>Read all markets (frontend)</h3>
        <p>
          <code>await window.__glAPI.loadMarkets()</code> — returns an array of
          parsed market objects.
        </p>

        <h3>Place a bet (frontend)</h3>
        <p>
          <code>await window.__glAPI.placePrediction("3", "YES")</code> — bets 1
          point YES on market id 3. Requires MetaMask connected to GenLayer
          Studio.
        </p>

        <h3>Generate a market (bot)</h3>
        <p>
          <code>await client.writeContract(&#123; address, functionName: 'generate_market', args: [url, terms], value: 0n &#125;)</code>
        </p>
      </>
    ),
  },

  audit_reports: {
    group: 'RESOURCES',
    title: 'Audit reports',
    body: (
      <>
        <p className="lead">
          Foresight is currently in testnet beta. No external audit has been
          performed.
        </p>
        <p>
          Internal review: lint via <code>genvm-lint</code>, manual storage
          schema verification, end-to-end smoke tests on Studio.
        </p>
        <p>
          A formal audit will be commissioned before any mainnet deployment.
          Until then, do not use real funds.
        </p>
      </>
    ),
  },

  brand_kit: {
    group: 'RESOURCES',
    title: 'Brand kit',
    body: (
      <>
        <p>Color palette and basic guidelines.</p>
        <ul>
          <li><b>Cyan</b> — <code>#4ce8e6</code> (primary accent)</li>
          <li><b>Violet</b> — <code>#8a7cff</code> (secondary accent)</li>
          <li><b>YES green</b> — <code>#4ce86e</code></li>
          <li><b>NO red</b> — <code>#ff5050</code></li>
          <li><b>Background</b> — near-black <code>#05070f</code></li>
        </ul>
        <p>
          Fonts: <b>Space Grotesk</b> for headings, <b>JetBrains Mono</b> for
          code and labels. Both via Google Fonts.
        </p>
      </>
    ),
  },
};

const SIDEBAR_GROUPS = [
  { title: 'GETTING STARTED', items: ['quickstart', 'architecture', 'glossary'] },
  { title: 'CONTRACT API',    items: ['generate_market', 'place_prediction', 'resolve_market', 're_resolve_market', 'claim_winnings', 'claim_refund'] },
  { title: 'THE SIGNAL',      items: ['sig_01', 'publish_article', 'article_schema', 'sentiment_tags', 'validator_agreement'] },
  { title: 'CONSENSUS',       items: ['optimistic_ai', 'validator_rules', 'tolerances'] },
  { title: 'RESOURCES',       items: ['examples', 'audit_reports', 'brand_kit'] },
];

const LABELS = {
  quickstart: 'Quickstart',
  architecture: 'Architecture',
  glossary: 'Glossary',
  generate_market: 'generate_market',
  place_prediction: 'place_prediction',
  resolve_market: 'resolve_market',
  re_resolve_market: 're_resolve_market',
  claim_winnings: 'claim_winnings',
  claim_refund: 'claim_refund',
  sig_01: 'Meet SIG-01',
  publish_article: 'publish_article',
  article_schema: 'Article schema',
  sentiment_tags: 'Sentiment tags',
  validator_agreement: 'Validator agreement',
  optimistic_ai: 'Optimistic AI',
  validator_rules: 'Validator rules',
  tolerances: 'Tolerances',
  examples: 'Examples',
  audit_reports: 'Audit reports',
  brand_kit: 'Brand kit',
};

const App = () => {
  const [active, setActive] = useDocsState('quickstart');
  const section = SECTIONS[active] || SECTIONS.quickstart;

  return (
    <div className="page" style={{ paddingBottom: 32 }}>
      <Topbar active="docs" />

      <div className="inner-stage">
        <div className="inner-body">
          <div className="sec-header">
            <div>
              <div className="sec-eyebrow">// DEVELOPER REFERENCE · v0.1.0</div>
              <h1 className="sec-title"><span className="accent">Docs</span>.</h1>
              <p className="sec-sub">
                Everything you need to integrate Foresight — contract methods,
                consensus model, validator tolerances, and event hooks.
              </p>
            </div>
            <div className="sec-meta">
              <span className="big">11<em>+</em></span>
              <span>PUBLIC METHODS · 4 EVENT HOOKS</span>
            </div>
          </div>

          <div className="docs-grid">
            {/* Sidebar */}
            <aside className="docs-sidebar">
              {SIDEBAR_GROUPS.map(g => (
                <div className="group" key={g.title}>
                  <div className="gtitle">{g.title}</div>
                  {g.items.map(key => (
                    <a
                      key={key}
                      href="#"
                      className={active === key ? 'active' : ''}
                      onClick={(e) => { e.preventDefault(); setActive(key); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      {LABELS[key]}
                    </a>
                  ))}
                </div>
              ))}
            </aside>

            {/* Content */}
            <article className="docs-content">
              <h2>{section.title}</h2>
              {section.body}
            </article>
          </div>
        </div>
      </div>

      <FooterStrip />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
