interface Props {
  streak: number;
}

export default function StreakBar({ streak }: Props) {
  if (streak < 2) return null;
  const flames = '🔥'.repeat(Math.min(streak, 7));
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
      fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: '#fff',
    }}>
      <span>{flames}</span>
      <span>{streak} in a row!</span>
    </div>
  );
}
