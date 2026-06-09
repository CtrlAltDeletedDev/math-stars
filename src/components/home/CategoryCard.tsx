import { useState } from 'react';
import { Category } from '@/types';
import { CategoryProgress } from '@/types';

interface Props {
  category: Category;
  progress: CategoryProgress | undefined;
  onPress: () => void;
  onMasterPress?: () => void;
}

export default function CategoryCard({ category, progress, onPress, onMasterPress }: Props) {
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
      <div style={{ fontSize: 52, lineHeight: 1 }}>{category.emoji}</div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
        {category.title}
      </div>
      {/* Visual progress dots instead of text — readable without reading */}
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: 4,
            background: i < completed ? '#FFE066' : 'rgba(255,255,255,0.3)',
          }} />
        ))}
        {stars > 0 && (
          <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.85)', marginLeft: 4 }}>
            ⭐{stars}
          </span>
        )}
      </div>
      {completed === total && total > 0 && onMasterPress && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => { e.stopPropagation(); onMasterPress(); }}
          style={{
            background: 'rgba(255,255,255,0.25)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: 10,
            padding: '4px 10px',
            fontFamily: 'Nunito',
            fontWeight: 800,
            fontSize: 11,
            color: '#fff',
            cursor: 'pointer',
          }}
        >⭐ Master Mode</button>
      )}
    </button>
  );
}
