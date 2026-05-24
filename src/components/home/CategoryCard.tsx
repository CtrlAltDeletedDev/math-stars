import { useState } from 'react';
import { Category } from '@/types';
import { CategoryProgress } from '@/types';

interface Props {
  category: Category;
  progress: CategoryProgress | undefined;
  onPress: () => void;
}

export default function CategoryCard({ category, progress, onPress }: Props) {
  const [pressed, setPressed] = useState(false);
  const levels = Object.values(progress?.levels ?? {});
  const completed = levels.filter((l) => l.status === 'completed').length;
  const total = levels.length;
  const stars = progress?.totalStarsEarned ?? 0;

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onPress(); }}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: category.bgColor,
        borderRadius: 20,
        padding: '14px 12px',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        boxShadow: pressed ? 'none' : '0 4px 0 rgba(0,0,0,0.15)',
        transform: pressed ? 'translateY(3px) scale(0.97)' : 'translateY(0) scale(1)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 36 }}>{category.emoji}</div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
        {category.title}
      </div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
        ⭐ {stars} · {completed}/{total} levels
      </div>
    </button>
  );
}
