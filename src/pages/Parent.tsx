import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { CATEGORIES } from '@/data/categories';
import { SKILLS, rankFor, unlockedSkillIds } from '@/data/skills';
import { rungAccuracy, isMaxed } from '@/engine/skillLadder';
import { hasOutgrown } from '@/engine/mastery';
import { GRADES, GradeLevel } from '@/data/grades';
import { topicsForGrade } from '@/data/topics';
import { passedLevel } from '@/engine/scoring';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';
import PlayCalendar from '@/components/ui/PlayCalendar';
import { todayString } from '@/engine/dates';
import { workingOn, topMistakes, hardestFacts, daysPlayedIn } from '@/engine/report';

export default function Parent() {
  const navigate = useNavigate();
  const { progress, importProgress, toggleChallengeMode, toggleSlowMode, setPracticeFocus, setGradeLevel, storageIssue } = useProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // Three quick taps on the title is exactly what an excited six-year-old does,
  // and this screen holds Import (which replaces everything) and the switches
  // that reshape her whole practice diet. A small multiplication is enough:
  // it stops a first grader without being a nuisance to a parent.
  const [gate] = useState(() => ({ a: 3 + Math.floor(Math.random() * 7), b: 4 + Math.floor(Math.random() * 6) }));
  const [gateInput, setGateInput] = useState('');
  const [gatePassed, setGatePassed] = useState(false);

  const outgrown = topicsForGrade(progress.gradeLevel)
    .filter((t) => hasOutgrown(t.id, progress))
    .map((t) => t.title);
  const nextGrade: GradeLevel | null =
    progress.gradeLevel === 'K' ? '1' : progress.gradeLevel === '1' ? '2' : null;

  const focused = progress.practiceFocus ?? [];
  const unlocked = unlockedSkillIds(progress.skills, progress.gradeLevel);

  function handleExport() {
    const json = JSON.stringify(progress, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `math-stars-progress-${todayString()}.json`;
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
    reader.onerror = () => {
      setImportMsg('Could not read that file.');
      e.target.value = '';
      setTimeout(() => setImportMsg(null), 3000);
    };
    reader.readAsText(file);
  }

  if (!gatePassed) {
    return (
      <BackgroundGradient colors={['#5C6BC0', '#303F9F']}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, padding: '24px 26px' }}>
          <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 22, color: '#fff', textAlign: 'center' }}>
            Grown-ups only
          </div>
          <div style={{ fontFamily: 'Nunito', fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>
            What is {gate.a} × {gate.b}?
          </div>
          <input
            value={gateInput}
            onChange={(e) => setGateInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && Number(gateInput) === gate.a * gate.b) setGatePassed(true); }}
            inputMode="numeric"
            autoFocus
            style={{
              fontFamily: 'Nunito', fontWeight: 800, fontSize: 24, textAlign: 'center',
              padding: '12px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.2)', color: '#fff', minHeight: 52,
            }}
          />
          <BigButton
            onPress={() => { if (Number(gateInput) === gate.a * gate.b) setGatePassed(true); }}
            label="Enter"
            color="#fff"
            textColor="#303F9F"
          />
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none', fontFamily: 'Nunito', fontWeight: 700,
              fontSize: 15, color: 'rgba(255,255,255,0.8)', cursor: 'pointer', minHeight: 44,
            }}
          >
            ← Back to the game
          </button>
        </div>
      </BackgroundGradient>
    );
  }

  const totalLevels = CATEGORIES.reduce((sum, c) => sum + c.levels.length, 0);
  const completedLevels = CATEGORIES.reduce(
    (sum, c) => sum + c.levels.filter((l) => passedLevel(progress.categories[c.id]?.levels[l.id])).length,
    0,
  );

  const daysPlayed = progress.playHistory ? new Set(progress.playHistory).size : 0;

  // The top of the screen answers "so what do I do this week?". Everything it
  // needs was already being recorded; none of it was being shown.
  const focusSkill = workingOn(progress);
  const patterns = topMistakes(progress, 2);
  const shakyFacts = hardestFacts(progress, 5);
  const daysThisWeek = daysPlayedIn(progress, 7);
  const hasSomethingToSay = focusSkill || patterns.length > 0 || shakyFacts.length > 0;

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

        {/* What to do this week.
            This used to open on a star count, a badge count and "6/51 levels",
            none of which changes what anyone does tomorrow. */}
        {hasSomethingToSay && (
          <div style={{ background: 'rgba(255,255,255,0.16)', border: '2px solid rgba(255,255,255,0.35)', borderRadius: 20, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
              This week · played {daysThisWeek} of the last 7 days
            </div>

            {focusSkill && (
              <div>
                <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 21, color: '#fff', lineHeight: 1.25 }}>
                  {focusSkill.emoji} Working on {focusSkill.title}
                </div>
                <div style={{ fontFamily: 'Nunito', fontSize: 14.5, color: 'rgba(255,255,255,0.82)', marginTop: 3 }}>
                  {focusSkill.rungLabel} · {Math.round((focusSkill.accuracy ?? 0) * 100)}% right over {focusSkill.attempts} questions
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setPracticeFocus([focusSkill.skillId])}
                    style={actionBtn(focused.length === 1 && focused[0] === focusSkill.skillId)}
                  >
                    {focused.length === 1 && focused[0] === focusSkill.skillId ? '✓ Practice is focused here' : 'Focus practice on this'}
                  </button>
                  <button onClick={() => navigate('/worksheet')} style={actionBtn(false)}>
                    Print a worksheet
                  </button>
                </div>
              </div>
            )}

            {patterns.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.18)', paddingTop: 13 }}>
                <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 7 }}>
                  What the wrong answers have in common
                </div>
                {patterns.map((m) => (
                  <div key={`${m.skillId}-${m.tag}`} style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14.5, color: '#fff', lineHeight: 1.35 }}>
                      {m.skillTitle}: {m.label}
                    </div>
                    <div style={{ fontFamily: 'Nunito', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                      {m.count} times · {Math.round(m.share * 100)}% of her mistakes here
                    </div>
                    <div style={{ fontFamily: 'Nunito', fontSize: 13.5, color: 'rgba(255,255,255,0.88)', marginTop: 4, lineHeight: 1.4 }}>
                      💡 {m.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {shakyFacts.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.18)', paddingTop: 13 }}>
                <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 8 }}>
                  Facts that keep coming back
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {shakyFacts.map((f) => (
                    <div key={f.questionId} style={{
                      background: 'rgba(255,255,255,0.18)', borderRadius: 10, padding: '6px 12px',
                      fontFamily: 'Nunito', fontWeight: 700, fontSize: 14.5, color: '#fff',
                    }}>{f.prompt.replace(/\n+/g, ' ')}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, color: '#fff' }}>🐢 Slow Mode</div>
            <div style={{ fontFamily: 'Nunito', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Extra time to see each answer, and a longer countdown</div>
          </div>
          <button
            onClick={toggleSlowMode}
            style={{
              background: progress.slowMode ? '#4CAF50' : 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.4)', borderRadius: 20, padding: '6px 18px',
              fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#fff', cursor: 'pointer', minWidth: 72,
            }}
          >{progress.slowMode ? 'ON' : 'OFF'}</button>
        </div>

        {/* Last 7 days */}
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          Last 7 Days
        </div>
        <PlayCalendar playHistory={progress.playHistory ?? []} />

        {/* Persistence trouble is worth interrupting for — it means her stars
            are not actually being kept. */}
        {storageIssue && (
          <div style={{ background: 'rgba(211,47,47,0.35)', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 16, padding: '14px 18px' }}>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, color: '#fff' }}>
              ⚠️ {storageIssue === 'cannot-save' ? 'Progress is not being saved' : 'Saved progress could not be read'}
            </div>
            <div style={{ fontFamily: 'Nunito', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 1.4 }}>
              {storageIssue === 'cannot-save'
                ? 'This browser is refusing to store data — usually private browsing, or a full device. She can still play, but stars will disappear when the app closes.'
                : storageIssue === 'unreadable-backed-up'
                  ? 'The old save was damaged. We kept a copy rather than deleting it, so nothing is lost for good. She has started a fresh profile.'
                  : 'The old save was damaged and could not be recovered. She has started a fresh profile.'}
            </div>
          </div>
        )}

        {/* Grade — the one setting that decides what she meets */}
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          Grade
        </div>
        <div style={{ fontFamily: 'Nunito', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: -8 }}>
          Sets which topics appear and how far each one goes. How hard the questions get inside
          that is still decided by how she answers.
        </div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GRADES.map((band) => {
              const on = progress.gradeLevel === band.id;
              return (
                <button
                  key={band.id}
                  onClick={() => setGradeLevel(band.id)}
                  style={{
                    flex: 1, minWidth: 100, minHeight: 48,
                    background: on ? '#4CAF50' : 'rgba(255,255,255,0.15)',
                    border: `2px solid ${on ? '#4CAF50' : 'rgba(255,255,255,0.35)'}`,
                    borderRadius: 16, cursor: 'pointer',
                    fontFamily: 'Nunito', fontWeight: 800, fontSize: 14.5, color: '#fff',
                  }}
                >
                  {band.emoji} {band.label}
                </button>
              );
            })}
          </div>

          {/* The ceiling is soft, and this is how it tells on itself. */}
          {outgrown.length > 0 && nextGrade && (
            <div style={{ marginTop: 12, background: 'rgba(255,213,79,0.25)', border: '2px solid #FFD54F', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 14.5, color: '#fff', lineHeight: 1.35 }}>
                🌟 {outgrown.slice(0, 3).join(', ')} {outgrown.length === 1 ? 'is' : 'are'} at the top of this grade.
              </div>
              <button
                onClick={() => setGradeLevel(nextGrade)}
                style={{
                  marginTop: 10, minHeight: 44, width: '100%',
                  background: '#FFD54F', border: 'none', borderRadius: 12, cursor: 'pointer',
                  fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#5D4037',
                }}
              >
                Move up to {GRADES.find((g) => g.id === nextGrade)?.label} →
              </button>
            </div>
          )}
        </div>

        {/* Focus Mode — pin practice to what she's working on this week */}
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          Focus Mode
        </div>
        <div style={{ fontFamily: 'Nunito', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: -8 }}>
          Working on something specific this week? Pick it here and ♾️ Practice will ask about
          nothing else. Leave everything off to let her range over whatever she has unlocked.
        </div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px 18px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SKILLS.map((sk) => {
              const on = focused.includes(sk.id);
              const available = unlocked.includes(sk.id);
              return (
                <button
                  key={sk.id}
                  onClick={() => setPracticeFocus(on ? focused.filter((f) => f !== sk.id) : [...focused, sk.id])}
                  style={{
                    background: on ? '#4CAF50' : 'rgba(255,255,255,0.15)',
                    border: `2px solid ${on ? '#4CAF50' : 'rgba(255,255,255,0.35)'}`,
                    borderRadius: 20, padding: '8px 14px', cursor: 'pointer',
                    fontFamily: 'Nunito', fontWeight: 800, fontSize: 14,
                    color: on || available ? '#fff' : 'rgba(255,255,255,0.55)',
                    minHeight: 40,
                  }}
                >
                  {sk.emoji} {sk.title}{!available && !on ? ' 🔒' : ''}
                </button>
              );
            })}
          </div>
          {focused.length > 0 && (
            <button
              onClick={() => setPracticeFocus([])}
              style={{
                marginTop: 12, background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.4)', borderRadius: 20,
                padding: '8px 18px', fontFamily: 'Nunito', fontWeight: 800, fontSize: 14,
                color: '#fff', cursor: 'pointer', minHeight: 40,
              }}
            >
              Clear focus ({focused.length} on)
            </button>
          )}
          <div style={{ fontFamily: 'Nunito', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>
            {focused.length > 0
              ? 'Focus is on — practice is only asking about the green ones.'
              : `🔒 means she hasn't unlocked it yet. You can still switch it on here.`}
          </div>
        </div>

        {/* Where she is on each skill ladder */}
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          Practice Levels
        </div>
        <div style={{ fontFamily: 'Nunito', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: -8 }}>
          These move on their own — up after 6 of the last 8 right, down after 3 or fewer. Skills she hasn't practised yet aren't shown.
        </div>
        {SKILLS.filter((sk) => progress.skills?.[sk.id]).length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px 18px', fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
            Nothing yet — tap ♾️ Practice on the home screen to get started.
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '6px 18px' }}>
            {SKILLS.filter((sk) => progress.skills?.[sk.id]).map((sk) => {
              const st = progress.skills[sk.id];
              const acc = rungAccuracy(st);
              const rung = sk.rungs[Math.min(st.rung, sk.rungs.length - 1)];
              return (
                <div key={sk.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{sk.emoji}</span>
                    <span style={{ flex: 1, fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: '#fff' }}>{sk.title}</span>
                    <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                      {st.rung + 1}/{sk.rungs.length}
                    </span>
                    <span style={{ fontSize: 17 }}>{rankFor(st.rung)}</span>
                  </div>
                  <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
                    {rung.label}
                    {isMaxed(st) ? ' · top of the ladder' : ''}
                  </div>
                  <div style={{ fontFamily: 'Nunito', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
                    {st.attempts} answered
                    {acc !== null ? ` · ${Math.round(acc * 100)}% on the last ${st.recent.length}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Per-category breakdown */}
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
          By Category
        </div>
        {CATEGORIES.map((cat) => {
          const catProg = progress.categories[cat.id];
          const done = cat.levels.filter((l) => passedLevel(catProg?.levels[l.id])).length;
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

const actionBtn = (on: boolean): React.CSSProperties => ({
  // Share the row and stay the same size as each other. Sized to their own text
  // they wrap raggedly at phone width, which is the only width that matters on
  // the tablet this is read on.
  flex: '1 1 150px',
  background: on ? '#4CAF50' : 'rgba(255,255,255,0.22)',
  border: `2px solid ${on ? '#4CAF50' : 'rgba(255,255,255,0.4)'}`,
  borderRadius: 14, padding: '10px 14px', minHeight: 44, cursor: 'pointer',
  fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, color: '#fff',
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 19, color: '#fff' }}>{value}</div>
      <div style={{ fontFamily: 'Nunito', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
