import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useProgress } from '@/store/useProgress';
import { CATEGORIES } from '@/data/categories';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { getTheme } from '@/data/shop';
import CategoryCard from '@/components/home/CategoryCard';
import StarBadge from '@/components/ui/StarBadge';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import PlayCalendar from '@/components/ui/PlayCalendar';
import InstallBanner from '@/components/ui/InstallBanner';

export default function Home() {
  const { progress, isLoaded } = useProgress();
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

  return (
    <BackgroundGradient colors={theme.colors}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 16, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate('/character-select')}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 16, padding: '8px 14px', fontSize: 26, cursor: 'pointer' }}
          >
            {emoji}
          </button>
          <div onClick={handleTitleTap} style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 28, color: '#fff', cursor: 'default', userSelect: 'none' }}>Math Stars!</div>
          <StarBadge count={progress.totalStars} />
        </div>

        {/* Install banner */}
        <InstallBanner />

        {/* Play calendar + streak */}
        <PlayCalendar playHistory={progress.playHistory ?? []} />

        {/* Category grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1 }}>
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              progress={progress.categories[cat.id]}
              onPress={() => navigate(`/category/${cat.id}`)}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate('/badges')}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 16,
              padding: '12px 8px', cursor: 'pointer', fontFamily: 'Nunito', fontWeight: 700,
              fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            🏅 Badges ({progress.earnedBadges.length})
          </button>
          <button
            onClick={() => navigate('/shop')}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 16,
              padding: '12px 8px', cursor: 'pointer', fontFamily: 'Nunito', fontWeight: 700,
              fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            🛍️ Shop (⭐{progress.spendableStars})
          </button>
        </div>
      </div>
    </BackgroundGradient>
  );
}
