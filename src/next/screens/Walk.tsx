import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, House, RotateCcw, Volume2, X } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import TenFrameAid, { hasTenFrames } from '@/components/game/TenFrameAid';
import HopLine from '@/components/game/HopLine';
import { AnswerEvent, applyAnswer, completeWalk, sunToday, passedStones } from '@/core/learner';
import { Walk as WalkPlan, WalkItem } from '@/core/walk';
import { classifyTyped } from '@/core/mistakes';
import { STAGES, TrackId } from '@/core/stages';
import { getLearner, setLearner, useLearner } from '../store';
import { ROUTES } from '../routes';
import { C, KID_FONT } from '../theme';
import Page from '../ui/Page';
import NumberPad from '../ui/NumberPad';
import { characterEmoji } from '../ui/character';
import { friendFor } from '../ui/friends';
import { speak, stopSpeaking, sumToSpeech } from '../platform/speech';
import { sound } from '../platform/sound';
import { pictureMode } from '../walk/picture';
import '../walk/walk.css';

// One walk: ten plain sums, typed on the number pad.
//
// Two different questions are answered differently, as the old app learned:
//   "did she find it?"  -- what she sees. A footprint fills for every sum,
//                          because on a wrong try she is shown the way and
//                          finds it.
//   "did she know it?"  -- what is recorded. Only her first answer, right or
//                          wrong, goes to her fact record and her track.
//
// A wrong first answer gets no red and no buzzer: the box wobbles amber, the
// sign glows, the picture comes up and her friend says one short line. A
// second wrong answer shows the answer, says it, and walks on.

type Phase = 'ask' | 'right' | 'wobble' | 'retry' | 'reveal';

function parts(prompt: string): { a: number; op: '+' | '-'; b: number } {
  const m = prompt.match(/^(\d+)\s*([+\-−])\s*(\d+)/)!;
  return { a: Number(m[1]), op: m[2] === '+' ? '+' : '-', b: Number(m[3]) };
}

/**
 * What her friend says after a wrong first try: the strategy for this kind of
 * fact ("9 is one away from 10…", "Go back to 10 first…"). Every sum's hint
 * is written to name a strategy and never the answer (factStrategies.test.ts).
 */
function nudge(q: { prompt: string; hint?: string }): string {
  if (q.hint) return q.hint;
  const { b, op } = parts(q.prompt);
  return op === '-' ? `Take away ${b}.` : `Count on ${b}.`;
}

/** Bigger frames on a tall screen, so the picture is in proportion to the sum. */
function frameScale(): number {
  const h = typeof window === 'undefined' ? 800 : window.innerHeight;
  return h >= 1050 ? 1.6 : h >= 900 ? 1.3 : 1;
}

const RIGHT_MS = 900;
const WOBBLE_MS = 1300;
const REVEAL_MS = 2600;

/** "Again" starts a fresh walk in place: a reload would lose the tap that unlocked speech. */
export default function WalkScreen() {
  const [run, setRun] = useState(0);
  return <Walk key={run} onAgain={() => setRun((n) => n + 1)} />;
}

