import { useEffect, useRef } from 'react';

const COLORS = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9F43'];

interface Piece {
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  isCircle: boolean;
}

export default function Confetti({ active }: { active: boolean }) {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confettiFall {
        0%   { transform: translateY(-30px) rotate(0deg); opacity: 1; }
        80%  { opacity: 1; }
        100% { transform: translateY(110vh) rotate(800deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (!active) return null;

  const pieces: Piece[] = Array.from({ length: 50 }, (_, i) => ({
    x: (i / 50) * 100 + (Math.sin(i * 1.7) * 4),
    color: COLORS[i % COLORS.length],
    size: 8 + (i % 5) * 2,
    delay: (i % 20) * 0.12,
    duration: 2.8 + (i % 7) * 0.3,
    isCircle: i % 3 === 0,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.isCircle ? '50%' : 3,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}
