import { FactRecord, TOP_BOX } from './facts';
import { DayRecord, LEARNER_SCHEMA, Learner, Profile, newLearner } from './learner';
import { TRACKS, TrackId, topStage } from './stages';
import { TrackState } from './track';

// Reading a saved learner back without trusting it.
//
// A backup file is chosen by a grown-up and can be anything; a damaged save is
// rare but real. Repair what can be repaired -- her stage is the valuable part
// -- and drop what cannot, so nothing here can crash a screen behind her.

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const nat = (v: unknown, d = 0) => Math.max(0, Math.floor(num(v, d)));
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

export function parseLearner(raw: unknown): Learner | null {
  if (!isObj(raw) || raw.schema !== LEARNER_SCHEMA) return null;
  const base = newLearner();

  const p = isObj(raw.profile) ? raw.profile : {};
  const profile: Profile = {
    name: typeof p.name === 'string' ? p.name.slice(0, 40) : '',
    characterId: typeof p.characterId === 'string' ? p.characterId : null,
    grade: p.grade === 'K' || p.grade === '2' ? p.grade : '1',
    readAloud: p.readAloud !== false,
    sound: p.sound !== false,
    walkLength: p.walkLength === 20 ? 20 : 10,
    pictures: p.pictures === 'always' || p.pictures === 'off' ? p.pictures : 'auto',
    pin: typeof p.pin === 'string' && /^\d{4}$/.test(p.pin) ? p.pin : null,
    dailyWalks: Math.min(10, Math.max(1, nat(p.dailyWalks, 3))),
  };

  const tracks = { ...base.tracks };
  const rt = isObj(raw.tracks) ? raw.tracks : {};
  for (const id of TRACKS) {
    const t = rt[id];
    if (!isObj(t)) continue;
    const passed: Record<number, string> = {};
    if (isObj(t.passed)) for (const [k, v] of Object.entries(t.passed)) if (isDay(v) && /^\d+$/.test(k)) passed[Number(k)] = v;
    const state: TrackState = {
      stage: Math.min(nat(t.stage), topStage(id)),
      recent: Array.isArray(t.recent) ? t.recent.filter((r): r is boolean => typeof r === 'boolean').slice(-8) : [],
      ceilingHits: nat(t.ceilingHits),
      passed,
    };
    if (typeof t.demotions === 'number' && t.demotions >= 0) state.demotions = Math.floor(t.demotions);
    tracks[id] = state;
  }

  const facts: Record<string, FactRecord> = {};
  if (isObj(raw.facts)) {
    for (const [id, f] of Object.entries(raw.facts)) {
      if (!/^(add-\d+\+\d+|sub-\d+-\d+)$/.test(id) || !isObj(f)) continue;
      const seen = nat(f.seen);
      facts[id] = {
        seen,
        right: Math.min(nat(f.right), seen),
        box: Math.min(TOP_BOX, nat(f.box)),
        due: num(f.due, 0),
        recent: Array.isArray(f.recent)
          ? f.recent.filter((r): r is { day: string; ms: number } => isObj(r) && isDay(r.day) && typeof r.ms === 'number' && r.ms > 0).slice(-3)
          : [],
        ...(typeof f.said === 'string' ? { said: f.said.slice(0, 6) } : {}),
        ...(typeof f.tag === 'string' ? { tag: f.tag as FactRecord['tag'] } : {}),
      };
    }
  }

  const days: Record<string, DayRecord> = {};
  if (isObj(raw.days)) {
    for (const [d, r] of Object.entries(raw.days)) {
      if (!isDay(d) || !isObj(r)) continue;
      const answered = nat(r.answered);
      days[d] = { answered, right: Math.min(nat(r.right), answered), walks: nat(r.walks) };
    }
  }

  const f = raw.focus;
  const focusTrack: TrackId | null = isObj(f) && (f.track === 'plus' || f.track === 'minus') ? f.track : null;
  const focus = isObj(f) && focusTrack && isDay(f.until)
    ? { track: focusTrack, stage: Math.min(nat(f.stage), topStage(focusTrack)), until: f.until }
    : null;

  const lessons: Learner['lessons'] = {};
  if (isObj(raw.lessons)) {
    for (const [id, r] of Object.entries(raw.lessons)) {
      if (!/^[a-z0-9-]{1,60}$/.test(id) || !isObj(r)) continue;
      lessons[id] = {
        tries: nat(r.tries),
        best: Math.max(0, Math.min(1, num(r.best, 0))),
        done: isDay(r.done) ? r.done : null,
        last: isDay(r.last) ? r.last : '',
      };
    }
  }

  const s = isObj(raw.streak) ? raw.streak : {};
  return {
    schema: LEARNER_SCHEMA,
    profile,
    lessons,
    pinnedLesson: typeof raw.pinnedLesson === 'string' && /^[a-z0-9-]{1,60}$/.test(raw.pinnedLesson) ? raw.pinnedLesson : null,
    tracks,
    facts,
    days,
    focus,
    streak: { current: nat(s.current), best: nat(s.best), last: isDay(s.last) ? s.last : '' },
    migratedFrom: typeof raw.migratedFrom === 'number' ? raw.migratedFrom : null,
  };
}
