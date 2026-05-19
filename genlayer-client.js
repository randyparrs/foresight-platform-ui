// Foresight Platform — GenLayer Contract Client v4
import { createClient } from 'https://esm.sh/genlayer-js';
import { studionet } from 'https://esm.sh/genlayer-js/chains';
// Proper binary calldata encoding for gen_call JSON-RPC
//
// Encoding format (from genlayer-js source):
//   calldata = custom type-tagged ULeb128 binary
//   data     = RLP([calldataBytes, 0])  ← hex-encoded
//
// Foresight Markets : 0xC22D35c20D53730a86A7d456fc03B48556287903
// The Signal        : 0xCb20df465C11BcB67e87b68A5B936453340c9d01
// RPC               : https://studio.genlayer.com/api
// Chain ID          : 61999

const MARKETS_ADDR = '0xC22D35c20D53730a86A7d456fc03B48556287903';
const SIGNAL_ADDR  = '0xCb20df465C11BcB67e87b68A5B936453340c9d01';
const RPC_URL      = 'https://studio.genlayer.com/api';
const FROM_ADDR    = '0x0000000000000000000000000000000000000001';

// ── Calldata type constants ───────────────────────────────────────────────────
// BITS_IN_TYPE = 3: type occupies bits 0-2, value occupies bits 3+
const TYPE_SPECIAL = 0; // null/bool
const TYPE_PINT    = 1; // positive integer
const TYPE_NINT    = 2; // negative integer
const TYPE_BYTES   = 3; // byte array
const TYPE_STR     = 4; // UTF-8 string
const TYPE_ARR     = 5; // array
const TYPE_MAP     = 6; // map/object

const _utf8enc = new TextEncoder();
const _utf8dec = new TextDecoder();

// ── Encoder ───────────────────────────────────────────────────────────────────
// First byte layout: [continuation:1][value_low4:4][type:3]
// Continuation bytes: [continuation:1][value_7bits:7]
function writeTypedVarUint(val, type, out) {
  const low  = val & 0xF;       // lower 4 bits go into first byte (bits 3-6)
  const rest = val >>> 4;       // remaining bits
  if (rest === 0) {
    out.push((low << 3) | type);
  } else {
    out.push(0x80 | (low << 3) | type);
    let r = rest;
    while (r > 0x7F) { out.push(0x80 | (r & 0x7F)); r >>>= 7; }
    out.push(r);
  }
}

function writeKeyLen(len, out) {
  // Map keys use plain ULeb128 (no type bits)
  let r = len;
  while (r > 0x7F) { out.push(0x80 | (r & 0x7F)); r >>>= 7; }
  out.push(r);
}

function encodeVal(v, out) {
  if (typeof v === 'string') {
    const b = _utf8enc.encode(v);
    writeTypedVarUint(b.length, TYPE_STR, out);
    for (const byte of b) out.push(byte);
  } else if (Array.isArray(v)) {
    writeTypedVarUint(v.length, TYPE_ARR, out);
    for (const item of v) encodeVal(item, out);
  } else if (typeof v === 'number' && Number.isInteger(v)) {
    if (v >= 0) writeTypedVarUint(v, TYPE_PINT, out);
    else        writeTypedVarUint(-v, TYPE_NINT, out);
  } else if (v === null || v === undefined) {
    out.push(TYPE_SPECIAL); // SPECIAL_NULL = 0
  } else if (typeof v === 'boolean') {
    out.push(v ? (2 << 3) | TYPE_SPECIAL : (1 << 3) | TYPE_SPECIAL);
  }
}

function glEncodeCalldata(method, args = []) {
  const out = [];
  // Build sorted entries: "args" (4) < "method" (6) alphabetically
  const entries = args.length > 0
    ? [['args', args], ['method', method]]
    : [['method', method]];

  writeTypedVarUint(entries.length, TYPE_MAP, out);
  for (const [k, v] of entries) {
    const kb = _utf8enc.encode(k);
    writeKeyLen(kb.length, out);
    for (const byte of kb) out.push(byte);
    encodeVal(v, out);
  }
  return new Uint8Array(out);
}

// ── RLP encoder ───────────────────────────────────────────────────────────────
// Minimal RLP for list of [byte_string, single_byte_0]
function rlpEncodeString(bytes) {
  const len = bytes.length;
  if (len === 0) return [0x80];
  if (len < 56) return [0x80 + len, ...bytes];
  // Long string (≥56 bytes)
  const lenBytes = [];
  let l = len;
  while (l > 0) { lenBytes.unshift(l & 0xFF); l >>>= 8; }
  return [0xB7 + lenBytes.length, ...lenBytes, ...bytes];
}

