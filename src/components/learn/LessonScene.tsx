import { useEffect, useState } from 'react';
import { Scene, CompareRow } from '@/data/learn';
import HopLine from '@/components/game/HopLine';
import { Scale } from 'lucide-react';
import { BondScene, CoinsScene, GroupsScene, ObjectsScene, PairsScene, TensOnesScene } from './countScenes';
import { ClockScene, FractionScene, LengthsScene, PatternScene, ShapeScene, WeighScene } from './shapeScenes';

// The pictures lessons are made of. Each one is drawn from a few numbers in
// src/data/learn.ts, so a lesson is data and a new one needs no new drawing.
//
// Everything here is big, high-contrast and sparse on purpose: it is what she
// looks at while the guide talks, and a busy picture competes with the voice.

const INK = '#3A4652';
const RED = '#FF6B6B';
const BLUE = '#45B7D1';
const GOLD = '#FFC93C';
const FORWARD = '#2E9E5B';
const BACK = '#F07C2A';
const FONT = 'Nunito, sans-serif';

// --- Number line -----------------------------------------------------------

const PAD = 16;
const UNIT = 22;
const LINE_Y = 72;
const HOP_MS = 700;
/** The most numbers a line shows one tick each; wider, it ticks once per hop. */
const MOST_NUMBERS = 14;
/** Room for one hop when the line ticks once per hop; a bit less when there are many. */
const HOP_UNIT = 30;
const HOP_UNIT_CROWDED = 26;
/** More hops than this and their numbers no longer fit side by side on a phone. */
const CROWDED_TICKS = 12;

