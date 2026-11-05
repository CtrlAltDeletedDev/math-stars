import { KeyboardEvent, forwardRef } from 'react';
import { Volume2 } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { C, KID_FONT } from '../theme';
import { CourseView, LessonStone, PathNode, UnitProgress, UnitSign } from './path';
import {
  PATH_W, PEBBLE, PathLayout, SIGN, StoneSpot, friendSpot, pebblePillWidth, roomySide, smoothPath,
} from './layout';

// The path itself, as one SVG in matte cut-paper: flat fills, each shape
// lifted off the page by a darker copy of itself just below it. Every stone
// and sign is a button: nothing on the path is locked.

const STONE_BASE = '#F1E8D6';
const STONE_SHADOW = '#CDBD9B';
const TRAIL_EDGE = '#DCCBA8';
const TRAIL = '#EADDC2';
const TRAIL_TOP = '#F4ECDB';

interface Props {
  view: CourseView;
  layout: PathLayout;
  character: string;
  /** Extra drawing units on each side, so the grass and fog reach the screen's edges. */
  pad?: number;
  onLesson: (id: string) => void;
  onUnit: (sign: UnitSign) => void;
}

const fadeFor = (ahead: number) => (ahead <= 0 ? 1 : ahead === 1 ? 0.9 : ahead === 2 ? 0.7 : 0.5);

const PathScene = forwardRef<SVGSVGElement, Props>(function PathScene({ view, layout, character, pad = 0, onLesson, onUnit }, ref) {
  const { height, spots, trail, fogEnd } = layout;
  const trailD = smoothPath(trail);
  const cur = spots[view.current];
  const curNode = view.nodes[view.current];

  const tap = (node: PathNode) => {
    if (node.kind === 'lesson') onLesson(node.id);
    else if (node.kind === 'unit') onUnit(node);
  };

  return (
    <svg
      ref={ref}
      viewBox={`${-pad} 0 ${PATH_W + 2 * pad} ${height}`}
      width="100%"
      style={{ display: 'block', flexShrink: 0 }}
      fontFamily={KID_FONT}
    >
      <defs>
        <linearGradient id="np-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.35" stopColor="#F7FBFB" stopOpacity="0.95" />
          <stop offset="1" stopColor="#F7FBFB" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g aria-hidden="true">
        <Hills height={height} spots={spots} pad={pad} />
        {/* The trail: a paper strip with stepping marks along it. */}
        <path d={trailD} fill="none" stroke={TRAIL_EDGE} strokeWidth={40} strokeLinecap="round" transform="translate(0 4)" />
        <path d={trailD} fill="none" stroke={TRAIL} strokeWidth={38} strokeLinecap="round" />
        <path d={trailD} fill="none" stroke={TRAIL_TOP} strokeWidth={26} strokeLinecap="round" />
        <path d={trailD} fill="none" stroke={TRAIL} strokeWidth={9} strokeLinecap="round" strokeDasharray="1 19" />
        <Flowers spots={spots} />
        {view.nodes.map((n, i) => n.kind === 'lesson' && n.friend && (
          <Friend key={`f${i}`} at={friendSpot(spots[i])} emoji={n.friend} />
        ))}
        {cur && curNode?.kind === 'lesson' && curNode.state === 'today' && (
          <circle cx={cur.x} cy={cur.y} r={cur.r + 15} fill="#FFF0BC" className="np-glow" />
        )}
      </g>

      {/* Top to bottom, so a lower stone's shadow never sits on the one above. */}
      {view.nodes.map((node, i) => ({ node, i })).reverse().map(({ node, i }) => (
        <Node key={i} node={node} spot={spots[i]} current={i === view.current} onTap={() => tap(node)} />
      ))}

      {/* Fog over the far end: the path keeps going, it never ends. */}
      <g aria-hidden="true" pointerEvents="none">
        <rect x={-pad - 2} y={0} width={PATH_W + 2 * pad + 4} height={Math.max(0, fogEnd)} fill="url(#np-fog)" />
        <Cloud x={PATH_W * 0.3} y={58} scale={1} />
        <Cloud x={PATH_W * 0.72} y={88} scale={0.8} />
      </g>

      {cur && view.progress && <Progress spot={cur} progress={view.progress} />}

      {cur && (
        <text
          x={cur.x} y={cur.y - cur.r + 2} fontSize={62} textAnchor="middle" className="np-bob"
          aria-hidden="true"
          style={{ cursor: curNode?.kind === 'lesson' ? 'pointer' : undefined }}
          onClick={curNode ? () => tap(curNode) : undefined}
        >
          {character}
        </text>
      )}
    </svg>
  );
});

export default PathScene;

