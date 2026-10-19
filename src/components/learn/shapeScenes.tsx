import { Scene } from '@/data/learn';

// Pictures for clocks, shapes, patterns, measuring and fractions. Each is drawn
// from the few numbers in its Scene, so a lesson stays data.

type Of<K extends Scene['kind']> = Extract<Scene, { kind: K }>;

// Placeholders until each picture is drawn: the numbers, so nothing is blank.
const Placeholder = ({ text }: { text: string }) => (
  <div style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 28, color: '#3A4652', textAlign: 'center' }}>{text}</div>
);

export function ClockScene({ hour, minute }: Of<'clock'>) {
  return <Placeholder text={`${hour}:${String(minute).padStart(2, '0')}`} />;
}

export function ShapeScene({ shape }: Of<'shape'>) {
  return <Placeholder text={shape} />;
}

export function PatternScene({ items, blank }: Of<'pattern'>) {
  return <Placeholder text={[...items, ...(blank ? ['?'] : [])].join(' ')} />;
}

export function LengthsScene({ items }: Of<'lengths'>) {
  return <Placeholder text={items.map((i) => `${i.emoji} ${i.length}`).join('  ')} />;
}

export function WeighScene({ left, right, heavier }: Of<'weigh'>) {
  return <Placeholder text={heavier === 'left' ? `${left} > ${right}` : `${left} < ${right}`} />;
}

export function FractionScene({ parts, shaded }: Of<'fraction'>) {
  return <Placeholder text={`${shaded}/${parts}`} />;
}
