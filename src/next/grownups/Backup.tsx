import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, History, Upload } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { todayString } from '@/engine/dates';
import { exportBackup, importBackup, setUsesNewApp } from '../store';
import { backupFileName } from './report';

type Result = { ok: boolean; text: string } | null;

/** Save their progress to a file, bring one back, or go back to the old app. */
export default function Backup() {
  const navigate = useNavigate();
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; text: string } | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [leaving, setLeaving] = useState(false);

  const download = () => {
    try {
      const blob = new Blob([exportBackup()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupFileName(todayString());
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setResult({ ok: true, text: `Saved ${a.download}. Keep it somewhere safe, like your email or files app.` });
    } catch {
      setResult({ ok: false, text: 'This browser would not save the file.' });
    }
  };

  const picked = async (f: File | undefined) => {
    if (!f) return;
    try {
      setPending({ name: f.name, text: await f.text() });
      setResult(null);
    } catch {
      setResult({ ok: false, text: 'That file could not be read.' });
    }
    if (file.current) file.current.value = '';
  };

  const restore = () => {
    if (!pending) return;
    const ok = importBackup(pending.text);
    setResult(ok
      ? { ok: true, text: `Restored their progress from ${pending.name}.` }
      : { ok: false, text: `${pending.name} isn’t a Math Stars backup. Nothing was changed.` });
    setPending(null);
  };

  return (
    <div className="gu-stack">
      <div className="gu-row">
        <button type="button" className="gu-btn" onClick={download}>
          <Download size={18} strokeWidth={ICON_STROKE} />Export backup
        </button>
        <button type="button" className="gu-btn" onClick={() => file.current?.click()}>
          <Upload size={18} strokeWidth={ICON_STROKE} />Import backup
        </button>
        <input
          ref={file} type="file" accept="application/json,.json" hidden
          onChange={(e) => picked(e.target.files?.[0])}
        />
      </div>

      {pending && (
        <div className="gu-panel" role="alertdialog" aria-label="Replace their progress?">
          <p style={{ marginBottom: 10 }}>
            Replace their progress on this device with <b>{pending.name}</b>? What is here now will be overwritten.
          </p>
          <div className="gu-row">
            <button type="button" className="gu-btn primary" onClick={restore}>Replace</button>
            <button type="button" className="gu-btn quiet" onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
      )}
      {result && <div className={result.ok ? 'gu-ok' : 'gu-bad'} role="status">{result.text}</div>}

      <div style={{ marginTop: 8 }}>
        {leaving ? (
          <div className="gu-panel">
            <p style={{ marginBottom: 10 }}>
              The old version opens on this device from now on. Each version keeps its own progress from today,
              so what they do in one won&rsquo;t show in the other.
            </p>
            <div className="gu-row">
              <button type="button" className="gu-btn primary" onClick={() => { setUsesNewApp(false); navigate('/'); }}>
                Go to the old version
              </button>
              <button type="button" className="gu-btn quiet" onClick={() => setLeaving(false)}>Stay here</button>
            </div>
          </div>
        ) : (
          <button type="button" className="gu-btn quiet" onClick={() => setLeaving(true)}>
            <History size={18} strokeWidth={ICON_STROKE} />Go back to the old version on this device
          </button>
        )}
      </div>
    </div>
  );
}
