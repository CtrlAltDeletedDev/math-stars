import { ChevronRight } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
interface Props {
  prompt: string;
}

export default function NumberLine({ prompt }: Props) {
  const parts = prompt.split(',').map((s) => s.trim().replace('?', '').trim());
  const known = parts.filter((s) => s !== '').map(Number).filter((n) => !isNaN(n));
  if (known.length < 2) return null;

  const step = known[1] - known[0];
  if (step <= 0) return null;

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '4px 2px', width: 'max-content' }}>
        {known.map((n, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#4ECDC4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              flexShrink: 0,
            }}>{n}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, color: '#888', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              <div style={{ width: 18, height: 2, background: '#ccc' }} />
              <span style={{ fontFamily: 'Nunito', fontSize: 11, color: '#aaa' }}>+{step}</span>
              <div style={{ width: 18, height: 2, background: '#ccc' }} />
              <ChevronRight size={14} strokeWidth={ICON_STROKE} color="#aaa" aria-hidden />
            </div>
          </div>
        ))}
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: '#FFF9C4', border: '2.5px dashed #F9A825',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: '#555',
          flexShrink: 0,
        }}>?</div>
      </div>
    </div>
  );
}
