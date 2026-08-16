import { useNavigate, Navigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useProgress } from '@/store/useProgress';
import { CATEGORIES } from '@/data/categories';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { getTheme } from '@/data/shop';
import { STICKERS } from '@/data/stickers';
import { countDueReviews } from '@/engine/sessionBuilder';
import { findNextUp } from '@/engine/nextUp';
import { todayString } from '@/engine/dates';
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
  // Eleven category tiles at once is a wall of doors. They start folded away
  // behind one button, so the screen leads with what to actually play.
  const [showAllTopics, setShowAllTopics] = useState(false);

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
  const nextUp = findNextUp(progress);

  const nextLabel = nextUp
    ? nextUp.reason === 'continue' ? 'Keep going' : nextUp.reason === 'new' ? 'New level!' : 'Try this next'
    : null;

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

        <TodayStrip
          streak={progress.currentStreak}
          questionsToday={progress.dailyQuestionsDate === todayString() ? progress.dailyQuestionsCount : 0}
          goal={GAME_CONFIG.dailyGoalQuestions}
          musicEnabled={progress.musicEnabled}
          onToggleMusic={toggleMusic}
        />

        <InstallBanner />

        {/* Everything below scrolls; the three big choices come first. */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 4 } as React.CSSProperties}>

          {/* 1 — the single most sensible next thing */}
          {nextUp && (
            <button
              onClick={() => navigate(`/game/${nextUp.categoryId}/${nextUp.level.id}`)}
              style={{
                background: nextUp.bgColor, border: '2px solid rgba(255,255,255,0.45)', borderRadius: 20,
                padding: '18px 18px', cursor: 'pointer', width: '100%',
                display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                boxShadow: '0 5px 0 rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ fontSize: 44, lineHeight: 1 }}>{nextUp.categoryEmoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {nextLabel}
                </div>
                <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 21, color: '#fff' }}>
                  {nextUp.level.title}
                </div>
                <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {nextUp.categoryTitle}
                </div>
              </div>
              <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 26, color: '#fff' }}>▶</div>
            </button>
          )}

          {/* 2 — endless adaptive practice */}
          <button
            onClick={() => navigate('/practice')}
            style={{
              background: 'linear-gradient(135deg, #7E57C2, #4527A0)',
              border: '2px solid rgba(255,255,255,0.45)', borderRadius: 18,
              padding: '14px 18px', cursor: 'pointer', width: '100%',
              display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
              boxShadow: '0 4px 0 rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ fontSize: 34 }}>♾️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 19, color: '#fff' }}>Practice</div>
              <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                A mix of everything, just right for you
              </div>
            </div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 22, color: '#fff' }}>▶</div>
          </button>

          {/* 3 — the daily ritual */}
          <DailyChallengeCard progress={progress} onPress={() => navigate('/game/daily/challenge')} />

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

          {/* Everything else, folded away */}
          <button
            onClick={() => setShowAllTopics((v) => !v)}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 14,
              padding: '11px 16px', cursor: 'pointer', width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#fff',
            }}
          >
            <span>📚 All Topics</span>
            <span>{showAllTopics ? '▲' : '▼'}</span>
          </button>

          {showAllTopics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
          )}
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
