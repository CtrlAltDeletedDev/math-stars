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
          🔥 <span style={{ fontSize: 15 }}>{streak}</span>
        </div>
      )}
      <div style={{
        ...chip, flex: 1, justifyContent: 'center',
        background: goalReached ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.18)',
        border: goalReached ? '2px solid #FFE066' : '2px solid transparent',
      }}>
        {goalReached ? '⭐ Goal reached!' : `📚 Today: ${questionsToday}/${goal}`}
      </div>
      <button
        onClick={onToggleMusic}
        style={{
          ...chip, border: 'none', cursor: 'pointer', minWidth: 48, justifyContent: 'center',
          background: musicEnabled ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)',
        }}
      >{musicEnabled ? '🎵' : '🔇'}</button>
    </div>
  );
}

const chip: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: '9px 14px',
  fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, color: '#fff',
  whiteSpace: 'nowrap',
};
