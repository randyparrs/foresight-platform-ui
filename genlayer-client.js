// Foresight Platform — GenLayer Contract Client
// Reads live on-chain data from deployed intelligent contracts.
//
// Foresight Markets : 0xC22D35c20D53730a86A7d456fc03B48556287903
// The Signal        : 0xCb20df465C11BcB67e87b68A5B936453340c9d01
//
// Network: GenLayer Studio (localhost:8080)
// For public deployment update the chain config below.

import { createClient } from 'https://esm.sh/genlayer-js@latest';

const MARKETS_ADDR = '0xC22D35c20D53730a86A7d456fc03B48556287903';
const SIGNAL_ADDR  = '0xCb20df465C11BcB67e87b68A5B936453340c9d01';

const studioTestnet = {
  id: 61999,
  name: 'GenLayer Studio',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: { default: { http: ['https://studio.genlayer.com/api'] } }
};

const client = createClient({ chain: studioTestnet });

// ── Field extractor ──────────────────────────────────────────────────────────
function field(raw, key, next) {
  const marker = key + ': ';
  const s = raw.indexOf(marker);
  if (s === -1) return '';
  const vs = s + marker.length;
  if (next) {
    const e = raw.indexOf(' | ' + next + ': ', vs);
    return e !== -1 ? raw.slice(vs, e) : raw.slice(vs);
  }
  return raw.slice(vs);
}

// ── Parsers ──────────────────────────────────────────────────────────────────
function parseMarket(raw, id) {
  if (!raw || String(raw) === 'Market not found') return null;
  const r = String(raw);
  const yp = parseInt(field(r, 'YES Pool', 'NO Pool').replace(' pts', '')) || 0;
  const np = parseInt(field(r, 'NO Pool', 'Resolve Attempts').replace(' pts', '')) || 0;
  const total = yp + np;
  return {
    id:               parseInt(id),
    question:         field(r, 'Question', 'Category'),
    category:         field(r, 'Category', 'Quality'),
    quality:          parseInt((field(r, 'Quality', 'Context') || '0/10').split('/')[0]),
    status:           field(r, 'Status', 'Result').toUpperCase(),
    result:           field(r, 'Result', 'Confidence'),
    confidence:       parseInt((field(r, 'Confidence', 'YES Pool') || '0%').replace('%', '')),
    yes_pool:         yp,
    no_pool:          np,
    yes_pct:          total > 0 ? Math.round(yp * 100 / total) : 50,
    pool_total:       total,
    resolve_attempts: parseInt(field(r, 'Resolve Attempts', 'Reasoning') || '0'),
  };
}

function parseArticle(raw, id) {
  if (!raw || String(raw) === 'Article not found') return null;
  const r = String(raw);
  const tags = (field(r, 'Tags', 'Sources') || '')
    .split(',').map(t => t.trim()).filter(Boolean);
  const sources = (field(r, 'Sources', 'Block') || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  return {
    id:        parseInt(id),
    title:     field(r, 'Title', 'Category'),
    category:  field(r, 'Category', 'Sentiment'),
    sentiment: field(r, 'Sentiment', 'Headline'),
    headline:  field(r, 'Headline', 'Body'),
    body:      field(r, 'Body', 'Tags'),
    tags,
    sources,
    block:     parseInt(field(r, 'Block') || '0'),
  };
}

function parseSummary(raw) {
  const result = {};
  String(raw).split('\n').forEach(line => {
    line.split(' | ').forEach(seg => {
      const idx = seg.indexOf(': ');
      if (idx > -1) result[seg.slice(0, idx).trim()] = seg.slice(idx + 2).trim();
    });
  });
  return result;
}

// ── Contract readers ─────────────────────────────────────────────────────────
async function read(address, functionName, args = []) {
  return client.readContract({ address, functionName, args });
}

async function loadMarkets() {
  const raw = await read(MARKETS_ADDR, 'get_market_count', []);
  const count = typeof raw === 'bigint' ? Number(raw) : parseInt(String(raw) || '0');
  if (count === 0) return [];
  const ids = Array.from({ length: Math.min(count, 30) }, (_, i) => String(i));
  const results = await Promise.all(ids.map(id => read(MARKETS_ADDR, 'get_market', [id])));
  return results.map((r, i) => parseMarket(r, ids[i])).filter(Boolean);
}

async function loadMarketSummary() {
  const raw = await read(MARKETS_ADDR, 'get_summary', []);
  return parseSummary(raw);
}

async function loadArticles(limit = 20) {
  const raw = await read(SIGNAL_ADDR, 'get_article_count', []);
  const count = typeof raw === 'bigint' ? Number(raw) : parseInt(String(raw) || '0');
  if (count === 0) return [];
  const n = Math.min(count, limit);
  // newest first
  const ids = Array.from({ length: n }, (_, i) => String(count - 1 - i));
  const results = await Promise.all(ids.map(id => read(SIGNAL_ADDR, 'get_article', [id])));
  return results.map((r, i) => parseArticle(r, ids[i])).filter(Boolean);
}

async function loadSignalSummary() {
  const raw = await read(SIGNAL_ADDR, 'get_summary', []);
  return parseSummary(raw);
}

// ── Kick off data loading and expose API ─────────────────────────────────────
window.__glMarketsPromise = loadMarkets().catch(() => null);
window.__glMarketSummaryPromise = loadMarketSummary().catch(() => null);
window.__glArticlesPromise = loadArticles(20).catch(() => null);
window.__glSignalSummaryPromise = loadSignalSummary().catch(() => null);
window.__glAPI = { loadMarkets, loadMarketSummary, loadArticles, loadSignalSummary };

document.dispatchEvent(new CustomEvent('glReady'));
