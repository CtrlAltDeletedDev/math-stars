import { QuestionVisual as VisualSpec } from '@/types';

// Drawn illustrations for questions where a picture is the explanation.
// "1/4" is meaningless to a six-year-old until she has seen a quarter of a pizza.

const SHADE = '#FF8A3D';
const EMPTY = '#F1F4F8';
const LINE = '#4A5766';

function FractionCircle({ numerator, denominator }: { numerator: number; denominator: number }) {
  const r = 64;
  const c = 76;
  const slice = (i: number) => {
    const a0 = (i / denominator) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / denominator) * 2 * Math.PI - Math.PI / 2;
    const x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0);
    const x1 = c + r * Math.cos(a1), y1 = c + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${c} ${c} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
  };

  return (
    <svg width="152" height="152" viewBox="0 0 152 152" role="img" aria-label={`${numerator} of ${denominator} parts shaded`}>
      {Array.from({ length: denominator }, (_, i) => (
        <path key={i} d={slice(i)} fill={i < numerator ? SHADE : EMPTY} stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function FractionBar({ numerator, denominator }: { numerator: number; denominator: number }) {
  const w = 260, h = 76, pad = 3;
  const cell = (w - pad * 2) / denominator;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${numerator} of ${denominator} parts shaded`}>
      {Array.from({ length: denominator }, (_, i) => (
        <rect
          key={i}
          x={pad + i * cell}
          y={pad}
          width={cell}
          height={h - pad * 2}
          fill={i < numerator ? SHADE : EMPTY}
          stroke={LINE}
          strokeWidth="3"
        />
      ))}
    </svg>
  );
}

const COIN_STYLE: Record<number, { fill: string; label: string; size: number }> = {
  1: { fill: '#C87941', label: '1¢', size: 40 },
  5: { fill: '#B8BDC4', label: '5¢', size: 48 },
  10: { fill: '#A8ADB4', label: '10¢', size: 36 },
  25: { fill: '#9BA1A8', label: '25¢', size: 56 },
};

function Coins({ coins }: { coins: number[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center', maxWidth: 320 }}>
      {coins.map((value, i) => {
        const s = COIN_STYLE[value] ?? COIN_STYLE[1];
        return (
          <div
            key={i}
            style={{
              width: s.size, height: s.size, borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, #fff6, ${s.fill})`,
              border: `2.5px solid ${LINE}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Nunito', fontWeight: 800,
              fontSize: s.size * 0.3, color: '#2D3436',
              boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
            }}
          >
            {s.label}
          </div>
        );
      })}
    </div>
  );
}

/** Every option drawn, so comparing is a thing she can see rather than guess. */
function FractionSet({ fractions }: { fractions: [number, number][] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {fractions.map(([num, den], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 17, color: LINE, minWidth: 34, textAlign: 'right' }}>
            {num}/{den}
          </span>
          <svg width="180" height="42" viewBox="0 0 180 42" role="img" aria-label={`${num} of ${den} parts shaded`}>
            {Array.from({ length: den }, (_, k) => {
              const cell = 174 / den;
              return (
                <rect
                  key={k}
                  x={3 + k * cell}
                  y={3}
                  width={cell}
                  height={36}
                  fill={k < num ? SHADE : EMPTY}
                  stroke={LINE}
                  strokeWidth="2.5"
                />
              );
            })}
          </svg>
        </div>
      ))}
    </div>
  );
}

export default function QuestionVisual({ visual }: { visual: VisualSpec }) {
  if (visual.kind === 'coins') return <Coins coins={visual.coins} />;
  if (visual.kind === 'fractionSet') return <FractionSet fractions={visual.fractions} />;
  return visual.shape === 'circle'
    ? <FractionCircle numerator={visual.numerator} denominator={visual.denominator} />
    : <FractionBar numerator={visual.numerator} denominator={visual.denominator} />;
}
