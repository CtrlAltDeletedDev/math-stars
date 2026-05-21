import { useNavigate, useParams } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { getCategoryById } from '@/data/categories';
import LevelMap from '@/components/category/LevelMap';
import BackgroundGradient from '@/components/ui/BackgroundGradient';

export default function Category() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { progress } = useProgress();

  const category = getCategoryById(id ?? '');
  if (!category) return null;

  const catProgress = progress.categories[category.id] ?? { levels: {} };

  return (
    <BackgroundGradient colors={[category.bgColor, category.darkColor]}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 22, cursor: 'pointer' }}
          >
            ←
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Nunito', fontWeight: 800, fontSize: 24, color: '#fff' }}>
            {category.emoji} {category.title}
          </div>
          <div style={{ width: 44 }} />
        </div>

        {/* Scrollable level map */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
          <LevelMap
            levels={category.levels}
            levelStates={catProgress.levels}
            onSelect={(levelId) => navigate(`/game/${category.id}/${levelId}`)}
          />
        </div>
      </div>
    </BackgroundGradient>
  );
}
