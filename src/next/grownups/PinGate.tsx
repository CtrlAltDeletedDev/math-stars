import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Delete, KeyRound, Lock } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { setLearner, useLearner } from '../store';
import { ROUTES } from '../routes';

// The door to the grown-ups screen.
//
// Four digits she has not seen typed. The unlocked state lives only in the
// screen's React state, so leaving the screen locks it again. Resetting a
// forgotten PIN asks for the word RESET: easy for a grown-up, hard for a
// six-year-old, and it changes nothing about her progress.

const LEN = 4;
const TRIES = 5;
const COOL_MS = 30_000;

type Mode = 'enter' | 'choose' | 'confirm' | 'forgot';

function Keypad({ onDigit, onBack, disabled }: { onDigit: (d: string) => void; onBack: () => void; disabled?: boolean }) {
  return (
    <div className="gu-keys" role="group" aria-label="Number keys">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <button key={d} type="button" onClick={() => onDigit(d)} disabled={disabled}>{d}</button>
      ))}
      <span className="blank" aria-hidden />
      <button type="button" onClick={() => onDigit('0')} disabled={disabled}>0</button>
      <button type="button" onClick={onBack} disabled={disabled} aria-label="Delete">
        <Delete size={30} strokeWidth={ICON_STROKE} />
      </button>
    </div>
  );
}

function Dots({ n, shake }: { n: number; shake: boolean }) {
  return (
    <div className={`gu-dots${shake ? ' shake' : ''}`} aria-label={`${n} of ${LEN} digits`}>
      {Array.from({ length: LEN }, (_, i) => <i key={i} className={i < n ? 'on' : ''} />)}
    </div>
  );
}

export default function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const learner = useLearner();
  const pin = learner.profile.pin;
  const [mode, setMode] = useState<Mode>(pin ? 'enter' : 'choose');
  const [typed, setTyped] = useState('');
  const [first, setFirst] = useState('');
  const [msg, setMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [misses, setMisses] = useState(0);
  const [coolUntil, setCoolUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [word, setWord] = useState('');
  const shakeTimer = useRef<number | undefined>(undefined);

  const cooling = coolUntil > now;
  useEffect(() => {
    if (!cooling) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [cooling]);
  useEffect(() => () => window.clearTimeout(shakeTimer.current), []);

  const nudge = (text: string) => {
    setMsg(text);
    setShake(true);
    window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShake(false), 400);
  };

  const finish = (code: string) => {
    if (mode === 'enter') {
      if (code === pin) { onUnlock(); return; }
      const m = misses + 1;
      setMisses(m);
      setTyped('');
      if (m >= TRIES) {
        setCoolUntil(Date.now() + COOL_MS);
        setNow(Date.now());
        setMisses(0);
        nudge('Too many tries. Wait 30 seconds.');
      } else nudge("That's not it. Try again.");
      return;
    }
    if (mode === 'choose') {
      setFirst(code);
      setTyped('');
      setMsg('');
      setMode('confirm');
      return;
    }
    if (mode === 'confirm') {
      if (code === first) {
        setLearner((l) => ({ ...l, profile: { ...l.profile, pin: code } }));
        onUnlock();
        return;
      }
      setFirst('');
      setTyped('');
      setMode('choose');
      nudge("Those didn't match. Choose again.");
    }
  };

  const digit = (d: string) => {
    if (cooling || typed.length >= LEN) return;
    const next = typed + d;
    setTyped(next);
    if (msg && !cooling) setMsg('');
    if (next.length === LEN) window.setTimeout(() => finish(next), 120);
  };

  // A hardware keyboard works too, for a grown-up at a laptop.
  const keyRef = useRef({ digit, back: () => setTyped((t) => t.slice(0, -1)) });
  keyRef.current = { digit, back: () => setTyped((t) => t.slice(0, -1)) };
  useEffect(() => {
    if (mode === 'forgot') return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) keyRef.current.digit(e.key);
      else if (e.key === 'Backspace') keyRef.current.back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  const back = (
    <div style={{ alignSelf: 'flex-start' }}>
      <Link to={ROUTES.home} className="gu-back"><ArrowLeft size={20} strokeWidth={ICON_STROKE} />Back to her path</Link>
    </div>
  );

  if (mode === 'forgot') {
    const ok = word.trim().toUpperCase() === 'RESET';
    return (
      <div className="gu-pin" style={{ textAlign: 'left', alignItems: 'stretch' }}>
        {back}
        <h1 style={{ textAlign: 'left' }}>Forgot the PIN?</h1>
        <p className="muted" style={{ marginBottom: 14 }}>
          Type the word <b>RESET</b> below, then choose a new PIN. Her progress stays exactly as it is.
        </p>
        <label htmlFor="gu-reset" className="small" style={{ fontWeight: 700, marginBottom: 6 }}>Type RESET</label>
        <input
          id="gu-reset" className="gu-input" style={{ width: '100%', textTransform: 'uppercase' }}
          value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false}
        />
        <div className="gu-row" style={{ marginTop: 12 }}>
          <button
            type="button" className="gu-btn primary" disabled={!ok}
            onClick={() => { setWord(''); setTyped(''); setFirst(''); setMsg(''); setMode('choose'); }}
          >
            <KeyRound size={18} strokeWidth={ICON_STROKE} />Choose a new PIN
          </button>
          <button type="button" className="gu-btn quiet" onClick={() => { setWord(''); setMode('enter'); }}>Cancel</button>
        </div>
        <p className="small muted" style={{ marginTop: 18 }}>
          Clearing this site&rsquo;s data in your browser settings also removes the PIN, but it removes her progress too,
          unless you have a backup to import afterwards.
        </p>
      </div>
    );
  }

  const title = mode === 'enter'
    ? 'Grown-ups only'
    : mode === 'choose' ? 'Choose a 4-digit grown-ups PIN' : 'Type the same PIN again';
  const help = mode === 'enter'
    ? 'Type your PIN to see how she is doing.'
    : mode === 'choose'
      ? 'You will need it each time you open this screen. Pick one she won’t guess.'
      : 'Just to be sure.';
  const left = Math.ceil((coolUntil - now) / 1000);

  return (
    <div className="gu-pin">
      {back}
      <Lock size={30} strokeWidth={ICON_STROKE} color="#767888" style={{ marginTop: 18 }} aria-hidden />
      <h1>{title}</h1>
      <p className="muted">{help}</p>
      <Dots n={typed.length} shake={shake} />
      <div className="gu-pinmsg" role="status" aria-live="polite">{cooling ? `Too many tries. Wait ${left} s.` : msg}</div>
      <Keypad onDigit={digit} onBack={() => setTyped((t) => t.slice(0, -1))} disabled={cooling} />
      {mode === 'enter' && (
        <button type="button" className="gu-link" style={{ marginTop: 18 }} onClick={() => setMode('forgot')}>Forgot PIN?</button>
      )}
      {mode === 'confirm' && (
        <button type="button" className="gu-link" style={{ marginTop: 18 }} onClick={() => { setTyped(''); setFirst(''); setMode('choose'); }}>
          Start again
        </button>
      )}
    </div>
  );
}
