import { Question } from '@/types';
import DotAid from './DotAid';
import NumberLine from './NumberLine';

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

export default function QuestionCard({ question }: Props) {
  const speakText = question.speakText ?? question.prompt;
  const showDots = question.type === 'addition' || question.type === 'subtraction';
  const showNumberLine = question.type === 'skip_count';

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
        🔊
      </button>

      {question.promptEmoji && (
        <div style={{ fontSize: 44, lineHeight: 1.2, textAlign: 'center', letterSpacing: 4 }}>
          {question.promptEmoji}
        </div>
      )}

      <div style={{
        fontFamily: 'Nunito',
        fontWeight: 800,
        fontSize: 30,
        color: '#333',
        textAlign: 'center',
        lineHeight: 1.3,
        whiteSpace: 'pre-line', // some prompts set context on its own line
        paddingRight: showDots || showNumberLine ? 0 : 40,
      }}>
        {question.prompt}
      </div>

      {showDots && <DotAid prompt={question.prompt} type={question.type} />}
      {showNumberLine && <NumberLine prompt={question.prompt} />}
    </div>
  );
}
