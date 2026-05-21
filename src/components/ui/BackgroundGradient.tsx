import { ReactNode } from 'react';

interface Props {
  colors?: [string, string];
  children: ReactNode;
  style?: React.CSSProperties;
}

export default function BackgroundGradient({ colors = ['#87CEEB', '#4A90E2'], children, style }: Props) {
  return (
    <div style={{
      width: '100%',
      height: '100dvh',
      background: `linear-gradient(180deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
      ...style,
    }}>
      {children}
    </div>
  );
}
