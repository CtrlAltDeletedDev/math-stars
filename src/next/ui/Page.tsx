import { CSSProperties, ReactNode } from 'react';
import { C, KID_FONT } from '../theme';

/** A full-height screen on warm paper, centred and no wider than a big phone on an iPad. */
export default function Page({ children, background = C.paper, style, wide = false }: {
  children: ReactNode;
  background?: string;
  style?: CSSProperties;
  /** Let the content use the full width (the grown-ups screen on an iPad). */
  wide?: boolean;
}) {
  return (
    // The page scrolls itself: global.css locks html/body to the screen for the
    // old app, so a screen taller than an iPad was otherwise unreachable.
    <div style={{
      height: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
      background, fontFamily: KID_FONT, color: C.ink, display: 'flex', justifyContent: 'center',
    } as CSSProperties}>
      <div style={{
        width: '100%', maxWidth: wide ? 900 : 620, minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        padding: 'max(12px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))',
        boxSizing: 'border-box', ...style,
      }}>
        {children}
      </div>
    </div>
  );
}
