import { Level, LevelState } from '@/types';

interface Props {
  levels: Level[];
  levelStates: Record<string, LevelState>;
  onSelect: (levelId: string) => void;
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ fontSize: 16 }}>
      {[0, 1, 2].map((i) => <span key={i}>{i < n ? '⭐' : '☆'}</span>)}
    </span>
  );
}

export default function LevelMap({ levels, levelStates, onSelect }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0' }}>
      {levels.map((level, idx) => {
        const state = levelStates[level.id];
        const status = state?.status ?? 'locked';
        const locked = status === 'locked';
        const completed = status === 'completed';

        return (
          <div key={level.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            {idx > 0 && (
              <div style={{
                width: 3, height: 24,
                background: completed ? '#FFD700' : 'rgba(255,255,255,0.4)',
                borderRadius: 2,
              }} />
            )}
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

            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: locked ? 'rgba(255,255,255,0.5)' : '#fff' }}>
                {level.title}
              </div>
              {!locked && <Stars n={state?.starsEarned ?? 0} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
