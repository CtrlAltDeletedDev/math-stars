import { Lightbulb } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';

interface Props {
  hint: string;
  visible: boolean;
}

export default function HintBubble({ hint, visible }: Props) {
  if (!visible) return null;
  return (
    <div
      className="anim-slide"
      style={{
        background: '#FFF9C4',
        borderRadius: 16,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Lightbulb size={22} strokeWidth={ICON_STROKE} color="#C9A400" style={{ flexShrink: 0 }} aria-hidden />
      <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 16, color: '#555' }}>{hint}</span>
    </div>
  );
}
