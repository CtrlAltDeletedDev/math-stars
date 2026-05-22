import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { STORIES } from '@/data/stories';
import { getCategoryById } from '@/data/categories';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';

export default function Story() {
  const { categoryId = '' } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [panel, setPanel] = useState(0);

  const story = STORIES.find((s) => s.categoryId === categoryId);
  const category = getCategoryById(categoryId);

  if (!story || !category) return null;

  const isLast = panel >= story.panels.length - 1;
  const current = story.panels[panel];

  return (
    <BackgroundGradient colors={[category.bgColor, category.darkColor]}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: 16 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(`/category/${categoryId}`)}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 20, cursor: 'pointer', color: '#fff' }}
          >✕</button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Nunito', fontWeight: 800, fontSize: 20, color: '#fff' }}>
            📖 {story.title}
          </div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>
            {panel + 1}/{story.panels.length}
          </div>
        </div>

        {/* Panel dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {story.panels.map((_, i) => (
            <div key={i} style={{
              width: i === panel ? 24 : 10, height: 10, borderRadius: 5,
              background: i <= panel ? '#fff' : 'rgba(255,255,255,0.3)',
              transition: 'width 0.3s, background 0.3s',
            }} />
          ))}
        </div>

        {/* Story card */}
        <div
          key={panel}
          className="anim-slide"
          style={{
            flex: 1, background: '#fff', borderRadius: 28,
            padding: '32px 28px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 24,
            boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ fontSize: 52, lineHeight: 1.4, textAlign: 'center', whiteSpace: 'pre' }}>
            {current.art}
          </div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 19, color: '#333', textAlign: 'center', lineHeight: 1.5 }}>
            {current.text}
          </div>
        </div>

        <BigButton
          onPress={() => {
            if (isLast) navigate(`/category/${categoryId}`);
            else setPanel((p) => p + 1);
          }}
          label={isLast ? '🏠 Back to Levels' : 'Next ▶'}
          color={isLast ? '#fff' : 'rgba(255,255,255,0.3)'}
          textColor={isLast ? category.bgColor : '#fff'}
        />
      </div>
    </BackgroundGradient>
  );
}
