import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Pin, Play, X } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { Learner } from '@/core/learner';
import { todaysLesson } from '@/learn/progress';
import { setLearner } from '../store';
import { ROUTES } from '../routes';
import {
  GRADE_NAMES, GradeRow, LessonRow, UnitRow, courseReport, shortDate, suggestNextGrade, unitInCourse,
} from './report';

// "Her course": today's lesson (and a grown-up's pick of another), then every
// unit she is taught, grade by grade, with how far through each she is.

const PLACE_WORDS: Record<GradeRow['place'], string> = {
  hers: 'Her grade',
  earlier: 'Earlier: comes back as review',
  ahead: 'Next, when she finishes hers',
};

function statusText(r: LessonRow): string {
  const tries = r.tries === 1 ? '1 try' : `${r.tries} tries`;
  const score = r.best !== null ? ` · best ${r.best}% · ${tries}` : '';
  switch (r.status.kind) {
    case 'passed': return `Passed ${shortDate(r.status.on)}${score}`;
    case 'placed': return 'Already knew this (from her path)';
    case 'started': return r.best !== null ? `Not passed yet${score}` : 'Started, not reached the check yet';
    default: return 'Not yet';
  }
}

function Today({ learner }: { learner: Learner }) {
  const navigate = useNavigate();
  const today = todaysLesson(learner);
  const where = today ? unitInCourse(today.id) : null;
  const pinned = !!today && learner.pinnedLesson === today.id;
  const report = courseReport(learner);
  const [picking, setPicking] = useState(false);
  const [choice, setChoice] = useState(today?.id ?? '');

  const pin = (id: string | null) => {
    setLearner((l) => ({ ...l, pinnedLesson: id }));
    setPicking(false);
  };

  return (
    <div className="gu-today-card">
      {today && where ? (
        <>
          <div className="lbl">
            {pinned ? <><Pin size={14} strokeWidth={ICON_STROKE} aria-hidden /> Your pick for today</> : 'Today’s lesson'}
            <span className="unit">{where.unit.emoji} {where.unit.title}{where.grade.grade !== learner.profile.grade ? ` · ${where.grade.title}` : ''}</span>
          </div>
          <div className="ttl"><span aria-hidden>{today.emoji}</span>{today.title}</div>
          <p className="goal">{today.goal}</p>
          <div className="gu-row" style={{ marginTop: 12 }}>
            <button type="button" className="gu-btn primary" onClick={() => navigate(ROUTES.lesson(today.id))}>
              <Play size={17} strokeWidth={ICON_STROKE} />Start this lesson
            </button>
            {!picking && (
              <button type="button" className="gu-btn" onClick={() => { setChoice(today.id); setPicking(true); }}>
                Choose a different lesson
              </button>
            )}
            {pinned && !picking && (
              <button type="button" className="gu-btn quiet" onClick={() => pin(null)}>
                <X size={16} strokeWidth={ICON_STROKE} />Clear
              </button>
            )}
          </div>
        </>
      ) : (
        <p>
          <b>She has done every lesson written so far.</b> New ones appear here as they are added; until then her
          walks keep her facts sharp.
        </p>
      )}

      {picking && (
        <div className="gu-focus" style={{ marginTop: 12 }}>
          <div className="pick">
            <label htmlFor="gu-pin-lesson" className="small" style={{ width: '100%', fontWeight: 700 }}>
              Offer this lesson first, until she passes it
            </label>
            <select id="gu-pin-lesson" value={choice} onChange={(e) => setChoice(e.target.value)}>
              {report.flatMap((g) => g.units.map((u) => (
                <optgroup key={u.unit.id} label={`${g.title} · ${u.unit.title}`}>
                  {u.lessons.map((r, i) => (
                    <option key={r.lesson.id} value={r.lesson.id}>
                      {i + 1}. {r.lesson.title}{r.status.kind === 'passed' || r.status.kind === 'placed' ? ' (done)' : ''}
                    </option>
                  ))}
                </optgroup>
              )))}
            </select>
            <button type="button" className="gu-btn primary" onClick={() => pin(choice || null)} disabled={!choice}>Use this lesson</button>
            <button type="button" className="gu-btn quiet" onClick={() => setPicking(false)}>Cancel</button>
          </div>
        </div>
      )}

      <p className="small muted" style={{ marginTop: 12 }}>
        Her path still lets her tap any lesson. This only picks the one she is offered first.
      </p>
    </div>
  );
}