function rlpWrap(calldataBytes) {
  const strEncoded = rlpEncodeString(Array.from(calldataBytes));
  const listContent = [...strEncoded, 0x00]; // 0x00 = leaderOnly false
  const len = listContent.length;
  if (len < 56) {
    return new Uint8Array([0xC0 + len, ...listContent]);
  }
  const lenBytes = [];
  let l = len;
  while (l > 0) { lenBytes.unshift(l & 0xFF); l >>>= 8; }
  return new Uint8Array([0xF7 + lenBytes.length, ...lenBytes, ...listContent]);
}

function buildCalldata(method, args = []) {
  const cd  = glEncodeCalldata(method, args);
  const rlp = rlpWrap(cd);
  return '0x' + Array.from(rlp).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Result decoder ────────────────────────────────────────────────────────────
function readTypedHeader(bytes, st) {
  const b    = bytes[st.i++];
  const type = b & 7;
  let   val  = (b >>> 3) & 0xF;
  if (b & 0x80) {
    let shift = 4;
    while (true) {
      const nb = bytes[st.i++];
      val |= (nb & 0x7F) << shift;
      shift += 7;
      if (!(nb & 0x80)) break;
    }
  }
  return { type, val };
}

function readKeyLen(bytes, st) {
  let val = 0, shift = 0;
  while (true) {
    const b = bytes[st.i++];
    val |= (b & 0x7F) << shift;
    shift += 7;
    if (!(b & 0x80)) break;
  }
  return val;
}

function decodeVal(bytes, st) {
  if (st.i >= bytes.length) return null;
  const { type, val } = readTypedHeader(bytes, st);
  switch (type) {
    case TYPE_SPECIAL:
      return val === 0 ? null : val === 1 ? false : val === 2 ? true : null;
    case TYPE_PINT: return val;
    case TYPE_NINT: return -val;
    case TYPE_STR: {
      const b = bytes.slice(st.i, st.i + val);
      st.i += val;
      return _utf8dec.decode(b);
    }
    case TYPE_BYTES: {
      const b = bytes.slice(st.i, st.i + val);
      st.i += val;
      return b;
    }
    case TYPE_ARR: {
      const arr = [];
      for (let i = 0; i < val; i++) arr.push(decodeVal(bytes, st));
      return arr;
    }
    case TYPE_MAP: {
      const map = {};
      for (let i = 0; i < val; i++) {
        const kLen  = readKeyLen(bytes, st);
        const kBytes = bytes.slice(st.i, st.i + kLen);
        st.i += kLen;
        const key   = _utf8dec.decode(kBytes);
        map[key] = decodeVal(bytes, st);
      }
      return map;
    }
    default: return null;
  }
}

function glDecodeResult(hexData) {
  if (!hexData) return null;
  const hex = hexData.startsWith('0x') ? hexData.slice(2) : hexData;
  if (!hex || hex === '00') return null;
  try {
    const bytes = new Uint8Array(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
    return decodeVal(bytes, { i: 0 });
  } catch (_) {
    return null;
  }
}

// ── JSON-RPC call ─────────────────────────────────────────────────────────────
async function glCall(address, method, args = []) {
  const data = buildCalldata(method, args);
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'gen_call',
      params: [{
        type: 'read',
        from: FROM_ADDR,
        to:   address,
        data,
      }]
    })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  const resultData = typeof json.result === 'string' ? json.result : json.result?.data;
  const decoded = glDecodeResult(resultData);
  console.log(`[GL] ${method}(${args.join(',')}) →`, String(decoded).slice(0, 100));
  return decoded;
}

// ── Field extractor ───────────────────────────────────────────────────────────
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

// ── Parsers ───────────────────────────────────────────────────────────────────
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
  const tags    = (field(r, 'Tags', 'Sources') || '').split(',').map(t => t.trim()).filter(Boolean);
  const sources = (field(r, 'Sources', 'Block') || '').split(',').map(s => s.trim()).filter(Boolean);
  return {
    id:        parseInt(id),
    title:     field(r, 'Title', 'Category'),
    category:  field(r, 'Category', 'Sentiment'),
    sentiment: field(r, 'Sentiment', 'Headline'),
    headline:  field(r, 'Headline', 'Body'),
    body:      field(r, 'Body', 'Tags'),
    tags, sources,
    block:     parseInt(field(r, 'Block') || '0'),
  };
}