function Node({ node, spot, current, onTap }: { node: PathNode; spot: StoneSpot; current: boolean; onTap: () => void }) {
  if (node.kind === 'start') {
    return (
      <g aria-hidden="true">
        <circle cx={spot.x} cy={spot.y + 5} r={spot.r} fill={STONE_SHADOW} />
        <circle cx={spot.x} cy={spot.y} r={spot.r} fill={STONE_BASE} />
      </g>
    );
  }
  const label = node.kind === 'lesson'
    ? `${node.title}${node.state === 'done' ? ', done' : node.state === 'today' ? ', today' : ''}`
    : node.title;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); }
  };
  return (
    <g role="button" tabIndex={0} aria-label={label} onClick={onTap} onKeyDown={onKey}
      className="np-node" style={{ cursor: 'pointer' }} opacity={fadeFor(node.ahead)}>
      {node.kind === 'lesson'
        ? <Stone stone={node} spot={spot} current={current} />
        : <Sign sign={node} spot={spot} />}
    </g>
  );
}

function Stone({ stone, spot, current }: { stone: LessonStone; spot: StoneSpot; current: boolean }) {
  const { x, y, r } = spot;
  const col = stone.colour;
  const inner = r * 0.66;
  const emojiSize = (current ? 1.05 : 0.95) * r;
  return (
    <g>
      {/* A generous, invisible hit area: their finger, not the stone's edge. */}
      <circle className="np-hit" cx={x} cy={y} r={r + 10} fill="#000" fillOpacity={0} stroke="none" />
      <circle cx={x} cy={y + 5} r={r} fill={STONE_SHADOW} />
      {stone.state === 'done' && <circle cx={x} cy={y} r={r} fill={col} />}
      {stone.state === 'today' && (
        <>
          <circle cx={x} cy={y} r={r} fill={STONE_BASE} />
          <circle cx={x} cy={y} r={r} fill={col} fillOpacity={0.22} />
          <circle cx={x} cy={y} r={r - 3} fill="none" stroke={col} strokeWidth={6} />
        </>
      )}
      {stone.state === 'open' && (
        <>
          <circle cx={x} cy={y} r={r} fill={STONE_BASE} />
          <circle cx={x} cy={y} r={r - 2} fill="none" stroke={col} strokeWidth={3.5} />
        </>
      )}
      {stone.state === 'ahead' && (
        <>
          <circle cx={x} cy={y} r={r} fill={STONE_BASE} />
          <circle cx={x} cy={y} r={r - 2} fill="none" stroke={col} strokeOpacity={0.55} strokeWidth={2.5} strokeDasharray="5 5" />
        </>
      )}
      <circle cx={x} cy={y} r={inner} fill="#FFFFFF" />
      <circle cx={x} cy={y + 1.5} r={inner} fill="none" stroke="#000" strokeOpacity={0.05} strokeWidth={2} />
      <text x={x} y={y + emojiSize * 0.35} fontSize={emojiSize} textAnchor="middle" opacity={stone.state === 'ahead' ? 0.6 : 1}>
        {stone.emoji}
      </text>
    </g>
  );
}

/** A unit begins: a board in its colour with its picture. Tapping it says the unit's name. */
function Sign({ sign, spot }: { sign: UnitSign; spot: StoneSpot }) {
  const w = SIGN.w;
  const h = SIGN.h;
  const x0 = spot.x - w / 2;
  const y0 = spot.y - h / 2;
  return (
    <g>
      <rect className="np-hit" x={x0 - 8} y={y0 - 8} width={w + 16} height={h + 16} rx={26} fill="#000" fillOpacity={0} />
      <rect x={x0} y={y0 + 5} width={w} height={h} rx={20} fill={sign.colour} />
      <rect x={x0} y={y0 + 5} width={w} height={h} rx={20} fill="#000" opacity={0.22} />
      <rect x={x0} y={y0} width={w} height={h} rx={20} fill={sign.colour} />
      <circle cx={x0 + h / 2 + 2} cy={spot.y} r={h / 2 - 7} fill="#FFFFFF" />
      <text x={x0 + h / 2 + 2} y={spot.y + 11} fontSize={30} textAnchor="middle">{sign.emoji}</text>
      <Volume2 x={x0 + w - 40} y={spot.y - 13} width={26} height={26} color="#FFFFFF" strokeWidth={ICON_STROKE * 0.85} aria-hidden="true" />
      {sign.grade && <GradeSign spot={spot} text={sign.grade} />}
    </g>
  );
}

/** "2nd grade", small, beside the sign where a grade's road begins. For the grown-ups. */
function GradeSign({ spot, text }: { spot: StoneSpot; text: string }) {
  const w = 18 + text.length * 8.6;
  const h = 28;
  const gap = 12;
  const raw = roomySide(spot) === 'right' ? spot.x + SIGN.w / 2 + gap : spot.x - SIGN.w / 2 - gap - w;
  const x0 = Math.max(4, Math.min(PATH_W - 4 - w, raw));
  const y0 = spot.y - h / 2 - 8;
  return (
    <g aria-hidden="true">
      <rect x={x0 + w / 2 - 2.5} y={y0 + h - 2} width={5} height={20} rx={2.5} fill="#B9A47E" />
      <rect x={x0} y={y0 + 3} width={w} height={h} rx={9} fill="#000" opacity={0.07} />
      <rect x={x0} y={y0} width={w} height={h} rx={9} fill="#FFFDF7" stroke="#E2D5BB" strokeWidth={1.5} />
      <text x={x0 + w / 2} y={y0 + h / 2 + 5.5} fontSize={15} fontWeight={600} textAnchor="middle" fill={C.inkSoft}>{text}</text>
    </g>
  );
}

