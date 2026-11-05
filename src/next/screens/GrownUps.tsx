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
import { Section } from '../grownups/ui';
import { css } from '../grownups/styles';
import { GRADE_NAMES, addDays, lastPlayed, trickyFacts, whenSaid } from '../grownups/report';

// The grown-ups screen: how her week went, where she is on each track, which
// facts she knows, and the few settings worth changing. Plain words, one
// font, readable in twenty seconds. Behind a PIN that is asked for on every
// visit: unlocking lives in this component's state and nowhere else.

const ISSUE_TEXT = {
  'cannot-save': 'This browser is not keeping her progress. It may be a private window, or storage may be full. Export a backup below, and open the app in a normal browser window.',
  'unreadable-backed-up': 'Her saved progress on this device could not be read, so it was set aside and she carried on from the old version’s save. If you have a backup, import it below.',
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
        <Link to={ROUTES.home} className="gu-back"><ArrowLeft size={20} strokeWidth={ICON_STROKE} />Back to her path</Link>
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

      <Section title="Where she is" id="gu-where">
        <div className="gu-two">
          {TRACKS.map((t) => <TrackBlock key={t} learner={learner} track={t} today={today} />)}
        </div>
      </Section>

      <Section title="Facts she knows" id="gu-facts">
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
          <p className="muted">Nothing tricky right now. When she misses a fact more than once it will show here.</p>
        )}
        <button type="button" className="gu-btn wide" style={{ marginTop: 14 }} onClick={onPrint}>
          <Printer size={18} strokeWidth={ICON_STROKE} />Print a worksheet of her tricky ones
        </button>
      </Section>

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

  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo(0, 0); }, [unlocked, printing]);

  // The app's body never scrolls (global.css), so this screen scrolls itself.
  return (
    <div ref={scroller} className="gu-root">
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
