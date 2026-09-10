import { Level, LevelState } from '@/types';

interface Props {
  levels: Level[];
  /** Sparse — a missing entry simply means she has not played it yet. */
  states: Record<string, LevelState | undefined>;
  onPlay: (levelId: string) => void;
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ fontSize: 13, letterSpacing: 1 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ opacity: i < n ? 1 : 0.28 }}>
          ⭐
        </span>
      ))}
    </span>
  );
}

// Every activity in the topic, all of them tappable, all of the time.
//
// This replaces the vertical LevelMap, where five of six nodes were padlocks and
// the only way to reach the sixth was to beat the one above it. Maths facts are
// not a story: a child working on +2 in class this week should be able to tap +2
// today, whether or not she has finished -1.
//
// Stars mark what she has already earned rather than gating what comes next, so
// a level she has three-starred stays as playable as one she has never opened.

export default function ReplayStrip({ levels, states, onPlay }: Props) {
  if (levels.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        padding: '4px 2px 10px',
        // Wide content scrolls inside its own box; the page never scrolls sideways.
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {levels.map((level, idx) => {
        const state = states[level.id];
        const stars = state?.starsEarned ?? 0;
        const played = (state?.totalAttempts ?? 0) > 0;

        return (
          <button
            key={level.id}
            onClick={() => onPlay(level.id)}
            style={{
              flex: '0 0 auto',
              width: 128,
              minHeight: 116,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '12px 10px',
              borderRadius: 18,
              border: '2px solid rgba(255,255,255,0.35)',
              background: played ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span
              style={{
                fontFamily: 'Nunito',
                fontWeight: 800,
                fontSize: 26,
                color: '#fff',
                lineHeight: 1,
              }}
            >
              {idx + 1}
            </span>
            <span
              style={{
                fontFamily: 'Nunito',
                fontWeight: 700,
                fontSize: 12.5,
                color: '#fff',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {level.title}
            </span>
            <Stars n={stars} />
          </button>
        );
      })}
    </div>
  );
}
