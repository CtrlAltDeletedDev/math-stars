# Math Stars

A math practice web app for a first grader. Plain **Vite + React 19 + React Router 7**,
TypeScript strict, no framework beyond that. It runs in a browser and installs as a PWA —
there is **no Expo, no React Native, and no native build**. Ignore any older instructions
saying otherwise.

## Commands

```
npm run dev      # local dev server
npm run build    # production build to dist/
npm test         # question-bank + generator invariants (vitest)
npm run check    # tsc --noEmit
```

Run `npm test` and `npm run check` before committing.

## Layout

```
src/
  engine/      question generation, session building, scoring, spaced repetition
  data/        question banks + curriculum definition (categories.ts is the index)
  store/       progress state (React context) and localStorage persistence
  pages/       one component per route
  components/  game/, home/, ui/, category/
  hooks/       audio, speech, session
```

Two tables are the spine:

- `src/data/categories.ts` — every level, each naming either a `questionBankIds` list
  (hand-written) or `generatorParams` (procedurally generated).
- `src/data/topics.ts` — maps all 51 levels onto the 17 skill ladders, one topic per skill.
  `src/data/grades.ts` then says which topics a grade covers and how far up each goes.

The child-facing screens are Home (one Play button + a grid of topics) and
`Topic.tsx` (one Play button + a replay strip). There is no category screen.

## Rules that are easy to get wrong

**Never let choice order reveal the answer.** Question banks may list `choices` in any
order; `buildSession` shuffles them per session. Do not add a shuffle inside a data file,
and never rely on `choices[0]` being anything in particular. `npm test` fails if the
correct answer lands in one slot too often.

**Distractors must be plausible mistakes**, not neighbouring integers. See
`src/engine/questionGenerator.ts` — wrong answers should be the errors a six-year-old
actually makes (off-by-one on a count, adding instead of subtracting, the wrong multiple),
so that picking one tells us something.

**Dates are local, never UTC.** Use `todayString()` / `daysAgoString()` from
`src/engine/dates.ts`. `new Date().toISOString()` gives a UTC date, which rolls over
mid-evening in US time zones and silently breaks streaks. `npm test` guards this.

**Inserting a skill rung means writing a migration.** `SkillState.rung` is a saved
*index* into `Skill.rungs`, so adding a rung anywhere but the top silently moves every
child already above it — she loses her place and re-climbs ground she had. v4 added two
rungs to the bottom of `adding` and `taking-away` and shifts saved rungs by two to
compensate; see `normalizeProgress` in `src/store/storage.ts`. `npm test` guards this.

**The catalogue says what exists; saved state only says what happened.** Nothing derives
*availability* from `progress`. `LevelState` has no `status` and no `unlockedAt` — whether
she passed is derived with `passedLevel()` in `src/engine/scoring.ts`, and level records are
sparse. This is what stops a level added to an existing category rendering as a padlock
forever, so don't reintroduce a stored status.

**Nothing is locked, and nothing is ever finished.** Every topic in her grade is always
tappable and every activity is always replayable. The mastery ring has no complete state
on purpose: at the top of her grade the last segment refills each window
(`src/engine/mastery.ts`). A full bar tells a child she's done with a topic, which is
backwards for maths facts.

**Grade bounds the ladder; it does not drive it.** A parent picks K/1st/2nd, which sets
the topics in scope and each ladder's top rung (`src/data/grades.ts`). Within the band she
still advances on evidence. The ceiling is soft: a blocked promotion increments
`ceilingHits` so the Parent screen can suggest moving her up. `SKILL_TIERS` used to do this
job worse and is gone. A parent can still override scope with Focus Mode
(`progress.practiceFocus`).

**Level play must keep feeding the ladder.** `recordLevelComplete` folds every answer
through `recordSkillAnswer`, routed by `skillForQuestion` so mixed levels credit both
ladders. Without it, categories and skills drift back into two worlds that model the same
maths and never talk — which is the bug this design exists to prevent.

**Record what she actually did.** The first wrong tap gets a kind retry on screen but is
still scored, fed to SRS and fed to the ladder. When it was discarded, guessing scored ~50%
and promoted her into work she couldn't do. Keep "did she find it?" (what she sees) and
"did she know it?" (what is recorded) separate.

**A targeted drill is a level that holds the operation still.** "She's working on +2 this
week" is the most common thing a parent knows. `fixedAddend` / `fixedSubtrahend` on the
generator params vary the starting number instead of both numbers — see the
`steps` category. A normal capped level ("sums to 10") is only ~28% +2 questions.

**This is used by a six-year-old.** Tap targets stay large, text stays readable without
fluent reading, and nothing should ever be able to leave her on a blank screen — the app
is wrapped in an error boundary, so keep it that way.