function NumberLineScene({ max, start, hops = 0, dir = 1, animate = false, step = 1 }: {
  max: number; start: number; hops?: number; dir?: 1 | -1; animate?: boolean; step?: number;
}) {
  // How many hops are drawn so far. Animated scenes count up on a timer so the
  // hops land roughly as the guide says each number.
  const [shown, setShown] = useState(animate ? 0 : hops);
  useEffect(() => {
    if (!animate) return;
    setShown(0);
    let n = 0;
    const id = setInterval(() => {
      n++;
      setShown(n);
      if (n >= hops) clearInterval(id);
    }, HOP_MS);
    return () => clearInterval(id);
  }, [animate, hops, start, dir, step]);

  // Zoom to where the hops happen, at least 11 numbers wide. On a phone the
  // whole 0–20 line is too small to watch; her homework line is still what the
  // "try" steps use, so she sees both.
  const end = start + dir * hops * step;
  let lo = Math.max(0, Math.min(start, end) - 2);
  let hi = Math.min(max, Math.max(start, end) + 2);
  while (hi - lo < 10 && (lo > 0 || hi < max)) {
    if (hi < max) hi++;
    if (hi - lo < 10 && lo > 0) lo--;
  }
  // Counting by 2s, 5s or 10s can cover more numbers than fit one tick each
  // (0 to 100 by 10s). Then the line ticks only where a hop can land: start,
  // start ± one hop and so on, which is the multiples of the step when she
  // starts on one. One hop either side, at least 6 hops wide, and every hop
  // still lands on a numbered tick.
  let every = 1;
  if (step > 1 && hi - lo > MOST_NUMBERS) {
    every = step;
    lo = Math.min(start, end);
    hi = Math.max(start, end);
    if (lo - step >= 0) lo -= step;
    if (hi + step <= max) hi += step;
    while ((hi - lo) / step < 6 && (lo - step >= 0 || hi + step <= max)) {
      if (hi + step <= max) hi += step;
      if ((hi - lo) / step < 6 && lo - step >= 0) lo -= step;
    }
  }
  const ticks = (hi - lo) / every;
  // More hops than a phone can number side by side (0 to 100 by 5s): the
  // numbers under the line take turns between two rows, and everything is
  // drawn bigger, because the whole line is shrunk to fit.
  const crowded = every > 1 && ticks > CROWDED_TICKS;
  const unit = every === 1 ? UNIT : crowded ? HOP_UNIT_CROWDED : HOP_UNIT;
  const pad = crowded ? 24 : PAD; // room for the ring round the start
  const width = pad * 2 + unit * ticks;
  // Room under the line for a ringed 100; a line of single steps keeps its old size.
  const height = crowded ? 128 : step > 1 ? 106 : 100;
  // A long hop (one 10 across ten numbers) gets a taller arc, so it reads as a hop, not a bridge.
  const lift = every === 1 ? Math.min(42 + (step - 1) * 4, 62) : 42;
  const x = (n: number) => pad + ((n - lo) / every) * unit;
  const labelY = (n: number) => LINE_Y + (crowded && ((n - lo) / every) % 2 === 1 ? 44 : 22);
  const here = start + dir * shown * step;
  const colour = dir === 1 ? FORWARD : BACK;
  // Counting by 2s, every number she has landed on stays lit: 2, 4, 6.
  const landed = (n: number) => {
    const gone = (n - start) * dir;
    return step > 1 && gone > 0 && gone % step === 0 && gone / step <= shown;
  };
  const labelSize = (n: number) => (crowded ? 20 : step > 1 && n >= 100 ? 12 : n >= 10 ? 13 : 15);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 560 }} role="img"
         aria-label={`Number line: start on ${start}${hops
           ? `, ${hops} hops${step > 1 ? ` of ${step}` : ''} ${dir === 1 ? 'forward' : 'back'}${step > 1 ? `, landing on ${end}` : ''}`
           : ''}`}>
      {Array.from({ length: shown }, (_, i) => {
        const from = start + dir * i * step;
        const to = from + dir * step;
        const mid = (x(from) + x(to)) / 2;
        return (
          <g key={i} className="anim-pop" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <path d={`M ${x(from)} ${LINE_Y - 4} Q ${mid} ${LINE_Y - lift} ${x(to)} ${LINE_Y - 4}`}
                  fill="none" stroke={colour} strokeWidth="3.5" strokeLinecap="round" />
            {/* Number each hop: counting the hops is the whole skill. */}
            <text x={mid} y={LINE_Y - 9 - lift / 2} textAnchor="middle"
                  style={{ fontFamily: FONT, fontWeight: 800, fontSize: crowded ? 19 : 12, fill: colour }}>{i + 1}</text>
          </g>
        );
      })}
      <line x1={pad - 8} y1={LINE_Y} x2={width - pad + 8} y2={LINE_Y} stroke={INK} strokeWidth="2.5" />
      {Array.from({ length: ticks + 1 }, (_, i) => lo + i * every).map((n) => (
        <g key={n}>
          <line x1={x(n)} y1={LINE_Y - 7} x2={x(n)} y2={labelY(n) === LINE_Y + 22 ? LINE_Y + 7 : LINE_Y + 26} stroke={INK}
                strokeWidth={every === 1 ? (n % 5 === 0 ? 2.5 : 1.5) : n % 10 === 0 ? 2.5 : 2} />
          <text x={x(n)} y={labelY(n)} textAnchor="middle"
                style={{
                  fontFamily: FONT, fontWeight: n === here || n === start || landed(n) ? 800 : 700,
                  fontSize: labelSize(n),
                  fill: (n === here && shown > 0) || landed(n) ? colour : INK,
                }}>{n}</text>
        </g>
      ))}
      <circle cx={x(start)} cy={labelY(start) - (crowded ? 7 : 4)} r={crowded ? 19 : step > 1 && start >= 100 ? 14 : 11}
              fill="none" stroke={INK} strokeWidth="2" />
      <circle cx={x(here)} cy={LINE_Y} r="6.5" fill={shown > 0 ? colour : INK} />
    </svg>
  );
}

// --- Ten frame ---------------------------------------------------------------

