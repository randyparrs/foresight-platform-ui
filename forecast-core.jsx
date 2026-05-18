/* global React */

const { useMemo } = React;

// =============================================================
//  FORECAST CORE — Holographic AI oracle orb
//
//  Layers (back → front):
//   - Aura rings
//   - Outer rotating tick ring
//   - Probability arc (0→100) ring
//   - Mid node ring (active markets)
//   - Inner rotating digital ring
//   - Glass orb (radial gradient + rim)
//   - Probability sine wave inside orb
//   - Center label (67% YES, category)
// =============================================================

const ForecastCore = ({ pctYes = 67, category = "CRYPTO" }) => {
  const cx = 500, cy = 500;

  // 72 outer ticks (every 5°), every 3rd is longer
  const outerTicks = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => ({
        a: i * 5,
        long: i % 3 === 0,
        bright: i % 9 === 0,
      })),
    []
  );

  // Probability arc 0-100% positions (240° sweep from -120 to +120)
  const probTicks = useMemo(() => {
    const arr = [];
    for (let p = 0; p <= 100; p += 10) {
      const angle = -120 + (p / 100) * 240; // -120 → 120
      arr.push({ p, angle });
    }
    return arr;
  }, []);

  // 24 inner nodes
  const innerNodes = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        a: i * 15,
        active: [0, 2, 5, 9, 11, 14, 17, 20].includes(i),
      })),
    []
  );

  const polarTo = (cx, cy, r, deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  // Probability needle position
  const needleAngle = -120 + (pctYes / 100) * 240;
  const needleEnd = polarTo(cx, cy, 360, needleAngle);

  // Sine wave inside orb
  const wavePath = useMemo(() => {
    const w = 240, h = 50;
    let d = `M ${cx - w / 2} ${cy + 30}`;
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const x = cx - w / 2 + t * w;
      const y = cy + 30 + Math.sin(t * Math.PI * 3) * h * 0.55;
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }, []);

  return (
    <svg className="forecast-core" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="orb-core" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#2d4670" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#0c1a30" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#05080f" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="orb-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(76, 232, 230, 0.55)" />
          <stop offset="60%" stopColor="rgba(76, 232, 230, 0.10)" />
          <stop offset="100%" stopColor="rgba(76, 232, 230, 0)" />
        </radialGradient>
        <radialGradient id="orb-violet-glow" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="rgba(138, 124, 255, 0.0)" />
          <stop offset="70%" stopColor="rgba(138, 124, 255, 0.0)" />
          <stop offset="100%" stopColor="rgba(138, 124, 255, 0.45)" />
        </radialGradient>
        <linearGradient id="ring-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#4ce8e6" />
          <stop offset="100%" stopColor="#8a7cff" />
        </linearGradient>
        <linearGradient id="wave-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#4ce8e6" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#4ce8e6" stopOpacity="1" />
          <stop offset="100%" stopColor="#8a7cff" stopOpacity="0.2" />
        </linearGradient>
        <filter id="orb-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="line-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer aura */}
      <circle cx={cx} cy={cy} r="495" fill="url(#orb-glow)" opacity="0.35" />
      <circle cx={cx} cy={cy} r="495" fill="url(#orb-violet-glow)" opacity="0.5" />

      {/* === Outermost faint ring === */}
      <circle cx={cx} cy={cy} r="475" fill="none" stroke="#27314f" strokeWidth="1" opacity="0.6" />

      {/* === Outer rotating tick ring === */}
      <g className="ring-rot-cw" style={{ transformOrigin: "500px 500px", animation: "spin-cw 60s linear infinite" }}>
        <circle cx={cx} cy={cy} r="440" fill="none" stroke="rgba(76,232,230,0.25)" strokeWidth="1" />
        {outerTicks.map((t, i) => {
          const inner = t.long ? 425 : 432;
          const outer = 440;
          const p1 = polarTo(cx, cy, inner, t.a);
          const p2 = polarTo(cx, cy, outer, t.a);
          return (
            <line
              key={i}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={t.bright ? "#4ce8e6" : "rgba(76,232,230,0.45)"}
              strokeWidth={t.bright ? 2 : 1}
              opacity={t.bright ? 0.95 : 0.6}
              filter={t.bright ? "url(#line-glow)" : undefined}
            />
          );
        })}
        {/* Cardinal labels */}
        {[
          { a: 0, t: "N" },
          { a: 90, t: "E" },
          { a: 180, t: "S" },
          { a: 270, t: "W" },
        ].map((c) => {
          const p = polarTo(cx, cy, 460, c.a);
          return (
            <text
              key={c.t}
              x={p.x}
              y={p.y}
              fontFamily="JetBrains Mono, monospace"
              fontSize="14"
              fill="#4ce8e6"
              textAnchor="middle"
              dominantBaseline="middle"
              opacity="0.7"
            >
              {c.t}
            </text>
          );
        })}
      </g>

      {/* === Probability arc ring (240° sweep) === */}
      <g>
        {/* Background arc */}
        <path
          d={`M ${polarTo(cx, cy, 380, -120).x} ${polarTo(cx, cy, 380, -120).y}
              A 380 380 0 1 1 ${polarTo(cx, cy, 380, 120).x} ${polarTo(cx, cy, 380, 120).y}`}
          fill="none"
          stroke="#1a2238"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Filled arc up to pctYes */}
        <path
          d={`M ${polarTo(cx, cy, 380, -120).x} ${polarTo(cx, cy, 380, -120).y}
              A 380 380 0 ${needleAngle - -120 > 180 ? 1 : 0} 1
              ${needleEnd.x} ${needleEnd.y}`}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="14"
          strokeLinecap="round"
          filter="url(#line-glow)"
        />
        {/* Probability labels */}
        {probTicks.map((t) => {
          const inner = polarTo(cx, cy, 360, t.angle);
          const outer = polarTo(cx, cy, 388, t.angle);
          const labelP = polarTo(cx, cy, 405, t.angle);
          const major = t.p % 25 === 0;
          return (
            <g key={t.p}>
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#27314f"
                strokeWidth={major ? 1.5 : 1}
              />
              {major && (
                <text
                  x={labelP.x}
                  y={labelP.y}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="11"
                  fill="#a5adc8"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {t.p}
                </text>
              )}
            </g>
          );
        })}
        {/* Needle marker */}
        <circle cx={needleEnd.x} cy={needleEnd.y} r="11" fill="#0a1224" stroke="#4ce8e6" strokeWidth="2" />
        <circle cx={needleEnd.x} cy={needleEnd.y} r="4" fill="#4ce8e6" filter="url(#line-glow)" />
      </g>

      {/* === Mid node ring === */}
      <g className="ring-rot-ccw" style={{ transformOrigin: "500px 500px", animation: "spin-ccw 90s linear infinite" }}>
        <circle cx={cx} cy={cy} r="305" fill="none" stroke="rgba(138,124,255,0.18)" strokeWidth="1" strokeDasharray="2 4" />
        {innerNodes.map((n, i) => {
          const p = polarTo(cx, cy, 305, n.a);
          return (
            <g key={i}>
              {n.active && <circle cx={p.x} cy={p.y} r="9" fill="rgba(138,124,255,0.15)" />}
              <circle
                cx={p.x}
                cy={p.y}
                r={n.active ? 4.5 : 2.5}
                fill={n.active ? "#8a7cff" : "#424b66"}
                filter={n.active ? "url(#line-glow)" : undefined}
              />
            </g>
          );
        })}
      </g>

      {/* === Inner rotating digital ring === */}
      <g className="ring-rot-cw-slow" style={{ transformOrigin: "500px 500px", animation: "spin-cw 30s linear infinite" }}>
        <circle cx={cx} cy={cy} r="250" fill="none" stroke="rgba(76,232,230,0.4)" strokeWidth="1.5" strokeDasharray="20 6 4 6" />
        <circle cx={cx} cy={cy} r="232" fill="none" stroke="rgba(76,232,230,0.15)" strokeWidth="0.8" />
        {/* 8 markers */}
        {Array.from({ length: 8 }, (_, i) => i * 45).map((a, i) => {
          const p = polarTo(cx, cy, 250, a);
          return (
            <rect
              key={i}
              x={p.x - 4}
              y={p.y - 4}
              width="8"
              height="8"
              fill="#4ce8e6"
              transform={`rotate(45 ${p.x} ${p.y})`}
              filter="url(#line-glow)"
            />
          );
        })}
      </g>

      {/* === Orb body === */}
      <circle cx={cx} cy={cy} r="200" fill="#05080f" />
      <circle cx={cx} cy={cy} r="200" fill="url(#orb-core)" />
      <circle cx={cx} cy={cy} r="200" fill="url(#orb-violet-glow)" />
      {/* Rim */}
      <circle cx={cx} cy={cy} r="200" fill="none" stroke="#4ce8e6" strokeWidth="1.5" opacity="0.85" filter="url(#line-glow)" />
      <circle cx={cx} cy={cy} r="194" fill="none" stroke="rgba(76,232,230,0.25)" strokeWidth="1" />
      {/* Top specular */}
      <ellipse cx={cx - 30} cy={cy - 110} rx="80" ry="22" fill="rgba(255,255,255,0.12)" />

      {/* === Probability wave inside orb === */}
      <g style={{ animation: "wave-shift 4s ease-in-out infinite alternate" }}>
        <path d={wavePath} fill="none" stroke="url(#wave-grad)" strokeWidth="2.2" strokeLinecap="round" filter="url(#line-glow)" />
        {/* mirror wave faded */}
        <path
          d={wavePath}
          fill="none"
          stroke="#8a7cff"
          strokeWidth="1.2"
          opacity="0.35"
          transform="translate(0, 6)"
        />
      </g>

      {/* === Center label === */}
      <g style={{ animation: "subtle-bob 5s ease-in-out infinite alternate" }}>
        <text
          x={cx}
          y={cy - 30}
          fontFamily="JetBrains Mono, monospace"
          fontSize="14"
          fill="#a5adc8"
          textAnchor="middle"
          letterSpacing="0.3em"
        >
          PROBABILITY
        </text>
        <text
          x={cx}
          y={cy + 28}
          fontFamily="Space Grotesk, sans-serif"
          fontSize="92"
          fontWeight="700"
          fill="#eef1fa"
          textAnchor="middle"
          letterSpacing="-0.02em"
          style={{ filter: "drop-shadow(0 0 20px rgba(76, 232, 230, 0.6))" }}
        >
          {pctYes}
          <tspan fontSize="48" fill="#4ce8e6">%</tspan>
        </text>
        <text
          x={cx}
          y={cy + 68}
          fontFamily="JetBrains Mono, monospace"
          fontSize="13"
          fill="#5cffa1"
          textAnchor="middle"
          letterSpacing="0.4em"
          fontWeight="700"
        >
          YES · {category}
        </text>
      </g>

      {/* Tiny rotating glyph at very center bottom inside orb */}
      <g
        style={{ transformOrigin: "500px 600px", animation: "spin-cw 16s linear infinite" }}
        opacity="0.45"
      >
        <circle cx={cx} cy={cy + 100} r="14" fill="none" stroke="#4ce8e6" strokeWidth="1" />
        <line x1={cx - 10} y1={cy + 100} x2={cx + 10} y2={cy + 100} stroke="#4ce8e6" strokeWidth="1" />
        <line x1={cx} y1={cy + 90} x2={cx} y2={cy + 110} stroke="#4ce8e6" strokeWidth="1" />
      </g>

      {/* Keyframes (inline so the SVG ships standalone) */}
      <style>{`
        @keyframes spin-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spin-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes wave-shift {
          from { transform: translateY(0); }
          to   { transform: translateY(-4px); }
        }
        @keyframes subtle-bob {
          from { transform: translateY(0); }
          to   { transform: translateY(-3px); }
        }
      `}</style>
    </svg>
  );
};

Object.assign(window, { ForecastCore });
