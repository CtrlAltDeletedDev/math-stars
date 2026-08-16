import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { getCategoryById } from '@/data/categories';
import { LESSONS } from '@/data/lessons';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';

export default function Lesson() {
  const { categoryId = '', levelId = '' } = useParams<{ categoryId: string; levelId: string }>();
  const navigate = useNavigate();

  const category = getCategoryById(categoryId);
  const slides = LESSONS[levelId] ?? [];

  const [current, setCurrent] = useState(0);

  // Graceful fallback: no lesson data → go straight to game
  if (!category || slides.length === 0) {
    return <Navigate to={`/game/${categoryId}/${levelId}`} replace />;
  }

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  function goNext() {
    if (isLast) {
      navigate(`/game/${categoryId}/${levelId}`, { replace: true });
    } else {
      setCurrent((c) => c + 1);
    }
  }

  function skipToGame() {
    navigate(`/game/${categoryId}/${levelId}`, { replace: true });
  }

  return (
    <BackgroundGradient colors={[category.bgColor, category.darkColor]}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 16, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={skipToGame}
            style={{
              background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12,
              padding: '8px 16px', cursor: 'pointer',
              fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#fff',
            }}
          >← Skip</button>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {slides.map((_, i) => (
              <div key={i} style={{
                width: i === current ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? '#fff' : 'rgba(255,255,255,0.4)',
                transition: 'width 0.25s ease',
              }} />
            ))}
          </div>

          <div style={{ width: 72 }} />
        </div>

        {/* Slide card */}
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 24,
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          overflow: 'hidden',
        }}>
          {/* Big emoji */}
          <div className="anim-bounce" style={{ fontSize: 72, lineHeight: 1 }}>{slide.emoji}</div>

          {/* Title */}
          <div style={{
            fontFamily: 'Nunito', fontWeight: 800, fontSize: 26,
            color: '#fff', textAlign: 'center',
          }}>{slide.title}</div>

          {/* Body */}
          <div style={{
            fontFamily: 'Nunito', fontWeight: 600, fontSize: 17,
            color: 'rgba(255,255,255,0.95)', textAlign: 'center',
            lineHeight: 1.5,
          }}>{slide.body}</div>

          {/* Example block */}
          {slide.example && (
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 14,
              padding: '12px 20px',
              fontFamily: 'monospace',
              fontSize: 16,
              color: '#FFE066',
              textAlign: 'center',
              whiteSpace: 'pre-line',
              lineHeight: 1.7,
              width: '100%',
            }}>{slide.example}</div>
          )}

          {/* Tip chip */}
          {slide.tip && (
            <div style={{
              background: 'rgba(255,230,0,0.2)',
              border: '1px solid rgba(255,230,0,0.4)',
              borderRadius: 12,
              padding: '8px 16px',
              fontFamily: 'Nunito',
              fontWeight: 700,
              fontSize: 14,
              color: '#FFE066',
              textAlign: 'center',
            }}>{slide.tip}</div>
          )}
        </div>

        {/* Footer button */}
        <BigButton
          onPress={goNext}
          label={isLast ? '▶ Let\'s Play!' : 'Next →'}
          color={isLast ? '#FFE066' : 'rgba(255,255,255,0.3)'}
          textColor={isLast ? category.darkColor : '#fff'}
          fontSize={20}
        />
      </div>
    </BackgroundGradient>
  );
}
