import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useProgress } from '@/store/useProgress';
import { CATEGORIES } from '@/data/categories';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { getTheme } from '@/data/shop';
import { STICKERS } from '@/data/stickers';
import { countDueReviews } from '@/engine/sessionBuilder';
import CategoryCard from '@/components/home/CategoryCard';
import DailyChallengeCard from '@/components/home/DailyChallengeCard';
import TodayStrip from '@/components/home/TodayStrip';
import StarBadge from '@/components/ui/StarBadge';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import InstallBanner from '@/components/ui/InstallBanner';
import { GAME_CONFIG } from '@/constants/gameConfig';

export default function Home() {
  const { progress, isLoaded, toggleMusic } = useProgress();
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
  const dueReviews = countDueReviews(progress);

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

        {/* Today strip: streak + goal + music in one compact row */}
        <TodayStrip
          streak={progress.currentStreak}
          questionsToday={progress.dailyQuestionsDate === new Date().toISOString().split('T')[0] ? progress.dailyQuestionsCount : 0}
          goal={GAME_CONFIG.dailyGoalQuestions}
          musicEnabled={progress.musicEnabled}
          onToggleMusic={toggleMusic}
        />

        {/* Install banner */}
        <InstallBanner />

        {/* Daily challenge card */}
        <DailyChallengeCard progress={progress} onPress={() => navigate('/game/daily/challenge')} />

        {/* Practice mistakes */}
        {dueReviews > 0 && (
          <button
            onClick={() => navigate('/game/review/practice')}
            style={{
              background: 'rgba(67,160,71,0.45)', border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: 14, padding: '10px 16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#fff',
            }}
          >
            <span>💪 Practice Mistakes</span>
            <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 12, padding: '2px 10px', fontSize: 13 }}>
              {dueReviews} to review
            </span>
          </button>
        )}

        {/* Category grid — scrollable so footer stays pinned */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 4 }}>
            {CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                progress={progress.categories[cat.id]}
                onPress={() => navigate(`/category/${cat.id}`)}
                onMasterPress={() => navigate(`/game/master/${cat.id}`)}
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
