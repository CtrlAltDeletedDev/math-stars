import { CSSProperties, ReactNode, useEffect, useId, useState } from 'react';
import { COIN_STYLE } from '@/components/game/QuestionVisual';
import { Scene } from '@/data/learn';

// Pictures for counting, pairs, groups, tens and ones, number bonds and coins.
// Each is drawn from the few numbers in its Scene, so a lesson stays data.
//
// They are SVG drawn at phone size (a ~300px card) and scaled to fit, so 30
// things or 10 groups of 10 still fit a 360px phone and never scroll sideways.
// Everything that moves starts on mount: the player remounts a scene on every
// step and every replay.

type Of<K extends Scene['kind']> = Extract<Scene, { kind: K }>;

// LessonScene.tsx's palette, so every lesson picture looks like one set.
const INK = '#3A4652';
const RED = '#FF6B6B';
const BLUE = '#45B7D1';
const GOLD = '#FFC93C';
const FORWARD = '#2E9E5B';
const FONT = 'Nunito, sans-serif';
// The unknown, as PartWholeScene draws it: a dashed gold box with a "?".
const UNKNOWN_FILL = '#FFF3B0';
const UNKNOWN_EDGE = '#C9A400';
// The soft box or bubble that holds a group of things together.
const SOFT = '#EEF4FA';
const SOFT_EDGE = '#C9D6E2';

/** One counted number per tick: about as fast as the guide says them. */
const COUNT_MS = 650;
/** Coins are counted in longer words ("sixty-five"), so a little slower. */
const COIN_MS = 750;
/** Room around a drawing, so a pop-in that overshoots is not clipped. */
const M = 6;

const type = (size: number, fill: string = INK): CSSProperties => ({ fontFamily: FONT, fontWeight: 800, fontSize: size, fill });
const pop: CSSProperties = { transformBox: 'fill-box', transformOrigin: 'center' };

/**
 * How far an animation has got: `from` on mount, then one more every `ms`
 * until `total`, as NumberLineScene counts its hops. Off, it never starts.
 */
function useSteps(total: number, on: boolean, ms: number, from = 0): number {
  const [shown, setShown] = useState(on ? Math.min(from, total) : 0);
  useEffect(() => {
    if (!on) { setShown(0); return; }
    let k = Math.min(from, total);
    setShown(k);
    if (k >= total) return;
    const id = setInterval(() => {
      k++;
      setShown(k);
      if (k >= total) clearInterval(id);
    }, ms);
    return () => clearInterval(id);
  }, [total, on, ms, from]);
  return shown;
}

/** A drawing of `w` × `h` design px that shrinks to fit and grows a little on a tablet. */
function Picture({ w, h, label, children, grow = 1.35 }: { w: number; h: number; label: string; children: ReactNode; grow?: number }) {
  return (
    <svg viewBox={`${-M} ${-M} ${w + M * 2} ${h + M * 2}`} role="img" aria-label={label}
         style={{ width: '100%', maxWidth: Math.round((w + M * 2) * grow), display: 'block', overflow: 'visible' }}>
      {children}
    </svg>
  );
}

/** An emoji centred on (x, y), `size` tall. */
function Thing({ x, y, size, emoji }: { x: number; y: number; size: number; emoji: string }) {
  return <text x={x} y={y} dy="0.35em" textAnchor="middle" style={{ fontSize: size }}>{emoji}</text>;
}

/** A plain counter, for a picture given no emoji. */
function Counter({ x, y, r, fill = BLUE }: { x: number; y: number; r: number; fill?: string }) {
  return (
    <g>
      <circle cx={x} cy={y + r * 0.1} r={r} fill="rgba(0,0,0,0.16)" />
      <circle cx={x} cy={y} r={r} fill={fill} />
      <circle cx={x - r * 0.3} cy={y - r * 0.32} r={r * 0.28} fill="#fff" opacity={0.45} />
    </g>
  );
}

