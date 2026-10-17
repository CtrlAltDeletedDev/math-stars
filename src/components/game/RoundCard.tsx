import { UserProgress } from '@/types';
import { SKILLS_BY_ID, rankFor } from '@/data/skills';
import { TOPICS_BY_ID } from '@/data/topics';
import { masteryFor } from '@/engine/mastery';
import BigButton from '@/components/ui/BigButton';
import MasteryRing from '@/components/ui/MasteryRing';
import { ArrowBigUp, House, Play } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';

interface Props {
  progress: UserProgress;
  /** What the round concentrated on, in the order the queue chose them. */
  skillIds: string[];
  /** The ones that moved up a rung during the round. */
  levelledUp: string[];
  correct: number;
  total: number;
  stars: number;
  characterEmoji: string;
  onKeepGoing: () => void;
  onHome: () => void;
}

// The end of a round of Play.
//
// Play used to be one endless stream, so nothing ever ended and nothing ever
// visibly moved: a promotion on any one topic came round about once a week.
// A round is ten questions on two or three topics, and this card is where she
// sees what they did — each topic's ring where it now stands, a big arrow on
// any that went up. It is an ending without being a finish: "Keep going" is the
// bigger button, and the rings never show a full, done state.
//
// Pictures and numbers, not sentences, so she can read it on her own.

export default function RoundCard({
  progress, skillIds, levelledUp, correct, total, stars, characterEmoji, onKeepGoing, onHome,
}: Props) {
  return (
    <div
      className="anim-pop"
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 18, padding: '20px 8px',
      }}
    >
      <div className="anim-bounce" style={{ fontSize: 76, lineHeight: 1 }}>{characterEmoji}</div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 30, color: '#fff', textAlign: 'center' }}>
        Round done!
      </div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 20, color: 'rgba(255,255,255,0.9)' }}>
        {correct} / {total} ✓{stars > 0 ? `  ·  +${stars} ⭐` : ''}
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 420 }}>
        {skillIds.map((id) => {
          const skill = SKILLS_BY_ID.get(id);
          if (!skill) return null;
          const topic = TOPICS_BY_ID.get(id);
          const mastery = masteryFor(id, progress);
          const up = levelledUp.includes(id);
          return (
            <div
              key={id}
              style={{
                flex: '1 1 110px', maxWidth: 140, minHeight: 150, borderRadius: 20,
                background: up ? 'rgba(255,224,102,0.95)' : 'rgba(255,255,255,0.18)',
                border: '2px solid rgba(255,255,255,0.45)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '12px 8px', position: 'relative',
              }}
            >
              {up && (
                <ArrowBigUp
                  size={30} strokeWidth={ICON_STROKE} color="#2E7D32" fill="#66BB6A" aria-label="levelled up"
                  style={{ position: 'absolute', top: 6, right: 6 }}
                />
              )}
              <MasteryRing fill={mastery.fill} size={68} rank={mastery.everPlayed ? rankFor(mastery.rung) : undefined}>
                <span>{topic?.emoji ?? skill.emoji}</span>
              </MasteryRing>
              <span style={{
                fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, textAlign: 'center', lineHeight: 1.15,
                color: up ? '#5D4037' : '#fff',
              }}>
                {topic?.title ?? skill.title}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340, marginTop: 6 }}>
        <BigButton
          onPress={onKeepGoing}
          label="Keep going"
          icon={<Play size={24} strokeWidth={ICON_STROKE} fill="currentColor" aria-hidden />}
          color="#fff"
          textColor="#4527A0"
        />
        <BigButton
          onPress={onHome}
          label="Home"
          icon={<House size={22} strokeWidth={ICON_STROKE} aria-hidden />}
          color="rgba(255,255,255,0.22)"
          fontSize={18}
        />
      </div>
    </div>
  );
}
