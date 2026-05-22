interface Props {
  playHistory: string[];
}

export default function PlayCalendar({ playHistory }: Props) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const playSet = new Set(playHistory);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const streak = (() => {
    let s = 0;
    for (let i = 6; i >= 0; i--) {
      if (playSet.has(days[i])) s++;
      else break;
    }
    return s;
  })();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: '10px 16px' }}>
      <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
        {streak > 0 ? `${streak}d 🔥` : '📅'}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {days.map((date) => {
          const played = playSet.has(date);
          const isToday = date === todayStr;
          return (
            <div
              key={date}
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: played ? '#4CAF50' : 'rgba(255,255,255,0.2)',
                border: isToday ? '2.5px solid #fff' : '2.5px solid transparent',
                boxSizing: 'border-box',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
