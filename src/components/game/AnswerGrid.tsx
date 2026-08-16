interface Props {
  choices: string[];
  onSelect: (choice: string) => void;
  selectedChoice: string | null;
  correctAnswer: string;
  disabled: boolean;
  triedChoices?: string[];
}

// Most answers are one or two digits and want to be big. Some are equations or
// phrases ("12 − 8 = 4", "0, 2, 4, 6, or 8") and have to step down to fit.
function fontSizeFor(choices: string[]): number {
  const longest = choices.reduce((n, c) => Math.max(n, c.length), 0);
  if (longest <= 3) return 30;
  if (longest <= 6) return 24;
  if (longest <= 10) return 19;
  return 15;
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
  const fontSize = fontSizeFor(choices);
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
                fontSize,
                lineHeight: 1.2,
                borderRadius: 20,
                border: 'none',
                minHeight: 90,
                boxShadow: disabled ? 'none' : '0 4px 0 rgba(0,0,0,0.2)',
                cursor: disabled || !!selectedChoice ? 'default' : 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                // Room for the speaker badge in the corner only — the middle and
                // right edge of the button stay tappable, which is where a
                // six-year-old actually aims.
                padding: '18px 12px 12px',
                overflowWrap: 'anywhere',
              }}
            >
              {choice}
            </button>
            {!selectedChoice && !disabled && (
              <button
                onClick={(e) => { e.stopPropagation(); speak(choice); }}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 32, height: 32, borderRadius: 10,
                  background: 'rgba(255,255,255,0.28)', border: 'none',
                  fontSize: 14, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
                title="Hear this answer"
                aria-label={`Hear ${choice}`}
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
