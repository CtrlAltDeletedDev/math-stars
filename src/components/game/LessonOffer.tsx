import { Lesson } from '@/data/learn';
import BigButton from '@/components/ui/BigButton';
import { BookOpen, Play } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';

interface Props {
  lesson: Lesson;
  characterEmoji: string;
  onShowMe: () => void;
  onKeepPlaying: () => void;
}

// Offered between questions when Play sees her struggling: moved down a rung,
// or the same mistake twice in a round. Never forced — "Keep playing" is right
// there — and never a second time for the same topic in one sitting.
export default function LessonOffer({ lesson, characterEmoji, onShowMe, onKeepPlaying }: Props) {
  return (
    <div
      className="anim-pop"
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 18, padding: '20px 8px',
      }}
    >
      <div className="anim-bounce" style={{ fontSize: 72, lineHeight: 1 }}>{characterEmoji}</div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 28, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
        Want to see a trick?
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.45)', borderRadius: 22,
        padding: '16px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 180,
      }}>
        <span style={{ fontSize: 56, lineHeight: 1 }}>{lesson.emoji}</span>
        <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 20, color: '#fff', textAlign: 'center' }}>
          {lesson.title}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340, marginTop: 6 }}>
        <BigButton
          onPress={onShowMe}
          label="Show me"
          icon={<BookOpen size={24} strokeWidth={ICON_STROKE} aria-hidden />}
          color="#fff"
          textColor="#4527A0"
        />
        <BigButton
          onPress={onKeepPlaying}
          label="Keep playing"
          icon={<Play size={22} strokeWidth={ICON_STROKE} fill="currentColor" aria-hidden />}
          color="rgba(255,255,255,0.22)"
          fontSize={18}
        />
      </div>
    </div>
  );
}
