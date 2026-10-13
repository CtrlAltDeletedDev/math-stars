import { PointerEvent, useRef, useState } from 'react';

// "Show your work!" — a number line she can actually hop along.
//
// The class worksheet prints a 0–20 line under every take-away story and expects
// her to draw the hops. On paper her hops went the wrong way (from 14 forward to
// 20, for "14 balls, 6 are soccer balls") and nobody saw it until the sheet came
// home marked. Here the hops are drawn as she makes them, forward in one colour
// and back in another, and the line says out loud which way she went.
//
// It is scratch paper, not a second way to answer: nothing she does here is
// scored, and it starts blank so it never hands her the answer.

interface Props {
  max: number;
  /** Where she starts, already placed. Lessons set it; questions leave it blank. */
  initialStart?: number;
}

const PAD = 16;
const UNIT = 22;
const LINE_Y = 74;
const FORWARD = '#2E9E5B';
const BACK = '#F07C2A';
const INK = '#4A5766';

export default function HopLine({ max, initialStart }: Props) {
  const [start, setStart] = useState<number | null>(initialStart ?? null);
  const [path, setPath] = useState<number[]>([]); // every number landed on, one hop at a time
  const svgRef = useRef<SVGSVGElement>(null);

  const width = PAD * 2 + UNIT * max;
  const xOf = (n: number) => PAD + n * UNIT;
  const here = path.length ? path[path.length - 1] : start;

  function numberAt(e: PointerEvent<SVGSVGElement>): number | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const n = Math.round((x - PAD) / UNIT);
    return Math.max(0, Math.min(max, n));
  }

  function tap(e: PointerEvent<SVGSVGElement>) {
    const n = numberAt(e);
    if (n === null) return;
    if (start === null) { setStart(n); return; }
    if (n === here) return;
    // A tap further along fills in every single hop on the way, because the
    // hops are what she is meant to count.
    const step = n > here! ? 1 : -1;
    const hops: number[] = [];
    for (let k = here! + step; k !== n + step; k += step) hops.push(k);
    setPath((p) => [...p, ...hops]);
  }

  function undo() {
    if (path.length) setPath((p) => p.slice(0, -1));
    else setStart(null);
  }

  const forward = path.filter((n, i) => n > (i === 0 ? start! : path[i - 1])).length;
  const back = path.length - forward;
  // The colour of where she is now: the direction of her last hop.
  const hereColour = path.length < 1
    ? INK
    : path[path.length - 1] > (path.length > 1 ? path[path.length - 2] : start!) ? FORWARD : BACK;

  let status: string;
  if (start === null) status = 'Tap the number to start on';
  else if (!path.length) status = `Start on ${start}. Now tap to hop!`;
  else {
    const hops = (n: number) => `${n} ${n === 1 ? 'hop' : 'hops'}`;
    const parts = [];
    if (forward) parts.push(`${hops(forward)} forward`);
    if (back) parts.push(`${hops(back)} back`);
    status = `${parts.join(', ')} · on ${here}`;
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center' }}>
        <div
          aria-live="polite"
          style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: INK, textAlign: 'center', flex: 1 }}
        >
          {status}
        </div>
        {start !== null && (
          <button
            onClick={undo}
            aria-label="Undo a hop"
            style={{
              minWidth: 44, height: 44, borderRadius: 12, border: 'none', background: '#EEF4FF',
              fontSize: 20, cursor: 'pointer', flexShrink: 0,
            }}
          >
            ↶
          </button>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} 100`}
        role="img"
        aria-label={`Number line from 0 to ${max}`}
        onPointerDown={tap}
        style={{ width: '100%', maxWidth: 620, touchAction: 'manipulation', cursor: 'pointer', userSelect: 'none' }}
      >
        {/* The whole height is the hit area: she taps near a number, not on a 2px tick. */}
        <rect x="0" y="0" width={width} height="100" fill="transparent" />

        {path.map((n, i) => {
          const from = i === 0 ? start! : path[i - 1];
          const x1 = xOf(from), x2 = xOf(n);
          const mid = (x1 + x2) / 2;
          return (
            <path
              key={i}
              d={`M ${x1} ${LINE_Y - 4} Q ${mid} ${LINE_Y - 40} ${x2} ${LINE_Y - 4}`}
              fill="none"
              stroke={n > from ? FORWARD : BACK}
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}

        <line x1={PAD - 8} y1={LINE_Y} x2={width - PAD + 8} y2={LINE_Y} stroke={INK} strokeWidth="2.5" />
        {Array.from({ length: max + 1 }, (_, n) => (
          <g key={n}>
            <line x1={xOf(n)} y1={LINE_Y - 7} x2={xOf(n)} y2={LINE_Y + 7} stroke={INK} strokeWidth={n % 5 === 0 ? 2.5 : 1.5} />
            <text
              x={xOf(n)}
              y={LINE_Y + 22}
              textAnchor="middle"
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontWeight: n === here || n === start ? 800 : 700,
                fontSize: n >= 10 ? 13 : 15,
                fill: n === here ? hereColour : INK,
              }}
            >
              {n}
            </text>
          </g>
        ))}

        {start !== null && (
          <circle cx={xOf(start)} cy={LINE_Y + 18} r="10" fill="none" stroke={INK} strokeWidth="2" />
        )}
        {here !== null && (
          <circle cx={xOf(here)} cy={LINE_Y} r="6" fill={hereColour} />
        )}
      </svg>
    </div>
  );
}
