import { useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { CHARACTERS } from '@/data/characters';
import Page from '../ui/Page';
import { setLearner } from '../store';
import { ROUTES } from '../routes';
import { C, KID_FONT } from '../theme';
import { speak, unlockSpeech } from '../platform/speech';
import { sound } from '../platform/sound';
import { HOME_CSS } from '../home/styles';

// First run: she picks who walks the path with her. The title speaks when
// tapped (never on its own: iPad Safari only speaks from a tap).

const TITLE = 'Pick your friend!';

export default function Start() {
  const navigate = useNavigate();

  const pick = (id: string, name: string) => {
    unlockSpeech();
    sound.unlock();
    speak(`${name}!`);
    setLearner((l) => ({ ...l, profile: { ...l.profile, characterId: id } }));
    navigate(ROUTES.home, { replace: true });
  };

  return (
    <Page>
      <style>{HOME_CSS}</style>
      <button
        type="button"
        onClick={() => { unlockSpeech(); speak(TITLE); }}
        style={{
          alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 22px',
          padding: '10px 18px 10px 12px', borderRadius: 22, border: 0, cursor: 'pointer', minHeight: 64,
          background: C.card, boxShadow: `0 3px 0 ${C.line}`, color: C.ink, fontFamily: KID_FONT,
          fontSize: 'clamp(28px, 4vh, 40px)', fontWeight: 700, WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 14, background: C.paper, color: C.inkSoft, display: 'grid', placeItems: 'center' }}>
          <Volume2 size={24} strokeWidth={ICON_STROKE * 0.85} />
        </span>
        {TITLE}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignContent: 'start' }}>
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="np-press"
            onClick={() => pick(c.id, c.name)}
            style={{
              minHeight: 'clamp(150px, 21vh, 230px)', borderRadius: 28, border: 0, cursor: 'pointer',
              background: C.card, boxShadow: `0 6px 0 ${C.line}`, color: C.ink,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: KID_FONT, padding: 12,
            }}
          >
            <span aria-hidden="true" style={{
              width: 'clamp(92px, 12vh, 132px)', height: 'clamp(92px, 12vh, 132px)', borderRadius: '50%',
              background: C.paper, display: 'grid', placeItems: 'center',
              fontSize: 'clamp(60px, 8vh, 88px)', lineHeight: 1,
            }}>{c.emoji}</span>
            <span style={{ fontSize: 'clamp(22px, 2.8vh, 30px)', fontWeight: 600 }}>{c.name}</span>
          </button>
        ))}
      </div>
    </Page>
  );
}
