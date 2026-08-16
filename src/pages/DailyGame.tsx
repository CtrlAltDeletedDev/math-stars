import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { buildDailyChallengeSession } from '@/engine/sessionBuilder';
import { useGameSession } from '@/hooks/useGameSession';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeakQuestion } from '@/hooks/useSpeakQuestion';
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
const DAILY_COLORS: [string, string] = ['#FF9F43', '#EE5A24'];

export default function DailyGame() {
  const navigate = useNavigate();
  const { progress, recordDailyChallengeComplete, recordQuestionsAnswered, toggleAutoRead } = useProgress();
  const sounds = useSoundEffects();
  useBackgroundMusic(progress.musicEnabled);
  const speech = useSpeechRecognition();
  const { speak, cancel } = useSpeakQuestion();

  const character = CHARACTERS.find((c) => c.id === progress.characterId);
  const characterName = character?.name ?? 'Friend';
  const characterEmoji = character ? getCharacterEmoji(character.id, progress.totalStars) : '⭐';
  const timerSeconds = progress.slowMode ? 15 : TIMER_SECONDS;
  const feedbackMs = progress.slowMode ? GAME_CONFIG.feedbackDurationMs * 2 : GAME_CONFIG.feedbackDurationMs;

  const questionsRef = useRef(buildDailyChallengeSession(progress, characterName));
  const session = useGameSession(questionsRef.current, progress.srsCards, characterName);

  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(progress.consecutiveCorrect);
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [isListening, setIsListening] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const wrongAnswersRef = useRef<{ prompt: string; correct: string }[]>([]);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingRef = useRef(0);
  const hasCompleted = useRef(false);
  const answeringRef = useRef(false);

  const challengeMode = progress.challengeMode;

  function startCountdown() {
    if (!challengeMode) return;
    setTimeLeft(timerSeconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    // The countdown reads and writes a ref, and only calls setState with a plain
    // value. Firing handleAnswer from inside a setTimeLeft updater made the
    // updater impure — StrictMode double-invokes updaters, so a timeout could
    // register two answers.
    remainingRef.current = timerSeconds;
    countdownRef.current = setInterval(() => {
      const next = remainingRef.current - 0.25;
      remainingRef.current = next;
      if (next <= 0) {
        stopCountdown();
        setTimeLeft(0);
        handleAnswer('__timeout__');
        return;
      }
      setTimeLeft(next);
    }, 250);
  }

  function stopCountdown() {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }

  function handleAnswer(choice: string) {
    if (answeringRef.current || selectedChoice || showFeedback) return;
    answeringRef.current = true;
    stopCountdown();

    const isLastQuestion = session.currentIndex >= session.totalQuestions - 1;
    const correctCountBefore = session.correctCount;
    const srsUpdatesBefore = session.srsUpdates;

    const { correct, card } = session.recordAnswer(choice);
    // Include this answer — `session.srsUpdates` has not caught up yet.
    const finalSrsUpdates = card ? [...srsUpdatesBefore, card] : srsUpdatesBefore;
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
      if (currentQ && choice !== '__timeout__') {
        wrongAnswersRef.current = [
          ...wrongAnswersRef.current,
          { prompt: currentQ.prompt, correct: currentQ.correctAnswer },
        ];
      }
    }

    const finalCorrectCount = correctCountBefore + (correct ? 1 : 0);

    advanceTimer.current = setTimeout(() => {
      answeringRef.current = false;
      setShowFeedback(false);
      setSelectedChoice(null);
      setShowHint(false);

      if (isLastQuestion && !hasCompleted.current) {
        hasCompleted.current = true;
        sounds.playLevelUp();
        const { newBadges, newStickers, streakBonus, dcStreakBonus } = recordDailyChallengeComplete(
          finalCorrectCount, session.totalQuestions, finalSrsUpdates, nextConsecutive,
        );
        recordQuestionsAnswered(session.totalQuestions);
        navigate('/celebration/daily/challenge', {
          replace: true,
          state: {
            correctCount: finalCorrectCount,
            totalCount: session.totalQuestions,
            newBadges,
            newStickers,
            streakBonus,
            dcStreakBonus,
            wrongAnswers: wrongAnswersRef.current,
            isDailyChallenge: true,
          },
        });
      } else {
        session.advance();
        startCountdown();
      }
    }, feedbackMs);
  }


  function handleToggleAutoRead() {
    if (progress.autoReadEnabled) cancel();
    else if (session.currentQuestion) speak(session.currentQuestion);
    toggleAutoRead();
  }

  function handleMic() {
    if (isListening) { speech.stop(); setIsListening(false); return; }
    setIsListening(true);
    speech.start(
      ({ transcript }) => {
        setIsListening(false);
        const question = session.currentQuestion;
        if (!question) return;
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

  useEffect(() => {
    const q = session.currentQuestion;
    if (q && progress.autoReadEnabled) speak(q);
  }, [session.currentIndex]); // eslint-disable-line

  useEffect(() => {
    if (showFeedback) cancel();
  }, [showFeedback, cancel]);

  const question = session.currentQuestion;
  if (!question) return null;

  const hotStreak = session.hotStreak;

  return (
    <BackgroundGradient colors={DAILY_COLORS}>
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
              <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 22, color: '#333' }}>Quit Daily Challenge? 🎮</div>
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
          <button
            onClick={handleToggleAutoRead}
            title={progress.autoReadEnabled ? 'Turn off read-aloud' : 'Turn on read-aloud'}
            style={{
              background: progress.autoReadEnabled ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 18, cursor: 'pointer',
            }}
          >{progress.autoReadEnabled ? '🔊' : '🔇'}</button>
          {challengeMode
            ? <TimerArc timeLeft={timeLeft} totalTime={timerSeconds} />
            : (
              <div
                className={showFeedback ? (lastCorrect ? 'anim-bounce' : 'anim-shake') : ''}
                style={{ fontSize: 32 }}
              >{characterEmoji}</div>
            )
          }
        </div>

        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, color: '#fff', textAlign: 'center', letterSpacing: 0.5 }}>
          ⭐ Daily Challenge
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
