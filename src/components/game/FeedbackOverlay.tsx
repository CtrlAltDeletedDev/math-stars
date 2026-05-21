interface Props {
  visible: boolean;
  correct: boolean;
  characterEmoji: string;
}

export default function FeedbackOverlay({ visible, correct, characterEmoji }: Props) {
  if (!visible) return null;

  return (
    <div
      className="anim-fade"
      style={{
        position: 'absolute',
        inset: 0,
        background: correct ? 'rgba(76,175,80,0.88)' : 'rgba(255,82,82,0.88)',
        borderRadius: 28,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        zIndex: 10,
      }}
    >
      <div className="anim-bounce" style={{ fontSize: 64 }}>
        {correct ? characterEmoji : '💪'}
      </div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 28, color: '#fff' }}>
        {correct ? 'Great job! 🌟' : 'Try again soon!'}
      </div>
    </div>
  );
}
