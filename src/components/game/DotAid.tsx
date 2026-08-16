interface Props {
  prompt: string;
  type: string;
}

function parse(prompt: string): [number, number] | null {
  const m = prompt.match(/^(\d+)\s*[+\-]\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1]), parseInt(m[2])];
}

const TEAL = '#4ECDC4';
const BLUE = '#45B7D1';
const RED = '#FF6B6B';

function Dot({ color, crossed }: { color: string; crossed?: boolean }) {
  return (
    <div style={{ position: 'relative', width: 22, height: 22 }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', background: color,
        opacity: crossed ? 0.3 : 1,
        boxShadow: crossed ? 'none' : '0 2px 4px rgba(0,0,0,0.15)',
      }} />
      {crossed && (
        <svg width="22" height="22" viewBox="0 0 22 22" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
          <line x1="3" y1="3" x2="19" y2="19" stroke={RED} strokeWidth="3" strokeLinecap="round" />
          <line x1="19" y1="3" x2="3" y2="19" stroke={RED} strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

export default function DotAid({ prompt, type }: Props) {
  if (type !== 'addition' && type !== 'subtraction') return null;
  const parsed = parse(prompt);
  if (!parsed) return null;
  const [a, b] = parsed;
  if (a > 10 || b > 10) return null;

  // Subtraction is *one* group with some taken away, not two groups side by
  // side. The old version drew 7 dots, a minus sign, and 3 more faded dots —
  // which is the picture for "7 and 3", the exact idea we don't want.
  if (type === 'subtraction') {
    return (
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 280, padding: '2px 0' }}>
        {Array.from({ length: a }, (_, i) => (
          <Dot key={i} color={TEAL} crossed={i >= a - b} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', padding: '2px 0' }}>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 130 }}>
        {Array.from({ length: a }, (_, i) => <Dot key={i} color={TEAL} />)}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#666', flexShrink: 0 }}>+</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 130 }}>
        {Array.from({ length: b }, (_, i) => <Dot key={i} color={BLUE} />)}
      </div>
    </div>
  );
}
