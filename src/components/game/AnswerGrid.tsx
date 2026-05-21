interface Props {
  choices: string[];
  onSelect: (choice: string) => void;
  selectedChoice: string | null;
  correctAnswer: string;
  disabled: boolean;
}

function getColor(choice: string, selected: string | null, correct: string): string {
  if (!selected) return '#4A90E2';
  if (choice === correct) return '#4CAF50';
  if (choice === selected) return '#FF5252';
  return '#bbb';
}

export default function AnswerGrid({ choices, onSelect, selectedChoice, correctAnswer, disabled }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14,
      width: '100%',
    }}>
      {choices.map((choice) => {
        const color = getColor(choice, selectedChoice, correctAnswer);
        const isSelected = choice === selectedChoice;
        const isCorrect = selectedChoice && choice === correctAnswer;
        return (
          <button
            key={choice}
            onClick={() => { if (!disabled && !selectedChoice) onSelect(choice); }}
            className={isSelected && choice !== correctAnswer ? 'anim-shake' : isCorrect ? 'anim-pop' : ''}
            style={{
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
            }}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}
