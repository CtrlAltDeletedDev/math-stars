import { Question } from '@/types';

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

  return (
    <div style={{
      background: '#fff',
      borderRadius: 28,
      padding: '24px 28px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
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
        <div style={{ fontSize: 48, lineHeight: 1.2, textAlign: 'center', letterSpacing: 4 }}>
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
      }}>
        {question.prompt}
      </div>
    </div>
  );
}
