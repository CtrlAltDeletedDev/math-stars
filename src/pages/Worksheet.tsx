import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '@/data/categories';
import { Question } from '@/types';
import { generateSheet, WORKSHEET_QUESTION_COUNT } from '@/engine/worksheet';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import { ICON_CENTER, ICON_STROKE } from '@/components/ui/icons';

/** The school sheet's 0–20 line, printed blank for her to draw hops on. */
function PrintedNumberLine({ max }: { max: number }) {
  const pad = 14, unit = 22, w = pad * 2 + unit * max;
  return (
    <svg viewBox={`0 0 ${w} 40`} style={{ width: '100%', maxWidth: 480, margin: '6px 0' }} aria-hidden="true">
      <line x1={pad - 8} y1={14} x2={w - pad + 8} y2={14} stroke="#555" strokeWidth="1.5" />
      {Array.from({ length: max + 1 }, (_, n) => (
        <g key={n}>
          <line x1={pad + n * unit} y1={9} x2={pad + n * unit} y2={19} stroke="#555" strokeWidth={n % 5 === 0 ? 1.8 : 1} />
          <text x={pad + n * unit} y={34} textAnchor="middle" style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, fill: '#444' }}>{n}</text>
        </g>
      ))}
    </svg>
  );
}

export default function Worksheet() {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState('');
  const [questions, setQuestions] = useState<Question[] | null>(null);

  function handleGenerate() {
    if (!selectedLevel) return;
    setQuestions(generateSheet(selectedLevel));
  }

  return (
    <BackgroundGradient colors={['#5C6BC0', '#283593']}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 16, overflow: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/parent')}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, width: 44, height: 44, cursor: 'pointer', color: '#fff' }}
            aria-label="Back"
          ><ArrowLeft size={24} strokeWidth={ICON_STROKE} style={ICON_CENTER} aria-hidden /></button>
          <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 24, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={26} strokeWidth={ICON_STROKE} aria-hidden /> Worksheet Generator
          </div>
        </div>

        {!questions ? (
          <>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.85)' }}>
              Choose a level to generate a printable practice sheet with {WORKSHEET_QUESTION_COUNT} questions.
            </div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              style={{
                borderRadius: 14, padding: '14px 16px', border: 'none', fontFamily: 'Nunito',
                fontWeight: 700, fontSize: 16, background: '#fff', color: '#333', width: '100%',
              }}
            >
              <option value="">— Select a level —</option>
              {CATEGORIES.map((cat) => (
                <optgroup key={cat.id} label={`${cat.emoji} ${cat.title}`}>
                  {cat.levels.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <BigButton onPress={handleGenerate} label="Generate Worksheet" icon={<FileText size={22} strokeWidth={ICON_STROKE} aria-hidden />} disabled={!selectedLevel} />
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12 }}>
              <BigButton onPress={() => window.print()} label="Print" icon={<Printer size={22} strokeWidth={ICON_STROKE} aria-hidden />} color="rgba(255,255,255,0.25)" style={{ flex: 1 }} />
              <BigButton onPress={() => setQuestions(null)} label="Back" icon={<ArrowLeft size={22} strokeWidth={ICON_STROKE} aria-hidden />} color="rgba(255,255,255,0.15)" style={{ flex: 1 }} />
            </div>

            <div
              id="print-sheet"
              style={{
                background: '#fff', borderRadius: 20, padding: '24px 28px',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px',
              }}
            >
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  style={{
                    borderBottom: '1px solid #eee', paddingBottom: 12,
                    // A story with a number line needs the full width to be usable on paper.
                    gridColumn: q.visual?.kind === 'numberLine' ? '1 / -1' : undefined,
                    breakInside: 'avoid',
                  }}
                >
                  <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#333', marginBottom: 4, whiteSpace: 'pre-line' }}>
                    {i + 1}. {q.prompt}
                  </div>
                  {q.visual?.kind === 'numberLine' && <PrintedNumberLine max={q.visual.max} />}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {q.choices.map((c) => (
                      <div key={c} style={{
                        border: '1.5px solid #ccc', borderRadius: 8, padding: '4px 12px',
                        fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#555',
                      }}>{c}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-sheet, #print-sheet * { visibility: visible; }
          #print-sheet { position: fixed; inset: 0; border-radius: 0; padding: 32px; }
        }
      `}</style>
    </BackgroundGradient>
  );
}