/** "That's how many": the last count, gold. Text widths are estimates in Nunito ExtraBold. */
function GoldPill({ x, y, text, size }: { x: number; y: number; text: string; size: number }) {
  const w = text.length * size * 0.62 + size * 0.9;
  const h = size * 1.45;
  return (
    <g className="anim-pop" style={pop}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={GOLD} stroke={INK} strokeWidth={2} />
      <text x={x} y={y} dy="0.36em" textAnchor="middle" style={type(size)}>{text}</text>
    </g>
  );
}

// --- Things to count -----------------------------------------------------------

export function ObjectsScene({ n, emoji, counting = false }: Of<'objects'>) {
  // Ten or fewer in rows of five, like a ten frame. More in rows of ten split
  // five and five, so 30 is three rows and she can still see the fives.
  const wide = n > 10;
  const cols = wide ? 10 : 5;
  const C = wide ? 30 : 54;
  const split = wide ? 10 : 0;
  const rowGap = wide ? 6 : 8;
  const r = wide ? 9.5 : 13;
  // A big thing has room for its number in its corner. A small one would be
  // hidden under it, so rows of ten get a strip above each row for the numbers.
  const band = wide && counting ? r * 2 + 3 : 0;
  const rowH = band + C;
  const rows = Math.max(1, Math.ceil(n / cols));
  const W = cols * C + split;
  const gridH = rows * rowH + (rows - 1) * rowGap;
  const H = gridH + (counting ? 74 : 0);

  const counted = useSteps(n, counting, COUNT_MS);
  const done = counting && counted >= n;
  const cell = (i: number) => {
    const c = i % cols;
    return { x: c * C + (c >= 5 ? split : 0), y: Math.floor(i / cols) * (rowH + rowGap) };
  };
  const badgeAt = (i: number) => {
    const { x, y } = cell(i);
    return wide ? { bx: x + C / 2, by: y + r + 1 } : { bx: x + C - r - 1, by: y + r + 1 };
  };

  // Each five sits on its own tray, sized to what is on it.
  const trays: { x: number; y: number; k: number }[] = [];
  for (let start = 0; start < n; start += 5) {
    const { x, y } = cell(start);
    trays.push({ x, y, k: Math.min(5, n - start) });
  }

  return (
    <Picture w={W} h={H} label={`${n} ${emoji} in rows of five${counting ? ', counted one at a time' : ''}`}>
      {trays.map((t, i) => (
        <rect key={i} x={t.x + 1} y={t.y + 1} width={t.k * C - 2} height={rowH - 2} rx={C * 0.28} fill={SOFT} />
      ))}
      {n === 0 && (
        <rect x={1} y={1} width={W - 2} height={C - 2} rx={C * 0.28} fill="none" stroke={SOFT_EDGE} strokeWidth={2.5} strokeDasharray="8 6" />
      )}
      {Array.from({ length: n }, (_, i) => {
        const { x, y } = cell(i);
        return <Thing key={i} x={x + C / 2} y={y + band + C / 2} size={C * 0.64} emoji={emoji} />;
      })}
      {/* A number on each thing as it is counted: the newest green, the last gold. */}
      {Array.from({ length: counted }, (_, i) => {
        const { bx, by } = badgeAt(i);
        const newest = i === counted - 1;
        const last = done && newest;
        return (
          <g key={i} className="anim-pop" style={pop}>
            <circle cx={bx} cy={by} r={newest ? r * 1.12 : r}
                    fill={last ? GOLD : newest ? FORWARD : '#fff'}
                    stroke={last ? INK : FORWARD} strokeWidth={last ? 2 : newest ? 0 : 2} />
            <text x={bx} y={by} dy="0.36em" textAnchor="middle"
                  style={type(wide ? 12 : 15, last ? INK : newest ? '#fff' : FORWARD)}>{i + 1}</text>
          </g>
        );
      })}
      {done && <GoldPill x={W / 2} y={gridH + 42} text={String(n)} size={34} />}
    </Picture>
  );
}

// --- Two by two -----------------------------------------------------------------

