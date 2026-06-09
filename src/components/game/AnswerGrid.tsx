interface Props {
  choices: string[];
  onSelect: (choice: string) => void;
  selectedChoice: string | null;
  correctAnswer: string;
  disabled: boolean;
  triedChoices?: string[];
}

function getColor(choice: string, selected: string | null, correct: string, tried: string[]): string {
  if (!selected) return tried.includes(choice) ? '#bbb' : '#4A90E2';
  if (choice === correct) return '#4CAF50';
  if (choice === selected) return '#FF5252';
  return '#bbb';
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}

export default function AnswerGrid({ choices, onSelect, selectedChoice, correctAnswer, disabled, triedChoices = [] }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: '100%' }}>
      {choices.map((choice) => {
        const color = getColor(choice, selectedChoice, correctAnswer, triedChoices);
        const isSelected = choice === selectedChoice;
        const isCorrect = selectedChoice && choice === correctAnswer;
        const isTried = triedChoices.includes(choice);
        return (
          <div key={choice} style={{ position: 'relative' }}>
            <button
              onClick={() => { if (!disabled && !selectedChoice && !isTried) onSelect(choice); }}
              className={isSelected && choice !== correctAnswer ? 'anim-shake' : isCorrect ? 'anim-pop' : ''}
              style={{
                width: '100%',
                background: color,
                color: '#fff',
                fontFamily: 'Nunito',
                fontWeight: 800,
                fontSize: 26,
                borderRadius: 20,
                border: 'none',
                minHeight: 90,
                boxShadow: disabled ? 'none' : '0 4px 0 rgba(0,0,0,0.2)',
                cursor: disabled || !!selectedChoice ? 'default' : 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingRight: 50,
              }}
            >
              {choice}
            </button>
            {!selectedChoice && !disabled && (
              <button
                onClick={(e) => { e.stopPropagation(); speak(choice); }}
                style={{
                  position: 'absolute', top: '50%', right: 6, transform: 'translateY(-50%)',
                  width: 42, height: 42, borderRadius: 12,
                  background: 'rgba(255,255,255,0.3)', border: 'none',
                  fontSize: 18, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
                title="Hear this answer"
              >
                🔊
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
