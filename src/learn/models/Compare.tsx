import { ModelProps } from './types';
import { COL, MotionStyles, tap } from './a-shared';
import { compareLabel } from './logic-a';

// Two rows lined up in the same columns, so "which has more?" is something
// they can see. `matched` draws a line between each pair, one after another,
// and gently lights up the extras that have no partner.
//
// In "do" a tap anywhere on it matches them up (and a second tap un-matches),
// so a lesson can say "Tap to match them!".

export default function Compare({ state, onChange, size = 'big' }: ModelProps<'compare'>) {
  const [top, bottom] = state.rows;
  const cols = Math.max(1, top.count, bottom.count);
  const pairs = Math.min(top.count, bottom.count);
  const cellPx = size === 'big' ? 58 : 26;
  const matched = !!state.matched;
  const live = !!onChange;
  const emojiPx = `${(100 / cols) * 0.6}cqw`;
  const lineGap = size === 'big' ? 26 : 12;

  const row = (r: { emoji: string; count: number }, which: 0 | 1) =>
    Array.from({ length: r.count }, (_, i) => {
      const extra = matched && i >= pairs;
      return (
        <div
          key={`${which}-${i}`}
          style={{
            gridRow: which === 0 ? 1 : 3, gridColumn: i + 1,
            aspectRatio: '1 / 0.86', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* The extras, with no partner, get a soft amber glow once the lines are in. */}
          <span
            aria-hidden
            className={extra ? 'ma-glow' : undefined}
            style={{
              position: 'absolute', inset: '8% 12%', borderRadius: '50%',
              background: extra ? COL.unknownSoft : 'transparent',
              transition: 'background .4s ease',
              transitionDelay: extra ? `${pairs * 70 + 150}ms` : '0ms',
              animationDelay: `${pairs * 70 + 150}ms`,
            }}
          />
          <span style={{ position: 'relative', fontSize: emojiPx, lineHeight: 1 }}>{r.emoji}</span>
        </div>
      );
    });

  const body = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, ${cellPx}px))`,
        gridTemplateRows: `auto ${lineGap}px auto`,
        containerType: 'inline-size',
      }}
    >
      {row(top, 0)}
      {Array.from({ length: pairs }, (_, i) => (
        <div key={`l${i}`} style={{ gridRow: 2, gridColumn: i + 1, display: 'flex', justifyContent: 'center' }}>
          <span style={{
            width: size === 'big' ? 4 : 2, height: '100%', borderRadius: 4, background: COL.soft,
            transformOrigin: 'top',
            transform: matched ? 'scaleY(1)' : 'scaleY(0)',
            opacity: matched ? 0.7 : 0,
            transition: `transform .3s ease ${matched ? i * 70 : 0}ms, opacity .3s ease ${matched ? i * 70 : 0}ms`,
          }} />
        </div>
      ))}
      {row(bottom, 1)}
    </div>
  );

  return (
    <div className="ma-m" style={{ display: 'flex', justifyContent: 'center', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <MotionStyles />
      {live ? (
        <button
          type="button"
          className="ma-btn"
          aria-label={`${compareLabel(state)}. ${matched ? 'Tap to unmatch' : 'Tap to match them up'}`}
          aria-pressed={matched}
          {...tap(() => onChange!({ ...state, matched: !matched }))}
          style={{ maxWidth: '100%', display: 'flex', justifyContent: 'center', padding: size === 'big' ? 8 : 4, borderRadius: 18 }}
        >{body}</button>
      ) : (
        <div role="img" aria-label={compareLabel(state)} style={{ maxWidth: '100%', display: 'flex', justifyContent: 'center' }}>{body}</div>
      )}
    </div>
  );
}
