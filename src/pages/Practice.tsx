import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { SKILLS_BY_ID, rankFor } from '@/data/skills';
import { PracticeQueue, PracticePick, ROUND_SIZE } from '@/engine/practiceSession';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useSpeakQuestion } from '@/hooks/useSpeakQuestion';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';
import QuestionCard from '@/components/game/QuestionCard';
import AnswerGrid from '@/components/game/AnswerGrid';
import FeedbackOverlay from '@/components/game/FeedbackOverlay';
import HintBubble from '@/components/game/HintBubble';
import Toast from '@/components/ui/Toast';
import ProgressBar from '@/components/ui/ProgressBar';
import RoundCard from '@/components/game/RoundCard';
import LessonOffer from '@/components/game/LessonOffer';
import { Lesson } from '@/data/learn';
import { forgetLessonVisit, lessonToOffer, leaveForLesson, returnFromLesson } from '@/engine/lessonOffer';
import { ErrorTag } from '@/types';
import { BADGES } from '@/data/badges';
import { GAME_CONFIG } from '@/constants/gameConfig';
import { House, Volume2, VolumeX, X } from 'lucide-react';
import { ICON_CENTER, ICON_STROKE } from '@/components/ui/icons';

const PRACTICE_COLORS: [string, string] = ['#7E57C2', '#4527A0'];