function parseSummary(raw) {
  const result = {};
  if (!raw) return result;
  String(raw).split('\n').forEach(line => {
    line.split(' | ').forEach(seg => {
      const idx = seg.indexOf(': ');
      if (idx > -1) result[seg.slice(0, idx).trim()] = seg.slice(idx + 2).trim();
    });
  });
  return result;
}

// ── Loaders ───────────────────────────────────────────────────────────────────
async function loadMarkets() {
  const countRaw = await glCall(MARKETS_ADDR, 'get_market_count', []);
  const count = parseInt(String(countRaw)) || 0;
  console.log('[GL] Market count:', count);
  if (count === 0) return [];
  const ids = Array.from({ length: count }, (_, i) => String(i));
  const results = await Promise.all(ids.map(id => glCall(MARKETS_ADDR, 'get_market', [id])));
  return results.map((r, i) => parseMarket(r, ids[i])).filter(Boolean);
}

async function loadMarketSummary() {
  const raw = await glCall(MARKETS_ADDR, 'get_summary', []);
  return parseSummary(raw);
}

async function loadArticles(limit = 20) {
  const countRaw = await glCall(SIGNAL_ADDR, 'get_article_count', []);
  const count = parseInt(String(countRaw)) || 0;
  console.log('[GL] Article count:', count);
  if (count === 0) return [];
  const n = Math.min(count, limit);
  const ids = Array.from({ length: n }, (_, i) => String(count - 1 - i));
  const results = await Promise.all(ids.map(id => glCall(SIGNAL_ADDR, 'get_article', [id])));
  return results.map((r, i) => parseArticle(r, ids[i])).filter(Boolean);
}

async function loadSignalSummary() {
  const raw = await glCall(SIGNAL_ADDR, 'get_summary', []);
  return parseSummary(raw);
}

// ── User data (best-effort parse of contract response) ────────────────────────
async function loadMyPredictions(address) {
  try {
    const raw = await glCall(MARKETS_ADDR, 'get_my_predictions', [address]);
    console.log('[GL] get_my_predictions raw response →', raw);
    return String(raw || '');
  } catch (e) {
    console.error('[GL] loadMyPredictions error:', e);
    return '';
  }
}

// Extract any ethereum addresses from arbitrary text
function extractAddresses(text) {
  if (!text) return [];
  const matches = String(text).match(/0x[a-fA-F0-9]{40}/g) || [];
  return [...new Set(matches.map(a => a.toLowerCase()))];
}

// Build a predictor leaderboard from on-chain data.
// 1. Loads all markets, also logs the raw text of get_market(0) so we can see
//    whether the contract response contains bettor addresses.
// 2. Collects unique addresses found across all markets.
// 3. For each address, fetches get_my_predictions and aggregates stats.
// 4. Returns array sorted by wins desc, then total_bets desc.
async function loadPredictorRanking() {
  try {
    const countRaw = await glCall(MARKETS_ADDR, 'get_market_count', []);
    const count = parseInt(String(countRaw)) || 0;
    if (count === 0) return [];

    const ids = Array.from({ length: count }, (_, i) => String(i));
    const raws = await Promise.all(ids.map(id => glCall(MARKETS_ADDR, 'get_market', [id])));

    // Log first market raw so we can inspect what fields the contract returns
    console.log('[GL] get_market(0) raw response →', raws[0]);

    // Collect addresses from all markets
    const addrs = new Set();
    for (const r of raws) {
      extractAddresses(r).forEach(a => addrs.add(a));
    }
    console.log('[GL] Unique bettor addresses found:', addrs.size);

    if (addrs.size === 0) {
      // Contract response does not include bettor addresses — caller falls back
      return [];
    }

    const addrArr = [...addrs];
    const predictionsRaws = await Promise.all(
      addrArr.map(a => glCall(MARKETS_ADDR, 'get_my_predictions', [a]).catch(() => ''))
    );

    const ranking = addrArr.map((addr, i) => {
      const preds = parseMyPredictions(predictionsRaws[i]);
      const wins   = preds.filter(p => p.status === 'RESOLVED' && p.result && p.side === p.result).length;
      const losses = preds.filter(p => p.status === 'RESOLVED' && p.result && p.side !== p.result).length;
      const total  = preds.length;
      const wr     = (wins + losses) > 0 ? Math.round((wins * 100) / (wins + losses)) : 0;
      return {
        address: addr,
        totalBets: total,
        wins,
        losses,
        winRate: wr,
        pts: wins - losses,
      };
    });

    ranking.sort((a, b) => b.wins - a.wins || b.totalBets - a.totalBets);
    return ranking;
  } catch (e) {
    console.error('[GL] loadPredictorRanking error:', e);
    return [];
  }
}