export function PairsScene({ n, emoji }: Of<'pairs'>) {
  // Each pair stands in its own box, five boxes to a row (so 20 is two rows).
  // The odd one out gets a gold box of its own, half as tall: no partner.
  const pairs = Math.floor(n / 2);
  const odd = n % 2 === 1;
  const boxes = pairs + (odd ? 1 : 0);
  const S = 44, P = 6, GAP = 8, ROW_GAP = 12;
  const BW = S + P * 2;
  const BH = S * 2 + P * 3;
  const cols = Math.max(1, Math.min(boxes, 5));
  const rows = Math.max(1, Math.ceil(boxes / 5));
  const W = cols * BW + (cols - 1) * GAP;
  const H = rows * BH + (rows - 1) * ROW_GAP;

  // One pair after another, the first straight away.
  const shown = useSteps(boxes, true, COUNT_MS, 1);
  const thing = (x: number, y: number, key: number) => emoji
    ? <Thing key={key} x={x} y={y} size={S * 0.8} emoji={emoji} />
    : <Counter key={key} x={x} y={y} r={S * 0.38} />;

  return (
    <Picture w={W} h={H} label={`${n} ${emoji ?? 'counters'} put two by two${odd ? ', one left without a partner' : ', every one with a partner'}`}>
      {n === 0 && <rect x={1} y={1} width={BW - 2} height={BH - 2} rx={14} fill="none" stroke={SOFT_EDGE} strokeWidth={2.5} strokeDasharray="8 6" />}
      {Array.from({ length: shown }, (_, i) => {
        const x = (i % 5) * (BW + GAP);
        const y = Math.floor(i / 5) * (BH + ROW_GAP);
        const alone = odd && i === pairs;
        return (
          <g key={i} className="anim-pop" style={pop}>
            <rect x={x} y={y} width={BW} height={alone ? S + P * 2 : BH} rx={14}
                  fill={alone ? GOLD : SOFT} stroke={alone ? UNKNOWN_EDGE : SOFT_EDGE} strokeWidth={alone ? 3 : 2} />
            {thing(x + BW / 2, y + P + S / 2, 0)}
            {!alone && thing(x + BW / 2, y + P * 2 + S * 1.5, 1)}
          </g>
        );
      })}
    </Picture>
  );
}

// --- Equal groups -----------------------------------------------------------------

/** Bubble padding, the gap between bubbles, and between lines of them, in things. */
const G_PAD = 0.3, G_GAP = 0.5, G_VGAP = 0.4;
const G_LABEL = 18;

interface GroupLayout {
  /** Things across and down inside one bubble, and whether they fill down first. */
  across: number; down: number; byColumn: boolean;
  perLine: number; lines: number;
  /** One thing, in design px. */
  u: number;
  /** The bubbles' height, in design px. */
  tall: number;
}

/**
 * The arrangement that draws the things biggest in a 300 × 280 card. Inside a
 * bubble they go in fives, across or down; among arrangements within 15% of
 * the biggest, the one with the fewest lines of bubbles wins, so the running
 * totals read left to right where they can. 10 groups of 10 comes out as two
 * lines of five tall bubbles, each thing about 20px.
 */
function layOutGroups(groups: number, size: number, labelH: number): GroupLayout {
  const shapes = [
    { across: Math.min(size, 5), down: Math.ceil(size / 5), byColumn: false },
    { across: Math.ceil(size / 5), down: Math.min(size, 5), byColumn: true },
  ];
  const all: GroupLayout[] = [];
  for (const s of shapes) {
    for (let perLine = 1; perLine <= groups; perLine++) {
      const lines = Math.ceil(groups / perLine);
      const w = perLine * (s.across + G_PAD * 2) + (perLine - 1) * G_GAP;
      const h = lines * (s.down + G_PAD * 2) + (lines - 1) * G_VGAP;
      const u = Math.min(32, 300 / w, (280 - lines * labelH) / h);
      all.push({ ...s, perLine, lines, u, tall: h * u });
    }
  }
  const best = Math.max(...all.map((l) => l.u));
  // Fewest lines, then biggest things, then the shortest picture: 2 groups of
  // 3 is two short bubbles side by side, not two tall ones.
  return all.filter((l) => l.u >= best * 0.85)
    .sort((a, b) => a.lines - b.lines || Math.floor(b.u) - Math.floor(a.u) || a.tall - b.tall)[0];
}

