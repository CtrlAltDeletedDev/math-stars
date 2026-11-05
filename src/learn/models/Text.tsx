import { ModelProps } from './types';
import { C, KID_FONT } from '@/next/theme';
import { MotionStyles } from './a-shared';
import { textLabel, textPieces } from './logic-a';

// A big written thing for the guide to point at: "8 + 5 = 13", "=". Plus
// signs are teal and minus signs orange, as everywhere on her screens; a
// `tone` of 'plus' or 'minus' colours only that sign, 'plain' none. A hyphen
// used as a minus is drawn as a true minus sign. When the text changes, the
// new text rises in.

function fontSize(text: string, size: 'big' | 'small'): string {
  const longest = Math.max(...text.split('\n').map((l) => l.length));
  if (size === 'small') return longest <= 8 ? '40px' : longest <= 16 ? '28px' : '20px';
  if (longest <= 8) return 'clamp(56px, 17vw, 112px)';
  if (longest <= 16) return 'clamp(40px, 10vw, 76px)';
  return 'clamp(26px, 6vw, 44px)';
}

export default function Text({ state, size = 'big' }: ModelProps<'text'>) {
  const pieces = textPieces(state.text, state.tone);
  return (
    <div
      className="ma-m"
      role="img"
      aria-label={textLabel(state)}
      style={{ display: 'flex', justifyContent: 'center', maxWidth: '100%' }}
    >
      <MotionStyles />
      <div
        key={state.text}
        className="ma-rise"
        aria-hidden
        style={{
          fontFamily: KID_FONT, fontWeight: 600, color: C.ink,
          fontSize: fontSize(state.text, size), lineHeight: 1.2,
          textAlign: 'center', whiteSpace: 'pre-line', overflowWrap: 'anywhere',
          maxWidth: '100%',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {pieces.map((p, i) => p.kind === 'plain'
          ? <span key={i}>{p.text}</span>
          : <span key={i} style={{ color: p.kind === 'plus' ? C.plus : C.minus, fontWeight: 700 }}>{p.text}</span>)}
      </div>
    </div>
  );
}