function Walk({ onAgain }: { onAgain: () => void }) {
  const navigate = useNavigate();
  const learner = useLearner();
  const [plan] = useState(() => new WalkPlan(getLearner()));
  const [item, setItem] = useState<WalkItem | null>(() => plan.next());
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>('ask');
  const [found, setFound] = useState(0);
  const [moves, setMoves] = useState<AnswerEvent[]>([]);
  const [stoneToast, setStoneToast] = useState<{ track: TrackId; stone: string } | null>(null);
  const [aidOpen, setAidOpen] = useState(false);
  const [done, setDone] = useState(false);
  const tries = useRef(0);
  const shownAt = useRef(performance.now());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const after = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => () => { timers.current.forEach(clearTimeout); stopSpeaking(); }, []);

  // Decided when the sum appears, from her answers before it, so the picture
  // never vanishes mid-sum because her own answer moved the window.
  const mode = useMemo(() => (item ? pictureMode(getLearner(), item) : 'none'), [item]);

  useEffect(() => {
    if (!item) return;
    shownAt.current = performance.now();
    if (getLearner().profile.readAloud) speak(sumToSpeech(item.question.prompt));
  }, [item]);

  function next() {
    const n = plan.next();
    if (!n) {
      setLearner((l) => completeWalk(l));
      setDone(true);
      const full = sunToday(getLearner()) >= 1;
      if (getLearner().profile.readAloud) speak(full ? 'Great walk! All done for today!' : 'Great walk!');
      return;
    }
    tries.current = 0;
    setTyped('');
    setAidOpen(false);
    setPhase('ask');
    setItem(n);
  }

  function submit() {
    if (!item || (phase !== 'ask' && phase !== 'retry')) return;
    const q = item.question;
    const correct = typed === q.correctAnswer;
    const first = tries.current === 0;
    tries.current += 1;

    if (first) {
      const { learner: nextLearner, event } = applyAnswer(getLearner(), {
        track: item.track,
        stage: item.stage,
        factId: q.id,
        correct,
        typed: correct ? undefined : typed,
        tag: correct ? undefined : classifyTyped(q, typed),
        ms: correct ? performance.now() - shownAt.current : undefined,
      });
      setLearner(nextLearner);
      plan.sync(nextLearner);
      if (!correct) plan.missed(item);
      if (event.move === 'up') {
        setMoves((m) => [...m, event]);
        setStoneToast({ track: event.track, stone: STAGES[event.track][event.to].stone });
        if (nextLearner.profile.sound) sound.stoneUp();
        after(2400, () => setStoneToast(null));
      }
    }

    const sounds = getLearner().profile.sound;
    if (correct) {
      setPhase('right');
      setFound((f) => f + 1);
      if (sounds) sound.right();
      after(RIGHT_MS, next);
      return;
    }
    if (first) {
      setPhase('wobble');
      setAidOpen(true);
      if (sounds) sound.tryAgain();
      speak(nudge(q));
      after(WOBBLE_MS, () => { setTyped(''); setPhase('retry'); });
      return;
    }
    setPhase('reveal');
    setFound((f) => f + 1);
    const { a, op, b } = parts(q.prompt);
    speak(`${a} ${op === '+' ? 'plus' : 'take away'} ${b} is ${q.correctAnswer}`);
    after(REVEAL_MS, next);
  }

  if (done) return <WalkDone moves={moves} onAgain={onAgain} onHome={() => navigate(ROUTES.home)} />;
  if (!item) {
    // A walk always has a sum to ask; this is only ever reached by a bug, and
    // she must never be left on a blank screen.
    return (
      <Page style={{ alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ fontSize: 80 }}>{characterEmoji(learner.profile.characterId)}</div>
        <BigButton onClick={() => navigate(ROUTES.home)} label="Home" icon={<House size={30} strokeWidth={ICON_STROKE} />} />
      </Page>
    );
  }

  const q = item.question;
  const { a, op, b } = parts(q.prompt);
  const opColor = op === '+' ? C.plus : C.minus;
  const box = phase === 'reveal' ? q.correctAnswer : typed;
  const showPicture = mode === 'show' || (mode !== 'none' && aidOpen) || ((phase === 'wobble' || phase === 'retry' || phase === 'reveal') && mode !== 'none');
  const tenFrames = hasTenFrames(q.prompt, q.type);
  const hopLine = !tenFrames && (op === '+' ? a + b : a) <= 20;
  const boxStyle = (() => {
    if (phase === 'right') return { border: `4px solid ${C.go}`, background: C.goSoft, color: C.goDark };
    if (phase === 'wobble') return { border: `4px solid ${C.amber}`, background: C.amberSoft, color: '#9A6A00' };
    if (phase === 'reveal') return { border: `4px solid ${C.go}`, background: '#fff', color: C.goDark };
    return { border: `4px ${typed ? 'solid' : 'dashed'} ${typed ? C.ink : C.line}`, background: '#fff', color: C.ink };
  })();
  const sumSize = 'clamp(56px, min(15vw, 10vh), 132px)';
  const length = plan.length;

  return (
    <Page wide style={{ gap: 10 }}>
      {/* Top: stop, footprints, hear it again. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconButton label="Stop" onClick={() => navigate(ROUTES.home)}><X size={26} strokeWidth={ICON_STROKE} /></IconButton>
        <Footprints total={length} filled={found} />
        <IconButton label="Hear it again" onClick={() => speak(sumToSpeech(q.prompt))}><Volume2 size={26} strokeWidth={ICON_STROKE} /></IconButton>
      </div>

      {/* The sum, as on a worksheet. */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, position: 'relative', minHeight: 0 }}>
        {stoneToast && (
          <div className="nx-rise" role="status" style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 5,
            background: '#fff', borderRadius: 999, padding: '8px 18px', boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 22, whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 26 }}>⭐</span>
            <span style={{ background: stoneToast.track === 'plus' ? C.plus : C.minus, color: '#fff', borderRadius: 999, padding: '2px 12px' }}>
              {stoneToast.track === 'plus' ? '+' : '−'} {stoneToast.stone}
            </span>
          </div>
        )}

        <div aria-label={sumToSpeech(q.prompt)} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 18px)', fontFamily: KID_FONT, fontWeight: 700, fontSize: sumSize, lineHeight: 1 }}>
          <span>{a}</span>
          <span
            key={`${q.id}-${phase === 'wobble'}`}
            className={phase === 'wobble' ? (op === '+' ? 'nx-glow-plus' : 'nx-glow-minus') : undefined}
            style={{
              color: opColor, borderRadius: '50%', width: '0.82em', height: '0.82em', margin: '0 0.04em',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: phase === 'wobble' || phase === 'retry' ? (op === '+' ? C.plusSoft : C.minusSoft) : 'transparent',
            }}
          >{op === '+' ? '+' : '−'}</span>
          <span>{b}</span>
          <span style={{ color: C.inkSoft }}>=</span>
          <span
            key={`box-${phase}`}
            className={phase === 'wobble' ? 'nx-wobble' : phase === 'right' ? 'nx-step' : undefined}
            aria-live="polite"
            style={{
              minWidth: '1.25em', height: '1.25em', padding: '0 0.12em', borderRadius: 24, boxSizing: 'border-box',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...boxStyle,
            }}
          >{box}</span>
        </div>

        {mode !== 'none' && (
          showPicture ? (
            <div key={q.id} className={mode === 'tap' ? 'nx-rise' : undefined} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              {tenFrames ? <TenFrameAid prompt={q.prompt} type={q.type} scale={frameScale()} /> : hopLine ? <HopLine key={q.id} max={20} /> : null}
            </div>
          ) : (tenFrames || hopLine) && (
            <button onClick={() => setAidOpen(true)} style={{
              display: 'flex', alignItems: 'center', gap: 8, minHeight: 52, padding: '8px 20px', borderRadius: 16,
              background: C.card, border: `2px solid ${C.line}`, color: C.inkSoft, fontFamily: KID_FONT, fontWeight: 600, fontSize: 20, cursor: 'pointer',
            }}>
              <Eye size={24} strokeWidth={ICON_STROKE} aria-hidden /> Show me
            </button>
          )
        )}

        {(phase === 'wobble' || phase === 'retry' || phase === 'reveal') && (
          <div className="nx-rise" style={{
            display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 18, padding: '10px 16px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.08)', fontWeight: 600, fontSize: 22, maxWidth: '100%',
          }}>
            <button
              aria-label="Say it again"
              onClick={() => speak(phase === 'reveal' ? `${a} ${op === '+' ? 'plus' : 'take away'} ${b} is ${q.correctAnswer}` : nudge(q))}
              style={{ background: C.paperDeep, border: 'none', borderRadius: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            ><Volume2 size={22} strokeWidth={ICON_STROKE} color={C.inkSoft} /></button>
            <span style={{ color: phase === 'reveal' ? C.goDark : opColor }}>
              {phase === 'reveal' ? `${a} ${op === '+' ? '+' : '−'} ${b} = ${q.correctAnswer}` : nudge(q)}
            </span>
          </div>
        )}

        <div
          key={`pal-${found}`}
          className={phase === 'right' ? 'nx-hop' : 'nx-bob'}
          aria-hidden
          style={{ position: 'absolute', right: 4, bottom: 0, fontSize: 'clamp(40px, 7vh, 64px)', lineHeight: 1 }}
        >{characterEmoji(learner.profile.characterId)}</div>
      </div>

      <div style={{ background: C.paperDeep, margin: '0 -16px -16px', padding: '14px 16px max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${C.line}` }}>
        <NumberPad
          value={typed}
          onChange={setTyped}
          onSubmit={submit}
          disabled={phase !== 'ask' && phase !== 'retry'}
          onKey={() => { if (learner.profile.sound) sound.key(); }}
        />
      </div>
    </Page>
  );
}

function Footprints({ total, filled, grow = true }: { total: number; filled: number; grow?: boolean }) {
  const size = total > 12 ? 13 : 18;
  return (
    <div aria-label={`${filled} of ${total}`} style={{ flex: grow ? 1 : 'none', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: total > 12 ? 4 : 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={i === filled - 1 ? 'nx-step' : undefined}
          style={{
            width: size, height: size * 1.35, borderRadius: '50% 50% 45% 45%',
            background: i < filled ? C.go : 'transparent',
            border: `2.5px solid ${i < filled ? C.go : i === filled ? C.amber : C.line}`,
            transform: `rotate(${i % 2 ? 8 : -8}deg)`, boxSizing: 'border-box',
          }}
        />
      ))}
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button aria-label={label} onClick={onClick} style={{
      width: 52, height: 52, borderRadius: 16, border: 'none', background: C.card, color: C.inkSoft,
      boxShadow: `0 3px 0 ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
    }}>{children}</button>
  );
}

function BigButton({ onClick, label, icon, quiet = false }: { onClick: () => void; label: string; icon: React.ReactNode; quiet?: boolean }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', maxWidth: 420, minHeight: quiet ? 64 : 92, borderRadius: 26, border: quiet ? `2px solid ${C.line}` : 'none',
      background: quiet ? C.card : C.go, color: quiet ? C.inkSoft : '#fff', boxShadow: quiet ? 'none' : `0 6px 0 ${C.goDark}`,
      fontFamily: KID_FONT, fontWeight: 700, fontSize: quiet ? 24 : 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer',
    }}>{icon}{label}</button>
  );
}

/**
 * The end of a walk. Every footprint is filled -- she found every one -- and
 * any stone she moved up shows its new friend. When today's sun is full the
 * big button is Home: the walk ended, and so can today. Again is still there.
 */
function WalkDone({ moves, onAgain, onHome }: { moves: AnswerEvent[]; onAgain: () => void; onHome: () => void }) {
  const learner = useLearner();
  const length = learner.profile.walkLength;
  const sun = sunToday(learner);
  const full = sun >= 1;
  const passed = passedStones(learner);
  const newFriends = moves
    .map((m) => m.from)
    .filter((s, i, all) => all.indexOf(s) === i && passed.plus.has(s) && passed.minus.has(s));

  return (
    <Page background={`linear-gradient(${C.sky}, ${C.paper} 55%, ${C.grass})`} style={{ alignItems: 'center', justifyContent: 'center', gap: 22, textAlign: 'center' }}>
      <Footprints total={length} filled={length} grow={false} />
      <div className="nx-hop" style={{ fontSize: 96, lineHeight: 1 }}>{characterEmoji(learner.profile.characterId)}</div>
      <div style={{ fontWeight: 700, fontSize: 36 }}>{full ? 'All done today!' : 'Great walk!'}</div>

      {moves.length > 0 && (
        <div className="nx-rise" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {moves.map((m, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 20, padding: '10px 18px', boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 26,
            }}>
              <span>⭐</span>
              <span style={{ background: m.track === 'plus' ? C.plus : C.minus, color: '#fff', borderRadius: 999, padding: '2px 14px' }}>
                {m.track === 'plus' ? '+' : '−'} {STAGES[m.track][m.to].stone}
              </span>
            </div>
          ))}
          {newFriends.map((s) => (
            <div key={`f${s}`} className="nx-step" style={{ fontSize: 56 }} aria-label="A new friend joined your path">{friendFor(s)}</div>
          ))}
        </div>
      )}

      <Sun fill={sun} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
        {full ? (
          <>
            <BigButton onClick={onHome} label="Done!" icon={<House size={36} strokeWidth={ICON_STROKE} />} />
            <BigButton onClick={onAgain} label="Again" quiet icon={<RotateCcw size={26} strokeWidth={ICON_STROKE} />} />
          </>
        ) : (
          <>
            <BigButton onClick={onAgain} label="Again" icon={<RotateCcw size={36} strokeWidth={ICON_STROKE} />} />
            <BigButton onClick={onHome} label="" quiet icon={<House size={30} strokeWidth={ICON_STROKE} aria-label="Home" />} />
          </>
        )}
      </div>
    </Page>
  );
}

/** Today's sun: fills across the day's walks; a full one is "done for today". */
function Sun({ fill }: { fill: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div aria-label={fill >= 1 ? 'All done for today' : 'Today'} style={{ position: 'relative', width: 96, height: 96 }}>
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => {
          const ang = (i / 12) * Math.PI * 2;
          return <line key={i} x1={48 + Math.cos(ang) * 40} y1={48 + Math.sin(ang) * 40} x2={48 + Math.cos(ang) * 46} y2={48 + Math.sin(ang) * 46}
            stroke={fill >= 1 ? '#F2B705' : '#F3D98B'} strokeWidth="4" strokeLinecap="round" />;
        })}
        <circle cx="48" cy="48" r={r} fill="#FFF3C4" />
        <circle cx="48" cy="48" r={r / 2} fill="none" stroke="#FFC93C" strokeWidth={r}
          strokeDasharray={`${(c / 2) * fill} ${c}`} transform="rotate(-90 48 48)" />
      </svg>
      {fill >= 1 && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, color: '#8A5A00', fontWeight: 700 }}>✓</div>}
    </div>
  );
}
