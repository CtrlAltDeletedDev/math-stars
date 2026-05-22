import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { getLevelById, getCategoryById } from '@/data/categories';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { useGameSession } from '@/hooks/useGameSession';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import ProgressBar from '@/components/ui/ProgressBar';
import QuestionCard from '@/components/game/QuestionCard';
import AnswerGrid from '@/components/game/AnswerGrid';
import FeedbackOverlay from '@/components/game/FeedbackOverlay';
import HintBubble from '@/components/game/HintBubble';
import StreakBar from '@/components/game/StreakBar';
import { GAME_CONFIG } from '@/constants/gameConfig';

export default function Game() {
  const { categoryId = '', levelId = '' } = useParams<{ categoryId: string; levelId: string }>();
  const navigate = useNavigate();
  const { progress, recordLevelComplete } = useProgress();
  const sounds = useSoundEffects();

  const level = getLevelById(levelId);
  const category = getCategoryById(categoryId);
  const character = CHARACTERS.find((c) => c.id === progress.characterId);
  const characterName = character?.name ?? 'Friend';
  const characterEmoji = character ? getCharacterEmoji(character.id, progress.totalStars) : '⭐';

  const session = useGameSession(level!, progress.srsCards, characterName);

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(progress.consecutiveCorrect);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompleted = useRef(false);

  if (!level || !category) return null;

  function handleAnswer(choice: string) {
    if (selectedChoice || showFeedback) return;
    const correct = session.recordAnswer(choice);
    setSelectedChoice(choice);
    setLastCorrect(correct);
    setShowFeedback(true);
    setShowHint(false);
    if (hintTimer.current) clearTimeout(hintTimer.current);

    if (correct) {
      setConsecutiveCorrect((n) => n + 1);
      sounds.playCorrect();
    } else {
      setConsecutiveCorrect(0);
      sounds.playWrong();
      hintTimer.current = setTimeout(() => setShowHint(true), 400);
    }

    advanceTimer.current = setTimeout(() => {
      setShowFeedback(false);
      setSelectedChoice(null);
      setShowHint(false);

      if (session.isComplete && !hasCompleted.current) {
        hasCompleted.current = true;
        sounds.playLevelUp();
        const newBadges = recordLevelComplete(
          levelId,
          session.correctCount + (correct ? 1 : 0),
          session.totalQuestions,
          session.srsUpdates,
          consecutiveCorrect + (correct ? 1 : 0),
        );
        navigate(`/celebration/${categoryId}/${levelId}`, {
          replace: true,
          state: {
            correctCount: session.correctCount + (correct ? 1 : 0),
            totalCount: session.totalQuestions,
            newBadges,
          },
        });
      } else {
        session.advance();
      }
    }, GAME_CONFIG.feedbackDurationMs);
  }

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    };
  }, []);

  const question = session.currentQuestion;
  if (!question) return null;

  return (
    <BackgroundGradient colors={[category.bgColor, category.darkColor]}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px', gap: 12, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(`/category/${categoryId}`)}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 20, cursor: 'pointer', color: '#fff', fontFamily: 'Nunito', fontWeight: 700 }}
          >
            ✕
          </button>
          <div style={{ flex: 1 }}>
            {/* Fix 1: +1 so first question shows "1/10" not "0/10" */}
            <ProgressBar current={session.currentIndex + 1} total={session.totalQuestions} />
          </div>
          <div style={{ fontSize: 32 }}>{characterEmoji}</div>
        </div>

        <StreakBar streak={session.streak} />

        {/* Fix 5: FeedbackOverlay is sibling to card+hint+grid, covering all of them */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden', justifyContent: 'center' }}>
          <QuestionCard question={question} />

          {question.hint && <HintBubble hint={question.hint} visible={showHint} />}

          <AnswerGrid
            choices={question.choices}
            onSelect={handleAnswer}
            selectedChoice={selectedChoice}
            correctAnswer={question.correctAnswer}
            disabled={showFeedback}
          />

          <FeedbackOverlay visible={showFeedback} correct={lastCorrect} characterEmoji={characterEmoji} />
        </div>
      </div>
    </BackgroundGradient>
  );
}
