import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { LESSONS_BY_ID, TryStep, practiceLevelFor } from '@/data/learn';
import { TOPICS_BY_ID } from '@/data/topics';
import { CHARACTERS, getCharacterEmoji } from '@/data/characters';
import { shuffle } from '@/engine/choices';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';
import LessonScene from '@/components/learn/LessonScene';
import { ArrowLeft, ArrowRight, Lightbulb, Play, RotateCcw, Star, Volume2, X } from 'lucide-react';
import { ICON_CENTER, ICON_STROKE } from '@/components/ui/icons';

// One lesson, one step at a time: the guide says something, a picture shows it,
// and every few steps she has a go herself.
//
// Speech is started from inside tap handlers, never from an effect. iPad Safari
// only lets a page talk in response to a tap, and the Start button is that tap.

function say(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}

const PRAISE = ['Yes!', 'You got it!', 'Great thinking!', 'That\'s it!'];

export default function Learn() {
  const { lessonId = '' } = useParams<{ lessonId: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { progress, markLessonDone } = useProgress();
  const sounds = useSoundEffects();

  const lesson = LESSONS_BY_ID.get(lessonId);
  const [index, setIndex] = useState(-1); // -1 is the title card
  const [tried, setTried] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [replay, setReplay] = useState(0);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const step = lesson && index >= 0 && index < lesson.steps.length ? lesson.steps[index] : null;
  // Shuffled once per step, so the right answer is never in a fixed place.
  const choices = useMemo(() => (step?.kind === 'try' ? shuffle(step.choices) : []), [step]);

  if (!lesson) return <Navigate to="/" replace />;

  const fromTopic = search.get('topic');
  const topic = TOPICS_BY_ID.get(fromTopic ?? lesson.places[0].skillId);
  const colors: [string, string] = topic ? [topic.bgColor, topic.darkColor] : ['#5C6BC0', '#283593'];
  const character = CHARACTERS.find((c) => c.id === progress.characterId);
  const guide = character ? getCharacterEmoji(character.id, progress.totalStars) : '🦉';
  const practice = practiceLevelFor(lesson, topic?.id);
  const isDone = index >= lesson.steps.length;

  function leave() {
    window.speechSynthesis?.cancel();
    // Offered from inside Play, the lesson hands her back to Play. Only a Play
    // path is honoured, so a crafted link cannot send her anywhere else.
    const back = search.get('return');
    if (back && /^\/practice(\?skill=[a-z-]+)?$/.test(back)) { navigate(back, { replace: true }); return; }
    navigate(topic ? `/topic/${topic.id}` : '/');
  }

  function goTo(i: number) {
    setIndex(i);
    setTried([]);
    setSolved(false);
    setHint(null);
    setReplay(0);
    if (i < lesson!.steps.length) say(lesson!.steps[i].say);
    else {
      markLessonDone(lesson!.id);
      sounds.playLevelUp();
      say(`You did it! You learned ${lesson!.title}.`);
    }
  }

  function choose(c: string, s: TryStep) {
    if (solved || tried.includes(c)) return;
    if (c === s.answer) {
      setSolved(true);
      setHint(null);
      sounds.playCorrect();
      say(s.then.say);
      return;
    }
    // A wrong tap here costs nothing — this is where she is allowed to be wrong.
    sounds.playWrong();
    const h = s.hints?.[c] ?? 'Not quite. Look at the picture and try again!';
    setTried((t) => [...t, c]);
    setHint(h);
    say(h);
  }

  function again() {
    if (!step) return;
    setReplay((r) => r + 1);
    if (step.kind === 'try' && solved) say(step.then.say);
    else if (hint) say(hint);
    else say(step.say);
  }

  // --- Title card and the end -----------------------------------------------

  if (index < 0 || isDone) {
    return (
      <BackgroundGradient colors={colors}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 }}>
          <div className="anim-bounce" style={{ fontSize: 88, lineHeight: 1 }}>{isDone ? '⭐' : lesson.emoji}</div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 30, color: '#fff', textAlign: 'center' }}>
            {isDone ? 'You did it!' : lesson.title}
          </div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>
            {isDone ? `You learned ${lesson.title}.` : `${guide} Watch, then you try!`}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360, marginTop: 10 }}>
            {isDone ? (
              <>
                {/* A topic with no levels (Fractions) practises in Play instead. */}
                {(practice || topic) && (
                  <BigButton
                    onPress={() => navigate(practice ? `/game/${practice.categoryId}/${practice.id}` : `/practice?skill=${topic!.id}`, { replace: true })}
                    label="Practice it now"
                    icon={<Play size={22} strokeWidth={ICON_STROKE} fill="currentColor" aria-hidden />}
                    color="#fff"
                    textColor={colors[1]}
                  />
                )}
                <BigButton onPress={() => goTo(0)} label="Watch again" icon={<RotateCcw size={20} strokeWidth={ICON_STROKE} aria-hidden />} color="rgba(255,255,255,0.25)" fontSize={18} />
                <BigButton onPress={leave} label="Done" color="rgba(255,255,255,0.18)" fontSize={18} />
              </>
            ) : (
              <>
                <BigButton onPress={() => goTo(0)} label="Start" icon={<Play size={22} strokeWidth={ICON_STROKE} fill="currentColor" aria-hidden />} color="#fff" textColor={colors[1]} />
                <BigButton onPress={leave} label="Back" icon={<ArrowLeft size={20} strokeWidth={ICON_STROKE} aria-hidden />} color="rgba(255,255,255,0.18)" fontSize={18} />
              </>
            )}
          </div>
        </div>
      </BackgroundGradient>
    );
  }

  // --- A step ----------------------------------------------------------------

  const s = step!;
  const scene = s.kind === 'try' && solved && s.then.scene ? s.then.scene : s.scene;
  const caption = s.kind === 'try' && solved ? s.then.caption ?? PRAISE[index % PRAISE.length] : s.caption;
  const canGoOn = s.kind === 'watch' || solved;

  return (
    <BackgroundGradient colors={colors}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 16px 18px', gap: 12, overflowY: 'auto' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={leave} aria-label="Close lesson" style={iconButton}><X size={26} strokeWidth={ICON_STROKE} style={ICON_CENTER} aria-hidden /></button>
          <div style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'center' }}>
            {lesson.steps.map((_, i) => (
              <div key={i} style={{
                width: i === index ? 22 : 10, height: 10, borderRadius: 5,
                background: i <= index ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'width 0.25s',
              }} />
            ))}
          </div>
          <button onClick={again} aria-label="Say it again" style={iconButton}><Volume2 size={26} strokeWidth={ICON_STROKE} style={ICON_CENTER} aria-hidden /></button>
        </div>

        {/* The guide, saying the caption */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ fontSize: 48, lineHeight: 1, flexShrink: 0 }}>{guide}</div>
          <div style={{
            flex: 1, background: '#fff', borderRadius: '20px 20px 20px 6px', padding: '12px 16px',
            boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
          }}>
            <div key={`${index}-${solved}`} className="anim-pop" style={{
              fontFamily: 'Nunito', fontWeight: 800, fontSize: caption.length > 24 ? 21 : 26, color: '#333', lineHeight: 1.25,
            }}>
              {caption}
            </div>
            {s.kind === 'watch' && s.detail && (
              <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#667', marginTop: 4 }}>{s.detail}</div>
            )}
          </div>
        </div>

        {/* The picture */}
        {scene && (
          <div style={{
            background: '#fff', borderRadius: 24, padding: '18px 14px', minHeight: 140,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}>
            <LessonScene key={`${index}-${solved}-${replay}`} scene={scene} />
          </div>
        )}

        {hint && !solved && (
          <div className="anim-pop" style={{
            background: '#FFF3B0', borderRadius: 16, padding: '10px 14px',
            fontFamily: 'Nunito', fontWeight: 800, fontSize: 17, color: '#5A4A00',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Lightbulb size={24} strokeWidth={ICON_STROKE} color="#C9A400" style={{ flexShrink: 0 }} aria-hidden />
            <span>{hint}</span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {s.kind === 'try' && (
          <div style={{ display: 'grid', gridTemplateColumns: choices.length === 3 ? '1fr' : '1fr 1fr', gap: 12 }}>
            {choices.map((c) => {
              const isTried = tried.includes(c);
              const isRight = solved && c === s.answer;
              return (
                <button
                  key={c}
                  onClick={() => choose(c, s)}
                  className={isRight ? 'anim-pop' : undefined}
                  style={{
                    minHeight: 72, borderRadius: 18, border: 'none',
                    background: isRight ? '#4CAF50' : isTried ? 'rgba(255,255,255,0.35)' : solved ? 'rgba(255,255,255,0.5)' : '#fff',
                    color: isRight ? '#fff' : isTried ? 'rgba(0,0,0,0.35)' : colors[1],
                    fontFamily: 'Nunito', fontWeight: 800, fontSize: c.length > 6 ? 22 : 30,
                    boxShadow: isTried || solved ? 'none' : '0 4px 0 rgba(0,0,0,0.18)',
                    cursor: isTried || solved ? 'default' : 'pointer',
                    textDecoration: isTried ? 'line-through' : undefined,
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {canGoOn && (
          <BigButton
            onPress={() => goTo(index + 1)}
            label={index === lesson.steps.length - 1 ? 'Finish' : 'Next'}
            icon={index === lesson.steps.length - 1
              ? <Star size={24} strokeWidth={ICON_STROKE} fill="currentColor" aria-hidden />
              : <ArrowRight size={24} strokeWidth={ICON_STROKE} aria-hidden />}
            color="#FFE066"
            textColor="#5A4A00"
            style={{ width: '100%' }}
          />
        )}
      </div>
    </BackgroundGradient>
  );
}

const iconButton: React.CSSProperties = {
  background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12,
  width: 48, height: 48, cursor: 'pointer', color: '#fff', flexShrink: 0,
};
