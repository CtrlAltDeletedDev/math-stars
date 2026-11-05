import { C, ADULT_FONT } from '../theme';

// The grown-ups screen's look, as one stylesheet. Media queries (iPad, print)
// and :focus-visible are the reason it is CSS and not inline styles.
//
// Plain white, one readable font, the plus / minus colours from her screens so
// a grown-up learns the same code she does.

export const INK = '#24252F';
export const SOFT = '#5E6072';
export const MUTE = '#767888';
export const RULE = '#EEE9DF';
export const TILE = '#F8F5EE';
export const TRACK_BG = '#F1ECE2';

export const STATE_COLOURS = {
  new: '#ECE8E0',
  learning: '#F2B544',
  slow: '#B5E0C0',
  fast: C.goDark,
} as const;

export const css = `
.gu-root { height: 100%; height: 100dvh; overflow-y: auto; -webkit-overflow-scrolling: touch; background: #fff; }
.gu { font-family: ${ADULT_FONT}; color: ${INK}; font-size: 16px; line-height: 1.4; -webkit-text-size-adjust: 100%; }
.gu *, .gu *::before, .gu *::after { box-sizing: border-box; }
.gu button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.gu button:disabled { cursor: default; opacity: .45; }
.gu :focus-visible { outline: 3px solid ${C.navy}; outline-offset: 2px; border-radius: 8px; }
.gu h1 { font-size: 28px; line-height: 1.15; margin: 4px 0 2px; font-weight: 700; }
.gu h2 { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: ${MUTE}; margin: 0 0 12px; font-weight: 700; }
.gu h3 { font-size: 16px; margin: 0; font-weight: 700; }
.gu p { margin: 0; }
.gu .sub { color: ${SOFT}; font-size: 15px; }
.gu .muted { color: ${SOFT}; }
.gu .small { font-size: 14px; }

.gu-back { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: ${C.goDark}; font-size: 16px; padding: 10px 12px 10px 2px; min-height: 44px; text-decoration: none; }
.gu-sec { padding: 18px 0; border-top: 1px solid ${RULE}; }
.gu-head { padding: 2px 0 16px; }

.gu-warn { display: flex; gap: 10px; align-items: flex-start; background: #FFF1E6; border: 2px solid #F0A46A; color: #6A3410; border-radius: 14px; padding: 12px 14px; margin: 6px 0 12px; font-size: 15px; }
.gu-warn svg { flex: none; margin-top: 1px; }

/* the week */
.gu-week { display: flex; gap: 6px; margin-bottom: 12px; }
.gu-week .d { flex: 1; text-align: center; font-size: 12px; color: ${MUTE}; }
.gu-week .d.today { color: ${INK}; font-weight: 700; }
.gu-week .bar { display: block; height: 44px; border-radius: 8px; background: ${TRACK_BG}; margin-bottom: 4px; position: relative; overflow: hidden; }
.gu-week .bar b { position: absolute; left: 0; right: 0; bottom: 0; background: ${C.go}; border-radius: 8px; }
.gu-week .n { display: block; font-size: 11px; height: 14px; color: ${SOFT}; }
.gu-stats { display: flex; gap: 8px; }
.gu-stat { flex: 1; background: ${TILE}; border-radius: 12px; padding: 10px 12px; min-width: 0; }
.gu-stat b { font-size: 24px; display: block; line-height: 1.15; }
.gu-stat span { font-size: 13px; color: ${SOFT}; }
.gu-summary { margin-top: 16px; font-size: 16px; }
.gu-today { margin-top: 4px; font-size: 14px; color: ${SOFT}; }

/* where she is */
.gu-two { display: grid; grid-template-columns: 1fr; gap: 22px; }
.gu-track .row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.gu-track .nm { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 17px; }
.gu-sign { flex: none; display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 7px; color: #fff; font-weight: 700; font-size: 18px; line-height: 1; }
.gu-track .st { font-size: 13px; color: ${SOFT}; white-space: nowrap; }
.gu-rungs { display: flex; gap: 3px; margin: 9px 0 8px; }
.gu-rungs i { flex: 1; height: 10px; border-radius: 5px; background: #EBE5D8; }
.gu-track .note { font-size: 15px; color: #45475A; }
.gu-track .note + .note { margin-top: 4px; }
.gu-ready { margin-top: 10px; background: ${C.goSoft}; border-radius: 12px; padding: 10px 12px; font-size: 15px; display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; justify-content: space-between; }

.gu .gu-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 14px; border-radius: 12px; border: 2px solid #E2D9C7; background: #fff; font-weight: 700; font-size: 15px; text-decoration: none; color: ${INK}; }
.gu .gu-btn.primary { background: ${C.go}; border-color: ${C.go}; color: #fff; }
.gu .gu-btn.quiet { border-color: transparent; background: ${TRACK_BG}; }
.gu .gu-btn.wide { width: 100%; }
.gu .gu-btn.danger { color: #9A3B0C; }
.gu .gu-link { color: ${C.goDark}; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; padding: 6px 2px; min-height: 36px; }

.gu-focus { margin-top: 10px; }
.gu-focus .on { display: flex; align-items: center; gap: 10px; justify-content: space-between; border-radius: 12px; padding: 8px 8px 8px 12px; font-size: 15px; }
.gu-focus .pick { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; background: ${TILE}; border-radius: 12px; padding: 10px; }
.gu-focus select { font: inherit; font-size: 15px; min-height: 44px; padding: 6px 10px; border-radius: 10px; border: 2px solid #E2D9C7; background: #fff; color: ${INK}; flex: 1 1 220px; min-width: 0; }

/* the grids */
.gu-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 14px; color: ${SOFT}; margin-bottom: 14px; }
.gu-legend span { display: inline-flex; align-items: center; gap: 6px; }
.gu-legend i { width: 16px; height: 16px; border-radius: 4px; display: inline-block; }
.gu-grids { display: grid; grid-template-columns: 1fr; gap: 26px; }
.gu-gridbox { --cell: 26px; --gap: 2px; min-width: 0; }
.gu-gridbox .cap { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.gu-gridbox .count { font-size: 13px; color: ${SOFT}; }
.gu-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
.gu-gridwrap { position: relative; display: flex; gap: 4px; width: max-content; }
.gu-axis-y { width: 14px; display: flex; align-items: center; justify-content: center; }
.gu-axis-y span { writing-mode: vertical-rl; font-size: 12px; font-weight: 700; color: ${MUTE}; white-space: nowrap; letter-spacing: .02em; }
.gu-axis-x { font-size: 12px; font-weight: 700; color: ${MUTE}; height: 16px; padding-left: calc(var(--cell) + var(--gap)); letter-spacing: .02em; }
.gu-grid { display: grid; grid-template-columns: repeat(12, var(--cell)); grid-auto-rows: var(--cell); gap: var(--gap); }
.gu-grid .h { display: grid; place-items: center; font-size: 12px; color: ${MUTE}; font-weight: 700; border-radius: 5px; }
.gu-grid .h.hi { background: ${INK}; color: #fff; }
.gu-grid .corner { font-size: 16px; color: #fff; border-radius: 6px; }
.gu-grid button.c { width: var(--cell); height: var(--cell); border-radius: 5px; padding: 0; }
.gu-grid button.c.sel { box-shadow: 0 0 0 2px #fff, 0 0 0 4px ${INK}; position: relative; z-index: 1; }
.gu-pop { position: absolute; z-index: 5; width: 216px; background: #fff; border-radius: 14px; box-shadow: 0 6px 24px rgba(30,30,40,.18), 0 0 0 1px rgba(30,30,40,.06); padding: 12px 14px; font-size: 14px; }
.gu-pop .f { font-size: 22px; font-weight: 700; margin-right: 28px; }
.gu-pop .x { position: absolute; top: 6px; right: 6px; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 10px; color: ${SOFT}; }
.gu-pop .pill { display: inline-block; font-size: 12px; font-weight: 700; border-radius: 999px; padding: 2px 8px; margin: 4px 0 6px; }
.gu-pop dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; }
.gu-pop dt { color: ${SOFT}; }
.gu-pop dd { margin: 0; font-weight: 700; }

/* worth doing together */
.gu-chips { display: grid; grid-template-columns: 1fr; gap: 8px; }
.gu-chip { background: #FFF6E9; border: 1px solid #F2D7B2; border-radius: 12px; padding: 9px 12px; }
.gu-chip .top { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.gu-chip b { font-size: 19px; }
.gu-chip .said { font-size: 14px; color: ${SOFT}; }
.gu-chip .idea { font-size: 14px; color: #45475A; margin-top: 2px; }

/* settings */
.gu-set { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 7px 0; min-height: 52px; }
.gu-set > label, .gu-set > span { font-size: 16px; }
.gu-seg { display: inline-flex; background: ${TRACK_BG}; border-radius: 11px; padding: 3px; flex: none; }
.gu-seg button { min-width: 44px; min-height: 38px; padding: 4px 11px; border-radius: 8px; font-size: 15px; color: ${SOFT}; }
.gu-seg button[aria-checked="true"] { background: #fff; color: ${INK}; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,.14); }
.gu-input { font: inherit; font-size: 16px; min-height: 44px; padding: 6px 12px; border-radius: 10px; border: 2px solid #E2D9C7; color: ${INK}; width: 180px; min-width: 0; }
.gu-settings { display: grid; grid-template-columns: 1fr; column-gap: 40px; }

.gu-stack { display: flex; flex-direction: column; gap: 10px; }
.gu-row { display: flex; flex-wrap: wrap; gap: 8px; }
.gu-panel { background: ${TILE}; border-radius: 12px; padding: 12px; font-size: 15px; }
.gu-ok { background: ${C.goSoft}; color: #174D2E; border-radius: 12px; padding: 10px 12px; font-size: 15px; }
.gu-bad { background: #FFF1E6; color: #6A3410; border-radius: 12px; padding: 10px 12px; font-size: 15px; }

/* PIN */
.gu-pin { max-width: 380px; width: 100%; margin: 0 auto; padding: 8px 0 24px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.gu-pin h1 { font-size: 24px; margin: 12px 0 4px; }
.gu-dots { display: flex; gap: 16px; margin: 22px 0 8px; }
.gu-dots i { width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid #B9B3A5; }
.gu-dots i.on { background: ${INK}; border-color: ${INK}; }
.gu-dots.shake { animation: gu-shake .35s; }
@keyframes gu-shake { 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }
.gu-pinmsg { min-height: 24px; font-size: 15px; color: #9A3B0C; margin-bottom: 8px; }
.gu-keys { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; width: 100%; max-width: 320px; }
.gu-keys button { height: 66px; border-radius: 16px; background: ${TILE}; font-size: 28px; font-weight: 700; display: grid; place-items: center; }
.gu-keys button:active { background: ${TRACK_BG}; }
.gu-keys .blank { visibility: hidden; }

@media (min-width: 720px) {
  .gu h1 { font-size: 32px; }
  .gu-two { grid-template-columns: 1fr 1fr; gap: 32px; }
  .gu-gridbox { --cell: 30px; --gap: 3px; }
  .gu-chips { grid-template-columns: 1fr 1fr; }
  .gu-settings { grid-template-columns: 1fr 1fr; }
  .gu-sec { padding: 22px 0; }
  .gu-week .bar { height: 56px; }
}

@media (min-width: 800px) {
  /* Side by side: each grid is 14 + 4 + 12 × 27 + 11 × 3 = 375px wide. */
  .gu-grids { grid-template-columns: 1fr 1fr; gap: 28px; }
  .gu-gridbox { --cell: 27px; --gap: 3px; }
}

/* the worksheet */
.gu-sheet { font-family: ${ADULT_FONT}; color: #000; background: #fff; }
.gu-sheet .bar { display: flex; gap: 8px; justify-content: space-between; align-items: center; padding: 8px 0 16px; }
.gu-sheet h1 { font-size: 30px; margin: 0 0 4px; }
.gu-sheet .meta { font-size: 16px; color: #444; margin-bottom: 22px; }
.gu-sums { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 28px; }
.gu-sum { display: flex; align-items: center; gap: 10px; font-size: 34px; font-weight: 700; white-space: nowrap; }
.gu-sum .k { font-size: 14px; color: #777; width: 22px; font-weight: 400; text-align: right; }
.gu-sum .e { min-width: 5.3em; text-align: right; font-variant-numeric: tabular-nums; }
.gu-sum .box { display: inline-block; width: 74px; height: 54px; border: 3px solid #222; border-radius: 10px; }
.gu-key { break-before: page; page-break-before: always; padding-top: 28px; }
.gu-key h2 { font-size: 22px; margin: 0 0 14px; text-transform: none; letter-spacing: 0; color: #000; }
.gu-key ol { columns: 4; column-gap: 24px; font-size: 18px; margin: 0; padding-left: 28px; }
.gu-key li { margin-bottom: 6px; }
@media (max-width: 480px) {
  /* On a phone the sheet is a preview: one column. Paper gets two (print, below). */
  .gu-sums { grid-template-columns: 1fr; gap: 14px; }
  .gu-key ol { columns: 2; }
}
@media print {
  html, body, #root, .gu-root { height: auto !important; overflow: visible !important; background: #fff !important; }
  .gu-root > div, .gu-root > div > div { min-height: 0 !important; }
  /* global.css hides body * when printing (the old app's certificate). */
  .gu-sheet, .gu-sheet * { visibility: visible !important; }
  .gu-noprint { display: none !important; }
  .gu-sheet { padding: 0; }
  .gu-sum { font-size: 34px; }
  .gu-sum .box { width: 74px; height: 54px; }
  .gu-sums { grid-template-columns: 1fr 1fr; gap: 26px 40px; }
  .gu-key ol { columns: 4; }
  @page { margin: 16mm; }
}
`;
