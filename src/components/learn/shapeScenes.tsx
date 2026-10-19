import { CSSProperties, useEffect, useState } from 'react';
import { Scene, ShapeName } from '@/data/learn';

// Pictures for clocks, shapes, patterns, measuring and fractions. Each is drawn
// from the few numbers in its Scene, so a lesson stays data.
//
// Same rules as LessonScene.tsx: big, high-contrast, sparse, and the numbers
// in the picture. Anything that counts does it one at a time, at about the
// pace the guide talks, and starts over on every step (the scene is remounted).

type Of<K extends Scene['kind']> = Extract<Scene, { kind: K }>;

const INK = '#3A4652';
const RED = '#FF6B6B';
const BLUE = '#45B7D1';
const GOLD = '#FFC93C';
const FORWARD = '#2E9E5B';
const BACK = '#F07C2A';
const FONT = 'Nunito, sans-serif';
/** The colour of an unknown: the "?" boxes in ten frames and part-whole bars. */
const ASK = '#C9A400';
const ASK_BG = '#FFF3B0';

// The clock and the fraction pieces are the ones in her questions
// (components/game/QuestionVisual.tsx), in the same colours, so the clock in a
// lesson is the clock she then has to read in play.
const PLAY_LINE = '#4A5766';
const PLAY_SHADE = '#FF8A3D';
const PLAY_EMPTY = '#F1F4F8';
const FACE = '#FFFDF5';

/** One thing counted or lit, at about the pace the guide says each number. */
const STEP_MS = 650;

const text = (size: number, fill: string = INK): CSSProperties => ({ fontFamily: FONT, fontWeight: 800, fontSize: size, fill });

/** SVG pops from its own middle, not from the corner of the picture. */
const POP: CSSProperties = { transformBox: 'fill-box', transformOrigin: 'center' };

/**
 * 1, 2, 3… up to `n`, one every STEP_MS from mount (NumberLineScene's timer).
 * With `on` false it is simply `n`.
 */
