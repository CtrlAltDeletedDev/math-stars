import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { TOPICS_BY_ID, topicLevelsInScope } from '@/data/topics';
import { lessonsFor, recommendedLesson } from '@/data/learn';
import { ceilingFor } from '@/data/grades';
import { PATTERN_MIN_COUNT } from '@/engine/report';
import { ErrorTag } from '@/types';
import { STORIES } from '@/data/stories';
import { getLevelById } from '@/data/categories';
import { rankFor } from '@/data/skills';
import { masteryFor } from '@/engine/mastery';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';
import MasteryRing from '@/components/ui/MasteryRing';
import ReplayStrip from '@/components/topic/ReplayStrip';
import { ArrowLeft, BookOpen, CircleCheck, Play, Star, Zap } from 'lucide-react';
import { ICON_CENTER, ICON_STROKE } from '@/components/ui/icons';

// One topic, ordered by how much a child wants it.
//
// The big Play button is the answer to "what do I do here" — it asks questions
// at whatever rung she is standing on, so it works even for a topic with no
// hand-built levels at all. Everything below it is optional: the levels she can
// replay, a lesson, a story, a quick drill.
//
// Replaces the old Category screen, which opened on a vertical chain of
// padlocks and made the one playable node the smallest thing on the page.

export default function Topic() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const { progress } = useProgress();

  const topic = TOPICS_BY_ID.get(skillId ?? '');
  // Never a blank screen: an unknown or stale topic id goes home.
  if (!topic) return <Navigate to="/" replace />;

  const mastery = masteryFor(topic.id, progress);
  const levels = topicLevelsInScope(topic, progress.gradeLevel);
  const levelStates = topic.levels.reduce<Record<string, ReturnType<typeof lookupState>>>(
    (acc, ref) => {
      acc[ref.levelId] = lookupState(ref.levelId);
      return acc;
    },
    {},
  );

  function lookupState(levelId: string) {
    const level = getLevelById(levelId);
    if (!level) return undefined;
    return progress.categories[level.categoryId]?.levels[levelId];
  }

  // Lessons in this topic up to her grade, and the one worth her time today:
  // one that teaches against the mistake she keeps making here, else the
  // nearest to her rung she hasn't done.
  const ceiling = ceilingFor(topic.id, progress.gradeLevel);
  const lessons = lessonsFor(topic.id, ceiling);
  const done = progress.lessonsDone ?? {};
  const topMistake = (Object.entries(progress.errorPatterns?.[topic.id] ?? {}) as [ErrorTag, number][])
    .filter(([tag, n]) => tag !== 'unknown' && n >= PATTERN_MIN_COUNT)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const suggested = recommendedLesson(topic.id, ceiling, mastery.rung, done, topMistake);
  const openLesson = (id: string) => navigate(`/learn/${id}?topic=${topic.id}`);

  const story = topic.storyCategoryId
    ? STORIES.find((s) => s.categoryId === topic.storyCategoryId)
    : undefined;

  const firstLevel = levels[0];

  return (
    <BackgroundGradient colors={[topic.bgColor, topic.darkColor]}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            aria-label="Back"
            style={{
              background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12,
              width: 44, height: 44, cursor: 'pointer', color: '#fff',
            }}
          >
            <ArrowLeft size={24} strokeWidth={ICON_STROKE} style={ICON_CENTER} aria-hidden />
          </button>
          <div
            style={{
              flex: 1, textAlign: 'center', fontFamily: 'Nunito', fontWeight: 800,
              fontSize: 22, color: '#fff',
            }}
          >
            {topic.title}
          </div>
          <MasteryRing
            fill={mastery.fill}
            size={44}
            thickness={5}
            rank={mastery.everPlayed ? rankFor(mastery.rung) : undefined}
          >
            <span>{topic.emoji}</span>
          </MasteryRing>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 24px' }}>
          {/* The dominant action. Adaptive, always available, never "finished". */}
          <BigButton
            onPress={() => navigate(`/practice?skill=${topic.id}`)}
            label="Play"
            icon={<Play size={26} strokeWidth={ICON_STROKE} fill="currentColor" aria-hidden />}
            color="#fff"
            textColor={topic.darkColor}
            style={{ width: '100%', marginBottom: 12 }}
          />

          {suggested && (
            <button onClick={() => openLesson(suggested.id)} style={secondaryStyle}>
              <BookOpen size={22} strokeWidth={ICON_STROKE} aria-hidden /> Learn: {suggested.title}
            </button>
          )}

          {lessons.length > 1 && (
            <>
              <div style={sectionLabel}>Lessons</div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, marginBottom: 6 }}>
                {lessons.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => openLesson(l.id)}
                    aria-label={`Lesson: ${l.title}`}
                    style={{
                      flexShrink: 0, width: 116, minHeight: 104, borderRadius: 18, cursor: 'pointer',
                      background: l.id === suggested?.id ? '#fff' : 'rgba(255,255,255,0.22)',
                      border: '2px solid rgba(255,255,255,0.4)', padding: '10px 8px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: 34, lineHeight: 1 }}>{l.emoji}</span>
                    <span style={{
                      fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, lineHeight: 1.2, textAlign: 'center',
                      color: l.id === suggested?.id ? topic.darkColor : '#fff',
                    }}>{l.title}</span>
                    {done[l.id] && (
                      <CircleCheck
                        size={22} strokeWidth={ICON_STROKE} color="#fff" fill="#2E9E5B" aria-label="done"
                        style={{ position: 'absolute', top: 6, right: 6 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {levels.length > 0 && (
            <>
              <div style={sectionLabel}>Play again</div>
              <ReplayStrip
                levels={levels}
                states={levelStates}
                onPlay={(levelId) => {
                  const level = getLevelById(levelId);
                  if (level) navigate(`/game/${level.categoryId}/${levelId}`);
                }}
              />
            </>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            {story && (
              <button
                onClick={() => navigate(`/story/${story.categoryId}`)}
                style={{ ...secondaryStyle, flex: 1, minWidth: 140, marginBottom: 0 }}
              >
                <BookOpen size={20} strokeWidth={ICON_STROKE} aria-hidden /> Story
              </button>
            )}
            {firstLevel && (
              <button
                onClick={() => navigate(`/flashcard/${firstLevel.categoryId}/${firstLevel.id}`)}
                style={{ ...secondaryStyle, flex: 1, minWidth: 140, marginBottom: 0 }}
              >
                <Zap size={20} strokeWidth={ICON_STROKE} aria-hidden /> Quick Review
              </button>
            )}
            {firstLevel && (
              <button
                onClick={() => navigate(`/game/master/${firstLevel.categoryId}`)}
                style={{ ...secondaryStyle, flex: 1, minWidth: 140, marginBottom: 0 }}
              >
                <Star size={20} strokeWidth={ICON_STROKE} aria-hidden /> Master Mode
              </button>
            )}
          </div>
        </div>
      </div>
    </BackgroundGradient>
  );
}

const secondaryStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  minHeight: 52,
  marginBottom: 12,
  background: 'rgba(255,255,255,0.22)',
  border: '2px solid rgba(255,255,255,0.35)',
  borderRadius: 16,
  padding: '12px 14px',
  cursor: 'pointer',
  fontFamily: 'Nunito',
  fontWeight: 800,
  fontSize: 16,
  color: '#fff',
  WebkitTapHighlightColor: 'transparent',
};

const sectionLabel: React.CSSProperties = {
  fontFamily: 'Nunito',
  fontWeight: 800,
  fontSize: 15,
  color: 'rgba(255,255,255,0.85)',
  margin: '10px 2px 6px',
};
