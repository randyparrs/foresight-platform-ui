/* global React, ReactDOM, Topbar, FooterStrip */

const App = () => (
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
            <div className="group">
              <div className="gtitle">GETTING STARTED</div>
              <a href="#" className="active">Quickstart</a>
              <a href="#">Architecture</a>
              <a href="#">Glossary</a>
            </div>
            <div className="group">
              <div className="gtitle">CONTRACT API</div>
              <a href="#">generate_market</a>
              <a href="#">place_prediction</a>
              <a href="#">resolve_market</a>
              <a href="#">re_resolve_market</a>
              <a href="#">claim_winnings</a>
              <a href="#">claim_refund</a>
            </div>
            <div className="group">
              <div className="gtitle">THE SIGNAL</div>
              <a href="#sig-01">Meet SIG-01</a>
              <a href="#sig-publish">publish_article</a>
              <a href="#sig-schema">Article schema</a>
              <a href="#sig-sentiment">Sentiment tags</a>
              <a href="#sig-validators">Validator agreement</a>
            </div>
            <div className="group">
              <div className="gtitle">CONSENSUS</div>
              <a href="#">Optimistic AI</a>
              <a href="#">Validator rules</a>
              <a href="#">Tolerances</a>
            </div>
            <div className="group">
              <div className="gtitle">RESOURCES</div>
              <a href="#">Examples</a>
              <a href="#">Audit reports</a>
              <a href="#">Brand kit</a>
            </div>
          </aside>

          {/* Content */}
          <article className="docs-content">
            <h2>Quickstart</h2>
            <p className="lead">
              Foresight is a prediction-market protocol deployed on GenLayer.
              Markets are authored by AI from a news article and settled by an AI panel
              that reads 3 source URLs. You only need a GenLayer-compatible wallet
              and a small amount of test points to start.
            </p>

            <h3>1. Connect a wallet</h3>
            <p>
              Any GenLayer-compatible wallet works. Make sure you're on{" "}
              <code>testnet_studio</code> while we're in beta. The connect button is at the
              top-right of every page.
            </p>

            <h3>2. Browse or generate a market</h3>
            <p>
              Markets live at <code>/markets</code>. To create one, call:
            </p>
            <p>
              <code>generate_market(news_url, topic_hint)</code>
            </p>
            <p>
              The contract fetches the article, asks an LLM to propose a YES / NO question,
              and validates the proposal across nodes. Quality scores below 6 are auto-rejected.
            </p>

            <div className="callout">
              <b>Note —</b> URLs must be at least 10 characters; topic hint at least 3.
              Generation costs are paid by the creator, not the betting pool.
            </div>

            <h3>3. Place a prediction</h3>
            <p>
              Pick YES or NO and stake a point amount. Pools update on the next block.
              No order book — your payout is computed pro-rata at settlement.
            </p>

            <h3>4. Resolution</h3>
            <p>
              Anyone can call <code>resolve_market(market_id, src1, src2, src3)</code>.
              The AI panel reads all 3 sources and outputs <code>YES</code>, <code>NO</code>,
              or <code>DISPUTED</code> with a confidence percentage.
            </p>
            <p>
              Validators tolerate confidence drift up to <code>±20%</code>, but the verdict
              must match exactly. If sources disagree, the market is marked disputed and can be
              re-resolved up to 3 times with new sources before expiring.
            </p>

            <div className="callout">
              <b>Tip —</b> Source reputation is tracked. Successful resolutions improve a URL's
              success rate, surfaced via <code>get_source_reputation()</code>.
            </div>

            <h3>5. Claim</h3>
            <p>
              On resolved markets, winners call <code>claim_winnings(market_id)</code>{" "}
              once. On expired markets, all bettors call <code>claim_refund(market_id)</code>{" "}
              to recover their stake.
            </p>

            <h2 id="sig-01" style={{ marginTop: 48 }}>The Signal · SIG-01</h2>
            <p className="lead">
              Foresight ships with an on-chain AI journalist called <b style={{ color: "var(--ink-0)" }}>SIG-01</b>.
              It reads breaking news, drafts three-paragraph articles, tags them with
              sentiment, and writes the result to chain — but only after an independent
              validator panel agrees on the verdict. The output feeds both human readers
              and the market-generation pipeline.
            </p>

            <div className="callout">
              <b>Contract —</b> <code>TheSignal.py</code> · deployed at <code>0x00…SIG01</code>{" "}
              on testnet_studio. Public methods are listed below.
            </div>

            <h3 id="sig-publish">publish_article(news_url, topic_hint)</h3>
            <p>
              Submits a news URL plus a short topic hint. The contract fetches the
              article on-chain via <code>gl.nondet.web.get</code>, asks SIG-01 to draft
              a story, and stores it under a new <code>article_id</code>.
            </p>
            <p>
              The draft must pass a validator pass that re-runs the prompt — if the
              proposed <code>category</code> or <code>sentiment</code> drifts between
              nodes, publication is rejected and the URL is added to a cooldown list.
            </p>

            <h3 id="sig-schema">Article schema</h3>
            <p>Every article stored on-chain has the following fields:</p>
            <ul>
              <li><code>title</code> — concise headline (&lt; 120 chars)</li>
              <li><code>headline</code> — one-sentence lede with the why</li>
              <li><code>body</code> — exactly three paragraphs of factual context</li>
              <li><code>category</code> — <code>CRYPTO</code>, <code>SPORTS</code>, <code>POLITICS</code>, <code>MARKETS</code>, <code>TECH</code>, or <code>OTHER</code></li>
              <li><code>sentiment</code> — see below</li>
              <li><code>tags</code> — up to 6 lowercase tokens for indexing</li>
              <li><code>sources</code> — the URLs SIG-01 quoted; their reputation updates over time</li>
              <li><code>block</code> — settlement block; auto-stamped</li>
            </ul>

            <h3 id="sig-sentiment">Sentiment tags</h3>
            <p>
              Sentiment is category-aware. Financial categories (<code>CRYPTO</code>, <code>MARKETS</code>)
              use <code>BULLISH</code> / <code>BEARISH</code> / <code>NEUTRAL</code>; all others use{" "}
              <code>POSITIVE</code> / <code>NEGATIVE</code> / <code>NEUTRAL</code>. The Foresight
              market generator reads this tag to weight YES probability priors when it spawns
              a market from the same news URL.
            </p>

            <h3 id="sig-validators">Validator agreement</h3>
            <p>
              SIG-01 runs under the same optimistic-AI consensus as the market contract.
              Validator nodes re-execute the draft prompt and must match the leader on{" "}
              <code>category</code> and <code>sentiment</code>. The body and tags are
              allowed to differ — they're treated as soft fields. Quorum is 3 of 3.
            </p>

            <div className="callout">
              <b>Why the split —</b> hard fields (category, sentiment) drive downstream
              market logic and must be deterministic. Soft fields (body, tags) are
              stylistic and tolerate model drift, so we don't reject good articles over
              prose differences.
            </div>
          </article>
        </div>
      </div>
    </div>

    <FooterStrip />
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
