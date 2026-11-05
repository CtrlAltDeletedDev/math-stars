import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { sunToday } from '@/core/learner';
import { todayString } from '@/engine/dates';
import { characterEmoji } from '../ui/character';
import { useLearner } from '../store';
import { ROUTES } from '../routes';
import { C, KID_FONT } from '../theme';
import { speak, unlockSpeech } from '../platform/speech';
import { sound } from '../platform/sound';
import { UnitSign, courseView } from '../home/path';
import { PATH_W, layoutPath } from '../home/layout';
import PathScene from '../home/PathScene';
import Sun from '../home/Sun';
import GrownUpsDoor from '../home/GrownUpsDoor';
import { HOME_CSS } from '../home/styles';

// Her path: the course, one road of lesson stones grouped by unit, her
// character on today's. Go opens today's lesson; the small square beside it is
// the quick plus-and-minus walk. Nothing on it needs reading, and nothing is
// locked: every stone opens its lesson.

const BACKGROUND = `linear-gradient(180deg, ${C.sky} 0%, #EAF4EC 16%, ${C.grass} 34%, ${C.grass} 100%)`;
/** Wider than this, the path would get silly-big on an iPad; centre it instead. */
const MAX_PATH_PX = 500;
const FADE_EDGES = 'linear-gradient(180deg, transparent 0, #000 36px, #000 calc(100% - 18px), transparent 100%)';

export default function Home() {
  const learner = useLearner();
  const navigate = useNavigate();
  const view = useMemo(() => courseView(learner), [learner]);
  const layout = useMemo(() => layoutPath(view.nodes.map((n) => n.kind), view.hers), [view]);
  const pinned = view.today && learner.pinnedLesson === view.today.id ? view.today : null;
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

  // Keep today's stone in view: a little below the middle, so the stones
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

  // iPad Safari only lets speech and sound start from inside a tap.
  const unlock = () => { unlockSpeech(); sound.unlock(); };
  const openLesson = (id: string) => { unlock(); navigate(ROUTES.lesson(id)); };
  const sums = () => { unlock(); navigate(ROUTES.walk); };
  // Nothing to learn yet (or all of it learned): Go is the sums walk.
  const go = () => (view.today ? openLesson(view.today.id) : sums());
  const sayUnit = (sign: UnitSign) => { unlock(); speak(sign.title); };

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
        {pinned && <PickedRibbon emoji={pinned.emoji} />}
        <div ref={scroller} className="np-scroll" style={{
          position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column',
          // Soft edges, so a stone half-scrolled away fades rather than being cut.
          maskImage: FADE_EDGES, WebkitMaskImage: FADE_EDGES,
        }}>
          {/* Pushes a short path down to sit just above Go. */}
          <div style={{ flex: '1 0 auto' }} />
          <PathScene ref={svg} view={view} layout={layout} pad={pad} character={characterEmoji(learner.profile.characterId)}
            onLesson={openLesson} onUnit={sayUnit} />
        </div>
      </div>

      <nav style={{ display: 'flex', gap: 12, padding: '10px 16px 4px', position: 'relative', zIndex: 2, width: '100%', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box' }}>
        <button
          type="button"
          aria-label="Quick sums"
          className="np-press"
          onClick={sums}
          style={{
            flex: '0 0 auto', width: 100, height: 104, borderRadius: 28, border: 0, padding: 0, cursor: 'pointer',
            background: C.card, boxShadow: `0 7px 0 ${C.line}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
            fontFamily: KID_FONT, fontSize: 48, fontWeight: 700, lineHeight: 1,
          }}
        >
          <span aria-hidden="true" style={{ color: C.plus }}>+</span>
          <span aria-hidden="true" style={{ color: C.minus }}>−</span>
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

/** A grown-up picked today's lesson: say so, quietly, over the path. */
function PickedRibbon({ emoji }: { emoji: string }) {
  return (
    <div style={{ position: 'absolute', top: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px 6px 14px', borderRadius: 999,
        background: C.card, boxShadow: `0 3px 0 ${C.amberSoft}, 0 4px 14px rgba(0,0,0,0.06)`,
        border: `2px solid ${C.amberSoft}`, fontFamily: KID_FONT, fontSize: 16, fontWeight: 600, color: C.inkSoft,
      }}>
        <span>Picked for you</span>
        <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: '50%', background: C.amberSoft, display: 'grid', placeItems: 'center', fontSize: 19 }}>{emoji}</span>
      </div>
    </div>
  );
}
