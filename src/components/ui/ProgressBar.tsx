import { useEffect, useRef } from 'react';

interface Props {
  current: number;
  total: number;
  color?: string;
}

export default function ProgressBar({ current, total, color = '#FFD700' }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = total > 0 ? Math.min(1, current / total) : 0;

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${pct * 100}%`;
    }
  }, [pct]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 12, background: 'rgba(255,255,255,0.4)', borderRadius: 6, overflow: 'hidden' }}>
        <div
          ref={barRef}
          style={{
            height: '100%',
            background: color,
            borderRadius: 6,
            width: `${pct * 100}%`,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#fff', minWidth: 36, textAlign: 'right' }}>
        {current}/{total}
      </span>
    </div>
  );
}
