import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, House, Lightbulb, Play, RotateCcw, Volume2, X, Hand, Zap } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { LESSON_BY_ID, unitOf } from '@/learn/course';
import { DoStep, ModelState, ShowStep } from '@/learn/types';
import Model from '@/learn/models/Model';
import { passed, recordItem, recordLesson, todaysLesson, touchLesson, warmupItems } from '@/learn/progress';
import { getLearner, setLearner, useLearner } from '../store';
import { ROUTES } from '../routes';
import { C, KID_FONT } from '../theme';
import Page from '../ui/Page';
import { characterEmoji } from '../ui/character';
import { speak, stopSpeaking, unlockSpeech } from '../platform/speech';
import { sound } from '../platform/sound';
import ItemView from '../lesson/ItemView';
import { Card, checkScore, lessonCards } from '../lesson/plan';
import '../walk/walk.css';

// One lesson, card by card: warm-up, show, do, practice, check.
//
// Teaching cards wait for her: a "show" card moves on when she taps the arrow
// (the guide has said its line); a "do" card moves on once she has done the
// thing. If she is stuck, the bulb says a hint for what she has made so far,
// and after two hints "Show me how" does it for her -- she should never be
// stuck on a screen she cannot read her way out of.

const STUCK_MS = 25_000;

export default function LessonScreen() {
  const { lessonId = '' } = useParams<{ lessonId: string }>();
  const lesson = LESSON_BY_ID.get(lessonId);
  if (!lesson) return <Navigate to={ROUTES.home} replace />;
  return <LessonRun key={lessonId} lessonId={lessonId} />;
}

