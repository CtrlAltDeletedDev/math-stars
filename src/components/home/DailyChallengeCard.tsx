import { useState } from 'react';
import { UserProgress } from '@/types';

interface Props {
  progress: UserProgress;
  onPress: () => void;
}

export default function DailyChallengeCard({ progress, onPress }: Props) {
  const [pressed, setPressed] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const doneToday = progress.lastDailyChallengeDate === todayStr;
  const dcStreak = progress.dailyChallengeStreak ?? 0;

  if (doneToday) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'Nunito',
      }}>
        <div style={{ fontSize: 28 }}>✅</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Done for today!</div>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
            Come back tomorrow 📅{dcStreak > 0 ? ` · 🔥 ${dcStreak} day streak` : ''}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onPress(); }}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: 'linear-gradient(135deg, #FF9F43, #EE5A24)',
        borderRadius: 16,
        padding: '12px 16px',
        border: '2px solid rgba(255,255,255,0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: pressed ? 'none' : '0 4px 0 rgba(0,0,0,0.2)',
        transform: pressed ? 'translateY(3px) scale(0.98)' : 'translateY(0) scale(1)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        animation: 'pulse 2s ease infinite',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <div style={{ fontSize: 28 }}>🎯</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#fff' }}>
          ⭐ Daily Challenge
        </div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
          10 mixed questions · +5 bonus stars{dcStreak > 0 ? ` · 🔥 ${dcStreak} day streak` : ''}
        </div>
      </div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 20, color: '#fff' }}>▶</div>
    </button>
  );
}
