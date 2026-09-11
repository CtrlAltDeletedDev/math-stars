import { Navigate, useNavigate } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { GRADES, GradeLevel } from '@/data/grades';
import { skillIdsForGrade } from '@/data/grades';
import BackgroundGradient from '@/components/ui/BackgroundGradient';

// Asked once, of a grown-up.
//
// This is the only configuration the app has, and it is deliberately coarse:
// a parent knows what year their child is in, and knows it changes once a year.
// Everything finer — which rung inside a topic, which facts come up — is still
// decided by the child's answers, not by this screen.
//
// A child tapping the wrong one is harmless: it is reversible from the Parent
// screen and nothing is deleted by changing it.

/** Nudge toward what the existing ladder already suggests. */
function suggestGrade(addingRung: number): GradeLevel {
  if (addingRung >= 5) return '2';
  if (addingRung >= 4) return '1';
  return '1'; // most children arriving here are the first-grader this was built for
}

export default function GradeSelect() {
  const { progress, isLoaded, setGradeLevel } = useProgress();
  const navigate = useNavigate();

  if (!isLoaded) {
    return (
      <div style={{ height: '100dvh', background: '#87CEEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
        ⭐
      </div>
    );
  }
  if (!progress.characterId) return <Navigate to="/character-select" replace />;

  const suggested = suggestGrade(progress.skills?.adding?.rung ?? 0);

  return (
    <BackgroundGradient colors={['#5AA9E6', '#2E6DA4']}>
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          gap: 14, padding: '24px 22px',
        }}
      >
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
          FOR GROWN-UPS
        </div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 26, color: '#fff', textAlign: 'center', lineHeight: 1.25 }}>
          Which grade are they in?
        </div>
        <div style={{ fontFamily: 'Nunito', fontSize: 14.5, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.45, marginBottom: 6 }}>
          This picks which topics they'll see. How hard the questions get is still
          decided by how they answer them — and you can change this any time.
        </div>

        {GRADES.map((band) => {
          const isSuggested = band.id === suggested;
          const topicCount = skillIdsForGrade(band.id).length;
          return (
            <button
              key={band.id}
              onClick={() => {
                setGradeLevel(band.id);
                navigate('/', { replace: true });
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                minHeight: 74, padding: '14px 18px',
                background: isSuggested ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.18)',
                border: `3px solid ${isSuggested ? '#FFD54F' : 'rgba(255,255,255,0.35)'}`,
                borderRadius: 18, cursor: 'pointer', textAlign: 'left',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: 34, lineHeight: 1 }}>{band.emoji}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontFamily: 'Nunito', fontWeight: 800, fontSize: 20, color: '#fff' }}>
                  {band.label}
                </span>
                <span style={{ display: 'block', fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                  {topicCount} topics
                  {isSuggested ? ' · suggested' : ''}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </BackgroundGradient>
  );
}
