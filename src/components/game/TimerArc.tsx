interface Props {
  timeLeft: number;
  totalTime: number;
}

export default function TimerArc({ timeLeft, totalTime }: Props) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const frac = totalTime > 0 ? Math.max(0, timeLeft / totalTime) : 0;
  const offset = circ * (1 - frac);
  const isLow = frac < 0.3;

  return (
    <div style={{ width: 54, height: 54, position: 'relative', flexShrink: 0 }}>
      <svg width="54" height="54" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="27" cy="27" r={r} stroke="rgba(255,255,255,0.25)" strokeWidth="5" fill="none" />
        <circle
          cx="27" cy="27" r={r}
          stroke={isLow ? '#FF5252' : '#fff'}
          strokeWidth="5" fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.3s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Nunito', fontWeight: 800, fontSize: 16,
        color: isLow ? '#FF5252' : '#fff',
      }}>
        {Math.ceil(timeLeft)}
      </div>
    </div>
  );
}
