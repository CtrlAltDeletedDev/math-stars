import { Question } from '@/types';
import { CATEGORIES, ALL_QUESTIONS_BY_ID } from '@/data/categories';
import { generateFromParams } from './questionGenerator';
import { shuffleChoices } from './choices';

// A printed sheet is a session like any other, and the same rule applies to it:
// choice order must carry no information.
//
// This lived inside the Worksheet page, where no test could reach it, and it
// rendered `q.choices` in bank order. Banks may list choices however they like
// and overwhelmingly list the correct one first — 354 of the 460 bank questions
// put the answer in slot 0 — so the printed answer was the left-hand box 77% of
// the time. On paper, where she has all the time in the world to spot the
// pattern, and in front of a parent who would reasonably assume the sheet was
// sound.

export const WORKSHEET_QUESTION_COUNT = 20;

function withShuffledChoices(q: Question): Question {
  return { ...q, choices: shuffleChoices(q.choices) };
}

export function generateSheet(levelId: string): Question[] {
  const level = CATEGORIES.flatMap((c) => c.levels).find((l) => l.id === levelId);
  if (!level) return [];

  if (level.generatorParams) {
    const seen = new Set<string>();
    const qs: Question[] = [];
    let attempts = 0;
    while (qs.length < WORKSHEET_QUESTION_COUNT && attempts < 200) {
      attempts++;
      const q = generateFromParams(level.generatorParams, 'You');
      if (!seen.has(q.id)) { seen.add(q.id); qs.push(withShuffledChoices(q)); }
    }
    return qs;
  }

  if (level.questionBankIds) {
    const shuffled = [...level.questionBankIds].sort(() => Math.random() - 0.5);
    return (shuffled
      .slice(0, WORKSHEET_QUESTION_COUNT)
      .map((id) => ALL_QUESTIONS_BY_ID.get(id))
      .filter(Boolean) as Question[])
      .map(withShuffledChoices);
  }

  return [];
}
