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

export default function Celebration() {
  const { categoryId = '', levelId = '' } = useParams<{ categoryId: string; levelId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { progress } = useProgress();

  const state = location.state as { correctCount: number; totalCount: number; newBadges: BadgeEarned[] } | null;
  const correctCount = state?.correctCount ?? 0;
  const totalCount = state?.totalCount ?? 10;
  const newBadges = state?.newBadges ?? [];

  const score = totalCount > 0 ? correctCount / totalCount : 0;
  const stars = calculateStars(score);
  const passed = didPassLevel(score);
  const isPerfect = correctCount === totalCount && totalCount >= 5;
  const category = getCategoryById(categoryId);
  const character = CHARACTERS.find((c) => c.id === progress.characterId);
  const emoji = character ? getCharacterEmoji(character.id, progress.totalStars) : '⭐';

  const [visibleStars, setVisibleStars] = useState(0);
  const [showBurst, setShowBurst] = useState(false);
  const [badgeIndex, setBadgeIndex] = useState(0);
  const currentBadge = newBadges[badgeIndex] ?? null;

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setVisibleStars(i);
      if (i >= stars) {
        clearInterval(id);
        if (stars > 0) setTimeout(() => setShowBurst(true), 200);
      }
    }, 300);
    return () => clearInterval(id);
  }, [stars]);

  if (!category) return null;

  return (
    <BackgroundGradient colors={[category.bgColor, category.darkColor]}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20, position: 'relative', overflow: 'hidden' }}>
        <Confetti active={passed} />
        <StarBurst count={stars} active={showBurst} />

        <div className="anim-bounce" style={{ fontSize: isPerfect ? 88 : 72, zIndex: 1 }}>{emoji}</div>

        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: isPerfect ? 38 : 34, color: '#fff', textAlign: 'center', zIndex: 1 }}>
          {isPerfect ? '🌟 PERFECT! 🌟' : passed ? '🎉 Level Complete!' : '💪 Good Try!'}
        </div>

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
          <BigButton
            onPress={() => navigate(`/game/${categoryId}/${levelId}`, { replace: true })}
            label="Play Again 🔄"
            color="rgba(255,255,255,0.3)"
            style={{ flex: 1 }}
          />
          <BigButton
            onPress={() => navigate('/', { replace: true })}
            label="Home 🏠"
            color="#fff"
            textColor={category.bgColor}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <BadgeModal badgeId={currentBadge?.badgeId ?? null} onDismiss={() => setBadgeIndex((i) => i + 1)} />
    </BackgroundGradient>
  );
}
