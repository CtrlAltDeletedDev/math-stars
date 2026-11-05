import { KeyboardEvent, PointerEvent, MouseEvent, RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { C } from '@/next/theme';

// Shared by the ten frame, number line, objects, bond, compare and text
// models: colours, the little motions, and a tap that survives a six-year-old.

/** The first number's counters (teal) and the second's (navy). Never red. */
export const COL = {
  a: C.plus,
  aSoft: C.plusSoft,
  b: C.navy,
  bSoft: '#DCE1F4',
  /** Taken away, crossed out, a hop back. */
  cross: C.minus,
  forward: C.go,
  back: C.minus,
  frame: '#4A5160',
  cellBg: '#FFFDF8',
  ink: C.ink,
  soft: C.inkSoft,
  unknown: C.amber,
  unknownSoft: C.amberSoft,
  unknownInk: '#9A6A00',
} as const;

const CSS = `
@keyframes ma-pop { 0% { transform: scale(.3); opacity: 0 } 65% { transform: scale(1.12); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
@keyframes ma-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes ma-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ma-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
@keyframes ma-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(232,163,23,0) } 50% { box-shadow: 0 0 0 4px rgba(232,163,23,.28) } }
.ma-pop { animation: ma-pop .34s cubic-bezier(.34,1.56,.64,1) both }
.ma-draw { animation: ma-draw .36s ease-out both }
.ma-fade { animation: ma-fade .3s ease both }
.ma-rise { animation: ma-rise .35s ease both }
.ma-glow { animation: ma-glow 1.1s ease 2 }
.ma-btn { appearance: none; -webkit-appearance: none; border: none; background: none; padding: 0; margin: 0;
  font: inherit; color: inherit; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.ma-btn:disabled { cursor: default }
.ma-btn:focus-visible, .ma-tap:focus-visible { outline: 3px solid ${C.navy}; outline-offset: 2px; border-radius: 12px }
.ma-tap { touch-action: manipulation; -webkit-tap-highlight-color: transparent; cursor: pointer; outline: none }
@media (prefers-reduced-motion: reduce) {
  .ma-m, .ma-m * { transition: none !important; animation: none !important }
}
`;

/** The keyframes, once per page (React 19 hoists and de-duplicates by href). */
export function MotionStyles() {
  return <style href="learn-models-a" precedence="default">{CSS}</style>;
}

// --- Tap -----------------------------------------------------------------------------

// A tap is a pointer that goes down and comes up on the same thing without
// travelling: a finger that starts a scroll is not a tap (the browser cancels
// the pointer), and a palm resting elsewhere does not stop another finger.
const downs = new Map<number, { x: number; y: number; el: EventTarget }>();
const SLOP = 14;

export type TapEvent = { clientX: number; clientY: number; currentTarget: Element };

/**
 * Props that call `fn` on a tap (pointer events), on a keyboard click of a
 * <button>, and with `key` also on Enter/Space for an element given
 * role="button" (an SVG part, say).
 */
export function tap(fn: (e: TapEvent) => void, key = false) {
  return {
    onPointerDown: (e: PointerEvent<Element>) => {
      if (e.button > 0) return;
      downs.set(e.pointerId, { x: e.clientX, y: e.clientY, el: e.currentTarget });
    },
    onPointerUp: (e: PointerEvent<Element>) => {
      const d = downs.get(e.pointerId);
      downs.delete(e.pointerId);
      if (!d || d.el !== e.currentTarget) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > SLOP) return;
      fn({ clientX: e.clientX, clientY: e.clientY, currentTarget: e.currentTarget });
    },
    onPointerCancel: (e: PointerEvent<Element>) => { downs.delete(e.pointerId); },
    // A click with no pointer behind it (detail 0) came from the keyboard.
    onClick: (e: MouseEvent<Element>) => {
      if (e.detail === 0) fn({ clientX: e.clientX, clientY: e.clientY, currentTarget: e.currentTarget });
    },
    ...(key ? {
      onKeyDown: (e: KeyboardEvent<Element>) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        fn({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, currentTarget: e.currentTarget });
      },
    } : {}),
  };
}

// --- Hooks ----------------------------------------------------------------------------

/** The value from the last committed render: what the picture showed before this change. */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = value; }, [value]);
  // eslint-disable-next-line react-hooks/refs
  return ref.current;
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** The element's content width in px, kept up to date. `guess` until it is measured. */
export function useWidth(ref: RefObject<Element | null>, guess: number): number {
  const [w, setW] = useState(guess);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.getBoundingClientRect().width || guess);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width;
      if (next > 0) setW(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, guess]);
  return w;
}

/** A crossed-out mark: an orange X, drawn to fill its box. */
export function CrossX({ width = 12 }: { width?: number }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
      <path d="M22 22 L78 78 M78 22 L22 78" stroke={COL.cross} strokeWidth={width} strokeLinecap="round" fill="none" />
    </svg>
  );
}