export default function Practice() {
  const navigate = useNavigate();
  const { progress, recordPracticeAnswer, recordQuestionsAnswered, toggleAutoRead } = useProgress();
  const sounds = useSoundEffects();
  useBackgroundMusic(progress.musicEnabled);
  const { speak, say, cancel } = useSpeakQuestion();

  const character = CHARACTERS.find((c) => c.id === progress.characterId);
  const characterEmoji = character ? getCharacterEmoji(character.id, progress.totalStars) : '⭐';
  const feedbackMs = progress.slowMode ? GAME_CONFIG.feedbackDurationMs * 2 : GAME_CONFIG.feedbackDurationMs;

  const characterName = character?.name ?? 'You';
  const [searchParams] = useSearchParams();
  const sessionSkill = searchParams.get('skill');
  // The queue and its first question come from one initializer, so a render
  // React repeats in development cannot draw a question twice and put the
  // round's plan out of step. Back from a lesson Play offered, she carries on
  // the same sitting, led by the topic the lesson was about.
  const [start] = useState(() => {
    const back = returnFromLesson();
    const q = new PracticeQueue(progress, characterName, sessionSkill, ROUND_SIZE, back.lead);
    return { queue: q, first: q.next(), offered: back.offered };
  });
  const queue = start.queue;
  const [pick, setPick] = useState<PracticePick | null>(start.first);
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
  // Badges and stickers have always been earnable here; nothing used to say so.
  const [toasts, setToasts] = useState<string[]>([]);

  // Play runs in rounds of ROUND_SIZE on the few topics the queue chose, and
  // ends each one on a card showing what moved. The refs are what the advance
  // timer reads; `roundCount` is what the progress bar draws.
  const [roundCount, setRoundCount] = useState(0);
  const [roundOver, setRoundOver] = useState(false);
  const [roundSkills, setRoundSkills] = useState<string[]>(() => queue.roundSkills());
  const round = useRef({
    answered: 0, correct: 0, stars: 0, levelledUp: [] as string[],
    /** Tagged mistakes per topic this round, to spot the same one twice. */
    mistakes: {} as Record<string, Partial<Record<ErrorTag, number>>>,
    /** Topics actually asked this round; a review can take the variety topic's turns. */
    asked: [] as string[],
  });

  // A lesson offered between questions when she is struggling (see
  // engine/lessonOffer.ts): at most once per topic per sitting.
  const [offer, setOffer] = useState<{ lesson: Lesson; skillId: string } | null>(null);
  const pendingOffer = useRef<{ lesson: Lesson; skillId: string } | null>(null);
  const offeredFor = useRef(start.offered);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answeringRef = useRef(false);
  // When the current question appeared, so a first tap can say how long it took.
  const shownAt = useRef(performance.now());

  useEffect(() => {
    queue.syncProgress(progress);
  }, [progress, queue]);

  useEffect(() => forgetLessonVisit(), []);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
  }, []);

  useEffect(() => {
    shownAt.current = performance.now();
    if (pick && progress.autoReadEnabled) speak(pick.question);
  }, [pick]); // eslint-disable-line

  useEffect(() => {
    if (showFeedback) cancel();
  }, [showFeedback, cancel]);

  function handleAnswer(choice: string) {
    if (!pick || answeringRef.current || selectedChoice || showFeedback) return;
    answeringRef.current = true;

    const question = pick.question;

    // Same gentle retry as the levels — and, as there, the first wrong tap is
    // recorded rather than thrown away, so guessing cannot climb the ladder.
    if (choice !== question.correctAnswer && triedChoices.length === 0) {
      answeringRef.current = false;
      setTriedChoices([choice]);
      sounds.playWrong();
      setShowHint(true);
      return;
    }

    const correct = triedChoices.length === 0 && choice === question.correctAnswer;
    // Only a right first tap is ever kept as a time, so the retry needs no clock.
    const ms = triedChoices.length === 0 ? performance.now() - shownAt.current : undefined;
    const foundIt = choice === question.correctAnswer;
    setSelectedChoice(choice);
    setLastCorrect(foundIt);
    setShowFeedback(true);
    setShowHint(false);
    setAnswered((n) => n + 1);
    setStreak((s) => (correct ? s + 1 : 0));
    // Two different questions, deliberately answered differently:
    //   "did she find it?"  -> what she sees and hears. Finding it on the second
    //                          try still deserves the happy sound.
    //   "did she know it?"  -> what gets scored, requeued and fed to the ladder.
    if (foundIt) {
      if (correct) setCorrectCount((n) => n + 1);
      sounds.playCorrect();
    } else {
      sounds.playWrong();
      hintTimer.current = setTimeout(() => setShowHint(true), 400);
    }
    if (!correct) queue.missed(question, pick.skillId, pick.rung);

    // The option she reached for first is what was scored, so it is the one
    // whose meaning is worth keeping — not whatever she landed on after the
    // retry told her it was wrong.
    const answeredChoice = triedChoices.length > 0 ? triedChoices[0] : choice;
    const { move, skill, newBadges, newStickers, streakBonus, starsAwarded } = recordPracticeAnswer(
      pick.skillId, question.id, correct, pick.rung, { question, chosen: answeredChoice, ms },
    );
    recordQuestionsAnswered(1);

    round.current.answered += 1;
    if (correct) round.current.correct += 1;
    round.current.stars += starsAwarded + streakBonus;
    if (pick.skillId && pick.rung !== null && !round.current.asked.includes(pick.skillId)) {
      round.current.asked = [...round.current.asked, pick.skillId];
    }
    if (move === 'promoted' && skill && !round.current.levelledUp.includes(skill.skillId)) {
      round.current.levelledUp = [...round.current.levelledUp, skill.skillId];
    }
    setRoundCount(round.current.answered);

    if (pick.skillId && skill) {
      const tag = correct ? undefined : question.distractorMeaning?.[answeredChoice];
      const counts = round.current.mistakes[pick.skillId] ?? {};
      round.current.mistakes[pick.skillId] = counts;
      if (tag && tag !== 'unknown') counts[tag] = (counts[tag] ?? 0) + 1;
      const topTag = (Object.entries(counts) as [ErrorTag, number][]).sort((a, b) => b[1] - a[1])[0]?.[0];
      const lesson = lessonToOffer(progress, {
        skillId: pick.skillId, move, rung: skill.rung, tag,
        tagCountThisRound: tag ? counts[tag] ?? 0 : 0, topTagThisRound: topTag,
      }, offeredFor.current);
      if (lesson) {
        offeredFor.current.add(pick.skillId);
        pendingOffer.current = { lesson, skillId: pick.skillId };
      }
    }

    const earned = [
      ...newBadges.map((b) => {
        const def = BADGES.find((d) => d.id === b.badgeId);
        return def ? `${def.emoji} New badge: ${def.title}` : '🏅 New badge!';
      }),
      ...newStickers.map(() => '🎨 New sticker unlocked!'),
      ...(streakBonus > 0 ? [`🔥 Streak bonus: +${streakBonus} ⭐`] : []),
    ];
    if (earned.length > 0) setToasts(earned);

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
      if (pendingOffer.current) {
        const next = pendingOffer.current;
        pendingOffer.current = null;
        if (progress.autoReadEnabled) say(`Want to see a trick? ${next.lesson.title}`);
        else cancel();
        setOffer(next);
        return;
      }
      continueRound();
    }, feedbackMs);
  }

  /** The next question, or the end-of-round card once the round is used up. */
  function continueRound() {
    if (round.current.answered >= ROUND_SIZE) {
      cancel();
      setRoundOver(true);
      return;
    }
    setPick(queue.next());
  }

  function showLesson() {
    if (!offer) return;
    // "Done" in the lesson comes back to Play, on the same topic if she was on one.
    // Replacing this screen in history, as the lesson does on the way back,
    // keeps Back from walking her through Play, the lesson and Play again.
    const back = sessionSkill ? `/practice?skill=${sessionSkill}` : '/practice';
    leaveForLesson(offeredFor.current, offer.skillId);
    navigate(`/learn/${offer.lesson.id}?topic=${offer.skillId}&return=${encodeURIComponent(back)}`, { replace: true });
  }

  function keepPlaying() {
    setOffer(null);
    setShowQuit(false);
    continueRound();
  }

  function keepGoing() {
    queue.startRound();
    round.current = { answered: 0, correct: 0, stars: 0, levelledUp: [], mistakes: {}, asked: [] };
    setRoundCount(0);
    setRoundSkills(queue.roundSkills());
    setLevelUp(null);
    setShowQuit(false);
    setRoundOver(false);
    setPick(queue.next());
  }

  if (!pick) {
    return (
      <BackgroundGradient colors={PRACTICE_COLORS}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 }}>
          <div style={{ fontSize: 72 }}>🤔</div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 24, color: '#fff', textAlign: 'center' }}>
            No questions right now!
          </div>
          <BigButton onPress={() => navigate('/')} label="Home" icon={<House size={24} strokeWidth={ICON_STROKE} aria-hidden />} color="#fff" textColor={PRACTICE_COLORS[0]} style={{ width: '100%', maxWidth: 300 }} />
        </div>
      </BackgroundGradient>
    );
  }

  // Every branch keeps Toast first under the same background, so React keeps
  // the one Toast across them instead of remounting it and replaying old news.
  if (offer) {
    return (
      <BackgroundGradient colors={PRACTICE_COLORS}>
        <Toast messages={toasts} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px', overflow: 'auto' }}>
          <LessonOffer lesson={offer.lesson} characterEmoji={characterEmoji} onShowMe={showLesson} onKeepPlaying={keepPlaying} />
        </div>
      </BackgroundGradient>
    );
  }

  if (roundOver) {
    return (
      <BackgroundGradient colors={PRACTICE_COLORS}>
        <Toast messages={toasts} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px', overflow: 'auto' }}>
          <RoundCard
            progress={progress}
            skillIds={roundSkills.filter((id) => round.current.asked.includes(id))}
            levelledUp={round.current.levelledUp}
            correct={round.current.correct}
            total={round.current.answered}
            stars={round.current.stars}
            characterEmoji={characterEmoji}
            onKeepGoing={keepGoing}
            onHome={() => navigate('/')}
          />
        </div>
      </BackgroundGradient>
    );
  }

  const question = pick.question;
  const skill = pick.skillId ? SKILLS_BY_ID.get(pick.skillId) : null;

  return (
    <BackgroundGradient colors={PRACTICE_COLORS}>
      <Toast messages={toasts} />
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
                Harder questions now · +{GAME_CONFIG.levelUpBonusStars} ⭐
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
            aria-label="Stop"
          ><X size={26} strokeWidth={ICON_STROKE} style={ICON_CENTER} aria-hidden /></button>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* How far through this round: the round ends on a card, not never. */}
            <ProgressBar current={roundCount} total={ROUND_SIZE} />
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', minHeight: 17 }}>
              {streak >= 3 ? `🔥 ${streak} in a row` : ''}
            </div>
          </div>
          <button
            onClick={() => { if (progress.autoReadEnabled) cancel(); else speak(question); toggleAutoRead(); }}
            title={progress.autoReadEnabled ? 'Turn off read-aloud' : 'Turn on read-aloud'}
            style={{
              background: progress.autoReadEnabled ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 18, cursor: 'pointer',
            }}
          >{progress.autoReadEnabled
            ? <Volume2 size={24} strokeWidth={ICON_STROKE} color="#fff" style={ICON_CENTER} aria-hidden />
            : <VolumeX size={24} strokeWidth={ICON_STROKE} color="#fff" style={ICON_CENTER} aria-hidden />}</button>
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
