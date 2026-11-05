import { useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { Learner, activeFocus } from '@/core/learner';
import { STAGES, TrackId, ceilingFor } from '@/core/stages';
import { setLearner } from '../store';
import { C } from '../theme';
import {
  GRADE_NAMES, NEXT_GRADE, addDays, mistakeSentence, secondsText, shortDate, trackReport, whenSaid,
} from './report';

const COLOUR: Record<TrackId, { on: string; soft: string; sign: string; name: string }> = {
  plus: { on: C.plus, soft: C.plusSoft, sign: '+', name: 'Plus' },
  minus: { on: C.minus, soft: C.minusSoft, sign: '−', name: 'Minus' },
};

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** One track: where they stand, how it's going, what comes next, and this week's pick. */
export default function TrackBlock({ learner, track, today }: { learner: Learner; track: TrackId; today: string }) {
  const r = trackReport(learner, track, today);
  const col = COLOUR[track];
  const grade = learner.profile.grade;
  const ceiling = ceilingFor(track, grade);
  const focus = activeFocus(learner, today);
  const mine = focus?.track === track ? focus : null;
  const [picking, setPicking] = useState(false);
  const [choice, setChoice] = useState(r.stage);

  const movedOn = r.stage > 0 ? learner.tracks[track].passed[r.stage - 1] : undefined;
  const recentMoved = movedOn && movedOn >= addDays(today, -6) ? `Moved up ${whenSaid(movedOn, today)}. ` : '';
  const accuracy = r.recentCount > 0
    ? `${r.recentRight} of their last ${r.recentCount} right first try${r.typicalMs !== null ? `, ${r.typicalMs < 1000 ? '' : 'about '}${secondsText(r.typicalMs)} each` : ''}.`
    : 'No answers at this step yet.';
  const atTop = r.stage >= ceiling;
  const nextGrade = NEXT_GRADE[grade];

  const setFocus = () => {
    setLearner((l) => ({ ...l, focus: { track, stage: choice, until: addDays(today, 7) } }));
    setPicking(false);
  };

  return (
    <div className="gu-track">
      <div className="row">
        <h3 className="nm">
          <span className="gu-sign" style={{ background: col.on }} aria-label={col.name}>{col.sign}</span>
          {r.label}
        </h3>
        <span className="st">step {r.step} of {r.of}</span>
      </div>
      <div className="gu-rungs" aria-hidden>
        {Array.from({ length: r.of }, (_, i) => {
          const passed = i < r.stage;
          const here = i === r.stage;
          return (
            <i
              key={i}
              style={passed
                ? { background: col.on }
                : here
                  ? { background: `linear-gradient(90deg, ${col.on} 50%, ${col.soft} 50%)`, boxShadow: `inset 0 0 0 1.5px ${col.on}` }
                  : undefined}
            />
          );
        })}
      </div>
      <p className="note">{recentMoved}{accuracy}</p>
      {mistakeSentence(r) && <p className="note">{mistakeSentence(r)}</p>}
      <p className="note">
        {r.next && !atTop && <>Next: <b>{lowerFirst(r.next.label)}</b> ({r.next.example}).</>}
        {r.next && atTop && <>Top of {GRADE_NAMES[grade]}. After it: {lowerFirst(r.next.label)} ({r.next.example}).</>}
        {!r.next && <>The last step on this path.</>}
      </p>

      {r.ready && nextGrade && (
        <div className="gu-ready">
          <span>Top of {GRADE_NAMES[grade]}, and acing it. They may be ready for the next grade.</span>
          <button
            type="button" className="gu-btn"
            onClick={() => setLearner((l) => ({ ...l, profile: { ...l.profile, grade: nextGrade } }))}
          >
            Move to {GRADE_NAMES[nextGrade]}
          </button>
        </div>
      )}

      <div className="gu-focus">
        {mine ? (
          <div className="on" style={{ background: col.soft }}>
            <span>
              <CalendarClock size={17} strokeWidth={ICON_STROKE} style={{ verticalAlign: '-3px', marginRight: 6 }} aria-hidden />
              This week: <b>{lowerFirst(STAGES[track][mine.stage].label)}</b>, until {shortDate(mine.until)}
            </span>
            <button type="button" className="gu-btn" style={{ minHeight: 38, padding: '4px 10px' }} onClick={() => setLearner((l) => ({ ...l, focus: null }))}>
              <X size={16} strokeWidth={ICON_STROKE} />Clear
            </button>
          </div>
        ) : picking ? (
          <div className="pick">
            <label htmlFor={`gu-focus-${track}`} className="small" style={{ width: '100%', fontWeight: 700 }}>
              Practise this step for the next 7 days
            </label>
            <select id={`gu-focus-${track}`} value={choice} onChange={(e) => setChoice(Number(e.target.value))}>
              {STAGES[track].map((s, i) => (
                <option key={i} value={i}>
                  {i + 1}. {s.label} ({s.example}){i === r.stage ? ' · now' : i > ceiling ? ' · above their grade' : ''}
                </option>
              ))}
            </select>
            <button type="button" className="gu-btn primary" onClick={setFocus}>Practise this</button>
            <button type="button" className="gu-btn quiet" onClick={() => setPicking(false)}>Cancel</button>
            {focus && focus.track !== track && (
              <p className="small muted" style={{ width: '100%' }}>
                This replaces this week&rsquo;s {COLOUR[focus.track].name.toLowerCase()} pick.
              </p>
            )}
          </div>
        ) : (
          <button type="button" className="gu-btn quiet" onClick={() => { setChoice(r.stage); setPicking(true); }}>
            <CalendarClock size={18} strokeWidth={ICON_STROKE} />Practise a step this week
          </button>
        )}
      </div>
    </div>
  );
}
