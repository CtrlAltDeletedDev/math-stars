interface Props {
  prompt: string;
  type: string;
}

function parse(prompt: string): [number, number] | null {
  const m = prompt.match(/^(\d+)\s*[+\-]\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1]), parseInt(m[2])];
}

export default function DotAid({ prompt, type }: Props) {
  if (type !== 'addition' && type !== 'subtraction') return null;
  const parsed = parse(prompt);
  if (!parsed) return null;
  const [a, b] = parsed;
  if (a > 10 || b > 10) return null;

  const isAdd = type === 'addition';
  const colorA = '#4ECDC4';
  const colorB = isAdd ? '#45B7D1' : '#FF6B6B';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', padding: '2px 0' }}>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 130 }}>
        {Array.from({ length: a }, (_, i) => (
          <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: colorA, boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }} />
        ))}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#666', flexShrink: 0 }}>{isAdd ? '+' : '−'}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 130 }}>
        {Array.from({ length: b }, (_, i) => (
          <div
            key={i}
            style={{
              width: 20, height: 20, borderRadius: '50%',
              background: colorB,
              opacity: isAdd ? 1 : 0.45,
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
