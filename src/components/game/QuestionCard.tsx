import { useState } from 'react';
import { Question } from '@/types';
import TenFrameAid, { hasTenFrames } from './TenFrameAid';
import QuestionVisual from './QuestionVisual';
import NumberLine from './NumberLine';
import HopLine from './HopLine';
import { Eye, Volume2 } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { AidMode } from '@/engine/scaffold';

interface Props {
  question: Question;
  /**
   * Whether the counting picture (ten frames) is drawn or waits behind a
   * "Show me" button. See engine/scaffold.ts. Every screen but Play leaves it
   * drawn, as it always was.
   */
  aid?: AidMode;
  /** Draw the picture now whatever `aid` says: she has just tapped a wrong answer. */
  revealAid?: boolean;
}

/** The ten frames, or a button that brings them up. Keyed per question by the card. */
function FadingAid({ question, mode, reveal }: { question: Question; mode: AidMode; reveal: boolean }) {
  const [opened, setOpened] = useState(false);
  if (mode === 'show' || opened || reveal) {
    return <div className={mode === 'tap' ? 'anim-pop' : undefined}><TenFrameAid prompt={question.prompt} type={question.type} /></div>;
  }
  return (
    <button
      onClick={() => setOpened(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, minHeight: 48, padding: '8px 18px',
        background: '#EEF4FF', color: '#3D6FD9', border: 'none', borderRadius: 14, cursor: 'pointer',
        fontFamily: 'Nunito', fontWeight: 800, fontSize: 17,
      }}
    >
      <Eye size={22} strokeWidth={ICON_STROKE} aria-hidden /> Show me
    </button>
  );
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}

/**
 * Sums past ten get the 0–20 hop line instead of dots, which stop at ten: the
 * line is how her class works "14 − 6", and 14 dots with 6 crossed out is a
 * counting exercise rather than a strategy.
 */
function hopLineMax(q: Question): number | null {
  if (q.type !== 'addition' && q.type !== 'subtraction') return null;
  const m = q.prompt.match(/^(\d+)\s*[+-]\s*(\d+)/);
  if (!m) return null;
  const a = Number(m[1]), b = Number(m[2]);
  if (a <= 10 && b <= 10) return null; // DotAid has it
  const top = q.type === 'addition' ? a + b : a;
  return top <= 20 ? 20 : null;
}

/**
 * How many things a picture draws side by side: an emoji with its modifiers
 * ("3️⃣" is three code points) counts once, spaces not at all.
 */
function glyphCount(text: string): number {
  type Segmenter = { segment(s: string): Iterable<{ segment: string }> };
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: object) => Segmenter }).Segmenter;
  if (Seg) return [...new Seg(undefined, { granularity: 'grapheme' }).segment(text)].filter((g) => g.segment.trim()).length;
  return [...text].filter((c) => c.trim() && !/[\uFE0F\u20E3\u200D]/.test(c)).length;
}

// A one-line sum wants to be huge; a three-sentence story at that size runs off
// a phone screen and pushes the answers out of reach.
function promptFontSize(prompt: string): number | string {
  // A bare fact ("8 + 5 = ?") is the thing she is looking at: as big as the
  // screen allows. On a phone that is about 40px, on an iPad 64.
  if (prompt.length <= 14 && !prompt.includes('\n')) return 'clamp(40px, 11vw, 64px)';
  if (prompt.length > 110) return 20;
  if (prompt.length > 70) return 22;
  if (prompt.length > 40) return 25;
  return 30;
}

export default function QuestionCard({ question, aid = 'show', revealAid = false }: Props) {
  const speakText = question.speakText ?? question.prompt;
  const showDots = hasTenFrames(question.prompt, question.type);
  const showNumberLine = question.type === 'skip_count';
  const hopMax = hopLineMax(question);
  const isLong = question.prompt.length > 40;
  // Five across at this size reaches the read-aloud button on a phone.
  const wideEmoji = !!question.promptEmoji && glyphCount(question.promptEmoji) >= 5;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 28,
      padding: '20px 24px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      position: 'relative',
    }}>
      <button
        onClick={() => speak(speakText)}
        style={{
          position: 'absolute', top: 14, right: 14,
          background: '#EEF4FF', border: 'none', borderRadius: 12,
          width: 44, height: 44, fontSize: 22, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Read aloud"
      >
        <Volume2 size={24} strokeWidth={ICON_STROKE} color="#3D6FD9" aria-hidden />
      </button>

      {question.promptEmoji && (
        <div style={{
          fontSize: isLong ? 32 : 44, lineHeight: 1.2, textAlign: 'center', letterSpacing: 4,
          // A picture wide enough to reach the corner starts below the read-aloud
          // button: counting questions draw objects in full rows of five, and one
          // hidden under the button is a wrong answer she was set up to give.
          marginTop: wideEmoji ? 40 : 0,
        }}>
          {question.promptEmoji}
        </div>
      )}

      <div style={{
        fontFamily: 'Nunito',
        fontWeight: 800,
        fontSize: promptFontSize(question.prompt),
        color: '#333',
        textAlign: 'center',
        lineHeight: 1.3,
        whiteSpace: 'pre-line', // some prompts set context on its own line
        // Clear of the read-aloud button. A bare sum is centred and short
        // enough not to reach it.
        paddingRight: question.type === 'addition' || question.type === 'subtraction' || showNumberLine ? 0 : 40,
      }}>
        {question.prompt}
      </div>

      {/* After the prompt: she should read (or hear) the question, then look. */}
      {/* Keyed by question so scratch work never carries over to the next one. */}
      {question.visual && <QuestionVisual key={question.id} visual={question.visual} />}

      {showDots && <FadingAid key={question.id} question={question} mode={aid} reveal={revealAid} />}
      {hopMax !== null && <HopLine key={question.id} max={hopMax} />}
      {showNumberLine && <NumberLine prompt={question.prompt} />}
    </div>
  );
}
