export default function BraceletAnimation() {
  const C = 100;
  const R = 67;
  const GEM_COUNT = 10;

  const gems = Array.from({ length: GEM_COUNT }, (_, i) => {
    const a = (i / GEM_COUNT) * 2 * Math.PI - Math.PI / 2;
    return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
  });

  return (
    <div
      style={{
        animation: 'bracelet-spin 10s linear infinite',
        display: 'inline-block',
        filter:
          'drop-shadow(0 32px 40px rgba(0,0,0,0.45)) drop-shadow(0 0 28px rgba(212,165,165,0.18))',
      }}
    >
      <svg
        viewBox="0 0 200 200"
        width="240"
        height="240"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="bGem" cx="30%" cy="25%" r="65%">
            <stop offset="0%" stopColor="#f5d0d0" />
            <stop offset="45%" stopColor="#D4A5A5" />
            <stop offset="100%" stopColor="#9a6060" />
          </radialGradient>

          <linearGradient id="bBand" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="35%" stopColor="#111111" />
            <stop offset="65%" stopColor="#1e1e1e" />
            <stop offset="100%" stopColor="#080808" />
          </linearGradient>

          <filter id="bGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* depth shadow ring */}
        <circle
          cx={C + 1}
          cy={C + 2}
          r={R}
          fill="none"
          stroke="rgba(0,0,0,0.55)"
          strokeWidth="26"
        />

        {/* main band */}
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="url(#bBand)"
          strokeWidth="22"
        />

        {/* top-arc sheen */}
        <path
          d="M 42 67 A 67 67 0 0 1 158 67"
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="22"
        />

        {/* bottom-arc sheen (near side when tilted) */}
        <path
          d="M 158 134 A 67 67 0 0 1 42 134"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="22"
        />

        {/* outer rim */}
        <circle
          cx={C}
          cy={C}
          r={R + 11.5}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />

        {/* inner rim */}
        <circle
          cx={C}
          cy={C}
          r={R - 11.5}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />

        {/* gems */}
        {gems.map(({ x, y }, i) => (
          <g key={i} filter="url(#bGlow)">
            <circle cx={x} cy={y} r={7.5} fill="url(#bGem)" />
            <circle cx={x - 2.5} cy={y - 2.5} r={2.2} fill="white" opacity={0.65} />
          </g>
        ))}
      </svg>
    </div>
  );
}
