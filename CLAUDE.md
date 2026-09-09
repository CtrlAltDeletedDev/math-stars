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

`src/data/categories.ts` is the spine: it defines every category and level, and each level
either names a `questionBankIds` list (hand-written questions) or `generatorParams`
(procedurally generated ones).

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

**Practice is gated, not a free-for-all.** `SKILL_TIERS` in `src/data/skills.ts` decides
which skills endless practice may draw from, keyed off how far she has climbed on adding
or taking away. Without it a five-year-old gets fractions and the seven times table in
her first session. A parent can override the whole thing with Focus Mode
(`progress.practiceFocus`).

**A targeted drill is a level that holds the operation still.** "She's working on +2 this
week" is the most common thing a parent knows. `fixedAddend` / `fixedSubtrahend` on the
generator params vary the starting number instead of both numbers — see the
`steps` category. A normal capped level ("sums to 10") is only ~28% +2 questions.

**This is used by a six-year-old.** Tap targets stay large, text stays readable without
fluent reading, and nothing should ever be able to leave her on a blank screen — the app
is wrapped in an error boundary, so keep it that way.
