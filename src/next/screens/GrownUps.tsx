import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer, TriangleAlert } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { todayString } from '@/engine/dates';
import { quickMs } from '@/core/facts';
import { TRACKS } from '@/core/stages';
import Page from '../ui/Page';
import { ROUTES } from '../routes';
import { saveIssue, useLearner } from '../store';
import PinGate from '../grownups/PinGate';
import Week from '../grownups/Week';
import TrackBlock from '../grownups/TrackBlock';
import FactGrid, { Legend } from '../grownups/FactGrid';
import Settings from '../grownups/Settings';
import Backup from '../grownups/Backup';
import Worksheet from '../grownups/Worksheet';
import Course from '../grownups/Course';
import { Section } from '../grownups/ui';
import { css } from '../grownups/styles';
import { GRADE_NAMES, addDays, lastPlayed, trickyFacts, whenSaid } from '../grownups/report';

// The grown-ups screen: how their week went, where they are on each track, which
// facts they know, and the few settings worth changing. Plain words, one
// font, readable in twenty seconds. Behind a PIN that is asked for on every
// visit: unlocking lives in this component's state and nowhere else.

const ISSUE_TEXT = {
  'cannot-save': 'This browser is not keeping their progress. It may be a private window, or storage may be full. Export a backup below, and open the app in a normal browser window.',
  'unreadable-backed-up': 'Their saved progress on this device could not be read, so it was set aside and they carried on from the old version’s save. If you have a backup, import it below.',
} as const;

function Report({ onPrint }: { onPrint: () => void }) {
  const learner = useLearner();
  const today = todayString();
  const issue = saveIssue();
  const name = learner.profile.name.trim();
  const last = lastPlayed(learner);
  const quick = quickMs(learner.facts);
  const tricky = trickyFacts(learner, 6);

  return (
    <>
      <div>
        <Link to={ROUTES.home} className="gu-back"><ArrowLeft size={20} strokeWidth={ICON_STROKE} />Back to their path</Link>
      </div>
      {issue && (
        <div className="gu-warn" role="alert">
          <TriangleAlert size={22} strokeWidth={ICON_STROKE} aria-hidden />
          <span>{ISSUE_TEXT[issue]}</span>
        </div>
      )}
      <header className="gu-head">
        <h1>{name ? `${name} this week` : 'This week'}</h1>
        <p className="sub">
          {GRADE_NAMES[learner.profile.grade].replace(/^./, (c) => c.toUpperCase())}
          {' · '}
          {last ? `last played ${whenSaid(last, today)}` : 'not played yet'}
          {learner.streak.current > 1 && learner.streak.last >= addDays(today, -1) ? ` · ${learner.streak.current} days in a row` : ''}
        </p>
      </header>

      <section className="gu-sec" aria-label="This week" style={{ paddingTop: 16 }}>
        <Week learner={learner} today={today} />
      </section>

      <h2 className="gu-group" id="gu-course">Course</h2>
      <p className="gu-groupsub">Lessons that teach: show, do it together, practise, then a short check.</p>
      <section className="gu-sec" aria-labelledby="gu-course" style={{ borderTop: 0, paddingTop: 12 }}>
        <Course learner={learner} />
      </section>

      <h2 className="gu-group" id="gu-practice">Facts practice</h2>
      <p className="gu-groupsub">Their walks on the plus and minus path, and the facts they meet there.</p>

      <Section title="Where they are on plus and minus" id="gu-where">
        <div className="gu-two">
          {TRACKS.map((t) => <TrackBlock key={t} learner={learner} track={t} today={today} />)}
        </div>
      </Section>

      <Section title="Facts they know" id="gu-facts">
        <Legend />
        <div className="gu-grids">
          <FactGrid kind="add" facts={learner.facts} quick={quick} />
          <FactGrid kind="sub" facts={learner.facts} quick={quick} />
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          Tap a square for that fact. &ldquo;Knows it&rdquo; means right and quick on more than one day.
        </p>
      </Section>

      <Section title="Worth doing together" id="gu-together">
        {tricky.length ? (
          <div className="gu-chips">
            {tricky.map((f) => (
              <div key={f.id} className="gu-chip">
                <div className="top">
                  <b>{f.text}</b>
                  <span className="said">
                    {f.said !== null ? `said ${f.said}` : 'still learning'} · right {f.seen - f.misses} of {f.seen}
                  </span>
                </div>
                <p className="idea">{f.idea}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Nothing tricky right now. When they miss a fact more than once it will show here.</p>
        )}
        <button type="button" className="gu-btn wide" style={{ marginTop: 14 }} onClick={onPrint}>
          <Printer size={18} strokeWidth={ICON_STROKE} />Print a worksheet of their tricky ones
        </button>
      </Section>

      <h2 className="gu-group" id="gu-more">Settings and backup</h2>

      <Section title="Settings" id="gu-settings">
        <Settings learner={learner} />
      </Section>

      <Section title="Backup and switching" id="gu-backup">
        <Backup />
      </Section>
    </>
  );
}

export default function GrownUps() {
  const learner = useLearner();
  // Never stored: leaving this screen forgets it, so the PIN is asked again.
  const [unlocked, setUnlocked] = useState(false);
  const [printing, setPrinting] = useState(false);

  const wrap = useRef<HTMLDivElement>(null);
  // Page is the scroller; start each view (PIN, report, worksheet) at its top.
  useEffect(() => { wrap.current?.firstElementChild?.nextElementSibling?.scrollTo(0, 0); }, [unlocked, printing]);

  // The wrapper is only there so print styles can unclip Page's scroll box.
  return (
    <div ref={wrap} className="gu-root">
      <style>{css}</style>
      <Page wide background="#FFFFFF">
        {!unlocked ? (
          <div className="gu"><PinGate onUnlock={() => setUnlocked(true)} /></div>
        ) : printing ? (
          <Worksheet learner={learner} onClose={() => setPrinting(false)} />
        ) : (
          <div className="gu"><Report onPrint={() => setPrinting(true)} /></div>
        )}
      </Page>
    </div>
  );
}