function Counter({ colour, emoji, size }: { colour: string; emoji?: string; size: number }) {
  if (emoji) return <span style={{ fontSize: size * 0.72, lineHeight: 1 }}>{emoji}</span>;
  return <div style={{ width: size * 0.7, height: size * 0.7, borderRadius: '50%', background: colour, boxShadow: '0 2px 3px rgba(0,0,0,0.2)' }} />;
}

function TenFrameScene({ first, second = 0, outside = 0, emoji, askEmpty }: {
  first: number; second?: number; outside?: number; emoji?: string; askEmpty?: boolean;
}) {
  const size = 50;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(5, ${size}px)`, gridAutoRows: `${size}px`,
        border: `3px solid ${INK}`, borderRadius: 6, background: '#FFFDF5',
      }}>
        {Array.from({ length: 10 }, (_, i) => {
          const filled = i < first ? 'a' : i < first + second ? 'b' : null;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRight: i % 5 !== 4 ? `2px solid ${INK}55` : undefined,
              borderBottom: i < 5 ? `2px solid ${INK}55` : undefined,
              background: !filled && askEmpty ? '#FFF3B0' : undefined,
            }}>
              {filled === 'a' && <Counter colour={RED} emoji={emoji} size={size} />}
              {filled === 'b' && <div className="anim-pop"><Counter colour={BLUE} emoji={emoji} size={size} /></div>}
              {!filled && askEmpty && <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: '#C9A400' }}>?</span>}
            </div>
          );
        })}
      </div>
      {outside > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {Array.from({ length: outside }, (_, i) => <Counter key={i} colour={BLUE} emoji={emoji} size={44} />)}
        </div>
      )}
    </div>
  );
}

// --- Part-whole bar ------------------------------------------------------------

function PartWholeScene({ whole, parts, labels }: {
  whole: number | null; parts: [number | null, number | null]; labels: [string, string, string];
}) {
  // Widths from whatever is known, so the unknown part still *looks* like a part.
  const total = whole ?? (parts[0] ?? 0) + (parts[1] ?? 0);
  const a = parts[0] ?? total - (parts[1] ?? 0);
  const share = total > 0 ? Math.min(0.85, Math.max(0.15, a / total)) : 0.5;
  const show = (n: number | null) => (n === null ? '?' : String(n));
  const box = (bg: string, unknown: boolean): React.CSSProperties => ({
    background: unknown ? '#FFF3B0' : bg,
    border: `3px ${unknown ? 'dashed' : 'solid'} ${unknown ? '#C9A400' : INK}`,
    borderRadius: 10, height: 56,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: FONT, fontWeight: 800, fontSize: 28, color: INK,
  });
  const label: React.CSSProperties = { fontFamily: FONT, fontWeight: 700, fontSize: 15, color: '#667', textAlign: 'center', marginTop: 4 };

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div style={box('#E3F2FD', whole === null)}>{show(whole)}</div>
      <div style={label}>{labels[0]}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <div style={{ flex: share }}>
          <div style={box('#FFE0E0', parts[0] === null)}>{show(parts[0])}</div>
          <div style={label}>{labels[1]}</div>
        </div>
        <div style={{ flex: 1 - share }}>
          <div style={box('#DFF5E8', parts[1] === null)}>{show(parts[1])}</div>
          <div style={label}>{labels[2]}</div>
        </div>
      </div>
    </div>
  );
}

// --- Comparing two rows ----------------------------------------------------------

function CompareScene({ rows, match }: { rows: [CompareRow, CompareRow]; match?: boolean }) {
  const most = Math.max(rows[0].count, rows[1].count);
  const fewest = Math.min(rows[0].count, rows[1].count);
  const cell = `calc((100% - 70px) / ${Math.max(most, 8)})`;
  return (
    <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rows.map((row, r) => (
        <div key={r} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 70, fontFamily: FONT, fontWeight: 800, fontSize: 15, color: INK, flexShrink: 0 }}>
            {row.label} <span style={{ color: '#889' }}>{row.count}</span>
          </div>
          {Array.from({ length: row.count }, (_, i) => {
            const extra = match && i >= fewest;
            return (
              <div key={i} style={{
                width: cell, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'min(20px, 4.4vw)', borderRadius: 6,
                background: extra ? GOLD : undefined,
                // Matched pairs share a column; a faint stripe ties them together.
                boxShadow: match && i < fewest ? `inset 0 ${r === 0 ? -3 : 3}px 0 #B8C4D0` : undefined,
              }} className={extra ? 'anim-pop' : undefined}>{row.emoji}</div>
            );
          })}
        </div>
      ))}
      {match && (
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 17, color: '#B07D00', textAlign: 'right' }}>
          {most - fewest} extra
        </div>
      )}
    </div>
  );
}

