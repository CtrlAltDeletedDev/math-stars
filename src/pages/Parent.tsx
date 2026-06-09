import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { CATEGORIES } from '@/data/categories';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';

export default function Parent() {
  const navigate = useNavigate();
  const { progress, importProgress, toggleChallengeMode } = useProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function handleExport() {
    const json = JSON.stringify(progress, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `math-stars-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!importProgress(data)) throw new Error('Invalid file');
        setImportMsg('Progress imported successfully!');
      } catch {
        setImportMsg('Could not read file. Please use a valid export.');
      }
      e.target.value = '';
      setTimeout(() => setImportMsg(null), 3000);
    };
    reader.readAsText(file);
  }

  const totalLevels = CATEGORIES.reduce((sum, c) => sum + c.levels.length, 0);
  const completedLevels = Object.values(progress.categories).reduce(
    (sum, cat) => sum + Object.values(cat.levels).filter((l) => l.status === 'completed').length,
    0,
  );

  const daysPlayed = progress.playHistory ? new Set(progress.playHistory).size : 0;

  return (
    <BackgroundGradient colors={['#5C6BC0', '#283593']}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 14, overflow: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12,
              width: 44, height: 44, fontSize: 22, cursor: 'pointer', color: '#fff',
              fontFamily: 'Nunito', fontWeight: 700,
            }}
          >←</button>
          <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 26, color: '#fff' }}>📊 Parent Dashboard</div>
        </div>

        {/* Summary stats */}
        <div style={{
          background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '16px 20px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
        }}>
          <Stat label="Total Stars" value={`⭐ ${progress.totalStars}`} />
          <Stat label="Levels Completed" value={`${completedLevels} / ${totalLevels}`} />
          <Stat label="Badges Earned" value={`🏅 ${progress.earnedBadges.length}`} />
          <Stat label="Best Streak" value={`🔥 ${progress.longestStreak} days`} />
          <Stat label="Days Played" value={`📅 ${daysPlayed}`} />
          <Stat label="Stars to Spend" value={`⭐ ${progress.spendableStars}`} />
        </div>

        {/* Settings */}
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          Settings
        </div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, color: '#fff' }}>⏱️ Speed Challenge Mode</div>
            <div style={{ fontFamily: 'Nunito', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Each question has a 10-second countdown</div>
          </div>
          <button
            onClick={toggleChallengeMode}
            style={{
              background: progress.challengeMode ? '#4CAF50' : 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.4)', borderRadius: 20, padding: '6px 18px',
              fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#fff', cursor: 'pointer', minWidth: 72,
            }}
          >{progress.challengeMode ? 'ON' : 'OFF'}</button>
        </div>

        {/* Per-category breakdown */}
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          By Category
        </div>
        {CATEGORIES.map((cat) => {
          const catProg = progress.categories[cat.id];
          const done = catProg
            ? Object.values(catProg.levels).filter((l) => l.status === 'completed').length
            : 0;
          const total = cat.levels.length;
          const stars = catProg?.totalStarsEarned ?? 0;
          const pct = total > 0 ? (done / total) * 100 : 0;

          return (
            <div key={cat.id} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 17, color: '#fff' }}>
                  {cat.emoji} {cat.title}
                </div>
                <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#FFE066' }}>
                  ⭐ {stars}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, height: 10, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ width: `${pct}%`, background: '#4CAF50', height: '100%', borderRadius: 8, transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                {done}/{total} levels completed
              </div>

              {catProg && cat.levels.some((l) => (catProg.levels[l.id]?.totalAttempts ?? 0) > 0) && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {cat.levels.map((level) => {
                    const lv = catProg.levels[level.id];
                    if (!lv || lv.totalAttempts === 0) return null;
                    return (
                      <div key={level.id} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.1)',
                      }}>
                        <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
                          {level.title}
                        </div>
                        <div style={{ fontFamily: 'Nunito', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                          {Math.round(lv.bestScore * 100)}% · {'⭐'.repeat(lv.starsEarned)} · {lv.totalAttempts} play{lv.totalAttempts !== 1 ? 's' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Export / Import */}
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          Progress Backup
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleExport}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 16, padding: '14px 0', fontFamily: 'Nunito', fontWeight: 800,
              fontSize: 16, color: '#fff', cursor: 'pointer',
            }}
          >📤 Export</button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 16, padding: '14px 0', fontFamily: 'Nunito', fontWeight: 800,
              fontSize: 16, color: '#fff', cursor: 'pointer',
            }}
          >📥 Import</button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
        {importMsg && (
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 16px',
            fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#fff', textAlign: 'center',
          }}>{importMsg}</div>
        )}

        <BigButton onPress={() => navigate('/worksheet')} label="📄 Generate Worksheet" color="rgba(255,255,255,0.2)" />
        <BigButton onPress={() => navigate('/')} label="← Back to Game" color="rgba(255,255,255,0.15)" />
      </div>
    </BackgroundGradient>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 19, color: '#fff' }}>{value}</div>
      <div style={{ fontFamily: 'Nunito', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
