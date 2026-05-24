interface Props {
  questionsToday: number;
  goal: number;
}

export default function DailyGoalBar({ questionsToday, goal }: Props) {
  const pct = Math.min(1, questionsToday / goal);
  const reached = questionsToday >= goal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        fontFamily: 'Nunito', fontWeight: 700, fontSize: 12,
        color: reached ? '#FFE066' : 'rgba(255,255,255,0.85)',
      }}>
        {reached ? `⭐ Goal reached! ${questionsToday}/${goal} questions` : `📚 Today: ${questionsToday}/${goal} questions`}
      </div>
      <div style={{
        height: 8, borderRadius: 6,
        background: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct * 100}%`,
          borderRadius: 6,
          background: reached ? '#FFE066' : 'rgba(255,255,255,0.7)',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}
