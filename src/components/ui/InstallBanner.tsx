import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'mathstars_install_dismissed';

function isIOS(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac, so the touch check is what catches iPads.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

/**
 * Two different worlds:
 *
 * Chrome fires `beforeinstallprompt` and we can install in one tap. Safari never
 * fires it and has no install API at all — which meant this banner was dead code
 * on the one device most likely to be used, with no instructions anywhere. iOS
 * now gets the Share → Add to Home Screen steps instead.
 */
export default function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [gone, setGone] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; }
  });
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    if (isIOS() && !isStandalone()) setIos(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    setGone(true);
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* private mode */ }
  }

  if (gone || isStandalone()) return null;
  if (!prompt && !ios) return null;

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setPrompt(null);
    else dismiss();
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.22)', borderRadius: 16,
      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ flex: 1, fontFamily: 'Nunito', fontWeight: 700, fontSize: 13.5, color: '#fff', lineHeight: 1.35 }}>
        {prompt
          ? '📲 Add to Home Screen for the full app experience!'
          : '📲 Add to Home Screen: tap Share, then "Add to Home Screen"'}
      </div>
      {prompt && (
        <button
          onClick={handleInstall}
          style={{
            background: '#fff', border: 'none', borderRadius: 10,
            padding: '7px 14px', fontFamily: 'Nunito', fontWeight: 800,
            fontSize: 14, color: '#4A90E2', cursor: 'pointer', flexShrink: 0,
          }}
        >Install</button>
      )}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          background: 'transparent', border: 'none', padding: '4px 6px',
          fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer', flexShrink: 0,
        }}
      >✕</button>
    </div>
  );
}