export function GroupsScene({ groups, size, emoji, counting = false }: Of<'groups'>) {
  const labelH = counting ? G_LABEL * 1.6 : 0;
  const { across, down, byColumn, perLine, lines, u } = layOutGroups(groups, size, labelH);
  const bw = (across + G_PAD * 2) * u;
  const bh = (down + G_PAD * 2) * u;
  const W = Math.min(groups, perLine) * bw + (Math.min(groups, perLine) - 1) * G_GAP * u;
  const H = lines * (bh + labelH) + (lines - 1) * G_VGAP * u;

  const counted = useSteps(groups, counting, COUNT_MS);
  const done = counting && counted >= groups;
  const at = (g: number) => ({
    x: (g % perLine) * (bw + G_GAP * u),
    y: Math.floor(g / perLine) * (bh + labelH + G_VGAP * u),
  });

  return (
    <Picture w={W} h={H} label={`${groups} groups of ${size} ${emoji}${counting ? `, counted ${size} at a time` : ''}`}>
      {Array.from({ length: groups }, (_, g) => {
        const { x, y } = at(g);
        const now = counting && !done && g === counted - 1;
        return (
          <g key={g}>
            <rect x={x} y={y} width={bw} height={bh} rx={Math.min(bw, bh) / 2}
                  fill={SOFT} stroke={now ? FORWARD : SOFT_EDGE} strokeWidth={now ? 3.5 : 2} />
            {Array.from({ length: size }, (_, k) => {
              const col = byColumn ? Math.floor(k / 5) : k % 5;
              const row = byColumn ? k % 5 : Math.floor(k / 5);
              return <Thing key={k} x={x + (G_PAD + col + 0.5) * u} y={y + (G_PAD + row + 0.5) * u} size={u * 0.8} emoji={emoji} />;
            })}
          </g>
        );
      })}
      {/* The running total under each group as it is counted: 5, 10, 15. */}
      {Array.from({ length: counted }, (_, g) => {
        const { x, y } = at(g);
        const cx = x + bw / 2, cy = y + bh + labelH / 2 + 1;
        const total = String((g + 1) * size);
        if (done && g === groups - 1) return <GoldPill key={g} x={cx} y={cy} text={total} size={G_LABEL} />;
        return (
          <text key={g} x={cx} y={cy} dy="0.36em" textAnchor="middle" className="anim-pop"
                style={{ ...pop, ...type(G_LABEL, g === counted - 1 ? FORWARD : INK) }}>{total}</text>
        );
      })}
    </Picture>
  );
}

// --- Tens and ones -------------------------------------------------------------------

/** Gaps, in cubes: between rods, an extra one after every five rods, between ones, rods to ones. */
const ROD_GAP = 0.4, FIVE_GAP = 0.6, CUBE_GAP = 0.25, TO_ONES = 1;
const NUMBER_SIZE = 32;

/** How wide one number's blocks are, in cubes. */
function blocksWide(n: number): number {
  const tens = Math.floor(n / 10), ones = n % 10;
  const rods = tens > 0 ? tens + (tens - 1) * ROD_GAP + Math.floor((tens - 1) / 5) * FIVE_GAP : 0;
  const loose = ones === 0 ? 0 : ones > 5 ? 2 + CUBE_GAP : 1;
  return rods + (tens > 0 && ones > 0 ? TO_ONES : 0) + loose;
}

/** How tall one number's blocks are, in cubes: a rod is 10, ones stand in columns of up to 5. */
function blocksTall(n: number): number {
  if (n >= 10) return 10;
  const up = Math.min(n % 10, 5);
  return up === 0 ? 0 : up + (up - 1) * CUBE_GAP;
}

