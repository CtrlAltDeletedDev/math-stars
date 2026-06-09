import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { buildReviewSession } from '@/engine/sessionBuilder';
import { useGameSession } from '@/hooks/useGameSession';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useSpeakQuestion } from '@/hooks/useSpeakQuestion';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';
import ProgressBar from '@/components/ui/ProgressBar';
import QuestionCard from '@/components/game/QuestionCard';
import AnswerGrid from '@/components/game/AnswerGrid';
import FeedbackOverlay from '@/components/game/FeedbackOverlay';
import HintBubble from '@/components/game/HintBubble';
import StreakBar from '@/components/game/StreakBar';
import { GAME_CONFIG } from '@/constants/gameConfig';

const REVIEW_COLORS: [string, string] = ['#43A047', '#1B5E20'];

export default function ReviewGame() {
  const navigate = useNavigate();
  const { progress, recordMasterComplete, recordQuestionsAnswered } = useProgress();
  const sounds = useSoundEffects();
  useBackgroundMusic(progress.musicEnabled);
  const { speak, cancel } = useSpeakQuestion();

  const character = CHARACTERS.find((c) => c.id === progress.characterId);
  const characterName = character?.name ?? 'Friend';
  const characterEmoji = character ? getCharacterEmoji(character.id, progress.totalStars) : '⭐';

  const questionsRef = useRef(buildReviewSession(progress));
  const session = useGameSession(questionsRef.current, progress.srsCards, characterName);

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(progress.consecutiveCorrect);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const wrongAnswersRef = useRef<{ prompt: string; correct: string }[]>([]);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompleted = useRef(false);

  function handleAnswer(choice: string) {
    if (selectedChoice || showFeedback) return;

    const isLastQuestion = session.currentIndex >= session.totalQuestions - 1;
    const correctCountBefore = session.correctCount;
    const srsUpdatesBefore = session.srsUpdates;

    const correct = session.recordAnswer(choice);
    setSelectedChoice(choice);
    setLastCorrect(correct);
    setShowFeedback(true);
    setShowHint(false);
    if (hintTimer.current) clearTimeout(hintTimer.current);

    const nextConsecutive = correct ? consecutiveCorrect + 1 : 0;
    if (correct) {
      setConsecutiveCorrect((n) => n + 1);
      sounds.playCorrect();
    } else {
      setConsecutiveCorrect(0);
      sounds.playWrong();
      hintTimer.current = setTimeout(() => setShowHint(true), 400);
      const currentQ = session.currentQuestion;
      if (currentQ) {
        wrongAnswersRef.current = [
          ...wrongAnswersRef.current,
          { prompt: currentQ.prompt, correct: currentQ.correctAnswer },
        ];
      }
    }

    const finalCorrectCount = correctCountBefore + (correct ? 1 : 0);

    advanceTimer.current = setTimeout(() => {
      setShowFeedback(false);
      setSelectedChoice(null);
      setShowHint(false);

      if (isLastQuestion && !hasCompleted.current) {
        hasCompleted.current = true;
        sounds.playLevelUp();
        const { newBadges, newStickers, streakBonus } = recordMasterComplete(
          'review', finalCorrectCount, session.totalQuestions, srsUpdatesBefore, nextConsecutive,
        );
        recordQuestionsAnswered(session.totalQuestions);
        navigate('/celebration/review/practice', {
          replace: true,
          state: {
            correctCount: finalCorrectCount,
            totalCount: session.totalQuestions,
            newBadges,
            newStickers,
            streakBonus,
            wrongAnswers: wrongAnswersRef.current,
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

  useEffect(() => {
    const q = session.currentQuestion;
    if (q) speak(q);
  }, [session.currentIndex]); // eslint-disable-line

  useEffect(() => {
    if (showFeedback) cancel();
  }, [showFeedback, cancel]);

  // Nothing due — friendly empty state
  if (questionsRef.current.length === 0) {
    return (
      <BackgroundGradient colors={REVIEW_COLORS}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 }}>
          <div style={{ fontSize: 80 }}>🎉</div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 28, color: '#fff', textAlign: 'center' }}>
            Nothing to practice!
          </div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 17, color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>
            You don't have any tricky questions right now. Amazing work! 🌟
          </div>
          <BigButton onPress={() => navigate('/')} label="Home 🏠" color="#fff" textColor={REVIEW_COLORS[0]} style={{ width: '100%', maxWidth: 300 }} />
        </div>
      </BackgroundGradient>
    );
  }

  const question = session.currentQuestion;
  if (!question) return null;

  const hotStreak = session.hotStreak;

  return (
    <BackgroundGradient colors={REVIEW_COLORS}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px', gap: 12, overflow: 'hidden', position: 'relative' }}>

        {showQuitConfirm && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: '#fff', borderRadius: 24, padding: '28px 32px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 300, width: '90%',
            }}>
              <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 22, color: '#333' }}>Stop practicing? 🎮</div>
              <div style={{ fontFamily: 'Nunito', fontSize: 15, color: '#666' }}>Your progress won't be saved.</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => navigate('/')}
                  style={{ flex: 1, background: '#FF6B6B', color: '#fff', border: 'none', borderRadius: 14, padding: '12px 0', fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
                >Yes, quit</button>
                <button
                  onClick={() => setShowQuitConfirm(false)}
                  style={{ flex: 1, background: '#5DD97A', color: '#fff', border: 'none', borderRadius: 14, padding: '12px 0', fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
                >Keep going!</button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setShowQuitConfirm(true)}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 20, cursor: 'pointer', color: '#fff', fontFamily: 'Nunito', fontWeight: 700 }}
          >✕</button>
          <div style={{ flex: 1 }}>
            <ProgressBar current={session.currentIndex + 1} total={session.totalQuestions} />
          </div>
          <div style={{ fontSize: 32 }}>{characterEmoji}</div>
        </div>

        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, color: '#fff', textAlign: 'center', letterSpacing: 0.5 }}>
          💪 Practice Mistakes
        </div>

        <StreakBar streak={session.streak} />

        {hotStreak >= 3 && (
          <div className="anim-slide" style={{
            textAlign: 'center', fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, color: '#fff',
            background: 'rgba(255,150,0,0.35)', borderRadius: 12, padding: '4px 0',
          }}>
            {'🔥'.repeat(Math.min(hotStreak, 5))} {hotStreak} in a row!
          </div>
        )}

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden', justifyContent: 'center' }}>
          <QuestionCard question={question} />

          {!showFeedback && !selectedChoice && (
            <button
              onClick={() => speak(question)}
              style={{
                alignSelf: 'center', background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20,
                padding: '5px 16px', fontFamily: 'Nunito', fontWeight: 700,
                fontSize: 14, color: '#fff', cursor: 'pointer',
              }}
            >🔊 Read again</button>
          )}

          {question.hint && <HintBubble hint={question.hint} visible={showHint} />}

          <AnswerGrid
            choices={question.choices}
            onSelect={handleAnswer}
            selectedChoice={selectedChoice}
            correctAnswer={question.correctAnswer}
            disabled={showFeedback}
          />

          <FeedbackOverlay visible={showFeedback} correct={lastCorrect} characterEmoji={characterEmoji} correctAnswer={question.correctAnswer} />
        </div>
      </div>
    </BackgroundGradient>
  );
}
