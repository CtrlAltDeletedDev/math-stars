import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map as MapIcon, Play } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { activeFocus, sunToday } from '@/core/learner';
import { STAGES } from '@/core/stages';
import { todayString } from '@/engine/dates';
import { characterEmoji } from '../ui/character';
import { useLearner } from '../store';
import { ROUTES } from '../routes';
import { C, KID_FONT } from '../theme';
import { unlockSpeech } from '../platform/speech';
import { sound } from '../platform/sound';
import { pathView } from '../home/path';
import { PATH_W, layoutPath } from '../home/layout';
import PathScene from '../home/PathScene';
import Sun from '../home/Sun';
import GrownUpsDoor from '../home/GrownUpsDoor';
import { HOME_CSS } from '../home/styles';

// Her path. One winding trail of stones, her character on the one she is on,
// and one big Go. Nothing on it needs reading.

const BACKGROUND = `linear-gradient(180deg, ${C.sky} 0%, #EAF4EC 16%, ${C.grass} 34%, ${C.grass} 100%)`;
/** Wider than this, the path would get silly-big on an iPad; centre it instead. */
const MAX_PATH_PX = 500;
const FADE_EDGES = 'linear-gradient(180deg, transparent 0, #000 36px, #000 calc(100% - 18px), transparent 100%)';

export default function Home() {
  const learner = useLearner();
  const navigate = useNavigate();
  const view = useMemo(() => pathView(learner), [learner]);
  const layout = useMemo(() => layoutPath(view.stones.length, view.hers), [view]);
  const focus = activeFocus(learner);
  const walksToday = learner.days[todayString()]?.walks ?? 0;

  const scroller = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);

  // The path is drawn at most MAX_PATH_PX wide; the drawing's grass and fog
  // stretch past it to the screen's edges.
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    const measure = () => setWidth(sc.clientWidth);
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(sc);
    return () => ro?.disconnect();
  }, []);
  const pathPx = Math.min(width, MAX_PATH_PX);
  const pad = width > 0 ? Math.max(0, (width / (pathPx / PATH_W) - PATH_W) / 2) : 0;

  // Keep her stone in view: a little below the middle, so the two stones
  // ahead of her and the fog show above.
  const scrollToHer = useCallback(() => {
    const sc = scroller.current;
    const el = svg.current;
    const spot = layout.spots[view.hers];
    if (!sc || !el || !spot) return;
    const scale = el.getBoundingClientRect().width / (PATH_W + 2 * pad);
    const svgTop = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
    sc.scrollTop = Math.max(0, svgTop + spot.y * scale - sc.clientHeight * 0.55);
  }, [layout, view.hers, pad]);

  useLayoutEffect(() => {
    scrollToHer();
    window.addEventListener('resize', scrollToHer);
    return () => window.removeEventListener('resize', scrollToHer);
  }, [scrollToHer]);

  const go = () => {
    // iPad Safari only lets speech and sound start from inside a tap.
    unlockSpeech();
    sound.unlock();
    navigate(ROUTES.walk);
  };

  return (
    // Not <Page>: the grass and sky run to the screen's edges on an iPad too.
    <div style={{
      height: '100dvh', overflow: 'hidden', background: BACKGROUND, fontFamily: KID_FONT, color: C.ink,
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      padding: 'max(12px, env(safe-area-inset-top)) 0 max(16px, env(safe-area-inset-bottom))',
    }}>
      <style>{HOME_CSS}</style>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 0', position: 'relative', zIndex: 2, width: '100%', maxWidth: 620, margin: '0 auto', boxSizing: 'border-box' }}>
        <Sun fill={sunToday(learner)} walks={walksToday} goal={learner.profile.dailyWalks} />
        <GrownUpsDoor onOpen={() => navigate(ROUTES.grownUps)} />
      </header>

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {focus && <FocusRibbon track={focus.track} label={STAGES[focus.track][focus.stage]?.stone ?? ''} />}
        <div ref={scroller} className="np-scroll" style={{
          position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column',
          // Soft edges, so a stone half-scrolled away fades rather than being cut.
          maskImage: FADE_EDGES, WebkitMaskImage: FADE_EDGES,
        }}>
          {/* Pushes a short path down to sit just above Go. */}
          <div style={{ flex: '1 0 auto' }} />
          <PathScene ref={svg} view={view} layout={layout} pad={pad} character={characterEmoji(learner.profile.characterId)} />
        </div>
      </div>

      <nav style={{ display: 'flex', gap: 12, padding: '10px 16px 4px', position: 'relative', zIndex: 2, width: '100%', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}>
        <button
          type="button"
          aria-label="More games"
          className="np-press"
          onClick={() => navigate(ROUTES.more)}
          style={{
            flex: '0 0 auto', width: 100, height: 104, borderRadius: 28, border: 0, padding: 0, cursor: 'pointer',
            background: C.card, boxShadow: `0 7px 0 ${C.line}`, color: C.inkSoft,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <MapIcon size={34} strokeWidth={ICON_STROKE} aria-hidden="true" />
          <span aria-hidden="true" style={{ fontSize: 21, lineHeight: 1, letterSpacing: -1 }}>🕐🪙🔷</span>
        </button>
        <button
          type="button"
          aria-label="Go"
          className="np-press"
          onClick={go}
          style={{
            flex: 1, minWidth: 0, height: 104, borderRadius: 30, border: 0, cursor: 'pointer',
            background: C.go, color: '#FFFFFF', boxShadow: `0 7px 0 ${C.goDark}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
            fontFamily: KID_FONT, fontSize: 46, fontWeight: 700, letterSpacing: 0.5,
          }}
        >
          <Play size={44} strokeWidth={ICON_STROKE} fill="currentColor" aria-hidden="true" />
          Go
        </button>
      </nav>
    </div>
  );
}

/** A grown-up's "this week, work on…", shown as a small ribbon over the path. */
function FocusRibbon({ track, label }: { track: 'plus' | 'minus'; label: string }) {
  const solid = track === 'plus' ? C.plus : C.minus;
  const soft = track === 'plus' ? C.plusSoft : C.minusSoft;
  const sign = track === 'plus' ? '+' : '−';
  return (
    <div style={{ position: 'absolute', top: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px 6px 14px', borderRadius: 999,
        background: C.card, boxShadow: `0 3px 0 ${soft}, 0 4px 14px rgba(0,0,0,0.06)`,
        border: `2px solid ${soft}`, fontFamily: KID_FONT, fontSize: 16, fontWeight: 600, color: C.inkSoft,
      }}>
        <span>Picked for you:</span>
        <span style={{ padding: '2px 10px', borderRadius: 999, background: soft, color: C.ink, fontWeight: 700 }}>
          <span style={{ color: solid }}>{sign}</span> {label}
        </span>
      </div>
    </div>
  );
}
