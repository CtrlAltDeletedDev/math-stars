import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

// The app, its comments and its docs never use gendered pronouns for the child
// (or anyone else): the child is "they", "you" or "the child", and story
// characters are named every time. This walks every source file and fails,
// listing file:line, on any whole-word match.

const ROOT = process.cwd();
// This file has to spell the pronouns out to look for them, so it is the one
// file the walk skips.
const SELF = join(ROOT, 'src', 'neutral.test.ts');
const PRONOUNS = ['she', 'her', 'hers', 'herself', 'he', 'him', 'his', 'himself'];
const WORD = new RegExp(`\\b(?:${PRONOUNS.join('|')})\\b`, 'i');

// Allowlist, deliberately narrow: a line that DEFINES a pronoun-checking
// pattern (two or more pronouns joined by "|" in a regex literal or RegExp
// call), such as the guards in course.test.ts and storyProblems.test.ts. Those
// lines have to name the pronouns they forbid. Nothing else is exempt.
const ALT = new RegExp(`\\b(?:${PRONOUNS.join('|')})\\|(?:${PRONOUNS.join('|')})\\b`, 'i');
const DEFINES_CHECK = new RegExp(`RegExp|/\\\\b\\(`);
const allowed = (line: string) => ALT.test(line) && DEFINES_CHECK.test(line);

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css)$/.test(name) && p !== SELF) out.push(p);
  }
}

function files(): string[] {
  const out: string[] = [];
  walk(join(ROOT, 'src'), out);
  const docs = join(ROOT, 'docs');
  if (existsSync(docs)) {
    for (const name of readdirSync(docs)) if (name.endsWith('.md')) out.push(join(docs, name));
  }
  for (const name of ['README.md', 'CLAUDE.md']) if (existsSync(join(ROOT, name))) out.push(join(ROOT, name));
  return out;
}

describe('gender-neutral wording', () => {
  it('uses no gendered pronouns in code, comments, tests or docs', () => {
    const found: string[] = [];
    for (const file of files()) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (WORD.test(line) && !allowed(line)) found.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 100)}`);
      });
    }
    expect(found, `gendered pronouns found:\n${found.join('\n')}`).toEqual([]);
  });
});
