import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '@/data/categories';
import { generateFromParams } from '@/engine/questionGenerator';
import { ALL_QUESTIONS_BY_ID } from '@/data/categories';
import { Question } from '@/types';
import BackgroundGradient from '@/components/ui/BackgroundGradient';
import BigButton from '@/components/ui/BigButton';

function generateSheet(levelId: string): Question[] {
  const level = CATEGORIES.flatMap((c) => c.levels).find((l) => l.id === levelId);
  if (!level) return [];

  if (level.generatorParams) {
    const seen = new Set<string>();
    const qs: Question[] = [];
    let attempts = 0;
    while (qs.length < 20 && attempts < 200) {
      attempts++;
      const q = generateFromParams(level.generatorParams, 'You');
      if (!seen.has(q.id)) { seen.add(q.id); qs.push(q); }
    }
    return qs;
  }

  if (level.questionBankIds) {
    const shuffled = [...level.questionBankIds].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 20).map((id) => ALL_QUESTIONS_BY_ID.get(id)).filter(Boolean) as Question[];
  }

  return [];
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
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 12, width: 44, height: 44, fontSize: 22, cursor: 'pointer', color: '#fff' }}
          >←</button>
          <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 24, color: '#fff' }}>📄 Worksheet Generator</div>
        </div>

        {!questions ? (
          <>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.85)' }}>
              Choose a level to generate a printable practice sheet with 20 questions.
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
            <BigButton onPress={handleGenerate} label="Generate Worksheet 📄" disabled={!selectedLevel} />
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12 }}>
              <BigButton onPress={() => window.print()} label="🖨️ Print" color="rgba(255,255,255,0.25)" style={{ flex: 1 }} />
              <BigButton onPress={() => setQuestions(null)} label="← Back" color="rgba(255,255,255,0.15)" style={{ flex: 1 }} />
            </div>

            <div
              id="print-sheet"
              style={{
                background: '#fff', borderRadius: 20, padding: '24px 28px',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px',
              }}
            >
              {questions.map((q, i) => (
                <div key={q.id} style={{ borderBottom: '1px solid #eee', paddingBottom: 12 }}>
                  <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#333', marginBottom: 4 }}>
                    {i + 1}. {q.prompt}
                  </div>
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
