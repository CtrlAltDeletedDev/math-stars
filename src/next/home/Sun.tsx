import { Check } from 'lucide-react';
import { C } from '../theme';

// Today's sun: fills a slice with each walk, full at her daily goal. A small
// row of dots beside it counts the walks, so "one more" is something she can see.

const SIZE = 48;

function pie(cx: number, cy: number, r: number, frac: number): string {
  if (frac <= 0) return '';
  const a = frac * Math.PI * 2;
  const x = cx + r * Math.sin(a);
  const y = cy - r * Math.cos(a);
  return `M${cx} ${cy} L${cx} ${cy - r} A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`;
}

export default function Sun({ fill, walks, goal }: { fill: number; walks: number; goal: number }) {
  const full = fill >= 1;
  const c = SIZE / 2;
  const rays = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);
  const dots = Math.min(goal, 6);
  return (
    <div
      role="img"
      aria-label={`Today's sun: ${walks} of ${goal} walks`}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px 4px 4px', borderRadius: 999,
        background: 'rgba(255,255,255,0.7)', boxShadow: '0 2px 0 rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ position: 'relative', width: SIZE, height: SIZE, display: 'block' }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" className={full ? 'np-sun-full' : undefined}>
          {rays.map((a, i) => (
            <line key={i}
              x1={c + 17 * Math.sin(a)} y1={c - 17 * Math.cos(a)}
              x2={c + 22 * Math.sin(a)} y2={c - 22 * Math.cos(a)}
              stroke={full ? C.amber : '#F2D58C'} strokeWidth={3.5} strokeLinecap="round" />
          ))}
          <circle cx={c} cy={c} r={14} fill={C.amberSoft} stroke="#F2D58C" strokeWidth={2} />
          {full ? <circle cx={c} cy={c} r={14} fill={C.amber} /> : <path d={pie(c, c, 14, fill)} fill={C.amber} />}
        </svg>
        {full && (
          <>
            <Check size={18} strokeWidth={3.5} color="#FFFFFF" aria-hidden="true"
              style={{ position: 'absolute', left: c - 9, top: c - 9 }} />
            <Sparkle x={SIZE - 8} y={2} size={12} delay={0} />
            <Sparkle x={-2} y={SIZE - 14} size={9} delay={0.7} />
          </>
        )}
      </span>
      <span style={{ display: 'flex', gap: 4 }} aria-hidden="true">
        {Array.from({ length: dots }, (_, i) => (
          <i key={i} style={{
            width: 11, height: 16, borderRadius: '50% 50% 45% 45%', display: 'block',
            border: `2.5px solid ${i < walks ? C.go : '#CFC4AE'}`, background: i < walks ? C.go : 'transparent',
            boxSizing: 'border-box',
          }} />
        ))}
      </span>
    </div>
  );
}

function Sparkle({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true" className="np-twinkle"
      style={{ position: 'absolute', left: x, top: y, animationDelay: `${delay}s` }}>
      <path d="M5 0 Q5.6 4.4 10 5 Q5.6 5.6 5 10 Q4.4 5.6 0 5 Q4.4 4.4 5 0Z" fill={C.amber} />
    </svg>
  );
}
