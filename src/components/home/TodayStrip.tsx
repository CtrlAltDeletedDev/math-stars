import { BookOpen, Flame, Music, Star, VolumeX } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
interface Props {
  streak: number;
  questionsToday: number;
  goal: number;
  musicEnabled: boolean;
  onToggleMusic: () => void;
}

// One compact row replacing the separate streak banner, goal bar and
// quick-toggle row — keeps the Home screen calm for young kids.
export default function TodayStrip({ streak, questionsToday, goal, musicEnabled, onToggleMusic }: Props) {
  const goalReached = questionsToday >= goal;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
      {streak > 1 && (
        <div style={chip}>
          <Flame size={18} strokeWidth={ICON_STROKE} color="#FFB74D" fill="#FF7043" aria-hidden /> <span style={{ fontSize: 15 }}>{streak}</span>
        </div>
      )}
      <div style={{
        ...chip, flex: 1, justifyContent: 'center',
        background: goalReached ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.18)',
        border: goalReached ? '2px solid #FFE066' : '2px solid transparent',
      }}>
        {goalReached
          ? <><Star size={18} strokeWidth={ICON_STROKE} color="#FFE066" fill="#FFE066" aria-hidden /> Goal reached!</>
          : <><BookOpen size={18} strokeWidth={ICON_STROKE} aria-hidden /> Today: {questionsToday}/{goal}</>}
      </div>
      <button
        onClick={onToggleMusic}
        style={{
          ...chip, border: 'none', cursor: 'pointer', minWidth: 48, justifyContent: 'center',
          background: musicEnabled ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)',
        }}
        aria-label={musicEnabled ? 'Turn music off' : 'Turn music on'}
      >{musicEnabled
        ? <Music size={20} strokeWidth={ICON_STROKE} aria-hidden />
        : <VolumeX size={20} strokeWidth={ICON_STROKE} aria-hidden />}</button>
    </div>
  );
}

const chip: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: '9px 14px',
  fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, color: '#fff',
  whiteSpace: 'nowrap',
};
