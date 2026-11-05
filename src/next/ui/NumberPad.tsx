import { useEffect } from 'react';
import { Check, Delete } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { C, KID_FONT } from '../theme';

// The number pad.
//
// They type the answer, like on a worksheet. Four options invited tap-guessing
// and let the answer's position or shape give it away; a pad can do neither,
// and what they type is better evidence than which option they tapped.
//
// There is no auto-submit when enough digits are in: that would leak how many
// digits the answer has. ✓ is the commit, and it goes green only once they have
// typed something.

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  maxDigits?: number;
  onKey?: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'] as const;

export default function NumberPad({ value, onChange, onSubmit, disabled = false, maxDigits = 3, onKey }: Props) {
  const press = (k: (typeof KEYS)[number]) => {
    if (disabled) return;
    if (k === 'ok') { if (value) onSubmit(); return; }
    onKey?.();
    if (k === 'del') onChange(value.slice(0, -1));
    else if (value.length < maxDigits) onChange(value === '0' ? k : value + k);
  };

  // A keyboard works too: for a grown-up testing on a laptop, and for anyone
  // who needs it.
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) press(e.key as (typeof KEYS)[number]);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') press('ok');
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  });

  return (
    <div
      role="group"
      aria-label="Number pad"
      style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(8px, 1.6vh, 14px)',
        width: '100%', maxWidth: 460, margin: '0 auto',
      }}
    >
      {KEYS.map((k) => {
        const ok = k === 'ok';
        const ready = ok && !!value && !disabled;
        return (
          <button
            key={k}
            onClick={() => press(k)}
            disabled={disabled || (ok && !value)}
            aria-label={k === 'del' ? 'Rub out' : ok ? 'Check my answer' : k}
            style={{
              height: 'clamp(64px, 9.5vh, 92px)', borderRadius: 20, border: 'none',
              background: ok ? (ready ? C.go : C.goSoft) : k === 'del' ? C.paperDeep : C.card,
              color: ok ? '#fff' : C.ink,
              boxShadow: ready || (!ok && !disabled) ? `0 4px 0 ${ok ? C.goDark : C.line}` : 'none',
              fontFamily: KID_FONT, fontWeight: 600, fontSize: 'clamp(30px, 4.6vh, 44px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: disabled ? 'default' : 'pointer', touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent', transition: 'background 0.15s, transform 0.06s',
            }}
            onPointerDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(2px)'; }}
            onPointerUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
            onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ''; }}
          >
            {k === 'del' ? <Delete size={34} strokeWidth={ICON_STROKE} color={C.inkSoft} aria-hidden />
              : ok ? <Check size={40} strokeWidth={3} aria-hidden />
              : k}
          </button>
        );
      })}
    </div>
  );
}
