import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { ICON_CENTER, ICON_STROKE } from '@/components/ui/icons';
import Page from '../ui/Page';
import { ROUTES } from '../routes';
import { C, KID_FONT } from '../theme';
import { speak, unlockSpeech } from '../platform/speech';
import { sound } from '../platform/sound';
import { HOME_CSS } from '../home/styles';

// "More games": one door off the path to the old app's other topics, which
// still work as they are. Each card is a picture; the speaker says its name.

interface Door {
  emoji: string;
  name: string;
  /** What the speaker says, when the printed name is not how you would say it. */
  say?: string;
  to: string;
}

const DOORS: Door[] = [
  { emoji: '🕐', name: 'Clocks', to: '/topic/clocks' },
  { emoji: '🪙', name: 'Money', to: '/topic/money' },
  { emoji: '🔷', name: 'Shapes', to: '/topic/shapes' },
  { emoji: '🔟', name: 'Tens & ones', say: 'Tens and ones', to: '/topic/place-value' },
  { emoji: '⚖️', name: 'Bigger?', say: 'Which is bigger?', to: '/topic/comparing' },
  { emoji: '📖', name: 'Stories', to: '/topic/stories' },
  { emoji: '🔢', name: 'Counting', to: '/topic/counting' },
  { emoji: '📏', name: 'Measuring', to: '/topic/measuring' },
];

export default function More() {
  const navigate = useNavigate();
  const say = (text: string) => {
    unlockSpeech();
    sound.unlock();
    speak(text);
  };

  return (
    <Page>
      <style>{HOME_CSS}</style>
      <header style={{ display: 'flex', alignItems: 'center', padding: '4px 0 16px' }}>
        <button
          type="button"
          aria-label="Back to the path"
          className="np-press"
          onClick={() => navigate(ROUTES.home)}
          style={{
            width: 60, height: 60, borderRadius: 20, border: 0, padding: 0, cursor: 'pointer',
            background: C.card, boxShadow: `0 3px 0 ${C.line}`, color: C.inkSoft,
          }}
        >
          <ArrowLeft size={30} strokeWidth={ICON_STROKE} style={ICON_CENTER} aria-hidden="true" />
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, paddingBottom: 12 }}>
        {DOORS.map((d) => (
          <div key={d.to} style={{ position: 'relative' }}>
            <button
              type="button"
              aria-label={d.say ?? d.name}
              className="np-press"
              onClick={() => { sound.unlock(); navigate(d.to); }}
              style={{
                width: '100%', minHeight: 'clamp(140px, 20vh, 210px)', borderRadius: 26, border: 0, cursor: 'pointer',
                background: C.card, boxShadow: `0 5px 0 ${C.line}`, color: C.ink,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '22px 8px 16px', fontFamily: KID_FONT,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 'clamp(48px, 7vh, 76px)', lineHeight: 1 }}>{d.emoji}</span>
              <span style={{ fontSize: 'clamp(21px, 2.6vh, 28px)', fontWeight: 600, lineHeight: 1.1 }}>{d.name}</span>
            </button>
            <button
              type="button"
              aria-label={`Say "${d.say ?? d.name}"`}
              onClick={() => say(d.say ?? d.name)}
              style={{
                position: 'absolute', top: 4, right: 4, width: 44, height: 44, borderRadius: 15, border: 0, padding: 0,
                cursor: 'pointer', background: C.paper, color: C.inkSoft, WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Volume2 size={22} strokeWidth={ICON_STROKE * 0.85} style={ICON_CENTER} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </Page>
  );
}
