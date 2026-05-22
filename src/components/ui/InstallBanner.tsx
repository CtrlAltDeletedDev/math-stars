import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!prompt || gone) return null;

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setPrompt(null);
    else setGone(true);
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.22)', borderRadius: 16,
      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1, fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#fff' }}>
        📲 Add to Home Screen for the full app experience!
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: '#fff', border: 'none', borderRadius: 10,
          padding: '7px 14px', fontFamily: 'Nunito', fontWeight: 800,
          fontSize: 14, color: '#4A90E2', cursor: 'pointer', flexShrink: 0,
        }}
      >Install</button>
      <button
        onClick={() => setGone(true)}
        style={{
          background: 'transparent', border: 'none', padding: '4px 6px',
          fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer', flexShrink: 0,
        }}
      >✕</button>
    </div>
  );
}