const tensAndOnes = (n: number) => {
  const t = Math.floor(n / 10), o = n % 10;
  return `${n}: ${t} ${t === 1 ? 'ten' : 'tens'} and ${o} ${o === 1 ? 'one' : 'ones'}`;
};

export function TensOnesScene({ numbers, hide = false }: Of<'tensOnes'>) {
  // Every ten is one rod of ten joined cubes, every one a loose cube. Rods go
  // in fives (so 120 is 5, 5 and 2) and the loose ones in columns of five,
  // and the number is written underneath. Two numbers stand side by side.
  const nums = numbers.slice(0, 2);
  const labelW = (n: number) => String(n).length * NUMBER_SIZE * 0.64 + 8;
  const sepFor = (c: number) => (nums.length > 1 ? Math.max(c * 2.4, 30) : 0);
  const fits = (c: number) => nums.reduce((w, n) => w + Math.max(blocksWide(n) * c, labelW(n)), 0) + sepFor(c);
  let c = 17;
  while (c > 4 && fits(c) > 300) c -= 0.25;

  const tall = Math.max(...nums.map(blocksTall)) * c;
  const slots = nums.map((n) => Math.max(blocksWide(n) * c, labelW(n)));
  const sep = sepFor(c);
  const W = slots.reduce((a, b) => a + b, 0) + sep;
  const H = tall + 14 + NUMBER_SIZE;
  const sw = Math.max(1, c * 0.08);

  let left = 0;
  const drawn = nums.map((n, i) => {
    const x0 = left + (slots[i] - blocksWide(n) * c) / 2;
    const mid = left + slots[i] / 2;
    left += slots[i] + sep;
    const tens = Math.floor(n / 10), ones = n % 10;
    const rodX = (k: number) => x0 + (k * (1 + ROD_GAP) + Math.floor(k / 5) * FIVE_GAP) * c;
    const onesX = x0 + (tens > 0 ? blocksWide(tens * 10) + TO_ONES : 0) * c;
    return (
      <g key={i}>
        {Array.from({ length: tens }, (_, k) => (
          <g key={`t${k}`}>
            <rect x={rodX(k)} y={tall - 10 * c} width={c} height={10 * c} rx={Math.min(3, c * 0.15)} fill={BLUE} stroke={INK} strokeWidth={sw} />
            {Array.from({ length: 9 }, (_, j) => (
              <line key={j} x1={rodX(k)} x2={rodX(k) + c} y1={tall - 10 * c + (j + 1) * c} y2={tall - 10 * c + (j + 1) * c}
                    stroke={INK} strokeOpacity={0.45} strokeWidth={sw * 0.8} />
            ))}
          </g>
        ))}
        {Array.from({ length: ones }, (_, k) => {
          const col = Math.floor(k / 5), row = k % 5;
          return (
            <rect key={`o${k}`} x={onesX + col * (1 + CUBE_GAP) * c} y={tall - (row + 1) * c - row * CUBE_GAP * c}
                  width={c} height={c} rx={Math.min(3, c * 0.15)} fill={RED} stroke={INK} strokeWidth={sw} />
          );
        })}
        {/* Hidden, it is the question: "?" in the gold every unknown is drawn in. */}
        <text x={mid} y={tall + 14 + NUMBER_SIZE * 0.5} dy="0.36em" textAnchor="middle"
              style={{ ...type(NUMBER_SIZE), ...(hide ? { fill: '#C9A400' } : {}) }}>{hide ? '?' : n}</text>
      </g>
    );
  });

  return (
    <Picture w={W} h={H} grow={1.1} label={hide ? nums.map((n) => tensAndOnes(n).replace(/^\d+: /, '')).join(', beside ') : nums.map(tensAndOnes).join(', beside ')}>
      {drawn}
      {nums.length > 1 && (
        <line x1={slots[0] + sep / 2} x2={slots[0] + sep / 2} y1={0} y2={H} stroke={SOFT_EDGE} strokeWidth={2.5} strokeDasharray="6 6" strokeLinecap="round" />
      )}
    </Picture>
  );
}

