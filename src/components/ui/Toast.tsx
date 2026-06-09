import { useEffect, useState } from 'react';

interface Props {
  messages: string[];
}

export default function Toast({ messages }: Props) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (messages.length === 0) return;
    setCurrent(0);
    setVisible(true);
  }, [messages]);

  // Auto-hide the current message after 2.5s
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(t);
  }, [visible, current]);

  // After hiding, advance to the next queued message
  useEffect(() => {
    if (!visible && current < messages.length - 1) {
      const t = setTimeout(() => {
        setCurrent((c) => c + 1);
        setVisible(true);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [visible, current, messages.length]);

  if (messages.length === 0 || !visible) return null;

  return (
    <div style={{
      position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(30,30,30,0.92)', color: '#fff', borderRadius: 20,
      padding: '12px 22px', fontFamily: 'Nunito', fontWeight: 800, fontSize: 16,
      zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      animation: 'slideDown 0.3s ease',
      whiteSpace: 'nowrap',
    }}>
      {messages[current]}
    </div>
  );
}
