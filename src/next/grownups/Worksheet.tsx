import { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { ICON_STROKE } from '@/components/ui/icons';
import { todayString } from '@/engine/dates';
import { Learner } from '@/core/learner';
import { shortDate, worksheet } from './report';

// Twenty sums on paper, for the kitchen table: big print, a box for each
// answer, and the answers on a page of their own.

const sign = (op: '+' | '-') => (op === '+' ? '+' : '−');

export default function Worksheet({ learner, onClose }: { learner: Learner; onClose: () => void }) {
  const today = todayString();
  const [items] = useState(() => worksheet(learner, today));

  useEffect(() => {
    // After the page has painted, so the dialog shows the sheet and not the report.
    const id = window.setTimeout(() => { try { window.print(); } catch { /* the buttons still work */ } }, 400);
    return () => window.clearTimeout(id);
  }, []);

  const name = learner.profile.name.trim();
  return (
    <div className="gu gu-sheet">
      <div className="bar gu-noprint">
        <button type="button" className="gu-btn quiet" onClick={onClose}>
          <ArrowLeft size={18} strokeWidth={ICON_STROKE} />Back
        </button>
        <button type="button" className="gu-btn primary" onClick={() => window.print()}>
          <Printer size={18} strokeWidth={ICON_STROKE} />Print
        </button>
      </div>
      <h1>{name ? `${name}’s sums` : 'My sums'}</h1>
      <div className="meta">{shortDate(today)} · Name: ____________________</div>
      <div className="gu-sums">
        {items.map((s, i) => (
          <div key={s.id} className="gu-sum">
            <span className="k">{i + 1}</span>
            <span className="e">{s.a} {sign(s.op)} {s.b} =</span>
            <span className="box" aria-label="answer box" />
          </div>
        ))}
      </div>
      <section className="gu-key">
        <h2>Answers</h2>
        <ol>
          {items.map((s) => (
            <li key={s.id}>{s.a} {sign(s.op)} {s.b} = <b>{s.answer}</b></li>
          ))}
        </ol>
      </section>
    </div>
  );
}
