import { useState } from 'react';
import { ModelState } from '../types';
import Model from './Model';
import { GALLERY_A } from './gallery-a';
import { GALLERY_B } from './gallery-b';
import { C, KID_FONT } from '@/next/theme';

// Every model, shown as a picture and as something to play with, at both sizes.
// For the people building and checking them, at /#/next/gallery.

export interface GalleryEntry {
  title: string;
  state: ModelState;
  /** Shown interactive as well as view-only. */
  interactive?: boolean;
}

function Live({ entry }: { entry: GalleryEntry }) {
  const [state, setState] = useState(entry.state);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Model state={state} onChange={setState} />
      <code style={{ fontSize: 11, color: C.inkSoft, wordBreak: 'break-all' }}>{JSON.stringify(state)}</code>
    </div>
  );
}

export default function Gallery() {
  const entries = [...GALLERY_A, ...GALLERY_B];
  return (
    <div style={{ height: '100dvh', overflowY: 'auto', background: C.paper, fontFamily: KID_FONT, padding: 16, boxSizing: 'border-box' }}>
      {entries.length === 0 && <p>No models yet.</p>}
      {entries.map((e, i) => (
        <section key={i} data-gallery={e.title} style={{ background: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{e.title}</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div><div style={{ fontSize: 12, color: C.inkSoft }}>picture · small</div><Model state={e.state} size="small" /></div>
            <div><div style={{ fontSize: 12, color: C.inkSoft }}>picture · big</div><Model state={e.state} /></div>
          </div>
          {e.interactive && <div><div style={{ fontSize: 12, color: C.inkSoft }}>her turn (tap / drag)</div><Live entry={e} /></div>}
        </section>
      ))}
    </div>
  );
}