function useCounter(n: number, on: boolean): number {
  const [shown, setShown] = useState(on ? 0 : n);
  useEffect(() => {
    if (!on || n <= 0) { setShown(n); return; }
    setShown(0);
    let k = 0;
    const id = setInterval(() => {
      k++;
      setShown(k);
      if (k >= n) clearInterval(id);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [n, on]);
  return Math.min(shown, n);
}

/** The things an emoji string draws, one each: 🍎🍎🍎 is three apples, 👩‍🚀 one astronaut. */
function things(s: string): string[] {
  const out: string[] = [];
  const regional = (cp: number) => cp >= 0x1f1e6 && cp <= 0x1f1ff;
  let glue = false;
  for (const ch of Array.from(s)) {
    if (/\s/.test(ch)) { glue = false; continue; }
    const cp = ch.codePointAt(0)!;
    const last = out[out.length - 1];
    // Joiners, variation selectors, skin tones, keycaps, tags and the second
    // half of a flag belong to the thing before them.
    const part = cp === 0x200d || cp === 0xfe0f || cp === 0x20e3
      || (cp >= 0x1f3fb && cp <= 0x1f3ff) || (cp >= 0xe0020 && cp <= 0xe007f)
      || (regional(cp) && last !== undefined && Array.from(last).length === 1 && regional(last.codePointAt(0)!));
    if (last !== undefined && (part || glue)) {
      out[out.length - 1] = last + ch;
      glue = cp === 0x200d;
      continue;
    }
    out.push(ch);
  }
  return out.length ? out : [s];
}

// --- Clock -------------------------------------------------------------------

export function ClockScene({ hour, minute, highlight }: Of<'clock'>) {
  // QuestionVisual's Clock, drawn bigger: same face, same hands, same colours.
  const c = 90, r = 82;
  const minuteAngle = (minute / 60) * 360 - 90;
  // The hour hand creeps toward the next number as the minutes pass: at 2:30
  // it is halfway from 2 to 3, which is the thing to notice.
  const hourAngle = ((hour % 12) / 12) * 360 + (minute / 60) * 30 - 90;
  const end = (deg: number, length: number) => ({
    x2: c + length * Math.cos((deg * Math.PI) / 180),
    y2: c + length * Math.sin((deg * Math.PI) / 180),
  });
  const hands = {
    hour: { ...end(hourAngle, r * 0.5), width: 9, colour: PLAY_LINE },
    // A touch shorter than play's 0.78, so its tip ends under the number it points at.
    minute: { ...end(minuteAngle, r * 0.76), width: 5.5, colour: PLAY_SHADE },
  };
  // Play draws the hour hand under the minute hand; a lit hand goes on top.
  const order: ('hour' | 'minute')[] = highlight === 'hour' ? ['minute', 'hour'] : ['hour', 'minute'];
  const time = minute === 0 ? `${hour} o'clock` : `${hour}:${String(minute).padStart(2, '0')}`;
  const lit = highlight === 'hour' ? 'The short hour hand is lit up.' : highlight === 'minute' ? 'The long minute hand is lit up.' : '';

  return (
    <svg viewBox="0 0 180 180" style={{ width: '100%', maxWidth: 240 }} role="img"
         aria-label={`Clock showing ${time}. ${lit}`.trim()}>
      <circle cx={c} cy={c} r={r} fill={FACE} stroke={PLAY_LINE} strokeWidth="5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i / 12) * 360 - 90) * (Math.PI / 180);
        return (
          <line key={i} x1={c + (r - 10) * Math.cos(a)} y1={c + (r - 10) * Math.sin(a)}
                x2={c + (r - 2) * Math.cos(a)} y2={c + (r - 2) * Math.sin(a)}
                stroke={PLAY_LINE} strokeWidth="3" strokeLinecap="round" />
        );
      })}
      {order.map((k) => {
        const h = hands[k];
        const isLit = highlight === k;
        return (
          // "Look at the short hand": the other one steps back so there is one thing to look at.
          <g key={k} opacity={highlight && !isLit ? 0.28 : 1}>
            {isLit && (
              <g className="anim-fade">
                <line x1={c} y1={c} x2={h.x2} y2={h.y2} stroke={GOLD} strokeOpacity="0.35" strokeWidth={h.width + 18} strokeLinecap="round" />
                <line x1={c} y1={c} x2={h.x2} y2={h.y2} stroke={GOLD} strokeWidth={h.width + 8} strokeLinecap="round" />
              </g>
            )}
            <line x1={c} y1={c} x2={h.x2} y2={h.y2} stroke={h.colour} strokeWidth={h.width} strokeLinecap="round" />
          </g>
        );
      })}
      {/* The numbers go over the hands. In play the long hand hides the number
          it points at, and "it points at the 12" is what the guide is saying. */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i / 12) * 360 - 90) * (Math.PI / 180);
        return (
          <text key={i} x={c + (r - 24) * Math.cos(a)} y={c + (r - 24) * Math.sin(a) + 6} textAnchor="middle"
                style={{ ...text(17, PLAY_LINE), stroke: FACE, strokeWidth: 5, strokeLinejoin: 'round', paintOrder: 'stroke' }}>
            {i === 0 ? 12 : i}
          </text>
        );
      })}
      <circle cx={c} cy={c} r="7" fill={PLAY_LINE} />
    </svg>
  );
}

// --- Shapes ------------------------------------------------------------------

type Pt = [number, number];

function regular(n: number, r: number, fromDeg: number): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = ((fromDeg + (360 / n) * i) * Math.PI) / 180;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
}

/**
 * Corners, clockwise from the top left, so side 1 is the top (or the first
 * side clockwise from the top corner). All about the same size on screen.
 */
