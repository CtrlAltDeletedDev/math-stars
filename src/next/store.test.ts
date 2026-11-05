import { describe, it, expect, beforeEach } from 'vitest';
import { LEARNER_KEY, getLearner, setLearner, resetLearnerCache, importBackup, exportBackup, saveIssue, usesNewApp, setUsesNewApp } from './store';
import { buildInitialProgress } from '@/store/storage';

// The new app's save. The rules that protect her progress:
//   - the first run on a device brings her across from the old save, once
//   - it never writes, changes or deletes the old save
//   - an unreadable new save is parked, not lost, and she restarts from the old one

const OLD_KEY = 'mathstars_progress_v2';

class MemoryStorage {
  data = new Map<string, string>();
  writes: string[] = [];
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.writes.push(k); this.data.set(k, String(v)); }
  removeItem(k: string) { this.writes.push(k); this.data.delete(k); }
  clear() { this.data.clear(); }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  get length() { return this.data.size; }
}

let storage: MemoryStorage;

function oldSave(rung: number) {
  const p = buildInitialProgress();
  p.characterId = 'cat';
  p.gradeLevel = '1';
  p.skills = { adding: { skillId: 'adding', rung, recent: [], attempts: 10, correct: 8, ceilingHits: 0, demotions: 1 } };
  return JSON.stringify(p);
}

beforeEach(() => {
  storage = new MemoryStorage();
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = storage;
  resetLearnerCache();
});

describe('the new save', () => {
  it('brings her across from the old save the first time, and keeps her place', () => {
    storage.data.set(OLD_KEY, oldSave(4));
    const l = getLearner();
    expect(l.tracks.plus.stage).toBe(4);
    expect(l.profile.characterId).toBe('cat');
    expect(storage.getItem(LEARNER_KEY)).not.toBeNull();
  });

  it('never writes the old save', () => {
    const before = oldSave(4);
    storage.data.set(OLD_KEY, before);
    getLearner();
    setLearner((l) => ({ ...l, profile: { ...l.profile, name: 'Mia' } }));
    expect(storage.writes).not.toContain(OLD_KEY);
    expect(storage.getItem(OLD_KEY)).toBe(before);
  });

  it('migrates once: later changes to the old save are not pulled in again', () => {
    storage.data.set(OLD_KEY, oldSave(2));
    getLearner();
    storage.data.set(OLD_KEY, oldSave(7));
    resetLearnerCache();
    expect(getLearner().tracks.plus.stage).toBe(2);
  });

  it('writes every change straight away', () => {
    getLearner();
    setLearner((l) => ({ ...l, profile: { ...l.profile, walkLength: 20 } }));
    expect(JSON.parse(storage.getItem(LEARNER_KEY)!).profile.walkLength).toBe(20);
  });

  it('parks an unreadable save and starts again from the old one, not from nothing', () => {
    storage.data.set(OLD_KEY, oldSave(5));
    storage.data.set(LEARNER_KEY, '{not json');
    const l = getLearner();
    expect(l.tracks.plus.stage).toBe(5);
    expect(storage.getItem('mathstars_learner_unreadable')).toBe('{not json');
    expect(saveIssue()).toBe('unreadable-backed-up');
  });

  it('round-trips a backup and refuses a file that is not one', () => {
    getLearner();
    setLearner((l) => ({ ...l, profile: { ...l.profile, name: 'Mia' } }));
    const backup = exportBackup();
    setLearner((l) => ({ ...l, profile: { ...l.profile, name: 'Someone else' } }));
    expect(importBackup('{"hello": 1}')).toBe(false);
    expect(getLearner().profile.name).toBe('Someone else');
    expect(importBackup(backup)).toBe(true);
    expect(getLearner().profile.name).toBe('Mia');
  });

  it('says so when it cannot save, instead of failing quietly', () => {
    storage.setItem = () => { throw new Error('QuotaExceededError'); };
    getLearner();
    expect(saveIssue()).toBe('cannot-save');
  });

  it('remembers which app this device opens', () => {
    expect(usesNewApp()).toBe(false);
    setUsesNewApp(true);
    expect(usesNewApp()).toBe(true);
    setUsesNewApp(false);
    expect(usesNewApp()).toBe(false);
  });
});
