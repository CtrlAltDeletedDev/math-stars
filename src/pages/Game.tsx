import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { getLevelById, getCategoryById } from '@/data/categories';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { useGameSession } from '@/hooks/useGameSession';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import ProgressBar from '@/components/ui/ProgressBar';
import QuestionCard from '@/components/game/QuestionCard';
import AnswerGrid from '@/components/game/AnswerGrid';
import FeedbackOverlay from '@/components/game/FeedbackOverlay';
import HintBubble from '@/components/game/HintBubble';
import StreakBar from '@/components/game/StreakBar';
import TimerArc from '@/components/game/TimerArc';
import { GAME_CONFIG } from '@/constants/gameConfig';

const TIMER_SECONDS = 10;

export default function Game() {
  const { categoryId = '', levelId = '' } = useParams<{ categoryId: string; levelId: string }>();
  const navigate = useNavigate();
  const { progress, recordLevelComplete } = useProgress();
  const sounds = useSoundEffects();
  useBackgroundMusic(progress.musicEnabled);
  const speech = useSpeechRecognition();

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
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [isListening, setIsListening] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompleted = useRef(false);

  const challengeMode = progress.challengeMode;

  if (!level || !category) return null;

  function startCountdown() {
    if (!challengeMode) return;
    setTimeLeft(TIMER_SECONDS);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.25) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          handleAnswer('__timeout__');
          return 0;
        }
        return t - 0.25;
      });
    }, 250);
  }

  function stopCountdown() {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }

  function handleAnswer(choice: string) {
    if (selectedChoice || showFeedback) return;
    stopCountdown();

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
    }

    const finalCorrectCount = correctCountBefore + (correct ? 1 : 0);

    advanceTimer.current = setTimeout(() => {
      setShowFeedback(false);
      setSelectedChoice(null);
      setShowHint(false);

      if (isLastQuestion && !hasCompleted.current) {
        hasCompleted.current = true;
        sounds.playLevelUp();
        const newBadges = recordLevelComplete(
          levelId, finalCorrectCount, session.totalQuestions, srsUpdatesBefore, nextConsecutive,
        );
        navigate(`/celebration/${categoryId}/${levelId}`, {
          replace: true,
          state: { correctCount: finalCorrectCount, totalCount: session.totalQuestions, newBadges },
        });
      } else {
        session.advance();
        startCountdown();
      }
    }, GAME_CONFIG.feedbackDurationMs);
  }

  function handleMic() {
    if (isListening) { speech.stop(); setIsListening(false); return; }
    setIsListening(true);
    speech.start(
      ({ transcript }) => {
        setIsListening(false);
        const question = session.currentQuestion;
        if (!question) return;
        // Try matching transcript to a choice (number words + digits)
        const words: Record<string, string> = {
          zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',
          six:'6',seven:'7',eight:'8',nine:'9',ten:'10',
          eleven:'11',twelve:'12',thirteen:'13',fourteen:'14',fifteen:'15',
          sixteen:'16',seventeen:'17',eighteen:'18',nineteen:'19',twenty:'20',
        };
        const normalized = words[transcript] ?? transcript.replace(/\D/g, '');
        const match = question.choices.find(
          (c) => c.toLowerCase() === transcript || c === normalized,
        );
        if (match) handleAnswer(match);
      },
      () => setIsListening(false),
    );
  }

  useEffect(() => {
    startCountdown();
    return () => {
      stopCountdown();
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    };
  }, []); // eslint-disable-line

  const question = session.currentQuestion;
  if (!question) return null;

  const hotStreak = session.hotStreak;

  return (
    <BackgroundGradient colors={[category.bgColor, category.darkColor]}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px', gap: 12, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(`/category/${categoryId}`)}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 20, cursor: 'pointer', color: '#fff', fontFamily: 'Nunito', fontWeight: 700 }}
          >✕</button>
          <div style={{ flex: 1 }}>
            <ProgressBar current={session.currentIndex + 1} total={session.totalQuestions} />
          </div>
          {challengeMode
            ? <TimerArc timeLeft={timeLeft} totalTime={TIMER_SECONDS} />
            : <div style={{ fontSize: 32 }}>{characterEmoji}</div>
          }
        </div>

        <StreakBar streak={session.streak} />

        {/* Hot streak badge */}
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

          {question.hint && <HintBubble hint={question.hint} visible={showHint} />}

          <AnswerGrid
            choices={question.choices}
            onSelect={handleAnswer}
            selectedChoice={selectedChoice}
            correctAnswer={question.correctAnswer}
            disabled={showFeedback}
          />

          {/* Voice input button */}
          {speech.isSupported && !showFeedback && !selectedChoice && (
            <button
              onClick={handleMic}
              style={{
                alignSelf: 'center', background: isListening ? '#FF5252' : 'rgba(255,255,255,0.25)',
                border: isListening ? '2px solid #fff' : '2px solid transparent',
                borderRadius: 28, padding: '10px 22px',
                fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                animation: isListening ? 'pulse 1s ease infinite' : 'none',
              }}
            >
              🎤 {isListening ? 'Listening...' : 'Say the answer'}
            </button>
          )}

          <FeedbackOverlay visible={showFeedback} correct={lastCorrect} characterEmoji={characterEmoji} correctAnswer={question.correctAnswer} />
        </div>
      </div>
    </BackgroundGradient>
  );
}
