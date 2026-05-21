import { useNavigate } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { BADGES } from '@/data/badges';
import { getTheme } from '@/data/shop';
import BackgroundGradient from '@/components/ui/BackgroundGradient';

export default function Badges() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const theme = getTheme(progress.activeTheme);
  const earnedIds = new Set(progress.earnedBadges.map((b) => b.badgeId));

  return (
    <BackgroundGradient colors={theme.colors}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 22, cursor: 'pointer' }}
          >
            ←
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Nunito', fontWeight: 800, fontSize: 22, color: '#fff' }}>
            🏅 Badges ({earnedIds.size}/{BADGES.length})
          </div>
          <div style={{ width: 44 }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {BADGES.map((badge) => {
              const earned = earnedIds.has(badge.id);
              return (
                <div
                  key={badge.id}
                  style={{
                    background: earned ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.25)',
                    borderRadius: 20, padding: '18px 14px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 44, opacity: earned ? 1 : 0.35 }}>{earned ? badge.emoji : '🔒'}</div>
                  <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: earned ? '#333' : 'rgba(255,255,255,0.6)' }}>
                    {earned ? badge.title : '???'}
                  </div>
                  {earned && (
                    <div style={{ fontFamily: 'Nunito', fontWeight: 400, fontSize: 12, color: '#666' }}>
                      {badge.description}
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
