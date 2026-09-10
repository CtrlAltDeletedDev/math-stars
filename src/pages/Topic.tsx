import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { TOPICS_BY_ID, topicLevelsInScope } from '@/data/topics';
import { LESSONS } from '@/data/lessons';
import { STORIES } from '@/data/stories';
import { getLevelById } from '@/data/categories';
import { rankFor } from '@/data/skills';
import { masteryFor } from '@/engine/mastery';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';
import MasteryRing from '@/components/ui/MasteryRing';
import ReplayStrip from '@/components/topic/ReplayStrip';

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

  // The lesson nearest the rung she is actually standing on, rather than always
  // the first one in the topic.
  const lessonRef = topic.levels
    .filter((ref) => LESSONS[ref.levelId])
    .sort((a, b) => Math.abs(a.rung - mastery.rung) - Math.abs(b.rung - mastery.rung))[0];
  const lessonLevel = lessonRef ? getLevelById(lessonRef.levelId) : null;

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
              width: 44, height: 44, fontSize: 22, cursor: 'pointer', color: '#fff',
            }}
          >
            ←
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
            label="▶  Play"
            color="#fff"
            textColor={topic.darkColor}
            style={{ width: '100%', marginBottom: 12 }}
          />

          {lessonLevel && (
            <button
              onClick={() => navigate(`/lesson/${lessonLevel.categoryId}/${lessonLevel.id}`)}
              style={secondaryStyle}
            >
              📖 Show me how
            </button>
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
                📖 Story
              </button>
            )}
            {firstLevel && (
              <button
                onClick={() => navigate(`/flashcard/${firstLevel.categoryId}/${firstLevel.id}`)}
                style={{ ...secondaryStyle, flex: 1, minWidth: 140, marginBottom: 0 }}
              >
                ⚡ Quick Review
              </button>
            )}
            {firstLevel && (
              <button
                onClick={() => navigate(`/game/master/${firstLevel.categoryId}`)}
                style={{ ...secondaryStyle, flex: 1, minWidth: 140, marginBottom: 0 }}
              >
                ⭐ Master Mode
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
