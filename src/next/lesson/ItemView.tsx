import { useEffect, useRef, useState } from 'react';
import { Check, Eye, Volume2 } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { Item, ModelState } from '@/learn/types';
import Model from '@/learn/models/Model';
import NumberPad from '../ui/NumberPad';
import { C, KID_FONT } from '../theme';
import { speak } from '../platform/speech';
import { sound } from '../platform/sound';
import { Support } from './plan';
import '../walk/walk.css';

// One question in a lesson, answered on the number pad, by tapping a big
// choice, or by doing something with a model (set the clock, build 34).
//
// The same two rules as the walk:
//   - her FIRST answer is what is recorded, right or wrong (onFirst)
//   - she always gets to find it: a wrong first answer is amber, the hint is
//     said and the picture comes up; a second wrong answer shows the answer.
// In the check there is no picture and no hint, and a wrong answer shows the
// right one straight away.

type Phase = 'ask' | 'right' | 'wobble' | 'retry' | 'reveal';

interface Props {
  item: Item;
  support: Support;
  /** No hints, no second try: the check. */
  strict?: boolean;
  readAloud: boolean;
  sounds: boolean;
  /** Her first answer: what is recorded. */
  onFirst: (correct: boolean, typed: string | undefined, ms: number) => void;
  /** She has found it (or been shown it): move on. */
  onDone: () => void;
}

const RIGHT_MS = 900;
const WOBBLE_MS = 1300;
const REVEAL_MS = 2400;

