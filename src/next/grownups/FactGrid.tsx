import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { FactRecord, FactState, factState } from '@/core/facts';
import { C } from '../theme';
import { addCellId, factDetail, secondsText, subCellId } from './report';
import { INK, STATE_COLOURS } from './styles';

// The 11 × 11 fact grids: every addition fact to 10 + 10, and every
// subtraction fact whose parts are both 10 or less. Tap a square for that fact.

export const STATE_WORDS: Record<FactState, string> = {
  new: 'Not met yet',
  learning: 'Learning',
  slow: 'Getting there',
  fast: 'Knows it',
};

export function Legend() {
  return (
    <div className="gu-legend">
      {(['new', 'learning', 'slow', 'fast'] as const).map((s) => (
        <span key={s}><i style={{ background: STATE_COLOURS[s] }} />{STATE_WORDS[s]}</span>
      ))}
    </div>
  );
}

const N = 11;
const range = Array.from({ length: N }, (_, i) => i);

interface Pop { id: string; row: number; col: number; left: number; top?: number; bottom?: number }

export default function FactGrid({ kind, facts, quick }: {
  kind: 'add' | 'sub';
  facts: Record<string, FactRecord>;
  quick: number;
}) {
  const [pop, setPop] = useState<Pop | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const colour = kind === 'add' ? C.plus : C.minus;
  const idOf = kind === 'add' ? addCellId : subCellId;

  const states = useMemo(
    () => range.map((r) => range.map((c) => factState(facts[idOf(r, c)], quick))),
    [facts, quick, idOf],
  );
  const known = states.flat().filter((s) => s === 'fast').length;
  const learning = states.flat().filter((s) => s === 'learning').length;

  useEffect(() => {
    if (!pop) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t)) return;
      if ((t as HTMLElement).closest?.('button.c')) return;
      setPop(null);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setPop(null); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [pop]);

  const open = (row: number, col: number, el: HTMLElement) => {
    const id = idOf(row, col);
    if (pop?.id === id) { setPop(null); return; }
    const box = wrap.current!.getBoundingClientRect();
    const cell = el.getBoundingClientRect();
    const W = 216;
    const x = cell.left - box.left + cell.width / 2 - W / 2;
    const left = Math.max(0, Math.min(box.width - W, x));
    const y = cell.top - box.top;
    // Lower half of the grid: open above the square so it stays on screen.
    setPop(row > 5
      ? { id, row, col, left, bottom: box.height - y + 6 }
      : { id, row, col, left, top: y + cell.height + 6 });
  };

  const d = pop ? factDetail(facts, pop.id, quick) : null;
  const title = kind === 'add' ? 'Adding' : 'Taking away';

  return (
    <div className="gu-gridbox" ref={wrap} style={{ position: 'relative' }}>
      <div className="cap">
        <h3>{title}</h3>
        <span className="count">{known} known · {learning} learning</span>
      </div>
      <div className="gu-scroll">
        <div className="gu-axis-x">{kind === 'add' ? 'add this →' : 'leaves →'}</div>
        <div className="gu-gridwrap">
          <div className="gu-axis-y"><span>{kind === 'add' ? 'start with →' : 'take away →'}</span></div>
          <div className="gu-grid" role="grid" aria-label={`${title} facts`}>
            <div className="h corner" style={{ background: colour }} aria-hidden>{kind === 'add' ? '+' : '−'}</div>
            {range.map((c) => <div key={`h${c}`} className={`h${pop?.col === c ? ' hi' : ''}`} aria-hidden>{c}</div>)}
            {range.map((r) => [
              <div key={`r${r}`} className={`h${pop?.row === r ? ' hi' : ''}`} aria-hidden>{r}</div>,
              ...range.map((c) => {
                const id = idOf(r, c);
                const s = states[r][c];
                const p = id.match(/^\w+-(\d+)[+-](\d+)$/)!;
                const said = kind === 'add' ? `${p[1]} plus ${p[2]}` : `${p[1]} take away ${p[2]}`;
                return (
                  <button
                    key={id} type="button" className={`c${pop?.id === id ? ' sel' : ''}`}
                    style={{ background: STATE_COLOURS[s] }}
                    aria-label={`${said}: ${STATE_WORDS[s]}`}
                    onClick={(e) => open(r, c, e.currentTarget)}
                  />
                );
              }),
            ])}
          </div>
        </div>
      </div>
      {pop && d && (
        <div
          ref={popRef} className="gu-pop" role="dialog" aria-label={d.text}
          style={{ left: pop.left, top: pop.top, bottom: pop.bottom }}
        >
          <button type="button" className="x" aria-label="Close" onClick={() => setPop(null)}>
            <X size={18} strokeWidth={ICON_STROKE} />
          </button>
          <div className="f">{d.text} = {d.answer}</div>
          <span
            className="pill"
            style={{ background: STATE_COLOURS[d.state], color: d.state === 'fast' ? '#fff' : INK }}
          >
            {STATE_WORDS[d.state]}
          </span>
          {d.seen === 0 ? (
            <p className="muted">She hasn&rsquo;t had this one yet.</p>
          ) : (
            <dl>
              <dt>Seen</dt><dd>{d.seen === 1 ? 'once' : `${d.seen} times`}</dd>
              <dt>Right first try</dt><dd>{d.pctRight}%</dd>
              {d.typicalMs !== null && (<><dt>Typical time</dt><dd>{secondsText(d.typicalMs)}</dd></>)}
              {d.said !== null && (<><dt>Last time said</dt><dd>{d.said}</dd></>)}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
