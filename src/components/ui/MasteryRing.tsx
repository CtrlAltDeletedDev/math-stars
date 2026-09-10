interface Props {
  /** 0..1 */
  fill: number;
  size?: number;
  thickness?: number;
  /** Drawn in the middle — usually the topic emoji. */
  children: React.ReactNode;
  /** The rank glyph, badged bottom-right. Omitted before she has played. */
  rank?: string;
  color?: string;
}

// A ring instead of a progress bar, and never a padlock.
//
// It has no "complete" state on purpose: see engine/mastery.ts. The arc is drawn
// from the top and clockwise, because that is the direction a child expects a
// thing to fill.

export default function MasteryRing({
  fill,
  size = 84,
  thickness = 7,
  children,
  rank,
  color = '#FFD54F',
}: Props) {
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, fill));

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(size * 0.42),
          lineHeight: 1,
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>
      {rank && (
        <div
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            fontSize: Math.round(size * 0.26),
            lineHeight: 1,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))',
          }}
        >
          {rank}
        </div>
      )}
    </div>
  );
}
