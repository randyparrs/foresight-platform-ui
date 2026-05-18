/* global React, ReactDOM, Topbar, FooterStrip */

const STEPS = [
  {
    n: 1,
    title: "News in",
    text: "User submits a news URL and a topic hint. The contract fetches the article on-chain via GenLayer's web access.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="5" width="20" height="18" rx="2" stroke="#4ce8e6" strokeWidth="1.6" />
        <line x1="7" y1="10" x2="21" y2="10" stroke="#4ce8e6" strokeWidth="1.4" />
        <line x1="7" y1="14" x2="21" y2="14" stroke="#4ce8e6" strokeWidth="1.4" />
        <line x1="7" y1="18" x2="15" y2="18" stroke="#4ce8e6" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    n: 2,
    title: "AI generates",
    text: "An LLM proposes a concrete YES/NO question, picks a category, and self-scores quality 1–10. Score < 6 = auto-rejected.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="9" stroke="#8a7cff" strokeWidth="1.6" />
        <circle cx="14" cy="14" r="3" fill="#8a7cff" />
        <line x1="14" y1="2" x2="14" y2="6" stroke="#8a7cff" strokeWidth="1.4" />
        <line x1="14" y1="22" x2="14" y2="26" stroke="#8a7cff" strokeWidth="1.4" />
        <line x1="2" y1="14" x2="6" y2="14" stroke="#8a7cff" strokeWidth="1.4" />
        <line x1="22" y1="14" x2="26" y2="14" stroke="#8a7cff" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    n: 3,
    title: "Consensus",
    text: "Independent validators rerun the prompt. The market only goes live if the leader's verdict matches the validators on category and rejection.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4 L24 10 L24 18 L14 24 L4 18 L4 10 Z" stroke="#4ce8e6" strokeWidth="1.6" />
        <path d="M9 14 L13 18 L19 11" stroke="#5cffa1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    n: 4,
    title: "Predict",
    text: "Wallets stake YES or NO into the market pool. Pools update on every block. No order book — payouts are pro-rata at settlement.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="8" width="22" height="14" rx="2" stroke="#4ce8e6" strokeWidth="1.6" />
        <circle cx="20" cy="15" r="3" stroke="#8a7cff" strokeWidth="1.4" />
        <line x1="6" y1="12" x2="14" y2="12" stroke="#4ce8e6" strokeWidth="1.4" />
        <line x1="6" y1="16" x2="11" y2="16" stroke="#4ce8e6" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    n: 5,
    title: "Resolve",
    text: "An AI panel reads 3 source URLs and outputs YES / NO / DISPUTED with confidence %. Up to 3 retries with fresh sources before expiry.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="#4ce8e6" strokeWidth="1.6" />
        <path d="M14 7 L14 14 L19 17" stroke="#4ce8e6" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

const App = () => (
  <div className="page" style={{ paddingBottom: 32 }}>
    <Topbar active="how" />

    <div className="inner-stage">
      <div className="inner-body">
        <div className="sec-header">
          <div>
            <div className="sec-eyebrow">// PROTOCOL_FLOW · v0.1.0</div>
            <h1 className="sec-title">How <span className="accent">Foresight</span> works.</h1>
            <p className="sec-sub">
              Foresight runs on <b style={{ color: "var(--ink-0)" }}>GenLayer's optimistic AI consensus</b>.
              Multiple independent LLMs reach agreement before anything writes to chain —
              for market creation <i>and</i> resolution.
            </p>
          </div>
          <div className="sec-meta">
            <span className="big">5</span>
            <span>STAGES · END_TO_END</span>
          </div>
        </div>

        {/* Flow */}
        <div className="how-flow">
          {STEPS.map((s) => (
            <div key={s.n} className="how-step">
              <div className="num"><span className="n">{s.n}</span> STEP {String(s.n).padStart(2, "0")}</div>
              <div className="icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <div className="arrow">→</div>
            </div>
          ))}
        </div>

        {/* Deep dive: code + validators */}
        <div className="how-detail">
          <div className="code-panel">
            <div className="code-head">
              <span className="dots"><span></span><span></span><span></span></span>
              <span>FORESIGHT.PY · GENERATE_MARKET()</span>
              <span style={{ color: "var(--cyan)" }}>● ON-CHAIN</span>
            </div>
            <pre className="code-body">
{`<span class="c"># 1. Fetch news content on-chain</span>
<span class="k">response</span> = gl.nondet.web.<span class="f">get</span>(<span class="s">news_url</span>)
<span class="k">web_data</span> = response.body.decode(<span class="s">"utf-8"</span>)[:<span class="n">4000</span>]

<span class="c"># 2. Ask the LLM to propose a market</span>
<span class="k">prompt</span> = <span class="s">f"""You are an AI creating a prediction
market. Output JSON: question, category,
quality_score 1-10, reject bool, context.
News:
{web_data}
"""</span>
<span class="k">result</span> = gl.nondet.<span class="f">exec_prompt</span>(prompt)

<span class="c"># 3. Validators rerun & must agree</span>
<span class="k">raw</span> = gl.vm.<span class="f">run_nondet_unsafe</span>(
    leader_fn, validator_fn
)`}
            </pre>
          </div>

          <div className="validator-list">
            <div className="validator-card">
              <h4>Leader output is verified</h4>
              <p>The proposing node returns a JSON market. Other nodes rerun the same prompt and reject any drift in <code>category</code> or <code>reject</code> flag.</p>
              <div className="meter"><span style={{ width: "100%" }}></span></div>
              <div className="meter-foot"><span>AGREEMENT</span><span>3/3 NODES</span></div>
            </div>
            <div className="validator-card">
              <h4>Confidence-banded resolution</h4>
              <p>For resolution, validators tolerate up to <code>±20%</code> confidence drift, but the verdict (YES / NO / DISPUTED) must match exactly.</p>
              <div className="meter"><span style={{ width: "80%" }}></span></div>
              <div className="meter-foot"><span>TOLERANCE</span><span>±20%</span></div>
            </div>
            <div className="validator-card">
              <h4>3 retries, then expiry</h4>
              <p>If sources disagree, the market is marked <code>disputed</code>. Anyone can call <code>re_resolve_market</code> with fresh sources up to 3 times. After that the market expires and bettors refund.</p>
              <div className="meter"><span style={{ width: "33%" }}></span></div>
              <div className="meter-foot"><span>ATTEMPTS</span><span>1 / 3</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FooterStrip />
  </div>
);

// Render — note: code-body uses dangerouslySetInnerHTML for syntax-color spans
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

// Patch <pre>.code-body innerHTML to interpret the inline spans (since JSX escaped them)
setTimeout(() => {
  document.querySelectorAll(".code-body").forEach((el) => {
    el.innerHTML = el.textContent;
  });
}, 50);
