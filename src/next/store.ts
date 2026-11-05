import { useSyncExternalStore } from 'react';
import { Learner } from '@/core/learner';
import { migrateLegacy } from '@/core/migrate';
import { parseLearner } from '@/core/validate';
import { loadProgressResult } from '@/store/storage';

// The new app's save: one learner, one key, written on every change.
//
// It never writes the old app's key (`mathstars_progress_v2`). The first time
// it runs on a device it *reads* the old save and brings them across; after
// that the old save just sits there, untouched, so switching back to the old
// app finds everything exactly as they left it.
//
// Writes are synchronous. The whole learner is a few tens of KB, and a
// debounced save is what loses the last answer when Safari kills a tab.

export const LEARNER_KEY = 'mathstars_learner_v1';
const UNREADABLE_KEY = 'mathstars_learner_unreadable';
/**
 * Which app this device opens. The new one is the default; 'old' records a
 * grown-up's choice to go back to the old app on this device. ('next' was the
 * opt-in value while the new app was behind a switch; it still means new.)
 */
export const SHELL_KEY = 'mathstars_shell';

export type SaveIssue = null | 'cannot-save' | 'unreadable-backed-up';

let learner: Learner | null = null;
let issue: SaveIssue = null;
const listeners = new Set<() => void>();

function read(): Learner {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEARNER_KEY);
  } catch {
    issue = 'cannot-save';
  }
  if (raw) {
    try {
      const parsed = parseLearner(JSON.parse(raw));
      if (parsed) return parsed;
    } catch { /* fall through to the backup below */ }
    // Unreadable. Park it rather than lose it, then start again from the old
    // save -- which still holds their place -- instead of from nothing.
    try { localStorage.setItem(UNREADABLE_KEY, raw); issue = 'unreadable-backed-up'; } catch { /* nothing more to do */ }
  }
  const old = loadProgressResult();
  return migrateLegacy(old.ok ? old.progress : null);
}

function write(l: Learner) {
  try {
    localStorage.setItem(LEARNER_KEY, JSON.stringify(l));
    if (issue === 'cannot-save') issue = null;
  } catch {
    issue = 'cannot-save';
  }
}

export function getLearner(): Learner {
  if (!learner) {
    learner = read();
    write(learner);
  }
  return learner;
}

export function setLearner(next: Learner | ((l: Learner) => Learner)) {
  const value = typeof next === 'function' ? next(getLearner()) : next;
  learner = value;
  write(value);
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function useLearner(): Learner {
  return useSyncExternalStore(subscribe, getLearner, getLearner);
}

export function saveIssue(): SaveIssue {
  return issue;
}

/** For tests: forget the in-memory copy so the next read goes to storage. */
export function resetLearnerCache() {
  learner = null;
  issue = null;
}

// --- Which app this device opens -------------------------------------------

export function usesNewApp(): boolean {
  try { return localStorage.getItem(SHELL_KEY) !== 'old'; } catch { return true; }
}

export function setUsesNewApp(on: boolean) {
  try {
    if (on) localStorage.removeItem(SHELL_KEY);
    else localStorage.setItem(SHELL_KEY, 'old');
  } catch { /* the choice just won't stick; both apps still work */ }
}

// --- Backup ---------------------------------------------------------------

export function exportBackup(): string {
  return JSON.stringify(getLearner(), null, 2);
}

/** Replace their save from a backup file. Returns false if the file is not one. */
export function importBackup(text: string): boolean {
  try {
    const parsed = parseLearner(JSON.parse(text));
    if (!parsed) return false;
    setLearner(parsed);
    return true;
  } catch {
    return false;
  }
}