// --- Doubles -------------------------------------------------------------------

function DoublesScene({ n, extra = 0 }: { n: number; extra?: number }) {
  const dot = (bg: string, key: number, pop = false) => (
    <div key={key} className={pop ? 'anim-pop' : undefined}
         style={{ width: 30, height: 30, borderRadius: '50%', background: bg, boxShadow: '0 2px 3px rgba(0,0,0,0.2)' }} />
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: 6 }}>{Array.from({ length: n }, (_, i) => dot(RED, i))}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: n }, (_, i) => dot(BLUE, i))}
        {Array.from({ length: extra }, (_, i) => dot(GOLD, n + i, true))}
      </div>
    </div>
  );
}

// --- Balance ---------------------------------------------------------------------

function BalanceScene({ left, right }: { left: string; right: string }) {
  const pan = (text: string) => (
    <div style={{
      minWidth: 110, padding: '10px 14px', borderRadius: 14, background: '#fff',
      border: `3px solid ${INK}`, fontFamily: FONT, fontWeight: 800, fontSize: 30, color: INK, textAlign: 'center',
    }}>{text}</div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 380 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 10 }}>
        {pan(left)}
        <div style={{ alignSelf: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 34, color: INK }}>=</div>
        {pan(right)}
      </div>
      {/* A level balance: the picture of "the same". */}
      <Scale size={72} strokeWidth={2} color={INK} style={{ marginTop: 10 }} aria-hidden />
    </div>
  );
}

// --- Big text --------------------------------------------------------------------

function BigScene({ text }: { text: string }) {
  const long = text.length > 14;
  return (
    <div style={{
      fontFamily: FONT, fontWeight: 800, fontSize: long ? 22 : 48, color: INK,
      textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.35,
    }}>{text}</div>
  );
}

export default function LessonScene({ scene }: { scene: Scene }) {
  switch (scene.kind) {
    case 'numberLine':
      return scene.interactive
        ? <HopLine max={scene.max} initialStart={scene.start} />
        : <NumberLineScene {...scene} />;
    case 'tenFrame': return <TenFrameScene {...scene} />;
    case 'partWhole': return <PartWholeScene {...scene} />;
    case 'compare': return <CompareScene {...scene} />;
    case 'doubles': return <DoublesScene {...scene} />;
    case 'balance': return <BalanceScene {...scene} />;
    case 'big': return <BigScene text={scene.text} />;
    case 'objects': return <ObjectsScene {...scene} />;
    case 'pairs': return <PairsScene {...scene} />;
    case 'groups': return <GroupsScene {...scene} />;
    case 'tensOnes': return <TensOnesScene {...scene} />;
    case 'bond': return <BondScene {...scene} />;
    case 'coins': return <CoinsScene {...scene} />;
    case 'clock': return <ClockScene {...scene} />;
    case 'shape': return <ShapeScene {...scene} />;
    case 'pattern': return <PatternScene {...scene} />;
    case 'lengths': return <LengthsScene {...scene} />;
    case 'weigh': return <WeighScene {...scene} />;
    case 'fraction': return <FractionScene {...scene} />;
  }
}
