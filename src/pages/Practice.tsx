import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { SKILLS_BY_ID, rankFor } from '@/data/skills';
import { PracticeQueue, PracticePick } from '@/engine/practiceSession';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useSpeakQuestion } from '@/hooks/useSpeakQuestion';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';
import QuestionCard from '@/components/game/QuestionCard';
import AnswerGrid from '@/components/game/AnswerGrid';
import FeedbackOverlay from '@/components/game/FeedbackOverlay';
import HintBubble from '@/components/game/HintBubble';
import { GAME_CONFIG } from '@/constants/gameConfig';

const PRACTICE_COLORS: [string, string] = ['#7E57C2', '#4527A0'];

export default function Practice() {
  const navigate = useNavigate();
  const { progress, recordPracticeAnswer, recordQuestionsAnswered, toggleAutoRead } = useProgress();
  const sounds = useSoundEffects();
  useBackgroundMusic(progress.musicEnabled);
  const { speak, cancel } = useSpeakQuestion();

  const character = CHARACTERS.find((c) => c.id === progress.characterId);
  const characterEmoji = character ? getCharacterEmoji(character.id, progress.totalStars) : '⭐';
  const feedbackMs = progress.slowMode ? GAME_CONFIG.feedbackDurationMs * 2 : GAME_CONFIG.feedbackDurationMs;

  const queue = useMemo(() => new PracticeQueue(progress), []); // eslint-disable-line
  const [pick, setPick] = useState<PracticePick | null>(() => queue.next());
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [triedChoices, setTriedChoices] = useState<string[]>([]);
  const [answered, setAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [levelUp, setLevelUp] = useState<{ title: string; emoji: string; rank: string } | null>(null);
  const [showQuit, setShowQuit] = useState(false);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answeringRef = useRef(false);

  useEffect(() => {
    queue.syncProgress(progress);
  }, [progress, queue]);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
  }, []);

  useEffect(() => {
    if (pick && progress.autoReadEnabled) speak(pick.question);
  }, [pick]); // eslint-disable-line

  useEffect(() => {
    if (showFeedback) cancel();
  }, [showFeedback, cancel]);

  function handleAnswer(choice: string) {
    if (!pick || answeringRef.current || selectedChoice || showFeedback) return;
    answeringRef.current = true;

    const question = pick.question;

    // Same gentle retry as the levels: the first wrong tap is free.
    if (choice !== question.correctAnswer && triedChoices.length === 0) {
      answeringRef.current = false;
      setTriedChoices([choice]);
      sounds.playWrong();
      setShowHint(true);
      return;
    }

    const correct = choice === question.correctAnswer;
    setSelectedChoice(choice);
    setLastCorrect(correct);
    setShowFeedback(true);
    setShowHint(false);
    setAnswered((n) => n + 1);
    setStreak((s) => (correct ? s + 1 : 0));
    if (correct) {
      setCorrectCount((n) => n + 1);
      sounds.playCorrect();
    } else {
      sounds.playWrong();
      queue.missed(question, pick.skillId);
      hintTimer.current = setTimeout(() => setShowHint(true), 400);
    }

    const { move, skill } = recordPracticeAnswer(pick.skillId, question.id, correct);
    recordQuestionsAnswered(1);

    if (move === 'promoted' && skill) {
      const def = SKILLS_BY_ID.get(skill.skillId);
      if (def) {
        setLevelUp({ title: def.title, emoji: def.emoji, rank: rankFor(skill.rung) });
        sounds.playLevelUp();
        levelUpTimer.current = setTimeout(() => setLevelUp(null), 2600);
      }
    }

    advanceTimer.current = setTimeout(() => {
      answeringRef.current = false;
      setShowFeedback(false);
      setSelectedChoice(null);
      setShowHint(false);
      setTriedChoices([]);
      setPick(queue.next());
    }, feedbackMs);
  }

  if (!pick) {
    return (
      <BackgroundGradient colors={PRACTICE_COLORS}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 }}>
          <div style={{ fontSize: 72 }}>🤔</div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 24, color: '#fff', textAlign: 'center' }}>
            No questions right now!
          </div>
          <BigButton onPress={() => navigate('/')} label="Home 🏠" color="#fff" textColor={PRACTICE_COLORS[0]} style={{ width: '100%', maxWidth: 300 }} />
        </div>
      </BackgroundGradient>
    );
  }

  const question = pick.question;
  const skill = pick.skillId ? SKILLS_BY_ID.get(pick.skillId) : null;

  return (
    <BackgroundGradient colors={PRACTICE_COLORS}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px', gap: 12, overflow: 'hidden', position: 'relative' }}>

        {showQuit && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 24, padding: '28px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320, width: '90%' }}>
              <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 22, color: '#333' }}>All done for now? 🎈</div>
              <div style={{ fontFamily: 'Nunito', fontSize: 15, color: '#666' }}>
                You answered {answered} question{answered === 1 ? '' : 's'} and got {correctCount} right. Everything is saved!
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => navigate('/')}
                  style={{ flex: 1, background: '#FF6B6B', color: '#fff', border: 'none', borderRadius: 14, padding: '12px 0', fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
                >Yes, I'm done</button>
                <button
                  onClick={() => setShowQuit(false)}
                  style={{ flex: 1, background: '#5DD97A', color: '#fff', border: 'none', borderRadius: 14, padding: '12px 0', fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}
                >Keep going!</button>
              </div>
            </div>
          </div>
        )}

        {/* Level-up banner */}
        {levelUp && (
          <div className="anim-pop" style={{
            position: 'absolute', top: 70, left: 20, right: 20, zIndex: 90,
            background: '#FFE066', borderRadius: 18, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 36 }}>{levelUp.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 17, color: '#5D4037' }}>
                {levelUp.title} levelled up!
              </div>
              <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#795548' }}>
                You're getting harder questions now
              </div>
            </div>
            <div style={{ fontSize: 34 }}>{levelUp.rank}</div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setShowQuit(true)}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 20, cursor: 'pointer', color: '#fff', fontFamily: 'Nunito', fontWeight: 700 }}
          >✕</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 17, color: '#fff' }}>
              ♾️ Practice
            </div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              {correctCount} right{streak >= 3 ? ` · 🔥 ${streak} in a row` : ''}
            </div>
          </div>
          <button
            onClick={() => { if (progress.autoReadEnabled) cancel(); else speak(question); toggleAutoRead(); }}
            title={progress.autoReadEnabled ? 'Turn off read-aloud' : 'Turn on read-aloud'}
            style={{
              background: progress.autoReadEnabled ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 18, cursor: 'pointer',
            }}
          >{progress.autoReadEnabled ? '🔊' : '🔇'}</button>
          <div className={showFeedback ? (lastCorrect ? 'anim-bounce' : 'anim-shake') : ''} style={{ fontSize: 30 }}>
            {characterEmoji}
          </div>
        </div>

        {/* Which skill this question came from */}
        <div style={{ textAlign: 'center', fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
          {skill
            ? `${skill.emoji} ${skill.title} ${rankFor(progress.skills?.[skill.id]?.rung ?? 0)}`
            : '💪 Something to practise again'}
        </div>

        {triedChoices.length > 0 && !showFeedback && (
          <div className="anim-slide" style={{
            textAlign: 'center', fontFamily: 'Nunito', fontWeight: 800, fontSize: 16, color: '#fff',
            background: 'rgba(255,200,0,0.4)', borderRadius: 12, padding: '6px 0',
          }}>
            💛 Almost! Try again!
          </div>
        )}

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto', justifyContent: 'center' }}>
          <QuestionCard question={question} />

          {question.hint && <HintBubble hint={question.hint} visible={showHint} />}

          <AnswerGrid
            choices={question.choices}
            onSelect={handleAnswer}
            selectedChoice={selectedChoice}
            correctAnswer={question.correctAnswer}
            disabled={showFeedback}
            triedChoices={triedChoices}
          />

          <FeedbackOverlay visible={showFeedback} correct={lastCorrect} characterEmoji={characterEmoji} correctAnswer={question.correctAnswer} />
        </div>
      </div>
    </BackgroundGradient>
  );
}