function LessonRun({ lessonId }: { lessonId: string }) {
  const navigate = useNavigate();
  const learner = useLearner();
  const lesson = LESSON_BY_ID.get(lessonId)!;
  const unit = unitOf(lessonId);
  const [cards] = useState<Card[]>(() => lessonCards(lesson, warmupItems(getLearner()).filter((i) => !lesson.teach.some((s) => s.type === 'ask' && s.item.id === i.id))));
  const [at, setAt] = useState(0);
  const firstTry = useRef<Record<number, boolean>>({});
  const [result, setResult] = useState<{ right: number; total: number; passed: boolean } | null>(null);
  const { readAloud, sound: sounds } = learner.profile;

  useEffect(() => () => stopSpeaking(), []);

  const card = cards[at];
  const next = () => {
    const n = at + 1;
    if (cards[n]?.kind === 'result' && !result) {
      const { right, total } = checkScore(cards, firstTry.current);
      setLearner((l) => recordLesson(l, lessonId, right, total));
      const ok = passed(right, total);
      setResult({ right, total, passed: ok });
      if (sounds && ok) sound.stoneUp();
      speak(ok ? `You did it! You learned ${lesson.title}.` : 'Good work! We will practise this one again tomorrow.');
    }
    setAt(n);
  };

  const accent = unit?.colour ?? C.go;
  const teachingCards = cards.filter((c) => c.kind !== 'intro' && c.kind !== 'result').length;
  const done = cards.slice(0, at).filter((c) => c.kind !== 'intro').length;

  if (card.kind === 'intro') {
    return (
      <Page background={`linear-gradient(${C.sky}, ${C.paper} 60%)`} style={{ alignItems: 'center', justifyContent: 'center', gap: 22, textAlign: 'center' }}>
        <TopBar onClose={() => navigate(ROUTES.home)} />
        <div style={{ fontSize: 22, fontWeight: 600, color: C.inkSoft }}>{unit?.emoji} {unit?.title}</div>
        <div className="nx-bob" style={{ fontSize: 110, lineHeight: 1 }}>{lesson.emoji}</div>
        <div style={{ fontWeight: 700, fontSize: 'clamp(32px, 7vw, 52px)', maxWidth: 560 }}>{lesson.title}</div>
        <div style={{ fontSize: 64 }} aria-hidden>{characterEmoji(learner.profile.characterId)}</div>
        <BigButton
          label="Start"
          colour={accent}
          icon={<Play size={40} strokeWidth={ICON_STROKE} fill="#fff" />}
          onClick={() => {
            unlockSpeech();
            sound.unlock();
            setLearner((l) => touchLesson(l, lessonId));
            speak(`Let's learn ${lesson.title}!`);
            setAt(1);
          }}
        />
        {/* Testing out: what she already knows should never hold her back.
            Straight to the check; pass it and the stone fills like any other. */}
        <BigButton
          label="I know this!"
          quiet
          icon={<Zap size={30} strokeWidth={ICON_STROKE} color="#C99700" />}
          onClick={() => {
            unlockSpeech();
            sound.unlock();
            setLearner((l) => touchLesson(l, lessonId));
            speak("Let's see! Show me what you know.");
            setAt(cards.findIndex((c) => c.kind === 'item' && c.phase === 'check'));
          }}
        />
      </Page>
    );
  }

  if (card.kind === 'result') {
    const ok = result?.passed ?? false;
    const upNext = todaysLesson(getLearner());
    return (
      <Page background={`linear-gradient(${C.sky}, ${C.paper} 55%, ${C.grass})`} style={{ alignItems: 'center', justifyContent: 'center', gap: 22, textAlign: 'center' }}>
        <div className="nx-hop" style={{ fontSize: 100, lineHeight: 1 }}>{ok ? '🌟' : characterEmoji(learner.profile.characterId)}</div>
        <div style={{ fontWeight: 700, fontSize: 'clamp(30px, 7vw, 46px)' }}>{ok ? 'You did it!' : 'Good work!'}</div>
        <div style={{ fontSize: 24, color: C.inkSoft, maxWidth: 480 }}>
          {ok ? lesson.title : 'We will practise this one again tomorrow.'}
        </div>
        <div style={{ display: 'flex', gap: 8 }} aria-label={`${result?.right ?? 0} of ${result?.total ?? 0}`}>
          {Array.from({ length: result?.total ?? 0 }, (_, i) => (
            <span key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: i < (result?.right ?? 0) ? C.go : C.line }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
          {ok && upNext && upNext.id !== lessonId ? (
            <BigButton label="Next" colour={C.go} icon={<ArrowRight size={40} strokeWidth={ICON_STROKE} />} onClick={() => navigate(ROUTES.lesson(upNext.id), { replace: true })} />
          ) : !ok ? (
            <BigButton label="Again" colour={accent} icon={<RotateCcw size={36} strokeWidth={ICON_STROKE} />} onClick={() => navigate(0)} />
          ) : null}
          <BigButton label="" quiet icon={<House size={32} strokeWidth={ICON_STROKE} aria-label="Home" />} onClick={() => navigate(ROUTES.home)} />
        </div>
      </Page>
    );
  }

  return (
    <Page wide style={{ gap: 10 }}>
      <TopBar onClose={() => navigate(ROUTES.home)} progress={{ done, total: teachingCards, colour: accent }} />
      {card.kind === 'teach' && card.step.type === 'show' && (
        <ShowCard key={`show-${showRunStart(cards, at)}`} step={card.step} accent={accent} readAloud={readAloud} onNext={next} />
      )}
      {card.kind === 'teach' && card.step.type === 'do' && (
        <DoCard key={at} step={card.step} accent={accent} readAloud={readAloud} sounds={sounds} onNext={next} />
      )}
      {card.kind === 'teach' && card.step.type === 'ask' && (
        <ItemView key={at} item={card.step.item} support="picture" readAloud={readAloud} sounds={sounds}
          onFirst={() => {}} onDone={next} />
      )}
      {card.kind === 'item' && (
        <>
          {card.phase === 'check' && at === cards.findIndex((c) => c.kind === 'item' && c.phase === 'check') && (
            <PhaseBanner text="Your turn, all by yourself!" colour={accent} readAloud={readAloud} />
          )}
          <ItemView
            key={at}
            item={card.item}
            support={card.support}
            strict={card.phase === 'check'}
            readAloud={readAloud}
            sounds={sounds}
            onFirst={(correct, typed, ms) => {
              firstTry.current[at] = correct;
              setLearner((l) => recordItem(l, card.item, correct, typed, correct ? ms : undefined));
            }}
            onDone={next}
          />
        </>
      )}
    </Page>
  );
}

/**
 * Where this run of show cards on the same model began. Consecutive show
 * cards share a key, so the model stays mounted and animates from one state
 * to the next instead of being redrawn from scratch.
 */
function showRunStart(cards: Card[], at: number): number {
  const kind = (i: number) => {
    const c = cards[i];
    return c?.kind === 'teach' && c.step.type === 'show' ? c.step.model?.model ?? 'none' : null;
  };
  let i = at;
  while (i > 0 && kind(i - 1) !== null && kind(i - 1) === kind(at)) i--;
  return i;
}

function ShowCard({ step, accent, readAloud, onNext }: { step: ShowStep; accent: string; readAloud: boolean; onNext: () => void }) {
  useEffect(() => { if (readAloud) speak(step.say); }, [step, readAloud]);
  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, minHeight: 0 }}>
        {step.model && <Model state={step.model} />}
        {step.caption && <Caption text={step.caption} onSay={() => speak(step.say)} />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
        <BigButton label="" colour={accent} icon={<ArrowRight size={44} strokeWidth={ICON_STROKE} aria-label="Next" />} onClick={onNext} />
      </div>
    </>
  );
}

