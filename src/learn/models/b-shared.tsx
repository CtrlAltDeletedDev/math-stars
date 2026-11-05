import { CSSProperties, useEffect, useState } from 'react';
import { C, KID_FONT } from '@/next/theme';

// Shared bits for the Blocks, Clock, Coins, Fraction, Shapes, Measure and
// Graph models: one stylesheet of animations, a hook that lets a removed piece
// fade out rather than vanish, and the big tap-button look.

const CSS = `
@keyframes mb-pop { 0% { transform: scale(.2); opacity: 0 } 60% { transform: scale(1.12); opacity: 1 } 100% { transform: scale(1) } }
@keyframes mb-drop { 0% { transform: translateY(-34px) scale(.7); opacity: 0 } 70% { transform: translateY(3px) scale(1.04); opacity: 1 } 100% { transform: none } }
@keyframes mb-out { to { transform: scale(.4); opacity: 0 } }
@keyframes mb-bump { 0% { transform: scale(1) } 40% { transform: scale(1.18) } 100% { transform: scale(1) } }
@keyframes mb-fly { 0% { transform: none; opacity: 1 } 70% { opacity: 1 } 100% { transform: translate(var(--dx, 0px), var(--dy, 0px)) scale(.5); opacity: 0 } }
@keyframes mb-rod { 0%, 45% { transform: scaleY(.1); opacity: 0 } 80% { transform: scaleY(1.05); opacity: 1 } 100% { transform: none } }
@keyframes mb-glow { 0%, 100% { opacity: .55 } 50% { opacity: 1 } }
@keyframes mb-ring { 0% { transform: scale(.85); opacity: 0 } 100% { transform: none; opacity: 1 } }
@keyframes mb-wiggle { 0%, 100% { transform: none } 25% { transform: rotate(-6deg) } 75% { transform: rotate(6deg) } }
.mb-pop, .mb-drop, .mb-out, .mb-bump, .mb-fly, .mb-rod, .mb-ring, .mb-wiggle { transform-box: fill-box; transform-origin: center; }
.mb-pop { animation: mb-pop .42s cubic-bezier(.3,1.4,.5,1) both; }
.mb-drop { animation: mb-drop .45s cubic-bezier(.3,1.3,.5,1) both; }
.mb-out { animation: mb-out .3s ease-in both; pointer-events: none; }
.mb-bump { animation: mb-bump .4s ease-out; }
.mb-fly { animation: mb-fly .7s ease-in both; pointer-events: none; }
.mb-rod { animation: mb-rod .9s cubic-bezier(.3,1.3,.5,1) both; transform-origin: center bottom; }
.mb-glow { animation: mb-glow 1.6s ease-in-out infinite; }
.mb-ring { animation: mb-ring .25s ease-out both; }
.mb-wiggle { animation: mb-wiggle .3s ease-in-out; }
.mb-btn { transition: transform .12s ease, box-shadow .12s ease, opacity .2s; }
.mb-btn:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 ${C.line} !important; }
.mb-tap { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mb-tap:focus, .mb-btn:focus { outline: none; }
.mb-tap:focus-visible, .mb-btn:focus-visible { outline: 3px solid ${C.navy}; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .mb-pop, .mb-drop, .mb-bump, .mb-rod, .mb-ring, .mb-wiggle, .mb-glow { animation: none !important; }
  .mb-out, .mb-fly { animation: none !important; opacity: 0 !important; }
  .mb-anim { transition: none !important; }
}
`;

/** The models' animations. React 19 hoists this once into <head>, however many models render. */
export function ModelStyles() {
  return <style href="learn-models-b" precedence="default">{CSS}</style>;
}

/**
 * How many pieces to draw when a count changes: when it drops, the old count
 * for a moment, so the removed pieces (index >= `n`) can play `mb-out`.
 */
export function useLeaving(n: number, ms = 320): number {
  const [last, setLast] = useState(n);
  const [shown, setShown] = useState(n);
  if (n !== last) {
    setLast(n);
    setShown(Math.max(n, last));
  }
  useEffect(() => {
    if (shown <= n) return;
    const t = setTimeout(() => setShown(n), ms);
    return () => clearTimeout(t);
  }, [shown, n, ms]);
  return Math.max(shown, n);
}

/** Bumps a key each time `value` changes, so a `mb-bump` element replays its animation. */
export function useChangeKey(value: unknown): number {
  const [st, setSt] = useState({ value, key: 0 });
  if (!Object.is(st.value, value)) {
    const next = { value, key: st.key + 1 };
    setSt(next);
    return next.key;
  }
  return st.key;
}

/** A big, picture-only button for her: white, chunky, pressed-in on tap. */
export function bigButton(size: number, disabled?: boolean): CSSProperties {
  return {
    minWidth: size, height: size, padding: '0 10px', borderRadius: 20,
    border: `3px solid ${C.line}`, background: C.card,
    boxShadow: `0 4px 0 ${C.line}`, cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1, touchAction: 'manipulation',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: KID_FONT, fontWeight: 700, fontSize: 30, color: C.ink, lineHeight: 1,
    WebkitTapHighlightColor: 'transparent',
  };
}

/** Pixel size of a drawing: natural width for its size, shrinking to fit a narrow tile or phone. */
export function svgBox(vbW: number, vbH: number, scale: number): { width: number; height: number; style: CSSProperties } {
  return {
    width: Math.round(vbW * scale), height: Math.round(vbH * scale),
    style: { maxWidth: '100%', height: 'auto', display: 'block', overflow: 'visible' },
  };
}

export const NUM_FONT: CSSProperties = { fontFamily: KID_FONT, fontWeight: 700 };

/** Keyboard support for an SVG shape acting as a button. */
export function tapProps(label: string, onTap: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': label,
    className: 'mb-tap',
    onClick: onTap,
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } },
  };
}
