import { UserProgress } from '@/types';
import { FactRecord, TOP_BOX } from './facts';
import { LEARNER_SCHEMA, Learner, newLearner } from './learner';
import { Grade, TrackId, topStage } from './stages';
import { TrackState } from './track';

// Bringing her over from the old app.
//
// The old save is read with the old normaliser (any version 2-7 arrives as
// v7), and only what means something here is carried: where she stands on
// adding and taking away, the facts she has been practising, her streak, her
// character and grade and settings. Stars, badges, stickers, levels and the
// other topics stay in the old save, which is never written or deleted -- so
// switching back loses nothing.
//
// Stages are the old rungs, index for index (core.test.ts guards it), so her
// place moves straight across.

const OLD_SKILL: Record<TrackId, string> = { plus: 'adding', minus: 'taking-away' };

/** The old SRS ids that are one of our facts, written the way facts are. */
export function factIdFromLegacy(id: string): string | null {
  let m = id.match(/^add-(\d+)\+(\d+)$/);
  if (m) return id;
  m = id.match(/^sub-(\d+)-(\d+)$/);
  if (m && Number(m[1]) >= Number(m[2])) return id;
  m = id.match(/^cnt-(\d+)\+(\d+)$/); // Number Tricks' counting on: the same sum
  if (m) return `add-${m[1]}+${m[2]}`;
  m = id.match(/^dbl-(\d+)$/); // Number Tricks' doubles
  if (m) return `add-${m[1]}+${m[1]}`;
  return null;
}

export function migrateLegacy(old: UserProgress | null, now = Date.now()): Learner {
  const l = newLearner();
  if (!old) return l;

  for (const track of ['plus', 'minus'] as TrackId[]) {
    const s = old.skills?.[OLD_SKILL[track]];
    if (!s) continue;
    const stage = Math.max(0, Math.min(Number.isInteger(s.rung) ? s.rung : 0, topStage(track)));
    const t: TrackState = {
      stage,
      recent: Array.isArray(s.recent) ? s.recent.filter((r) => typeof r === 'boolean').slice(-8) : [],
      ceilingHits: s.ceilingHits ?? 0,
      // No dates for stones she passed in the old app: we don't know when, and
      // stamping today made the grown-ups screen say she moved up four steps
      // today. The path still shows them passed -- everything below where she
      // stands is (passedStones).
      passed: {},
    };
    // Kept absent when the old save never counted: see TrackState.demotions.
    if (typeof s.demotions === 'number') t.demotions = s.demotions;
    l.tracks[track] = t;
  }

  for (const card of Object.values(old.srsCards ?? {})) {
    const id = factIdFromLegacy(card.questionId);
    if (!id || l.facts[id]) continue;
    const reps = Math.max(0, Math.floor(card.repetitions ?? 0));
    const f: FactRecord = {
      // An old card is a fact she has met; repetitions is how many times in a
      // row she got it, which is the nearest thing it has to a box.
      seen: Math.max(1, reps),
      right: reps,
      box: Math.min(TOP_BOX, reps),
      due: Number.isFinite(card.nextDueDate) ? card.nextDueDate : now,
      recent: [],
    };
    l.facts[id] = f;
  }

  const grade: Grade = old.gradeLevel === 'K' || old.gradeLevel === '2' ? old.gradeLevel : '1';
  l.profile = {
    ...l.profile,
    characterId: old.characterId ?? null,
    grade,
    readAloud: old.autoReadEnabled !== false,
  };
  l.streak = {
    current: old.currentStreak ?? 0,
    best: Math.max(old.longestStreak ?? 0, old.currentStreak ?? 0),
    last: old.lastPlayedDate ?? '',
  };
  for (const d of old.playHistory ?? []) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) l.days[d] ??= { answered: 0, right: 0, walks: 0 };
  }
  l.migratedFrom = old.version ?? null;
  l.schema = LEARNER_SCHEMA;
  return l;
}
