import { Level, LevelState } from '@/types';
import { LESSONS } from '@/data/lessons';

interface Props {
  levels: Level[];
  levelStates: Record<string, LevelState>;
  onSelect: (levelId: string) => void;
  onLesson?: (levelId: string) => void;
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ fontSize: 16 }}>
      {[0, 1, 2].map((i) => <span key={i}>{i < n ? '⭐' : '☆'}</span>)}
    </span>
  );
}

const NEW_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export default function LevelMap({ levels, levelStates, onSelect, onLesson }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0' }}>
      {levels.map((level, idx) => {
        const state = levelStates[level.id];
        const status = state?.status ?? 'locked';
        const locked = status === 'locked';
        const completed = status === 'completed';
        const isNew = status === 'unlocked' && state?.unlockedAt != null && (Date.now() - state.unlockedAt < NEW_THRESHOLD_MS);

        return (
          <div key={level.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            {idx > 0 && (
              <div style={{
                width: 3, height: 24,
                background: completed ? '#FFD700' : 'rgba(255,255,255,0.4)',
                borderRadius: 2,
              }} />
            )}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => !locked && onSelect(level.id)}
                style={{
                  width: 72, height: 72, borderRadius: 36, border: 'none',
                  background: locked ? 'rgba(255,255,255,0.25)' : completed ? '#FFD700' : '#fff',
                  cursor: locked ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Nunito', fontWeight: 800, fontSize: 24,
                  color: locked ? 'rgba(255,255,255,0.5)' : completed ? '#fff' : '#333',
                  boxShadow: locked ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
                  opacity: locked ? 0.5 : 1,
                  transition: 'transform 0.1s',
                }}
              >
                {locked ? '🔒' : level.levelNumber}
              </button>
              {isNew && (
                <div className="anim-new" style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#FF5252', color: '#fff',
                  fontFamily: 'Nunito', fontWeight: 800, fontSize: 10,
                  borderRadius: 8, padding: '2px 6px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  pointerEvents: 'none',
                }}>NEW!</div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: locked ? 'rgba(255,255,255,0.5)' : '#fff' }}>
                {level.title}
              </div>
              {!locked && <Stars n={state?.starsEarned ?? 0} />}
              {!locked && onLesson && LESSONS[level.id] && (
                <button
                  onClick={(e) => { e.stopPropagation(); onLesson(level.id); }}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: 10,
                    padding: '3px 12px',
                    fontFamily: 'Nunito',
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#fff',
                    cursor: 'pointer',
                    marginTop: 2,
                  }}
                >📖 Learn</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
