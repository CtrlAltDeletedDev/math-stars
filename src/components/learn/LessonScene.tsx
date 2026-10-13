import { useEffect, useState } from 'react';
import { Scene, CompareRow } from '@/data/learn';
import HopLine from '@/components/game/HopLine';
import { Scale } from 'lucide-react';

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

function NumberLineScene({ max, start, hops = 0, dir = 1, animate = false }: {
  max: number; start: number; hops?: number; dir?: 1 | -1; animate?: boolean;
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
  }, [animate, hops, start, dir]);

  // Zoom to where the hops happen, at least 11 numbers wide. On a phone the
  // whole 0–20 line is too small to watch; her homework line is still what the
  // "try" steps use, so she sees both.
  const end = start + dir * hops;
  let lo = Math.max(0, Math.min(start, end) - 2);
  let hi = Math.min(max, Math.max(start, end) + 2);
  while (hi - lo < 10 && (lo > 0 || hi < max)) {
    if (hi < max) hi++;
    if (hi - lo < 10 && lo > 0) lo--;
  }
  const width = PAD * 2 + UNIT * (hi - lo);
  const x = (n: number) => PAD + (n - lo) * UNIT;
  const here = start + dir * shown;
  const colour = dir === 1 ? FORWARD : BACK;

  return (
    <svg viewBox={`0 0 ${width} 100`} style={{ width: '100%', maxWidth: 560 }} role="img"
         aria-label={`Number line: start on ${start}${hops ? `, ${hops} hops ${dir === 1 ? 'forward' : 'back'}` : ''}`}>
      {Array.from({ length: shown }, (_, i) => {
        const from = start + dir * i;
        const to = from + dir;
        const mid = (x(from) + x(to)) / 2;
        return (
          <g key={i} className="anim-pop" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <path d={`M ${x(from)} ${LINE_Y - 4} Q ${mid} ${LINE_Y - 42} ${x(to)} ${LINE_Y - 4}`}
                  fill="none" stroke={colour} strokeWidth="3.5" strokeLinecap="round" />
            {/* Number each hop: counting the hops is the whole skill. */}
            <text x={mid} y={LINE_Y - 30} textAnchor="middle"
                  style={{ fontFamily: FONT, fontWeight: 800, fontSize: 12, fill: colour }}>{i + 1}</text>
          </g>
        );
      })}
      <line x1={PAD - 8} y1={LINE_Y} x2={width - PAD + 8} y2={LINE_Y} stroke={INK} strokeWidth="2.5" />
      {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((n) => (
        <g key={n}>
          <line x1={x(n)} y1={LINE_Y - 7} x2={x(n)} y2={LINE_Y + 7} stroke={INK} strokeWidth={n % 5 === 0 ? 2.5 : 1.5} />
          <text x={x(n)} y={LINE_Y + 22} textAnchor="middle"
                style={{
                  fontFamily: FONT, fontWeight: n === here || n === start ? 800 : 700,
                  fontSize: n >= 10 ? 13 : 15,
                  fill: n === here && shown > 0 ? colour : INK,
                }}>{n}</text>
        </g>
      ))}
      <circle cx={x(start)} cy={LINE_Y + 18} r="11" fill="none" stroke={INK} strokeWidth="2" />
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
  }
}
