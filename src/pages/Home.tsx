import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useProgress } from '@/store/useProgress';
import { CATEGORIES } from '@/data/categories';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { getTheme } from '@/data/shop';
import { STICKERS } from '@/data/stickers';
import CategoryCard from '@/components/home/CategoryCard';
import StarBadge from '@/components/ui/StarBadge';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import PlayCalendar from '@/components/ui/PlayCalendar';
import InstallBanner from '@/components/ui/InstallBanner';

export default function Home() {
  const { progress, isLoaded, toggleMusic, toggleChallengeMode } = useProgress();
  const navigate = useNavigate();
  const titleTaps = useRef(0);
  const titleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTitleTap() {
    titleTaps.current += 1;
    if (titleTapTimer.current) clearTimeout(titleTapTimer.current);
    if (titleTaps.current >= 3) {
      titleTaps.current = 0;
      navigate('/parent');
    } else {
      titleTapTimer.current = setTimeout(() => { titleTaps.current = 0; }, 700);
    }
  }

  if (!isLoaded) {
    return (
      <div style={{ height: '100dvh', background: '#87CEEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
        ⭐
      </div>
    );
  }

  if (!progress.characterId) {
    navigate('/character-select', { replace: true });
    return null;
  }

  const theme = getTheme(progress.activeTheme);
  const character = CHARACTERS.find((c) => c.id === progress.characterId);
  const emoji = character ? getCharacterEmoji(character.id, progress.totalStars) : '⭐';
  const earnedStickers = (progress.earnedStickers ?? []).length;

  return (
    <BackgroundGradient colors={theme.colors}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: 8, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate('/character-select')}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 16, padding: '8px 14px', fontSize: 26, cursor: 'pointer' }}
          >{emoji}</button>
          <div onClick={handleTitleTap} style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 28, color: '#fff', cursor: 'default', userSelect: 'none' }}>Math Stars!</div>
          <StarBadge count={progress.totalStars} />
        </div>

        {/* Quick-toggle row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={toggleMusic}
            style={{
              flex: 1, background: progress.musicEnabled ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
              border: progress.musicEnabled ? '2px solid #fff' : '2px solid transparent',
              borderRadius: 14, padding: '8px 6px', cursor: 'pointer',
              fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#fff',
            }}
          >{progress.musicEnabled ? '🎵 Music On' : '🔇 Music Off'}</button>
          <button
            onClick={toggleChallengeMode}
            style={{
              flex: 1, background: progress.challengeMode ? 'rgba(255,180,0,0.5)' : 'rgba(255,255,255,0.2)',
              border: progress.challengeMode ? '2px solid #FFE066' : '2px solid transparent',
              borderRadius: 14, padding: '8px 6px', cursor: 'pointer',
              fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#fff',
            }}
          >{progress.challengeMode ? '⏱️ Challenge!' : '⏱️ Challenge'}</button>
        </div>

        {/* Streak banner */}
        {progress.currentStreak > 1 && (
          <div style={{
            background: 'rgba(255,150,0,0.3)', borderRadius: 14, padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#fff',
          }}>
            <span>{'🔥'.repeat(Math.min(progress.currentStreak, 7))}</span>
            <span>{progress.currentStreak} day streak!</span>
          </div>
        )}

        {/* Install banner */}
        <InstallBanner />

        {/* Play calendar */}
        <PlayCalendar playHistory={progress.playHistory ?? []} />

        {/* Category grid — scrollable so footer stays pinned */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 4 }}>
            {CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                progress={progress.categories[cat.id]}
                onPress={() => navigate(`/category/${cat.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/badges')} style={footerBtn}>
            🏅 Badges ({progress.earnedBadges.length})
          </button>
          <button onClick={() => navigate('/stickers')} style={footerBtn}>
            🎨 Stickers ({earnedStickers}/{STICKERS.length})
          </button>
          <button onClick={() => navigate('/shop')} style={footerBtn}>
            🛍️ ⭐{progress.spendableStars}
          </button>
        </div>
      </div>
    </BackgroundGradient>
  );
}

const footerBtn: React.CSSProperties = {
  flex: 1, background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 16,
  padding: '10px 4px', cursor: 'pointer', fontFamily: 'Nunito', fontWeight: 700,
  fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
};
