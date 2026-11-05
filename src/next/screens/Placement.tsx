import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, House, Play, X } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { unitOf } from '@/learn/course';
import { Item } from '@/learn/types';
import { recordItem } from '@/learn/progress';
import { PlacementState, answerPlacement, applyPlacement, placementItem, placementProgress, startPlacement } from '@/learn/placement';
import { getLearner, setLearner, useLearner } from '../store';
import { ROUTES } from '../routes';
import { C, KID_FONT } from '../theme';
import Page from '../ui/Page';
import { characterEmoji } from '../ui/character';
import { speak, stopSpeaking, unlockSpeech } from '../platform/speech';
import { sound } from '../platform/sound';
import ItemView from '../lesson/ItemView';
import '../walk/walk.css';

// "Let's find your level!": a short run of questions that finds where in the
// course to start (src/learn/placement.ts), so a child who already knows the
// early lessons is not taught them again.
//
// Every answer gets the same friendly "Okay!" -- no right or wrong -- and
// "I'm not sure" is always there, so it never feels like a test to fail.

const INTRO = "Let's find your level! I will ask some questions. Answer the ones you know. If you are not sure, tap I'm not sure.";

export default function Placement() {
  const navigate = useNavigate();
  const learner = useLearner();
  const [state, setState] = useState<PlacementState>(() => startPlacement(getLearner()));
  const [current, setCurrent] = useState<{ item: Item; key: number } | null>(null);
  const [started, setStarted] = useState(false);
  /** The first answer to the question on screen, read once its "Okay!" has shown. */
  const lastAnswer = useRef(false);
  const { readAloud, sound: sounds } = learner.profile;

  useEffect(() => () => stopSpeaking(), []);

  function ask(s: PlacementState) {
    const next = placementItem(s);
    setCurrent(next ? { item: next.item, key: s.asked } : null);
  }

  function answered(correct: boolean) {
    const next = answerPlacement(state, correct);
    setState(next);
    if (next.done) {
      setLearner((l) => applyPlacement(l, next));
      setCurrent(null);
      const lesson = next.start ? unitOf(next.start)?.lessons.find((x) => x.id === next.start) : null;
      if (sounds) sound.stoneUp();
      speak(lesson ? `Great work! You start with ${lesson.title}.` : 'Wow! You know everything so far!');
      return;
    }
    ask(next);
  }

  if (!started) {
    return (
      <Page background={`linear-gradient(${C.sky}, ${C.paper} 60%)`} style={{ alignItems: 'center', justifyContent: 'center', gap: 24, textAlign: 'center' }}>
        <div className="nx-bob" style={{ fontSize: 110, lineHeight: 1 }}>{characterEmoji(learner.profile.characterId)}</div>
        <div style={{ fontWeight: 700, fontSize: 'clamp(32px, 7vw, 52px)', maxWidth: 560 }}>Let's find your level!</div>
        <div style={{ fontSize: 22, color: C.inkSoft, maxWidth: 480 }}>Answer the ones you know. Not sure? That's okay!</div>
        <BigButton
          label="Start"
          icon={<Play size={40} strokeWidth={ICON_STROKE} fill="#fff" />}
          onClick={() => {
            unlockSpeech();
            sound.unlock();
            speak(INTRO);
            setStarted(true);
            ask(state);
          }}
        />
        <BigButton label="" quiet icon={<House size={30} strokeWidth={ICON_STROKE} aria-label="Home" />} onClick={() => navigate(ROUTES.home)} />
      </Page>
    );
  }

  if (state.done) {
    const lesson = state.start ? unitOf(state.start)?.lessons.find((x) => x.id === state.start) : null;
    const unit = state.start ? unitOf(state.start) : null;
    return (
      <Page background={`linear-gradient(${C.sky}, ${C.paper} 55%, ${C.grass})`} style={{ alignItems: 'center', justifyContent: 'center', gap: 22, textAlign: 'center' }}>
        <div className="nx-hop" style={{ fontSize: 96, lineHeight: 1 }}>🌟</div>
        <div style={{ fontWeight: 700, fontSize: 'clamp(30px, 7vw, 46px)' }}>{lesson ? 'You start here!' : 'You know it all so far!'}</div>
        {lesson && unit && (
          <div style={{ background: '#fff', borderRadius: 24, padding: '16px 22px', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 14, maxWidth: 480 }}>
            <span style={{ fontSize: 56 }}>{lesson.emoji}</span>
            <span style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: 16, color: C.inkSoft }}>{unit.emoji} {unit.title}</span>
              <span style={{ display: 'block', fontSize: 28, fontWeight: 700 }}>{lesson.title}</span>
            </span>
          </div>
        )}
        <div style={{ fontSize: 18, color: C.inkSoft }}>
          {state.known.length > 0 ? `${state.known.length} lessons you already know are on your path.` : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
          {lesson && <BigButton label="Go" icon={<ArrowRight size={40} strokeWidth={ICON_STROKE} />} onClick={() => navigate(ROUTES.lesson(lesson.id), { replace: true })} />}
          <BigButton label="" quiet icon={<House size={30} strokeWidth={ICON_STROKE} aria-label="Home" />} onClick={() => navigate(ROUTES.home, { replace: true })} />
        </div>
      </Page>
    );
  }

  return (
    <Page wide style={{ gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button aria-label="Stop" onClick={() => navigate(ROUTES.home)} style={roundBtn}><X size={26} strokeWidth={ICON_STROKE} color={C.inkSoft} /></button>
        <div style={{ flex: 1, height: 14, borderRadius: 999, background: C.line, overflow: 'hidden' }}>
          <div style={{ width: `${placementProgress(state) * 100}%`, height: '100%', background: C.go, borderRadius: 999, transition: 'width 0.4s ease' }} />
        </div>
      </div>
      {current && (
        <ItemView
          key={current.key}
          item={current.item}
          support="none"
          neutral
          readAloud={readAloud}
          sounds={sounds}
          onFirst={(correct, typed, ms) => {
            lastAnswer.current = correct;
            setLearner((l) => recordItem(l, current.item, correct, typed, correct ? ms : undefined));
          }}
          onDone={() => answered(lastAnswer.current)}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => answered(false)}
          style={{
            minHeight: 56, padding: '8px 22px', borderRadius: 18, border: `2px solid ${C.line}`, background: C.card,
            fontFamily: KID_FONT, fontWeight: 600, fontSize: 20, color: C.inkSoft, cursor: 'pointer',
          }}
        >🤔 I'm not sure</button>
      </div>
    </Page>
  );
}

function BigButton({ label, icon, onClick, quiet = false }: { label: string; icon: React.ReactNode; onClick: () => void; quiet?: boolean }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', maxWidth: 420, minHeight: quiet ? 64 : 92, borderRadius: 26, border: quiet ? `2px solid ${C.line}` : 'none',
      background: quiet ? C.card : C.go, color: quiet ? C.inkSoft : '#fff', boxShadow: quiet ? 'none' : `0 6px 0 ${C.goDark}`,
      fontFamily: KID_FONT, fontWeight: 700, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer',
    }}>{icon}{label}</button>
  );
}

const roundBtn: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 16, border: 'none', background: C.card, boxShadow: `0 3px 0 ${C.line}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
};
