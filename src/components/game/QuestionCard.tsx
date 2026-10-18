import { Question } from '@/types';
import DotAid from './DotAid';
import QuestionVisual from './QuestionVisual';
import NumberLine from './NumberLine';
import HopLine from './HopLine';
import { Volume2 } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';

interface Props {
  question: Question;
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

// A one-line sum wants to be huge; a three-sentence story at that size runs off
// a phone screen and pushes the answers out of reach.
function promptFontSize(prompt: string): number {
  if (prompt.length > 110) return 20;
  if (prompt.length > 70) return 22;
  if (prompt.length > 40) return 25;
  return 30;
}

export default function QuestionCard({ question }: Props) {
  const speakText = question.speakText ?? question.prompt;
  const showDots = question.type === 'addition' || question.type === 'subtraction';
  const showNumberLine = question.type === 'skip_count';
  const hopMax = hopLineMax(question);
  const isLong = question.prompt.length > 40;
  const wideEmoji = !!question.promptEmoji && [...question.promptEmoji].length > 6;

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
        paddingRight: showDots || showNumberLine ? 0 : 40,
      }}>
        {question.prompt}
      </div>

      {/* After the prompt: she should read (or hear) the question, then look. */}
      {/* Keyed by question so scratch work never carries over to the next one. */}
      {question.visual && <QuestionVisual key={question.id} visual={question.visual} />}

      {showDots && <DotAid prompt={question.prompt} type={question.type} />}
      {hopMax !== null && <HopLine key={question.id} max={hopMax} />}
      {showNumberLine && <NumberLine prompt={question.prompt} />}
    </div>
  );
}