/** Lessons done in today's unit, as dots beside their stone. */
function Progress({ spot, progress }: { spot: StoneSpot; progress: UnitProgress }) {
  const slots = Math.max(1, progress.total);
  const w = pebblePillWidth(slots);
  const gap = 12;
  const raw = roomySide(spot) === 'right' ? spot.x + spot.r + gap : spot.x - spot.r - gap - w;
  const x0 = Math.max(4, Math.min(PATH_W - 4 - w, raw));
  const cy = spot.y;
  const col = progress.colour;
  const chipX = x0 + PEBBLE.pad + PEBBLE.chip / 2 - 3;
  const firstDot = x0 + PEBBLE.pad + PEBBLE.chip + PEBBLE.step / 2 - 2;
  return (
    <g aria-hidden="true" pointerEvents="none">
      <rect x={x0} y={cy - PEBBLE.h / 2 + 3} width={w} height={PEBBLE.h} rx={PEBBLE.h / 2} fill="#000" opacity={0.06} />
      <rect x={x0} y={cy - PEBBLE.h / 2} width={w} height={PEBBLE.h} rx={PEBBLE.h / 2} fill="#FFFFFF" opacity={0.95} />
      <text x={chipX} y={cy + 6} fontSize={17} textAnchor="middle">{progress.emoji}</text>
      {Array.from({ length: slots }, (_, k) => (
        <circle key={k} cx={firstDot + k * PEBBLE.step} cy={cy} r={PEBBLE.r}
          fill={k < progress.done ? col : '#FFFFFF'} stroke={col} strokeWidth={2.5} />
      ))}
    </g>
  );
}

function Friend({ at, emoji }: { at: { x: number; y: number }; emoji: string }) {
  return (
    <g>
      <ellipse cx={at.x} cy={at.y + 8} rx={16} ry={5} fill="#000" opacity={0.08} />
      <text x={at.x} y={at.y + 6} fontSize={28} textAnchor="middle">{emoji}</text>
    </g>
  );
}

function Cloud({ x, y, scale }: { x: number; y: number; scale: number }) {
  const parts: [number, number, number][] = [[-46, 6, 26], [-14, -8, 32], [22, -2, 28], [50, 8, 20]];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g transform="translate(0 6)" fill="#DCE9EE">
        {parts.map(([dx, dy, r], i) => <circle key={i} cx={dx} cy={dy} r={r} />)}
        <rect x={-72} y={4} width={142} height={30} rx={15} />
      </g>
      <g fill="#FFFFFF">
        {parts.map(([dx, dy, r], i) => <circle key={i} cx={dx} cy={dy} r={r} />)}
        <rect x={-72} y={4} width={142} height={30} rx={15} />
      </g>
    </g>
  );
}

/** Soft paper mounds behind the trail. */
function Hills({ height, spots, pad }: { height: number; spots: StoneSpot[]; pad: number }) {
  const bumps = spots
    .filter((_, i) => i % 3 === 1)
    .map((s) => ({ cx: s.x < PATH_W / 2 ? PATH_W + 10 + pad * 0.6 : -10 - pad * 0.6, cy: s.y + 30 }));
  return (
    <g>
      {bumps.map((b, i) => (
        <g key={i}>
          <ellipse cx={b.cx} cy={b.cy + 5} rx={130} ry={44} fill={C.grassDeep} opacity={0.45} />
          <ellipse cx={b.cx} cy={b.cy} rx={130} ry={44} fill="#C3DFA4" opacity={0.75} />
        </g>
      ))}
      <ellipse cx={40 - pad} cy={height + 4} rx={170 + pad} ry={56} fill={C.grassDeep} opacity={0.5} />
      <ellipse cx={40 - pad} cy={height} rx={170 + pad} ry={56} fill="#C3DFA4" />
      <ellipse cx={PATH_W - 10 + pad} cy={height + 18} rx={150 + pad} ry={50} fill={C.grassDeep} opacity={0.6} />
    </g>
  );
}

/** A few flowers in the grass, on the side the trail is not. */
function Flowers({ spots }: { spots: StoneSpot[] }) {
  const out: { x: number; y: number; e: string }[] = [];
  for (let i = 0; i < spots.length - 1; i += 2) {
    const a = spots[i];
    const b = spots[i + 1];
    const mid = (a.x + b.x) / 2;
    out.push({ x: mid < PATH_W / 2 ? PATH_W - 36 : 30, y: (a.y + b.y) / 2 + 6, e: i % 4 === 0 ? '🌼' : '🌷' });
  }
  return (
    <g>
      {out.map((f, i) => <text key={i} x={f.x} y={f.y} fontSize={18} textAnchor="middle" opacity={0.95}>{f.e}</text>)}
    </g>
  );
}