// --- Number bond --------------------------------------------------------------------

export function BondScene({ whole, parts }: Of<'bond'>) {
  // The whole on top, the parts below, joined: the bond her class draws.
  const W = 300, H = 222;
  const top = { x: W / 2, y: 50, r: 46 };
  const below = [{ x: 62, y: 168, r: 44 }, { x: W - 62, y: 168, r: 44 }];

  const circle = (c: { x: number; y: number; r: number }, n: number | null, fill: string, key: string) => (
    <g key={key}>
      <circle cx={c.x} cy={c.y} r={c.r} fill={n === null ? UNKNOWN_FILL : fill}
              stroke={n === null ? UNKNOWN_EDGE : INK} strokeWidth={3} strokeDasharray={n === null ? '9 6' : undefined} />
      <text x={c.x} y={c.y} dy="0.36em" textAnchor="middle" style={type(String(n ?? '?').length > 2 ? 30 : 38)}>{n ?? '?'}</text>
    </g>
  );
  // A joining line from the edge of the whole to the edge of a part.
  const join = (p: { x: number; y: number; r: number }, i: number) => {
    const dx = p.x - top.x, dy = p.y - top.y, d = Math.hypot(dx, dy);
    return (
      <line key={i} x1={top.x + (dx / d) * top.r} y1={top.y + (dy / d) * top.r}
            x2={p.x - (dx / d) * p.r} y2={p.y - (dy / d) * p.r} stroke={INK} strokeWidth={4} strokeLinecap="round" />
    );
  };
  const say = (n: number | null) => (n === null ? 'a missing number' : String(n));

  return (
    <Picture w={W} h={H} grow={1.15} label={`Number bond: ${say(whole)} is made of ${say(parts[0])} and ${say(parts[1])}`}>
      {below.map(join)}
      {circle(top, whole, '#E3F2FD', 'whole')}
      {circle(below[0], parts[0], '#FFE0E0', 'a')}
      {circle(below[1], parts[1], '#DFF5E8', 'b')}
    </Picture>
  );
}

// --- Coins ----------------------------------------------------------------------------

/**
 * The coins she meets in play (QuestionVisual's Coins): the same colours,
 * labels and sizes relative to each other, so the dime is the smallest coin
 * even though it is worth more than a penny or a nickel.
 */
const COIN_NAMES: Record<number, string> = { 1: 'penny', 5: 'nickel', 10: 'dime', 25: 'quarter' };
const COIN: Record<number, { fill: string; label: string; size: number; name: string }> = Object.fromEntries(
  Object.entries(COIN_STYLE).map(([v, style]) => [v, { ...style, name: COIN_NAMES[Number(v)] ?? 'coin' }]),
);
const NAME_SIZE = 14;
const TOTAL_SIZE = 18;