function DoCard({ step, accent, readAloud, sounds, onNext }: { step: DoStep; accent: string; readAloud: boolean; sounds: boolean; onNext: () => void }) {
  const [state, setState] = useState<ModelState>(step.model);
  const [won, setWon] = useState(false);
  const [hints, setHints] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const lastMove = useRef(Date.now());

  useEffect(() => { if (readAloud) speak(step.say); }, [step, readAloud]);

  // Stuck for a while: offer the hint without her asking.
  useEffect(() => {
    if (won) return;
    const id = setInterval(() => {
      if (Date.now() - lastMove.current > STUCK_MS) { lastMove.current = Date.now(); hint(); }
    }, 2000);
    return () => clearInterval(id);
  });

  function change(s: ModelState) {
    if (won) return;
    lastMove.current = Date.now();
    setState(s);
    if (step.goal(s)) {
      setWon(true);
      setHintText(null);
      if (sounds) sound.right();
      speak(step.then);
    }
  }

  function hint() {
    const text = typeof step.hint === 'function' ? step.hint(state) : step.hint;
    setHintText(text);
    setHints((h) => h + 1);
    speak(text);
  }

  function showHow() {
    setState(step.solution);
    setWon(true);
    setHintText(null);
    speak(step.then);
  }

  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 0 }}>
        {step.caption && <Caption text={step.caption} onSay={() => speak(step.say)} />}
        <div style={{ position: 'relative' }}>
          <Model state={state} onChange={won ? undefined : change} />
        </div>
        {hintText && !won && <div className="nx-rise" style={bubble}>{hintText}</div>}
        {won && <div className="nx-rise" style={{ ...bubble, color: C.goDark }}>{step.then}</div>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, paddingBottom: 8, flexWrap: 'wrap' }}>
        {won ? (
          <BigButton label="" colour={C.go} icon={<ArrowRight size={44} strokeWidth={ICON_STROKE} aria-label="Next" />} onClick={onNext} />
        ) : (
          <>
            <SmallButton label="A hint" onClick={hint}><Lightbulb size={30} strokeWidth={ICON_STROKE} color="#C99700" /></SmallButton>
            {state !== step.model && (
              <SmallButton label="Start again" onClick={() => { lastMove.current = Date.now(); setState(step.model); setHintText(null); }}>
                <RotateCcw size={28} strokeWidth={ICON_STROKE} color={C.inkSoft} />
              </SmallButton>
            )}
            {hints >= 2 && <SmallButton label="Show me how" onClick={showHow}><Hand size={30} strokeWidth={ICON_STROKE} color={accent} /></SmallButton>}
          </>
        )}
      </div>
    </>
  );
}

function PhaseBanner({ text, colour, readAloud }: { text: string; colour: string; readAloud: boolean }) {
  useEffect(() => { if (readAloud) speak(text); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="nx-rise" style={{ alignSelf: 'center', background: colour, color: '#fff', borderRadius: 999, padding: '6px 18px', fontWeight: 600, fontSize: 18 }}>{text}</div>;
}

function Caption({ text, onSay }: { text: string; onSay: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 600 }}>
      <button aria-label="Say it again" onClick={onSay} style={roundBtn}><Volume2 size={24} strokeWidth={ICON_STROKE} color={C.inkSoft} /></button>
      <div style={{ fontFamily: KID_FONT, fontWeight: 600, fontSize: 'clamp(22px, 5vw, 32px)', lineHeight: 1.2 }}>{text}</div>
    </div>
  );
}

function TopBar({ onClose, progress }: { onClose: () => void; progress?: { done: number; total: number; colour: string } }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', alignSelf: 'stretch' }}>
      <button aria-label="Stop" onClick={onClose} style={roundBtn}><X size={26} strokeWidth={ICON_STROKE} color={C.inkSoft} /></button>
      {progress && (
        <div style={{ flex: 1, height: 14, borderRadius: 999, background: C.line, overflow: 'hidden' }} aria-label={`${progress.done} of ${progress.total}`}>
          <div style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%`, height: '100%', background: progress.colour, borderRadius: 999, transition: 'width 0.4s ease' }} />
        </div>
      )}
    </div>
  );
}

function BigButton({ label, icon, onClick, colour = C.go, quiet = false }: { label: string; icon: React.ReactNode; onClick: () => void; colour?: string; quiet?: boolean }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', maxWidth: 420, minHeight: quiet ? 64 : 92, borderRadius: 26, border: quiet ? `2px solid ${C.line}` : 'none',
      background: quiet ? C.card : colour, color: quiet ? C.inkSoft : '#fff', boxShadow: quiet ? 'none' : '0 6px 0 rgba(0,0,0,0.18)',
      fontFamily: KID_FONT, fontWeight: 700, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer',
    }}>{icon}{label}</button>
  );
}

function SmallButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} style={{
      minHeight: 64, minWidth: 64, padding: '0 18px', borderRadius: 20, border: `2px solid ${C.line}`, background: C.card,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
      fontFamily: KID_FONT, fontWeight: 600, fontSize: 18, color: C.inkSoft,
    }}>{children}{label === 'Show me how' ? label : null}</button>
  );
}

const roundBtn: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 16, border: 'none', background: C.card, boxShadow: `0 3px 0 ${C.line}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
};
const bubble: React.CSSProperties = {
  background: '#fff', borderRadius: 18, padding: '10px 16px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
  fontFamily: KID_FONT, fontWeight: 600, fontSize: 21, color: C.ink, maxWidth: 560, textAlign: 'center',
};
