import { useNavigate } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { CHARACTERS } from '@/data/characters';
import BackgroundGradient from '@/components/ui/BackgroundGradient';

export default function CharacterSelect() {
  const { selectCharacter } = useProgress();
  const navigate = useNavigate();

  function choose(id: string) {
    selectCharacter(id);
    navigate('/', { replace: true });
  }

  return (
    <BackgroundGradient colors={['#87CEEB', '#4A90E2']}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 28 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>👋</div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 32, color: '#fff' }}>Pick your friend!</div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 400, fontSize: 18, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
            They'll cheer you on
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, width: '100%', maxWidth: 420 }}>
          {CHARACTERS.map((char) => (
            <button
              key={char.id}
              onClick={() => choose(char.id)}
              style={{
                background: char.color,
                borderRadius: 24, border: 'none', cursor: 'pointer',
                padding: '20px 8px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8,
                boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
              }}
            >
              <span style={{ fontSize: 44 }}>{char.emoji}</span>
              <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#fff' }}>{char.name}</span>
            </button>
          ))}
        </div>
      </div>
    </BackgroundGradient>
  );
}
