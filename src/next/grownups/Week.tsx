import { Learner } from '@/core/learner';
import { todayLine, weekStats, weekSummary } from './report';

/** The last seven days: a bar per day, three numbers and a sentence. */
export default function Week({ learner, today }: { learner: Learner; today: string }) {
  const w = weekStats(learner, today);
  return (
    <div>
      <div className="gu-week" aria-label="Sums answered each day, last 7 days">
        {w.days.map((d) => (
          <div key={d.day} className={`d${d.day === today ? ' today' : ''}`} title={`${d.day}: ${d.answered} sums`}>
            <span className="n">{d.answered > 0 ? d.answered : ''}</span>
            <span className="bar">
              {d.answered > 0 && <b style={{ height: `${Math.max(12, (d.answered / Math.max(1, w.most)) * 100)}%` }} />}
            </span>
            {d.letter}
          </div>
        ))}
      </div>
      <div className="gu-stats">
        <div className="gu-stat"><b>{w.daysPlayed}<span style={{ fontSize: 15 }}> of 7</span></b><span>days played</span></div>
        <div className="gu-stat"><b>{w.answered}</b><span>sums</span></div>
        <div className="gu-stat"><b>{w.pctRight === null ? '—' : `${w.pctRight}%`}</b><span>right first try</span></div>
      </div>
      <p className="gu-summary">{weekSummary(learner, today)}</p>
      <p className="gu-today">{todayLine(learner, today)}</p>
    </div>
  );
}
