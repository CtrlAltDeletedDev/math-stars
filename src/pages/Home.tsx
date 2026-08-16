import { useNavigate, Navigate } from 'react-router-dom';
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
import { todayString } from '@/engine/dates';

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

  // A <Navigate> element, not a navigate() call: routing during render is a side
  // effect in the render phase and React warns about it.
  if (!progress.characterId) return <Navigate to="/character-select" replace />;

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
          questionsToday={progress.dailyQuestionsDate === todayString() ? progress.dailyQuestionsCount : 0}
          goal={GAME_CONFIG.dailyGoalQuestions}
          musicEnabled={progress.musicEnabled}
          onToggleMusic={toggleMusic}
        />

        {/* Install banner */}
        <InstallBanner />

        {/* Endless adaptive practice — the main way in */}
        <button
          onClick={() => navigate('/practice')}
          style={{
            background: 'linear-gradient(135deg, #7E57C2, #4527A0)',
            border: '2px solid rgba(255,255,255,0.45)', borderRadius: 18,
            padding: '16px 18px', cursor: 'pointer', width: '100%',
            display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
            boxShadow: '0 4px 0 rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ fontSize: 36 }}>♾️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 19, color: '#fff' }}>Practice</div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
              A mix of everything, just right for you
            </div>
          </div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 22, color: '#fff' }}>▶</div>
        </button>

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
