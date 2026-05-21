import { useEffect, useState } from 'react';
import { BADGES } from '@/data/badges';

interface Props {
  badgeId: string | null;
  onDismiss: () => void;
}

export default function BadgeModal({ badgeId, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const badge = BADGES.find((b) => b.id === badgeId);

  useEffect(() => {
    if (badgeId) {
      setVisible(true);
    }
  }, [badgeId]);

  if (!visible || !badge) return null;

  return (
    <div
      onClick={() => { setVisible(false); onDismiss(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="anim-pop"
        style={{
          background: '#fff', borderRadius: 28, padding: 40,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          maxWidth: 320, textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ fontSize: 16, fontFamily: 'Nunito', fontWeight: 700, color: '#999', letterSpacing: 2, textTransform: 'uppercase' }}>
          New Badge!
        </div>
        <div style={{ fontSize: 72 }}>{badge.emoji}</div>
        <div style={{ fontSize: 24, fontFamily: 'Nunito', fontWeight: 800, color: '#333' }}>{badge.title}</div>
        <div style={{ fontSize: 16, fontFamily: 'Nunito', fontWeight: 400, color: '#666' }}>{badge.description}</div>
        <div style={{ fontSize: 14, fontFamily: 'Nunito', color: '#aaa', marginTop: 8 }}>Tap to continue</div>
      </div>
    </div>
  );
}
