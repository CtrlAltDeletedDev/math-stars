import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getCategoryById } from '@/data/categories';
import { Level } from '@/types';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { useProgress } from '@/store/useProgress';
import { calculateStars, didPassLevel } from '@/engine/scoring';
import { BadgeEarned } from '@/types';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BadgeModal from '@/components/ui/BadgeModal';
import BigButton from '@/components/ui/BigButton';
import Confetti from '@/components/ui/Confetti';
import StarBurst from '@/components/ui/StarBurst';
import Toast from '@/components/ui/Toast';

type WrongAnswer = { prompt: string; correct: string };

export default function Celebration() {
  const { categoryId = '', levelId = '' } = useParams<{ categoryId: string; levelId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { progress } = useProgress();

  const state = location.state as {
    correctCount: number;
    totalCount: number;
    newBadges: BadgeEarned[];
    newStickers: string[];
    streakBonus: number;
    dcStreakBonus?: number;
    wrongAnswers: WrongAnswer[];
    isDailyChallenge?: boolean;
    isMasterMode?: boolean;
    masterCategoryId?: string;
  } | null;
  const correctCount = state?.correctCount ?? 0;
  const totalCount = state?.totalCount ?? 10;
  const newBadges = state?.newBadges ?? [];
  const newStickers = state?.newStickers ?? [];
  const streakBonus = state?.streakBonus ?? 0;
  const dcStreakBonus = state?.dcStreakBonus ?? 0;
  const wrongAnswers = state?.wrongAnswers ?? [];
  const isDailyChallenge = state?.isDailyChallenge ?? false;
  const isMasterMode = state?.isMasterMode ?? false;
  const masterCategoryId = state?.masterCategoryId ?? '';

  const score = totalCount > 0 ? correctCount / totalCount : 0;
  const stars = calculateStars(score);
  const passed = didPassLevel(score);
  const isPerfect = correctCount === totalCount && totalCount >= 5;

  const realCategory = categoryId === 'master' ? getCategoryById(masterCategoryId || levelId) : getCategoryById(categoryId);
  const category = categoryId === 'daily'
    ? { id: 'daily', bgColor: '#FF9F43', darkColor: '#EE5A24', title: 'Daily Challenge', emoji: '🌟', levels: [] }
    : categoryId === 'review'
    ? { id: 'review', bgColor: '#43A047', darkColor: '#1B5E20', title: 'Practice Mistakes', emoji: '💪', levels: [] }
    : (realCategory ?? null);

  const character = CHARACTERS.find((c) => c.id === progress.characterId);
  const emoji = character ? getCharacterEmoji(character.id, progress.totalStars) : '⭐';
  const characterName = character?.name ?? 'Math Star';

  // After passing, the natural next action is the next level — not replaying
  // this one, and certainly not backing out to the map to hunt for it.
  const nextLevel: Level | null = (() => {
    if (!passed || isDailyChallenge || isMasterMode || !realCategory) return null;
    const idx = realCategory.levels.findIndex((l) => l.id === levelId);
    return idx >= 0 ? realCategory.levels[idx + 1] ?? null : null;
  })();

  const [visibleStars, setVisibleStars] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const [badgeIndex, setBadgeIndex] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const currentBadge = newBadges[badgeIndex] ?? null;

  const toastMessages = [
    ...newStickers.map(() => '🎨 New sticker unlocked!'),
    ...(streakBonus > 0 ? [`🔥 Streak bonus: +${streakBonus} ⭐`] : []),
    ...(dcStreakBonus > 0 ? [`⭐ Daily bonus: +${dcStreakBonus} stars!`] : []),
  ];

  useEffect(() => {
    let i = 0;
    let burstTimer: ReturnType<typeof setTimeout> | null = null;
    const id = setInterval(() => {
      i++;
      setVisibleStars(i);
      if (i >= stars) {
        clearInterval(id);
        if (stars > 0) burstTimer = setTimeout(() => setShowBurst(true), 200);
      }
    }, 300);
    return () => {
      clearInterval(id);
      if (burstTimer) clearTimeout(burstTimer);
    };
  }, [stars]);

  // An in-page panel rather than a popup. `window.open` + document.write is
  // blocked by default on iOS Safari, and the old markup pulled its font from
  // Google Fonts, so it also failed offline — which is most of the time for a
  // home-screen app.
  const [showCertificate, setShowCertificate] = useState(false);
  const certDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  if (!category) return null;

  return (
    <BackgroundGradient colors={[category.bgColor, category.darkColor]}>
      <Toast messages={toastMessages} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20, position: 'relative', overflow: 'hidden' }}>
        <Confetti active={passed} />
        <StarBurst count={stars} active={showBurst} />

        <div className="anim-bounce" style={{ fontSize: isPerfect ? 88 : 72, zIndex: 1 }}>{emoji}</div>

        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: isPerfect ? 38 : 34, color: '#fff', textAlign: 'center', zIndex: 1 }}>
          {isDailyChallenge ? '🌟 Daily Challenge Complete! 🌟' : isPerfect ? '🌟 PERFECT! 🌟' : passed ? '🎉 Level Complete!' : '💪 Good Try!'}
        </div>

        {isDailyChallenge && progress.dailyChallengeStreak > 0 && (
          <div className="anim-pulse" style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: '#FFE066', zIndex: 1 }}>
            🔥 {progress.dailyChallengeStreak} day challenge streak!
          </div>
        )}

        {isPerfect && (
          <div className="anim-pulse" style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 20, color: '#FFE066', zIndex: 1 }}>
            ✨ All {totalCount}/{totalCount} correct! Amazing! ✨
          </div>
        )}

        {/* Stars */}
        <div style={{ display: 'flex', gap: 12, zIndex: 1 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={i < visibleStars ? 'anim-star' : ''}
              style={{ fontSize: isPerfect ? 64 : 56, opacity: i < visibleStars ? 1 : 0.25 }}
            >⭐</div>
          ))}
        </div>

        {!isPerfect && (
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 22, color: '#fff', zIndex: 1 }}>
            {correctCount} / {totalCount} correct!
          </div>
        )}

        {passed && newBadges.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 16, padding: '10px 20px', fontFamily: 'Nunito', fontWeight: 700, fontSize: 17, color: '#fff', zIndex: 1 }}>
            🏅 {newBadges.length} new badge{newBadges.length > 1 ? 's' : ''}!
          </div>
        )}

        <div style={{ display: 'flex', gap: 14, width: '100%', maxWidth: 380, zIndex: 1 }}>
          {isDailyChallenge ? null : nextLevel ? (
            <BigButton
              onPress={() => navigate(`/game/${categoryId}/${nextLevel.id}`, { replace: true })}
              label="Next Level →"
              color="#fff"
              textColor={category?.bgColor ?? '#FF9F43'}
              style={{ flex: 1 }}
            />
          ) : isMasterMode ? (
            <BigButton
              onPress={() => navigate(`/game/master/${masterCategoryId}`, { replace: true })}
              label="Play Again 🔄"
              color="rgba(255,255,255,0.3)"
              style={{ flex: 1 }}
            />
          ) : (
            <BigButton
              onPress={() => navigate(`/game/${categoryId}/${levelId}`, { replace: true })}
              label="Play Again 🔄"
              color="rgba(255,255,255,0.3)"
              style={{ flex: 1 }}
            />
          )}
          <BigButton
            onPress={() => navigate('/', { replace: true })}
            label="Home 🏠"
            color={nextLevel ? 'rgba(255,255,255,0.3)' : '#fff'}
            textColor={nextLevel ? '#fff' : (category?.bgColor ?? '#FF9F43')}
            style={{ flex: 1 }}
          />
        </div>

        {/* Wrong answer review */}
        {wrongAnswers.length > 0 && (
          <div style={{ width: '100%', maxWidth: 380, zIndex: 1 }}>
            <button
              onClick={() => setShowReview((s) => !s)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 14,
                padding: '10px 16px', fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>📝 Review {wrongAnswers.length} mistake{wrongAnswers.length > 1 ? 's' : ''}</span>
              <span>{showReview ? '▲' : '▼'}</span>
            </button>

            {showReview && (
              <div style={{
                background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '12px 16px',
                marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {wrongAnswers.map((wa, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.9)', flex: 1 }}>
                      {wa.prompt}
                    </div>
                    <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#FFE066', flexShrink: 0 }}>
                      ✓ {wa.correct}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Print certificate */}
        {passed && (
          <button
            onClick={() => { setShowCertificate(true); setTimeout(() => window.print(), 100); }}
            style={{
              width: '100%', maxWidth: 380, background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.35)', borderRadius: 14,
              padding: '11px 16px', fontFamily: 'Nunito', fontWeight: 800,
              fontSize: 15, color: '#fff', cursor: 'pointer', zIndex: 1,
            }}
          >🎓 Print Certificate</button>
        )}
      </div>

      <BadgeModal badgeId={currentBadge?.badgeId ?? null} onDismiss={() => setBadgeIndex((i) => i + 1)} />

      {/* Printable certificate. On screen it's a dismissable overlay; on paper
          it's the only thing that prints. */}
      {showCertificate && (
        <div
          id="certificate-overlay"
          onClick={() => setShowCertificate(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            id="certificate"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', border: `10px solid ${category.bgColor}`, borderRadius: 24,
              padding: '32px 34px', textAlign: 'center', maxWidth: 460, width: '100%',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 22, color: category.bgColor }}>
              🏆 Certificate of Achievement
            </div>
            <div style={{ fontFamily: 'Nunito', fontSize: 14, color: '#999', marginTop: 4 }}>This certifies that</div>
            <div style={{ fontSize: 72, lineHeight: 1.1, margin: '8px 0' }}>{emoji}</div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 26, color: '#222' }}>{characterName}</div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 17, color: category.bgColor, margin: '10px 0' }}>
              has mastered<br />{category.title}!
            </div>
            <div style={{ fontSize: 38 }}>{'⭐'.repeat(stars || 1)}</div>
            <div style={{ fontFamily: 'Nunito', fontSize: 12.5, color: '#aaa', marginTop: 14 }}>Awarded {certDate}</div>
            <button
              className="no-print"
              onClick={() => setShowCertificate(false)}
              style={{
                marginTop: 18, background: category.bgColor, color: '#fff', border: 'none',
                borderRadius: 12, padding: '10px 24px', fontFamily: 'Nunito', fontWeight: 800,
                fontSize: 15, cursor: 'pointer',
              }}
            >Close</button>
          </div>
        </div>
      )}
    </BackgroundGradient>
  );
}
