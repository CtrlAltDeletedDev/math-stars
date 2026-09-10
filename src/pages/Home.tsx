import { useNavigate, Navigate } from 'react-router-dom';
import { useRef } from 'react';
import { useProgress } from '@/store/useProgress';
import { topicsForGrade } from '@/data/topics';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { getTheme } from '@/data/shop';
import { STICKERS } from '@/data/stickers';
import { countDueReviews } from '@/engine/sessionBuilder';
import { masteryFor } from '@/engine/mastery';
import { todayString } from '@/engine/dates';
import TopicTile from '@/components/home/TopicTile';
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

  // A <Navigate> element, not a navigate() call: routing during render is a side
  // effect in the render phase and React warns about it.
  if (!progress.characterId) return <Navigate to="/character-select" replace />;
  // A grown-up picks the grade before anything else, so the topic grid below is
  // already the right size the first time she sees it.
  if (progress.gradeLevel === null) return <Navigate to="/grade" replace />;

  const theme = getTheme(progress.activeTheme);
  const character = CHARACTERS.find((c) => c.id === progress.characterId);
  const emoji = character ? getCharacterEmoji(character.id, progress.totalStars) : '⭐';
  const earnedStickers = (progress.earnedStickers ?? []).length;
  const dueReviews = countDueReviews(progress);
  const topics = topicsForGrade(progress.gradeLevel);

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

          {/* The one answer to "what should I do?" — adaptive, in-scope, always
              right. It used to compete with a recommended level and a daily
              challenge that a child who cannot read could not tell apart. */}
          <button
            onClick={() => navigate('/practice')}
            aria-label="Play"
            style={{
              background: 'linear-gradient(135deg, #7E57C2, #4527A0)',
              border: '3px solid rgba(255,255,255,0.5)', borderRadius: 22,
              padding: '22px 18px', cursor: 'pointer', width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
              boxShadow: '0 6px 0 rgba(0,0,0,0.22)', minHeight: 96,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: 40, lineHeight: 1 }}>▶</span>
            <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 32, color: '#fff' }}>Play</span>
          </button>

          {/* The daily ritual, and the mistakes worth another look. */}
          <DailyChallengeCard progress={progress} onPress={() => navigate('/game/daily/challenge')} />

          {dueReviews > 0 && (
            <button
              onClick={() => navigate('/game/review/practice')}
              style={{
                background: 'rgba(67,160,71,0.45)', border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: 14, padding: '12px 16px', cursor: 'pointer', minHeight: 48,
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

          {/* Every topic in her grade, always visible, always tappable, in a
              fixed order. Position is how a child who cannot read finds the one
              she wants, so this must never be sorted by recency. */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 2 }}>
            {topics.map((topic) => (
              <TopicTile
                key={topic.id}
                topic={topic}
                mastery={masteryFor(topic.id, progress)}
                onPress={() => navigate(`/topic/${topic.id}`)}
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
