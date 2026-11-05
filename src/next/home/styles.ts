// The few animations their screens use, in one style block. Everything that
// moves only idles gently, and nothing moves at all under reduced motion.

export const HOME_CSS = `
@keyframes np-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
@keyframes np-glow { 0%,100% { opacity: .55; transform: scale(1) } 50% { opacity: .95; transform: scale(1.06) } }
@keyframes np-wiggle { 0%,100% { transform: rotate(0) } 25% { transform: rotate(-12deg) } 75% { transform: rotate(10deg) } }
@keyframes np-twinkle { 0%,100% { opacity: .35; transform: scale(.75) } 50% { opacity: 1; transform: scale(1.1) } }
.np-bob { animation: np-bob 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center bottom; }
.np-glow { animation: np-glow 2.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.np-wiggle { animation: np-wiggle .4s ease-in-out; }
.np-twinkle { animation: np-twinkle 1.8s ease-in-out infinite; }
.np-press { transition: transform .08s ease, box-shadow .08s ease; -webkit-tap-highlight-color: transparent; }
.np-press:active { transform: translateY(5px); }
/* Stones and signs are SVG buttons: a green ring for keyboard focus, not the browser's box. */
.np-node { outline: none; -webkit-tap-highlight-color: transparent; }
.np-node:focus-visible .np-hit { stroke: #2E9E5B; stroke-width: 4; stroke-opacity: 1; }
.np-scroll { scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.np-scroll::-webkit-scrollbar { display: none; }
@media (prefers-reduced-motion: reduce) {
  .np-bob, .np-glow, .np-wiggle, .np-twinkle { animation: none; }
  .np-press, .np-press:active { transition: none; }
}
`;
