import { useEffect, useRef, useState } from 'react';

interface Props {
  count: number;
  size?: number;
}

export default function StarBadge({ count, size = 28 }: Props) {
  const [anim, setAnim] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current) {
      prevCount.current = count;
      setAnim(true);
      const t = setTimeout(() => setAnim(false), 500);
      return () => clearTimeout(t);
    }
  }, [count]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        fontSize: size,
        display: 'inline-block',
        transform: anim ? 'scale(1.4)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>⭐</span>
      <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: size * 0.9, color: '#FFD700' }}>
        {count}
      </span>
    </div>
  );
}
