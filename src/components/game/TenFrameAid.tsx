import { X } from 'lucide-react';

// Ten frames: the picture first-grade classes use for every fact within 20.
//
// This replaces a loose row of dots. Dots could be counted, and that was all
// they were good for: 8 + 5 as thirteen dots in a heap teaches counting from
// one, which is the habit fact practice is meant to replace. In a ten frame the
// structure does the work. 7 is "5 and 2 more" at a glance; 8 + 5 fills the
// first frame with 2 of the 5 and spills 3 into the second, which *is* the
// make-a-ten strategy; 9 + anything shows the one empty square.
//
// Counters fill the way children are taught to fill them: top row left to
// right, then the bottom row. Subtraction is one set with some crossed out
// from the end, never two groups (that is the picture for adding).

interface Props {
  prompt: string;
  type: string;
}

const FIRST = '#2EAD9F';
const SECOND = '#3D6FD9';
const CROSS = '#E5484D';
const FRAME = '#4A5766';
const EMPTY = '#F4F6FA';
const CELL = 30;
const GAP = 4;

export function parseFact(prompt: string, type: string): [number, number] | null {
  if (type !== 'addition' && type !== 'subtraction') return null;
  const m = prompt.match(/^(\d+)\s*[+\-−]\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2])];
}

/**
 * Does this question get ten frames? Facts whose parts are both ten or less
 * and whose total fits in two frames. Bigger numbers get the hop line instead
 * (see QuestionCard), which is how her class works "14 − 6".
 */
export function hasTenFrames(prompt: string, type: string): boolean {
  const f = parseFact(prompt, type);
  if (!f) return false;
  const [a, b] = f;
  if (a > 10 || b > 10) return false;
  return type === 'subtraction' ? a <= 10 : a + b <= 20;
}

type Cell = { fill: 'first' | 'second' | null; crossed: boolean };

function Frame({ cells }: { cells: Cell[] }) {
  const w = CELL * 5 + GAP * 6;
  const h = CELL * 2 + GAP * 3;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden style={{ maxWidth: '100%' }}>
      <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx="8" fill="#fff" stroke={FRAME} strokeWidth="3" />
      {cells.map((c, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const x = GAP + col * (CELL + GAP);
        const y = GAP + row * (CELL + GAP);
        const cx = x + CELL / 2;
        const cy = y + CELL / 2;
        return (
          <g key={i}>
            <rect x={x} y={y} width={CELL} height={CELL} rx="5" fill={EMPTY} />
            {c.fill && (
              <circle
                cx={cx} cy={cy} r={CELL / 2 - 3}
                fill={c.fill === 'first' ? FIRST : SECOND}
                opacity={c.crossed ? 0.3 : 1}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function TenFrameAid({ prompt, type }: Props) {
  if (!hasTenFrames(prompt, type)) return null;
  const [a, b] = parseFact(prompt, type)!;
  const total = type === 'subtraction' ? a : a + b;
  const frames = total > 10 ? 2 : 1;

  const cells: Cell[] = Array.from({ length: frames * 10 }, (_, i) => {
    if (type === 'subtraction') return { fill: i < a ? 'first' : null, crossed: i < a && i >= a - b };
    return { fill: i < a ? 'first' : i < a + b ? 'second' : null, crossed: false };
  });

  const label = type === 'subtraction'
    ? `${a} counters, ${b} crossed out`
    : `${a} counters and ${b} more counters in ten frames`;

  return (
    <div role="img" aria-label={label} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
      {Array.from({ length: frames }, (_, f) => (
        <div key={f} style={{ position: 'relative' }}>
          <Frame cells={cells.slice(f * 10, f * 10 + 10)} />
          {/* The crosses sit over the SVG so they stay crisp at any size. */}
          {cells.slice(f * 10, f * 10 + 10).map((c, i) => c.crossed && (
            <X
              key={i}
              size={CELL - 4}
              strokeWidth={3.5}
              color={CROSS}
              aria-hidden
              style={{
                position: 'absolute',
                left: GAP + (i % 5) * (CELL + GAP) + 2,
                top: GAP + Math.floor(i / 5) * (CELL + GAP) + 2,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