export function CoinsScene({ coins, counting = false, names = false }: Of<'coins'>) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const kinds = coins.map((v) => COIN[v] ?? COIN[1]);
  const totals = coins.reduce<number[]>((acc, v) => [...acc, (acc[acc.length - 1] ?? 0) + v], []);

  // Up to five to a row; more is two even rows.
  const perRow = coins.length <= 5 ? coins.length : Math.ceil(coins.length / 2);
  const rowsOf = [coins.slice(0, perRow).map((_, i) => i), coins.slice(perRow).map((_, i) => perRow + i)].filter((r) => r.length);
  const GAP = 8;
  // Each coin takes its own width, or its words' if they are wider (Nunito
  // ExtraBold is about 0.52em a letter and 0.6em a digit; the last total is
  // in a pill).
  const wordsW = (i: number) => Math.max(
    names ? kinds[i].name.length * NAME_SIZE * 0.52 : 0,
    counting ? `${totals[i]}¢`.length * TOTAL_SIZE * 0.6 + (i === coins.length - 1 ? TOTAL_SIZE * 0.9 : 0) : 0,
  );
  const widthOf = (i: number, s: number) => Math.max(kinds[i].size * s, wordsW(i));
  const rowW = (row: number[], s: number) => row.reduce((w, i) => w + widthOf(i, s), 0) + (row.length - 1) * GAP;
  // A little bigger than in play where there is room; smaller only if they must be.
  let s = 1.3;
  while (s > 0.6 && Math.max(...rowsOf.map((r) => rowW(r, s))) > 300) s -= 0.02;

  const band = Math.max(...kinds.map((k) => k.size)) * s;
  const nameH = names ? NAME_SIZE * 1.6 : 0;
  const totalH = counting ? TOTAL_SIZE * 1.9 : 0;
  const rowH = band + nameH + totalH;
  const ROW_GAP = 12;
  const W = Math.max(...rowsOf.map((r) => rowW(r, s)));
  const H = rowsOf.length * rowH + (rowsOf.length - 1) * ROW_GAP;

  const counted = useSteps(coins.length, counting, COIN_MS);
  const done = counting && counted >= coins.length;

  const place = new Map<number, { cx: number; top: number }>();
  rowsOf.forEach((row, r) => {
    let x = (W - rowW(row, s)) / 2;
    for (const i of row) {
      place.set(i, { cx: x + widthOf(i, s) / 2, top: r * (rowH + ROW_GAP) });
      x += widthOf(i, s) + GAP;
    }
  });

  const label = `Coins: ${coins.map((v) => (names ? `${COIN[v]?.name ?? 'penny'}, ${v}¢` : `${v}¢`)).join('; ')}`
    + (counting ? `. Counted up: ${totals.map((t) => `${t}¢`).join(', ')}` : '');

  return (
    <Picture w={W} h={H} label={label}>
      <defs>
        {Object.entries(COIN).map(([v, k]) => (
          // CSS's radial-gradient(circle at 35% 30%, #fff6, fill), which is how a coin looks in play.
          <radialGradient key={v} id={`${uid}-coin${v}`} cx="35%" cy="30%" fx="35%" fy="30%" r="95%">
            <stop offset="0" stopColor="#fff" stopOpacity={0.4} />
            <stop offset="1" stopColor={k.fill} />
          </radialGradient>
        ))}
      </defs>
      {coins.map((v, i) => {
        const k = kinds[i];
        const { cx, top } = place.get(i)!;
        const cy = top + band / 2;
        const d = k.size * s;
        const now = counting && !done && i === counted - 1;
        return (
          <g key={i}>
            {now && <circle cx={cx} cy={cy} r={d / 2 + 4.5} fill="none" stroke={FORWARD} strokeWidth={3.5} className="anim-pop" style={pop} />}
            <circle cx={cx} cy={cy + 2 * s} r={d / 2} fill="rgba(0,0,0,0.14)" />
            <circle cx={cx} cy={cy} r={d / 2 - 1.25 * s} fill={`url(#${uid}-coin${COIN[v] ? v : 1})`} stroke="#4A576633" strokeWidth={2.5 * s} />
            <text x={cx} y={cy} dy="0.36em" textAnchor="middle" style={type(d * 0.3, '#2D3436')}>{k.label}</text>
            {names && (
              <text x={cx} y={top + band + nameH / 2 + 1} dy="0.36em" textAnchor="middle" style={type(NAME_SIZE)}>{k.name}</text>
            )}
          </g>
        );
      })}
      {/* The running total under each coin as it is counted: the newest green, the last gold. */}
      {Array.from({ length: counted }, (_, i) => {
        const { cx, top } = place.get(i)!;
        const cy = top + band + nameH + totalH / 2 + 1;
        const text = `${totals[i]}¢`;
        if (done && i === coins.length - 1) return <GoldPill key={i} x={cx} y={cy} text={text} size={TOTAL_SIZE} />;
        return (
          <text key={i} x={cx} y={cy} dy="0.36em" textAnchor="middle" className="anim-pop"
                style={{ ...pop, ...type(TOTAL_SIZE, i === counted - 1 ? FORWARD : INK) }}>{text}</text>
        );
      })}
    </Picture>
  );
}