function parseMyPredictions(raw) {
  // Best-effort: try multiple separators and patterns.
  if (!raw) return [];
  const text  = String(raw);
  // Split by newlines, pipes-between-entries, or semicolons
  const lines = text.split(/\n|;| \| (?=(?:Market|MKT|ID|#))/i)
                    .map(l => l.trim())
                    .filter(Boolean);
  const items = [];
  for (const line of lines) {
    // Market id: "Market 3", "MKT_0003", "#3", "ID: 3", or just bare digits
    const mId  = (line.match(/(?:Market|MKT|ID|#)[_# :]*(\d+)/i) || line.match(/^(\d+)\b/) || [])[1];
    const side = (line.match(/\b(YES|NO)\b/i)                                                  || [])[1];
    const stat = (line.match(/\b(OPEN|RESOLVED|EXPIRED|DISPUTED|CLAIMED)\b/i)                  || [])[1];
    const res  = (line.match(/(?:Result|Outcome|Winner|Won)[: ]+(YES|NO|DISPUTED|true|false)/i)|| [])[1];
    if (!mId || !side) continue;
    items.push({
      marketId: parseInt(mId),
      side:     side.toUpperCase(),
      status:   (stat || 'OPEN').toUpperCase(),
      result:   res ? res.toUpperCase() : '',
      raw:      line,
    });
  }
  return items;
}

// ── Write via genlayer-js SDK (igual que Arena Tarder) ────────────────────────
function _sdkClient() {
  const account = window.__glAccount || sessionStorage.getItem('gl_account');
  if (!account) throw new Error('Conecta tu wallet primero.');
  if (!window.ethereum) throw new Error('No se detectó wallet.');
  return createClient({
    chain: studionet,
    account,
    transport: { custom: window.ethereum },
  });
}

async function glWrite(address, functionName, args = []) {
  const client = _sdkClient();
  const txHash = await client.writeContract({ address, functionName, args });
  console.log(`[GL] WRITE ${functionName}(${args.map(String).join(',')}) → ${txHash}`);
  return txHash;
}

// ── Market writes ─────────────────────────────────────────────────────────────
function generateMarket(sourceUrl, searchTerms) {
  return glWrite(MARKETS_ADDR, 'generate_market', [sourceUrl, searchTerms || '']);
}

function placePrediction(marketId, side) {
  // side: 'YES' | 'NO'  — cada bet vale 1 punto fijo
  return glWrite(MARKETS_ADDR, 'place_prediction', [String(marketId), side]);
}

function resolveMarket(marketId) {
  return glWrite(MARKETS_ADDR, 'resolve_market', [String(marketId)]);
}

function reResolveMarket(marketId) {
  return glWrite(MARKETS_ADDR, 're_resolve_market', [String(marketId)]);
}

function expireMarket(marketId) {
  return glWrite(MARKETS_ADDR, 'expire_market', [String(marketId)]);
}

function claimWinnings(marketId) {
  return glWrite(MARKETS_ADDR, 'claim_winnings', [String(marketId)]);
}

function claimRefund(marketId) {
  return glWrite(MARKETS_ADDR, 'claim_refund', [String(marketId)]);
}

// ── Signal writes ─────────────────────────────────────────────────────────────
function publishArticle(category, url1, url2, url3) {
  return glWrite(SIGNAL_ADDR, 'publish_article', [category, url1, url2, url3]);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
console.log('[GL] Connecting to GenLayer Studio at', RPC_URL);

window.__glMarketsPromise       = loadMarkets().catch(e       => { console.error('[GL] Markets error:', e);     return null; });
window.__glMarketSummaryPromise = loadMarketSummary().catch(e => { console.error('[GL] MktSumm error:', e);     return null; });
window.__glArticlesPromise      = loadArticles(20).catch(e    => { console.error('[GL] Articles error:', e);    return null; });
window.__glSignalSummaryPromise = loadSignalSummary().catch(e => { console.error('[GL] SgnSumm error:', e);     return null; });
window.__glAPI = {
  // reads
  loadMarkets, loadMarketSummary, loadArticles, loadSignalSummary,
  loadMyPredictions, parseMyPredictions, loadPredictorRanking,
  // writes — markets
  generateMarket, placePrediction, resolveMarket, reResolveMarket,
  expireMarket, claimWinnings, claimRefund,
  // writes — signal
  publishArticle,
};

document.dispatchEvent(new CustomEvent('glReady'));