const CORNERS: Record<Exclude<ShapeName, 'circle'>, Pt[]> = {
  triangle: regular(3, 106, -90),
  square: [[-78, -78], [78, -78], [78, 78], [-78, 78]],
  // Twice as wide as tall: nobody should be able to mistake it for a square.
  rectangle: [[-110, -54], [110, -54], [110, 54], [-110, 54]],
  pentagon: regular(5, 98, -90),
  hexagon: regular(6, 96, 240),
  octagon: regular(8, 94, -112.5),
  // A diamond, taller than wide: every side the same, but not a square.
  rhombus: [[0, -102], [70, 0], [0, 102], [-70, 0]],
  trapezoid: [[-56, -52], [56, -52], [112, 52], [-112, 52]],
};

/** Each side its own colour, so where one side stops and the next starts is visible. */
const SIDE_COLOURS = [RED, BLUE, FORWARD, BACK, '#8E6CEF', '#E0559B', '#1FA6A0', '#D99A00'];
const SHAPE_FILL = '#E3F2FD';
const SHAPE_W = 320;
const SHAPE_H = 270;

export function ShapeScene({ shape, mark }: Of<'shape'>) {
  const cx = SHAPE_W / 2, cy = SHAPE_H / 2;
  const corners = shape === 'circle' ? [] : CORNERS[shape];
  // A circle has no sides or corners to number: it is just drawn.
  const counted = useCounter(mark ? corners.length : 0, !!mark);

  const xs = corners.map((p) => p[0]), ys = corners.map((p) => p[1]);
  // Centre the shape's box in the picture (a triangle's middle is low otherwise).
  const ox = cx - (Math.min(...xs, 0) + Math.max(...xs, 0)) / 2;
  const oy = cy - (Math.min(...ys, 0) + Math.max(...ys, 0)) / 2;
  const pts: Pt[] = corners.map(([x, y]) => [x + ox, y + oy]);
  const mid: Pt = [
    pts.reduce((a, p) => a + p[0], 0) / (pts.length || 1),
    pts.reduce((a, p) => a + p[1], 0) / (pts.length || 1),
  ];

  const aria = shape === 'circle'
    ? `A circle${mark ? ': no straight sides and no corners' : ''}`
    : `${shape === 'octagon' ? 'An' : 'A'} ${shape}${mark ? `, its ${pts.length} ${mark} numbered one at a time` : ''}`;

  return (
    <svg viewBox={`0 0 ${SHAPE_W} ${SHAPE_H}`} style={{ width: '100%', maxWidth: 340 }} role="img" aria-label={aria}>
      {shape === 'circle'
        ? <circle cx={cx} cy={cy} r={100} fill={SHAPE_FILL} stroke={INK} strokeWidth="5" />
        : <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={SHAPE_FILL} stroke={INK} strokeWidth="5" strokeLinejoin="round" />}

      {mark === 'sides' && pts.slice(0, counted).map((p, i) => {
        const q = pts[(i + 1) % pts.length];
        const colour = SIDE_COLOURS[i % SIDE_COLOURS.length];
        // The badge sits just outside the middle of its side.
        const m: Pt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
        let n: Pt = [(q[1] - p[1]) / len, -(q[0] - p[0]) / len];
        if (n[0] * (m[0] - mid[0]) + n[1] * (m[1] - mid[1]) < 0) n = [-n[0], -n[1]];
        const b: Pt = [m[0] + n[0] * 27, m[1] + n[1] * 27];
        return (
          <g key={i}>
            <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={colour} strokeWidth="9" strokeLinecap="round" />
            <g className="anim-pop" style={POP}>
              <circle cx={b[0]} cy={b[1]} r="17" fill="#fff" stroke={colour} strokeWidth="5" />
              <text x={b[0]} y={b[1] + 7} textAnchor="middle" style={text(20)}>{i + 1}</text>
            </g>
          </g>
        );
      })}

      {mark === 'corners' && pts.slice(0, counted).map((p, i) => (
        <g key={i} className="anim-pop" style={POP}>
          <circle cx={p[0]} cy={p[1]} r="16" fill={GOLD} stroke={INK} strokeWidth="2.5" />
          <text x={p[0]} y={p[1] + 6.5} textAnchor="middle" style={text(18)}>{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

// --- Patterns ----------------------------------------------------------------

/** Two soft tints, one repeat each, so the part that repeats can be seen. */
const REPEAT_TINTS = [{ bg: '#E3F2FD', edge: '#B9DCF3' }, { bg: '#DFF5E8', edge: '#B3E2C6' }];
const REPEAT_MS = 400;
/** A repeat's box: padding and border each side, the gap inside, the gap between boxes. */
const BOX_PAD = 4, BOX_EDGE = 2, IN_GAP = 3, BOX_GAP = 8, GAP = 6;
/** The width the card gives a picture: the screen less the page gutter and the card's padding. */
const ROOM = 'min(100vw - 60px, 560px)';

export function PatternScene({ items, unit, blank }: Of<'pattern'>) {
  // Each repeat in its own box, and the "?" goes in the repeat it belongs to:
  // [🔴 🔵] [🔴 🔵] [🔴 ?]. With no repeat marked, every thing stands alone.
  const all: (string | null)[] = [...items, ...(blank ? [null] : [])];
  const per = unit ?? 1;
  const groups: (string | null)[][] = [];
  for (let i = 0; i < all.length; i += per) groups.push(all.slice(i, i + per));

  // Whole repeats to a row, the rows as even as the repeats allow and about
  // seven things wide, so the things can be big on a phone and the "?" is not
  // left on a line by itself when it could share one.
  const most = !unit ? 7 : unit === 1 ? 4 : Math.max(1, Math.floor((unit >= 4 ? 8 : 7) / unit));
  const perRow = Math.ceil(groups.length / Math.ceil(groups.length / most));
  const rows: { group: (string | null)[]; at: number }[][] = [];
  groups.forEach((group, at) => {
    if (at % perRow === 0) rows.push([]);
    rows[rows.length - 1].push({ group, at });
  });

  // One size for every thing in the picture: the biggest that lets the widest row fit.
  const fits = rows.map((row) => {
    const count = row.reduce((n, g) => n + g.group.length, 0);
    const fixed = unit
      ? row.length * 2 * (BOX_PAD + BOX_EDGE) + (count - row.length) * IN_GAP + (row.length - 1) * BOX_GAP
      : (count - 1) * GAP;
    return `calc((${ROOM} - ${fixed}px) / ${count})`;
  });
  const cell: CSSProperties = {
    width: 'var(--cell)', height: 'var(--cell)', flexShrink: 0, boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 'calc(var(--cell) * 0.72)', lineHeight: 1,
  };
  const thing = (emoji: string, key: number) => <div key={key} style={cell}>{emoji}</div>;
  const ask = (delay: number) => (
    <div key="ask" className="anim-pop" style={{
      ...cell, border: `3px dashed ${ASK}`, borderRadius: 10, background: ASK_BG,
      fontFamily: FONT, fontWeight: 800, fontSize: 'calc(var(--cell) * 0.6)', color: ASK,
      animationDelay: `${delay}ms`, animationFillMode: 'both',
    }}>?</div>
  );

  const aria = `Pattern: ${items.join(' ')}${blank ? ', then what comes next?' : '.'}${unit ? ` The part that repeats is ${items.slice(0, unit).join(' ')}.` : ''}`;
  return (
    <div role="img" aria-label={aria} style={{
      ['--cell' as string]: `min(48px, ${fits.join(', ')})`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    } as CSSProperties}>
      {rows.map((row, r) => (
        <div key={r} style={{ display: 'flex', gap: unit ? BOX_GAP : GAP }}>
          {row.map(({ group, at }) => {
            if (!unit) return group[0] === null ? ask(300) : thing(group[0], at);
            const tint = REPEAT_TINTS[at % 2];
            return (
              // The repeats arrive one after another, the way the guide says them.
              <div key={at} className="anim-pop" style={{
                display: 'flex', gap: IN_GAP, padding: BOX_PAD, borderRadius: 12,
                background: tint.bg, border: `${BOX_EDGE}px solid ${tint.edge}`,
                animationDelay: `${at * REPEAT_MS}ms`, animationFillMode: 'both',
              }}>
                {group.map((item, i) => (item === null ? ask(0) : thing(item, i)))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// --- Lengths -----------------------------------------------------------------

const BAR_COLOURS = [RED, BLUE, FORWARD, BACK];

export function LengthsScene({ items, units }: Of<'lengths'>) {
  const W = 340, LABEL = 58, LINE_X = 66, RIGHT = 10, ROW = 58, TOP = 10;
  // Ten units wide at least, so short things are not drawn huge; 14 at most.
  const span = Math.max(10, ...items.map((i) => (i.start ?? 0) + i.length));
  const u = (W - LINE_X - RIGHT) / span;
  const barH = Math.min(u, 28);
  const H = TOP * 2 + ROW * items.length;
  // With cubes, every row counts along together, so the shorter one stops first.
  const longest = Math.max(...items.map((i) => i.length));
  const counted = useCounter(units ? longest : 0, !!units);

  const aria = `Lengths from one starting line: ${items.map((i) =>
    `${i.label} ${i.length} long${i.start ? `, starting ${i.start} along` : ''}`).join('; ')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 480 }} role="img" aria-label={aria}>
      {items.map((item, r) => {
        const cy = TOP + ROW * r + ROW / 2;
        const colour = BAR_COLOURS[r % BAR_COLOURS.length];
        const x0 = LINE_X + (item.start ?? 0) * u;
        const y0 = cy - barH / 2;
        const labelSize = Math.min(12, 96 / Math.max(1, item.label.length));
        return (
          <g key={r}>
            <text x={LABEL / 2} y={cy - 5} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 28 }}>{item.emoji}</text>
            <text x={LABEL / 2} y={cy + 22} textAnchor="middle" style={text(labelSize, '#667')}>{item.label}</text>
            {units ? (
              <>
                {/* The whole length is there from the start, faint; the cubes fill it in. */}
                <rect x={x0} y={y0} width={item.length * u} height={barH} rx="4"
                      fill={colour} fillOpacity="0.15" stroke={colour} strokeWidth="2" strokeDasharray="5 4" />
                {Array.from({ length: Math.min(counted, item.length) }, (_, k) => (
                  <g key={k} className="anim-pop" style={POP}>
                    <rect x={x0 + k * u} y={y0} width={u} height={barH} rx="3" fill={colour} stroke="#fff" strokeWidth="2" />
                    <text x={x0 + k * u + u / 2} y={cy + u * 0.2} textAnchor="middle"
                          style={{ ...text(Math.min(15, u * 0.58), '#fff'), stroke: 'rgba(0,0,0,0.3)', strokeWidth: 2.5, paintOrder: 'stroke' }}>{k + 1}</text>
                  </g>
                ))}
              </>
            ) : (
              <rect x={x0} y={y0} width={item.length * u} height={barH} rx="6" fill={colour} />
            )}
          </g>
        );
      })}
      {/* The starting line every length is measured from. */}
      <line x1={LINE_X} y1={TOP - 4} x2={LINE_X} y2={H - TOP + 4} stroke={INK} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// --- Balance that tips ---------------------------------------------------------

export function WeighScene({ left, right, heavier }: Of<'weigh'>) {
  // Level first, then it tips: the heavier side going down is the whole idea.
  const [tipped, setTipped] = useState(false);
  useEffect(() => {
    setTipped(false);
    const id = setTimeout(() => setTipped(true), STEP_MS);
    return () => clearTimeout(id);
  }, [left, right, heavier]);

  const W = 320, H = 222, PX = 160, PY = 56, ARM = 106, DROP = 70, BASE_Y = 200, BOWL = 50;
  const deg = tipped ? (heavier === 'right' ? 13 : -13) : 0;
  const rad = (deg * Math.PI) / 180;
  // Where the ends of the beam go; the pans hang from them and stay level.
  const dy = ARM * Math.sin(rad), dx = ARM * (1 - Math.cos(rad));
  const move = 'transform 0.9s cubic-bezier(0.34, 1.25, 0.64, 1)';

  const pan = (side: 'left' | 'right', thing: string) => {
    const x = side === 'left' ? PX - ARM : PX + ARM;
    const [tx, ty] = side === 'left' ? [dx, -dy] : [-dx, dy];
    const rim = PY + DROP;
    // Piled up in the pan, sitting on it: three apples are two with one on top.
    const all = things(thing);
    const across = all.length <= 2 ? all.length : all.length <= 4 ? 2 : 3;
    const size = all.length === 1 ? 48 : all.length === 2 ? 38 : all.length <= 4 ? 32 : all.length <= 9 ? 26 : 18;
    return (
      <g style={{ transform: `translate(${tx}px, ${ty}px)`, transition: move }}>
        <line x1={x} y1={PY} x2={x - BOWL + 4} y2={rim} stroke={INK} strokeWidth="2" />
        <line x1={x} y1={PY} x2={x + BOWL - 4} y2={rim} stroke={INK} strokeWidth="2" />
        {all.map((t, k) => {
          const row = Math.floor(k / across);
          const inRow = Math.min(across, all.length - row * across);
          return (
            <text key={k} x={x + ((k % across) - (inRow - 1) / 2) * size * 1.12} y={rim + 2 - row * size * 0.86}
                  textAnchor="middle" style={{ fontSize: size }}>{t}</text>
          );
        })}
        <path d={`M ${x - BOWL} ${rim} Q ${x} ${rim + 38} ${x + BOWL} ${rim} Z`} fill="#FFE9A8" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <circle cx={x} cy={PY} r="4" fill={INK} />
      </g>
    );
  };

  const heavy = heavier === 'left' ? left : right;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 380 }} role="img"
         aria-label={`A balance with ${left} on the left and ${right} on the right. The ${heavier} side goes down: ${heavy} is heavier.`}>
      {/* Stand */}
      <path d={`M ${PX - 52} ${BASE_Y + 14} L ${PX - 22} ${BASE_Y} L ${PX + 22} ${BASE_Y} L ${PX + 52} ${BASE_Y + 14} Z`} fill={INK} />
      <rect x={PX - 5} y={PY} width="10" height={BASE_Y - PY} rx="3" fill={INK} />
      {pan('left', left)}
      {pan('right', right)}
      {/* Beam, tipping about the top of the stand */}
      <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: `${PX}px ${PY}px`, transformBox: 'view-box', transition: move }}>
        <rect x={PX - ARM - 6} y={PY - 5} width={ARM * 2 + 12} height="10" rx="5" fill={INK} />
      </g>
      <circle cx={PX} cy={PY} r="9" fill={GOLD} stroke={INK} strokeWidth="3" />
    </svg>
  );
}

// --- Fractions -----------------------------------------------------------------

/** Piece sizes for an unfair cut: never two the same, never close. */
const UNEVEN = [1.7, 0.7, 1.25, 0.55, 1.45, 0.8, 1.1, 0.6];

/** Where each strip starts and how wide it is, across `length`. */
function strips(parts: number, length: number, unequal?: boolean): [number, number][] {
  const weights = unequal ? UNEVEN.slice(0, parts) : Array.from({ length: parts }, () => 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let at = 0;
  return weights.map((w) => {
    const size = (w / total) * length;
    const s: [number, number] = [at, size];
    at += size;
    return s;
  });
}

export function FractionScene({ shape, parts, shaded, unequal }: Of<'fraction'>) {
  const fill = (i: number) => (i < shaded ? PLAY_SHADE : PLAY_EMPTY);
  const edge = { stroke: PLAY_LINE, strokeWidth: 3, strokeLinejoin: 'round' as const };
  const aria = `A ${shape} cut into ${parts} ${unequal ? 'parts that are not the same size' : 'equal parts'}, ${shaded} shaded`;

  if (shape === 'circle') {
    // QuestionVisual's FractionCircle, bigger: slices from 12 o'clock, clockwise.
    const c = 76, r = 64;
    let pieces: string[];
    if (!unequal) {
      pieces = Array.from({ length: parts }, (_, i) => {
        const a0 = (i / parts) * 2 * Math.PI - Math.PI / 2;
        const a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        return `M ${c} ${c} L ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)} Z`;
      });
    } else if (parts === 2) {
      // The "is this a half?" picture: one straight cut that misses the middle.
      const d = r * 0.4, h = Math.sqrt(r * r - d * d);
      const top = `${c + d} ${c - h}`, bottom = `${c + d} ${c + h}`;
      pieces = [`M ${top} L ${bottom} A ${r} ${r} 0 1 1 ${top} Z`, `M ${top} A ${r} ${r} 0 0 1 ${bottom} Z`];
    } else {
      // Cut from a point off the middle: the same number of pieces, all different sizes.
      const px = c + r * 0.34, py = c + r * 0.24;
      const onRim = (deg: number): Pt => {
        const ux = Math.cos((deg * Math.PI) / 180), uy = Math.sin((deg * Math.PI) / 180);
        const ox = px - c, oy = py - c;
        const b = ox * ux + oy * uy;
        const t = -b + Math.sqrt(b * b - (ox * ox + oy * oy - r * r));
        return [px + t * ux, py + t * uy];
      };
      const rim = Array.from({ length: parts }, (_, i) => onRim(-90 + (360 / parts) * i));
      pieces = rim.map((a, i) => {
        const b = rim[(i + 1) % parts];
        const sweep = (Math.atan2(b[1] - c, b[0] - c) - Math.atan2(a[1] - c, a[0] - c) + 4 * Math.PI) % (2 * Math.PI);
        return `M ${px} ${py} L ${a[0]} ${a[1]} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${b[0]} ${b[1]} Z`;
      });
    }
    return (
      <svg viewBox="0 0 152 152" style={{ width: '100%', maxWidth: 200 }} role="img" aria-label={aria}>
        {pieces.map((d, i) => <path key={i} d={d} fill={fill(i)} {...edge} />)}
      </svg>
    );
  }

  if (shape === 'bar') {
    // QuestionVisual's FractionBar, a little bigger.
    const w = 260, h = 76, pad = 3;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: 320 }} role="img" aria-label={aria}>
        {strips(parts, w - pad * 2, unequal).map(([x, size], i) => (
          <rect key={i} x={pad + x} y={pad} width={size} height={h - pad * 2} fill={fill(i)} {...edge} />
        ))}
      </svg>
    );
  }

  // A square: quarters are a 2 × 2 grid (the way her class folds paper),
  // sixths and eighths two rows, anything else strips.
  const side = 160, pad = 3;
  const cols = parts === 4 ? 2 : parts === 6 ? 3 : parts === 8 ? 4 : parts;
  const rows = parts / cols;
  let cells: [number, number, number, number][];
  if (unequal && parts === 4) {
    // Four pieces from two cuts that both miss the middle.
    const a = side * 0.34, b = side * 0.64;
    cells = [[0, 0, a, b], [a, 0, side - a, b], [0, b, a, side - b], [a, b, side - a, side - b]];
  } else if (unequal) {
    cells = strips(parts, side, true).map(([x, w]) => [x, 0, w, side]);
  } else {
    cells = Array.from({ length: parts }, (_, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      return [(col * side) / cols, (row * side) / rows, side / cols, side / rows];
    });
  }
  return (
    <svg viewBox={`0 0 ${side + pad * 2} ${side + pad * 2}`} style={{ width: '100%', maxWidth: 200 }} role="img" aria-label={aria}>
      {cells.map(([x, y, w, h], i) => (
        <rect key={i} x={pad + x} y={pad + y} width={w} height={h} fill={fill(i)} {...edge} />
      ))}
    </svg>
  );
}
