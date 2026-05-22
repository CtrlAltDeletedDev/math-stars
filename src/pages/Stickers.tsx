import { useNavigate } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { STICKERS } from '@/data/stickers';
import { getTheme } from '@/data/shop';
import BackgroundGradient from '@/components/ui/BackgroundGradient';

export default function Stickers() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const theme = getTheme(progress.activeTheme);
  const earnedSet = new Set(progress.earnedStickers ?? []);

  return (
    <BackgroundGradient colors={theme.colors}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 22, cursor: 'pointer' }}
          >←</button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Nunito', fontWeight: 800, fontSize: 22, color: '#fff' }}>
            🎨 Sticker Album ({earnedSet.size}/{STICKERS.length})
          </div>
          <div style={{ width: 44 }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {STICKERS.map((s) => {
              const earned = earnedSet.has(s.id);
              return (
                <div
                  key={s.id}
                  className={earned ? 'anim-pop' : ''}
                  style={{
                    background: earned ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.18)',
                    borderRadius: 18, padding: '14px 8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    textAlign: 'center',
                    boxShadow: earned ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 36, filter: earned ? 'none' : 'grayscale(1)', opacity: earned ? 1 : 0.35 }}>
                    {s.emoji}
                  </div>
                  <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: earned ? '#333' : 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>
                    {earned ? s.name : '???'}
                  </div>
                  {!earned && (
                    <div style={{ fontFamily: 'Nunito', fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.2 }}>
                      {s.unlockHint}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BackgroundGradient>
  );
}