export default function ItemView({ item, support, strict = false, readAloud, sounds, onFirst, onDone }: Props) {
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<Phase>('ask');
  const [picked, setPicked] = useState<string | null>(null);
  const [tried, setTried] = useState<string[]>([]);
  const [model, setModel] = useState<ModelState | null>(typeof item.input === 'object' && 'model' in item.input ? item.input.model : null);
  const [showPicture, setShowPicture] = useState(support === 'picture');
  const tries = useRef(0);
  const shownAt = useRef(performance.now());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const after = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => {
    shownAt.current = performance.now();
    if (readAloud) speak(item.say);
    return () => timers.current.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const busy = phase === 'right' || phase === 'wobble' || phase === 'reveal';

  function judge(correct: boolean, answerText: string | undefined) {
    const first = tries.current === 0;
    tries.current += 1;
    if (first) onFirst(correct, answerText, performance.now() - shownAt.current);
    if (correct) {
      setPhase('right');
      if (sounds) sound.right();
      after(RIGHT_MS, onDone);
      return;
    }
    if (first && !strict) {
      setPhase('wobble');
      if (sounds) sound.tryAgain();
      if (support !== 'none') setShowPicture(true);
      if (item.hint) speak(item.hint);
      after(WOBBLE_MS, () => { setTyped(''); setPicked(null); setPhase('retry'); });
      return;
    }
    setPhase('reveal');
    if (typeof item.input === 'object' && 'model' in item.input) setModel(item.input.solution);
    speak(revealLine(item));
    after(REVEAL_MS, onDone);
  }

  const input = item.input;
  const pictureNow = item.picture && (showPicture || phase === 'reveal') && support !== 'none';

  return (
    // data-answer is for the end-to-end tests, in development builds only.
    <div data-answer={import.meta.env.DEV ? item.answer : undefined} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className={phase === 'wobble' ? 'nx-wobble' : undefined}
            style={{ fontFamily: KID_FONT, fontWeight: 700, fontSize: promptSize(item.prompt), textAlign: 'center', lineHeight: 1.15 }}
          >
            {input === 'number' ? <NumberPrompt prompt={item.prompt} typed={phase === 'reveal' ? item.answer : typed} phase={phase} /> : item.prompt}
          </div>
          <button aria-label="Hear it again" onClick={() => speak(item.say)} style={roundBtn}>
            <Volume2 size={24} strokeWidth={ICON_STROKE} color={C.inkSoft} />
          </button>
        </div>

        {item.figure && <Model state={item.figure} />}
        {pictureNow && <div className="nx-rise"><Model state={item.picture!} size="small" /></div>}
        {item.picture && !pictureNow && support === 'tap' && (
          <button onClick={() => setShowPicture(true)} style={showMeBtn}>
            <Eye size={24} strokeWidth={ICON_STROKE} aria-hidden /> Show me
          </button>
        )}

        {model && (
          <Model state={model} onChange={busy ? undefined : setModel} />
        )}

        {(phase === 'wobble' || phase === 'retry') && item.hint && !strict && (
          <div className="nx-rise" style={bubble}>{item.hint}</div>
        )}
        {phase === 'reveal' && (
          <div className="nx-rise" style={{ ...bubble, color: C.goDark }}>{revealLine(item)}</div>
        )}
      </div>

      {input === 'number' && (
        <div style={padPanel}>
          <NumberPad
            value={typed}
            onChange={setTyped}
            onSubmit={() => judge(typed === item.answer, typed)}
            disabled={busy}
            onKey={() => { if (sounds) sound.key(); }}
          />
        </div>
      )}

      {typeof input === 'object' && 'choices' in input && (
        <div style={{ display: 'grid', gridTemplateColumns: input.choices.length === 3 ? 'repeat(3, 1fr)' : '1fr 1fr', gap: 12, width: '100%', maxWidth: 560, margin: '0 auto' }}>
          {input.choices.map((c) => {
            const isRight = c.value === item.answer;
            const state = phase === 'reveal' || phase === 'right' ? (isRight ? 'right' : c.value === picked ? 'wrong' : 'idle')
              : tried.includes(c.value) ? 'tried' : 'idle';
            return (
              <button
                key={c.value}
                data-value={import.meta.env.DEV ? c.value : undefined}
                disabled={busy || tried.includes(c.value)}
                onClick={() => {
                  if (readAloud && !c.model) speak(c.say ?? c.label ?? '');
                  setPicked(c.value);
                  setTried((t) => [...t, c.value]);
                  judge(isRight, c.value);
                }}
                aria-label={c.say ?? c.label}
                style={{
                  minHeight: c.model ? 150 : 92, borderRadius: 22, padding: 10,
                  border: `3px solid ${state === 'right' ? C.go : state === 'tried' || state === 'wrong' ? C.amber : C.line}`,
                  background: state === 'right' ? C.goSoft : state === 'tried' ? C.amberSoft : C.card,
                  opacity: state === 'tried' ? 0.6 : 1,
                  boxShadow: state === 'idle' && !busy ? `0 4px 0 ${C.line}` : 'none',
                  fontFamily: KID_FONT, fontWeight: 600, fontSize: (c.label ?? '').length > 8 ? 22 : 34, color: C.ink,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  cursor: 'pointer', touchAction: 'manipulation',
                }}
              >
                {c.model && <Model state={c.model} size="small" />}
                {c.label && <span>{c.label}</span>}
              </button>
            );
          })}
        </div>
      )}

      {typeof input === 'object' && 'model' in input && (
        <button
          disabled={busy}
          onClick={() => judge(!!model && input.goal(model), undefined)}
          aria-label="Check my answer"
          style={{ ...doneBtn, opacity: busy ? 0.5 : 1 }}
        >
          <Check size={40} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}

function revealLine(item: Item): string {
  if (item.input === 'number') {
    const m = item.prompt.match(/^(\d+)\s*([+\-−])\s*(\d+)\s*=\s*\?$/);
    if (m) return `${m[1]} ${m[2] === '+' ? 'plus' : 'take away'} ${m[3]} is ${item.answer}.`;
    return `It's ${item.answer}.`;
  }
  if ('choices' in item.input) {
    const c = item.input.choices.find((x) => x.value === item.answer);
    return `It's ${c?.say ?? c?.label ?? item.answer}.`;
  }
  return 'Like this!';
}

/** "8 + 5 = ?" draws the ? as her answer box; other prompts show the box below. */
function NumberPrompt({ prompt, typed, phase }: { prompt: string; typed: string; phase: Phase }) {
  const box = (
    <span
      key={phase}
      className={phase === 'right' ? 'nx-step' : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '1.3em', height: '1.25em',
        padding: '0 0.12em', borderRadius: 20, verticalAlign: 'middle', boxSizing: 'border-box',
        border: `4px ${typed ? 'solid' : 'dashed'} ${phase === 'right' || phase === 'reveal' ? C.go : phase === 'wobble' ? C.amber : typed ? C.ink : C.line}`,
        background: phase === 'right' ? C.goSoft : phase === 'wobble' ? C.amberSoft : '#fff',
        color: phase === 'right' || phase === 'reveal' ? C.goDark : C.ink,
      }}
    >{typed}</span>
  );
  if (prompt.includes('?')) {
    const [before, afterQ] = prompt.split('?');
    return <span>{colourSigns(before)}{box}{colourSigns(afterQ)}</span>;
  }
  return <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>{prompt}{box}</span>;
}

function colourSigns(text: string) {
  return text.split(/([+\-−])/).map((part, i) =>
    part === '+' ? <span key={i} style={{ color: C.plus }}>+</span>
      : part === '-' || part === '−' ? <span key={i} style={{ color: C.minus }}>−</span>
      : <span key={i}>{part}</span>);
}

function promptSize(prompt: string): string {
  if (prompt.length <= 12) return 'clamp(48px, min(12vw, 8vh), 104px)';
  // A longer sum ("9 + 4 = 10 + ?") is still just numbers: keep it big.
  if (prompt.length <= 18 && /^[\d\s+\-−=?]+$/.test(prompt)) return 'clamp(38px, min(9vw, 7vh), 84px)';
  if (prompt.length <= 30) return 'clamp(28px, 6vw, 48px)';
  return 'clamp(22px, 4.5vw, 32px)';
}

const roundBtn: React.CSSProperties = {
  width: 48, height: 48, borderRadius: 16, border: 'none', background: C.card, boxShadow: `0 3px 0 ${C.line}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
};
const showMeBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, minHeight: 52, padding: '8px 20px', borderRadius: 16,
  background: C.card, border: `2px solid ${C.line}`, color: C.inkSoft, fontFamily: KID_FONT, fontWeight: 600, fontSize: 20, cursor: 'pointer',
};
const bubble: React.CSSProperties = {
  background: '#fff', borderRadius: 18, padding: '10px 16px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
  fontFamily: KID_FONT, fontWeight: 600, fontSize: 21, color: C.ink, maxWidth: 560, textAlign: 'center',
};
const padPanel: React.CSSProperties = {
  background: C.paperDeep, margin: '0 -16px -16px', padding: '14px 16px max(16px, env(safe-area-inset-bottom))', borderTop: `1px solid ${C.line}`,
};
const doneBtn: React.CSSProperties = {
  alignSelf: 'center', width: '100%', maxWidth: 420, minHeight: 84, borderRadius: 24, border: 'none',
  background: C.go, color: '#fff', boxShadow: `0 6px 0 ${C.goDark}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};
