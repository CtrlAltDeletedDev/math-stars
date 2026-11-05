import { useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';

// The grown-ups' way in: small, quiet, and only for a deliberate press and
// hold. A ring fills while it is held; letting go or sliding off cancels it.
// A short tap just gives a little wiggle, so nothing seems broken.

export const HOLD_MS = 1500;
const SIZE = 48;
const R = 21;
const CIRC = 2 * Math.PI * R;

export default function GrownUpsDoor({ onOpen }: { onOpen: () => void }) {
  const [holding, setHolding] = useState(false);
  const [wiggle, setWiggle] = useState(0);
  const timer = useRef<number | null>(null);

  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);

  const start = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // Touch captures the pointer to the button, which would hide sliding off
    // it. Let go of that, so leaving the button cancels the hold.
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch { /* not supported: release still cancels */ }
    clear();
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onOpen();
    }, HOLD_MS);
  };
  const cancel = () => {
    if (timer.current === null) return;
    clear();
    setHolding(false);
  };
  // Belt and braces for touch: however capture behaves, a finger that has
  // slid off the button cancels.
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (timer.current === null) return;
    const r = e.currentTarget.getBoundingClientRect();
    const slack = 8;
    if (e.clientX < r.left - slack || e.clientX > r.right + slack || e.clientY < r.top - slack || e.clientY > r.bottom + slack) cancel();
  };
  const release = () => {
    if (timer.current === null) return;
    cancel();
    setWiggle((n) => n + 1);
  };

  return (
    <button
      type="button"
      aria-label="Grown-ups: press and hold"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={release}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'relative', width: SIZE, height: SIZE, padding: 0, border: 0, borderRadius: '50%',
        background: 'rgba(255,255,255,0.5)', color: '#9C9EAB', cursor: 'pointer',
        touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span key={wiggle} className={wiggle ? 'np-wiggle' : undefined} style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
        <UserRound size={22} strokeWidth={ICON_STROKE * 0.8} aria-hidden="true" />
      </span>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true"
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', pointerEvents: 'none' }}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#2E9E5B" strokeWidth={4} strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={holding ? 0 : CIRC}
          opacity={holding ? 1 : 0}
          style={{ transition: holding ? `stroke-dashoffset ${HOLD_MS}ms linear` : 'none' }} />
      </svg>
    </button>
  );
}
