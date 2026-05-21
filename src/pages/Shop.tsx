import { useNavigate } from 'react-router-dom';
import { useProgress } from '@/store/useProgress';
import { SHOP_ITEMS, getTheme } from '@/data/shop';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import StarBadge from '@/components/ui/StarBadge';

export default function Shop() {
  const navigate = useNavigate();
  const { progress, purchaseItem, setActiveTheme } = useProgress();
  const theme = getTheme(progress.activeTheme);

  return (
    <BackgroundGradient colors={theme.colors}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 22, cursor: 'pointer' }}
          >
            ←
          </button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Nunito', fontWeight: 800, fontSize: 22, color: '#fff' }}>
            🛍️ Theme Shop
          </div>
          <StarBadge count={progress.spendableStars} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SHOP_ITEMS.map((item) => {
            const owned = progress.purchasedItems.includes(item.id);
            const active = progress.activeTheme === item.value;
            const canAfford = progress.spendableStars >= item.cost;
            const itemTheme = getTheme(item.value);

            return (
              <div
                key={item.id}
                style={{
                  background: `linear-gradient(135deg, ${itemTheme.colors[0]}, ${itemTheme.colors[1]})`,
                  borderRadius: 20, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: active ? '0 0 0 3px #fff' : 'none',
                }}
              >
                <div style={{ fontSize: 40 }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 18, color: '#fff' }}>{item.name}</div>
                  <div style={{ fontFamily: 'Nunito', fontWeight: 400, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{item.description}</div>
                </div>
                {active ? (
                  <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: '#fff', background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '4px 10px' }}>
                    ✓ Active
                  </div>
                ) : owned ? (
                  <button
                    onClick={() => setActiveTheme(item.value)}
                    style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: '#fff', background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 10, padding: '6px 12px', cursor: 'pointer' }}
                  >
                    Use
                  </button>
                ) : (
                  <button
                    onClick={() => { if (canAfford) purchaseItem(item.id); }}
                    style={{
                      fontFamily: 'Nunito', fontWeight: 700, fontSize: 13,
                      color: canAfford ? '#fff' : 'rgba(255,255,255,0.4)',
                      background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 10,
                      padding: '6px 12px', cursor: canAfford ? 'pointer' : 'default',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ⭐ {item.cost}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </BackgroundGradient>
  );
}
