import { useEffect, useRef } from 'react';

interface Props { count: number; active: boolean }

export default function StarBurst({ count, active }: Props) {
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    const s = document.createElement('style');
    s.textContent = `@keyframes starFly{0%{transform:translate(0,0) scale(1.2);opacity:1}100%{transform:translate(var(--sdx),var(--sdy)) scale(0.1);opacity:0}}`;
    document.head.appendChild(s);
  }, []);

  if (!active || count === 0) return null;

  const total = count * 10;
  const particles = Array.from({ length: total }, (_, i) => {
    const angle = (i / total) * 360 + Math.random() * 20;
    const dist = 60 + Math.random() * 80;
    return {
      dx: Math.cos((angle * Math.PI) / 180) * dist,
      dy: Math.sin((angle * Math.PI) / 180) * dist,
      delay: Math.random() * 0.5,
    };
  });

  return (
    <div style={{ position: 'absolute', top: '42%', left: '50%', pointerEvents: 'none', zIndex: 20 }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', fontSize: 18,
            '--sdx': `${p.dx}px`, '--sdy': `${p.dy}px`,
            animation: `starFly 0.9s ${p.delay}s ease-out forwards`,
          } as React.CSSProperties}
        >⭐</div>
      ))}
    </div>
  );
}
