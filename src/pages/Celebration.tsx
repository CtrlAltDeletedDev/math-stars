import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getCategoryById } from '@/data/categories';
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

  function printCertificate() {
    const win = window.open('', '_blank', 'width=640,height=480');
    if (!win) return;
    const starStr = '⭐'.repeat(stars || 1);
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const bg = category?.bgColor ?? '#FF9F43';
    win.document.write(`<!DOCTYPE html><html><head><title>Certificate</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Nunito, Arial, sans-serif; background: ${bg}; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .cert { background: #fff; border: 10px solid ${bg}; border-radius: 28px; padding: 44px 56px; text-align: center; max-width: 520px; width: 92%; box-shadow: 0 8px 40px rgba(0,0,0,0.25); }
  h1 { font-size: 26px; color: ${bg}; margin-bottom: 6px; }
  .sub { color: #888; font-size: 15px; margin-bottom: 18px; }
  .emj { font-size: 84px; line-height: 1; }
  .name { font-size: 28px; font-weight: 800; color: #222; margin: 14px 0 4px; }
  .achv { font-size: 18px; color: ${bg}; font-weight: 800; margin-bottom: 14px; }
  .stars { font-size: 44px; }
  .date { color: #aaa; font-size: 13px; margin-top: 18px; }
  @media print { body { background: #fff; } .cert { border-color: ${bg}; box-shadow: none; } }
</style></head><body>
<div class="cert">
  <h1>🏆 Certificate of Achievement</h1>
  <div class="sub">This certifies that</div>
  <div class="emj">${emoji}</div>
  <div class="name">${characterName}</div>
  <div class="achv">has mastered<br>${category?.title ?? 'Math Stars'}!</div>
  <div class="stars">${starStr}</div>
  <div class="date">Awarded ${dateStr}</div>
</div>
<script>window.onload=function(){window.print();setTimeout(function(){window.close()},800);}<\/script>
</body></html>`);
    win.document.close();
  }

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
          {isDailyChallenge ? (
            <BigButton
              onPress={() => {}}
              label="See you tomorrow! 📅"
              color="rgba(255,255,255,0.2)"
              style={{ flex: 1, opacity: 0.7 }}
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
            color="#fff"
            textColor={category?.bgColor ?? '#FF9F43'}
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
            onClick={printCertificate}
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
    </BackgroundGradient>
  );
}
