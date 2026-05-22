import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { getLevelById, getCategoryById } from '@/data/categories';
import { buildSession } from '@/engine/sessionBuilder';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { Question } from '@/types';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';
import QuestionCard from '@/components/game/QuestionCard';

export default function Flashcard() {
  const { categoryId = '', levelId = '' } = useParams<{ categoryId: string; levelId: string }>();
  const navigate = useNavigate();
  const { progress } = useProgress();

  const level = getLevelById(levelId);
  const category = getCategoryById(categoryId);
  const character = CHARACTERS.find((c) => c.id === progress.characterId);
  const characterEmoji = character ? getCharacterEmoji(character.id, progress.totalStars) : '⭐';

  const questionsRef = useRef<Question[]>(
    level ? buildSession(level, progress.srsCards, character?.name ?? 'Friend') : [],
  );

  const [index, setIndex] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (!level || !category) return null;

  const questions = questionsRef.current;
  const question = questions[index];

  function handleAnswer(choice: string) {
    if (flash) return;
    const correct = choice === question.correctAnswer;
    setFlash(correct ? 'correct' : 'wrong');
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));

    timerRef.current = setTimeout(() => {
      setFlash(null);
      const next = index + 1;
      if (next >= questions.length) setDone(true);
      else setIndex(next);
    }, 500);
  }

  if (done) {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <BackgroundGradient colors={[category.bgColor, category.darkColor]}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 }}>
          <div style={{ fontSize: 72 }}>{characterEmoji}</div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 32, color: '#fff', textAlign: 'center' }}>
            Review Done! ⚡
          </div>
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '16px 32px', fontFamily: 'Nunito', fontWeight: 800, fontSize: 24, color: '#fff' }}>
            {score.correct}/{score.total} — {pct}%
          </div>
          <div style={{ display: 'flex', gap: 14, width: '100%', maxWidth: 360 }}>
            <BigButton onPress={() => { setIndex(0); setScore({ correct: 0, total: 0 }); setDone(false); }} label="Again ⚡" color="rgba(255,255,255,0.3)" style={{ flex: 1 }} />
            <BigButton onPress={() => navigate(`/category/${categoryId}`)} label="Done 🏠" color="#fff" textColor={category.bgColor} style={{ flex: 1 }} />
          </div>
        </div>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient colors={[category.bgColor, category.darkColor]}>
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px', gap: 12, overflow: 'hidden',
          background: flash === 'correct' ? 'rgba(76,175,80,0.25)' : flash === 'wrong' ? 'rgba(255,82,82,0.25)' : 'transparent',
          transition: 'background 0.1s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(`/category/${categoryId}`)}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 20, cursor: 'pointer', color: '#fff', fontFamily: 'Nunito', fontWeight: 700 }}
          >✕</button>
          <div style={{ flex: 1, fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: '#fff', textAlign: 'center' }}>
            ⚡ Quick Review — {index + 1}/{questions.length}
          </div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: '#FFE066' }}>
            {score.correct}✓
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
          <QuestionCard question={question} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {question.choices.map((choice) => {
              let bg = '#4A90E2';
              if (flash) bg = choice === question.correctAnswer ? '#4CAF50' : '#bbb';
              return (
                <button
                  key={choice}
                  onClick={() => handleAnswer(choice)}
                  style={{
                    background: bg, color: '#fff', fontFamily: 'Nunito', fontWeight: 800,
                    fontSize: 26, borderRadius: 20, border: 'none', minHeight: 80,
                    cursor: flash ? 'default' : 'pointer', transition: 'background 0.15s',
                  }}
                >{choice}</button>
              );
            })}
          </div>
        </div>
      </div>
    </BackgroundGradient>
  );
}
