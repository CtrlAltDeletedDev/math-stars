import { CSSProperties, useState } from 'react';

interface Props {
  onPress: () => void;
  label: string;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  style?: CSSProperties;
  fontSize?: number;
}

export default function BigButton({ onPress, label, color = '#4A90E2', textColor = '#fff', disabled = false, style, fontSize = 22 }: Props) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); if (!disabled) onPress(); }}
      onPointerLeave={() => setPressed(false)}
      disabled={disabled}
      style={{
        background: disabled ? '#ccc' : color,
        color: disabled ? '#888' : textColor,
        fontFamily: 'Nunito, sans-serif',
        fontWeight: 800,
        fontSize,
        borderRadius: 20,
        padding: '16px 24px',
        minHeight: 64,
        minWidth: 120,
        boxShadow: pressed || disabled ? 'none' : '0 4px 0 rgba(0,0,0,0.2)',
        transform: pressed ? 'translateY(3px) scale(0.97)' : 'translateY(0) scale(1)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        ...style,
      }}
    >
      {label}
    </button>
  );
}