function UnitBlock({ row, open, onToggle, todayId }: { row: UnitRow; open: boolean; onToggle: () => void; todayId: string | null }) {
  const navigate = useNavigate();
  const { unit } = row;
  const pct = row.total ? (row.done / row.total) * 100 : 0;
  const bodyId = `gu-unit-${unit.id}`;
  return (
    <div className={`gu-unit${open ? ' open' : ''}`}>
      <button type="button" className="hd" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
        <span className="em" aria-hidden>{unit.emoji}</span>
        <span className="mid">
          <span className="row">
            <span className="t">{unit.title}</span>
            <span className="n">{row.done} of {row.total}</span>
          </span>
          <span className="bar" aria-hidden><b style={{ width: `${pct}%`, background: unit.colour }} /></span>
          <span className="about">{unit.about}</span>
        </span>
        <ChevronDown className="chev" size={20} strokeWidth={ICON_STROKE} aria-hidden />
      </button>
      {open && (
        <ol id={bodyId} className="lessons">
          {row.lessons.map((r, i) => {
            const done = r.status.kind === 'passed' || r.status.kind === 'placed';
            return (
              <li key={r.lesson.id} className={done ? 'done' : ''}>
                <span className="num" style={done ? { background: unit.colour, borderColor: unit.colour } : { borderColor: unit.colour }} aria-label={done ? 'Done' : `Lesson ${i + 1}`}>
                  {done ? <Check size={15} strokeWidth={3.25} color="#fff" /> : i + 1}
                </span>
                <div className="body">
                  <div className="t">
                    {r.lesson.title}
                    {todayId === r.lesson.id && <span className="tag">Today</span>}
                  </div>
                  <p className="goal">{r.lesson.goal}</p>
                  <p className="st">{statusText(r)}</p>
                </div>
                <button
                  type="button" className="gu-btn go" aria-label={`Start ${r.lesson.title}`}
                  onClick={() => navigate(ROUTES.lesson(r.lesson.id))}
                >
                  <Play size={15} strokeWidth={ICON_STROKE} /><span className="w">Start this lesson</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default function Course({ learner }: { learner: Learner }) {
  const grades = courseReport(learner);
  const today = todaysLesson(learner);
  const todayUnit = today ? unitInCourse(today.id)?.unit.id ?? null : null;
  const [open, setOpen] = useState<Set<string>>(() => new Set(todayUnit ? [todayUnit] : []));
  const next = suggestNextGrade(learner);
  const grade = learner.profile.grade;
  const toggle = (id: string) => setOpen((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  return (
    <div>
      <Today learner={learner} />
      <p className="small muted" style={{ margin: '14px 0 4px' }}>
        She is set to <b style={{ color: 'inherit' }}>{GRADE_NAMES[grade]}</b>. Today&rsquo;s lesson starts there and carries
        on into the next grade when she finishes. Changing the grade (in Settings) moves where it starts; earlier lessons
        still come back as review.
      </p>
      {grades.map((g) => (
        <div key={g.grade} className="gu-grade">
          <div className="gh">
            <h3>{g.title}</h3>
            <span className={`place ${g.place}`}>{PLACE_WORDS[g.place]}</span>
            {g.total > 0 && <span className="cnt">{g.done} of {g.total} lessons done</span>}
          </div>
          {g.place === 'hers' && next && (
            <div className="gu-ready" style={{ margin: '0 0 12px' }}>
              <span>She has done most of {GRADE_NAMES[grade]}. Her lessons will carry on into {GRADE_NAMES[next]} by themselves.</span>
              <button type="button" className="gu-btn" onClick={() => setLearner((l) => ({ ...l, profile: { ...l.profile, grade: next } }))}>
                Move her to {GRADE_NAMES[next]}
              </button>
            </div>
          )}
          {g.units.length ? (
            <div className="gu-units">
              {g.units.map((u) => (
                <UnitBlock key={u.unit.id} row={u} open={open.has(u.unit.id)} onToggle={() => toggle(u.unit.id)} todayId={today?.id ?? null} />
              ))}
            </div>
          ) : (
            <p className="small muted">The {g.title} lessons are still being written. They will appear here as they are added.</p>
          )}
        </div>
      ))}
    </div>
  );
}
