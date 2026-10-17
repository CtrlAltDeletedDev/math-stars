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
- `src/data/topics.ts` — maps all 62 levels onto the 17 skill ladders, one topic per skill.
  `src/data/grades.ts` then says which topics a grade covers and how far up each goes.

The child-facing screens are Home (one Play button + a grid of topics),
`Topic.tsx` (one Play button, a suggested lesson, a lessons strip, a replay strip) and
`Learn.tsx` (the lesson player). There is no category screen.

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

**Every mode reads the ladders, not the category list.** Play passes no levels, so anything
built from category history goes stale for the child who only uses the main button — the Daily
Challenge was ten `n + 1`s a day for her. The Daily Challenge, Master Mode and Quick Review deal
from her serving rung (`src/engine/sessionBuilder.ts`), "Next" after a level is
`nextLevelInTopic`, and any badge or sticker that rewards passing levels also accepts the same
progress from `ladderProgress` (`src/engine/rewards.ts`). `sessions.test.ts` and
`rewards.test.ts` guard this.

**Placement is the fast lane, not a test.** Until a topic first moves her down, her first 4
answers at a rung all right promote her (`LADDER.fastLane` in `src/engine/skillLadder.ts`); the
first demotion closes it for good. Only `demotions === 0` opens it: a save from before
`SkillState.demotions` existed has no evidence she was never moved down, so `normalizeProgress`
must not default the field to 0.

**Play is rounds, not a stream.** `chooseRoundSkills` gives each round of ten two topics she can
climb plus one for variety, and `roundPlan` asks them A B A B C A B A B C so each main topic gets
a full fast-lane window. Spreading every pick over every topic in her grade is the old behaviour:
about 1 question in 16 per topic, so nothing ever moved within a sitting. The round ends on
`RoundCard`, which never shows a full or finished state.

**Lesson offers are rare on purpose.** Play offers a lesson between questions on a demotion, or the
same tagged mistake twice on a topic in a round (`src/engine/lessonOffer.ts`): once per topic per
sitting, never above her grade, and for a repeated mistake only a lesson written for that mistake.

**Record what she actually did.** The first wrong tap gets a kind retry on screen but is
still scored, fed to SRS and fed to the ladder. When it was discarded, guessing scored ~50%
and promoted her into work she couldn't do. Keep "did she find it?" (what she sees) and
"did she know it?" (what is recorded) separate.

**A targeted drill is a level that holds the operation still.** "She's working on +2 this
week" is the most common thing a parent knows. `fixedAddend` / `fixedSubtrahend` on the
generator params vary the starting number instead of both numbers — see the
`steps` category. A normal capped level ("sums to 10") is only ~28% +2 questions.

**Story problems must not be solvable without reading.** `src/data/storyProblems.ts` covers
every first-grade story shape within 20 (some-and-the-rest, how many more, fewer than, still
needs). Every level that is mostly take-away stories mixes in some putting-together stories,
"which number sentence" questions offer exactly one sentence that solves to the answer, and no
story uses a pronoun for its characters (names are repeated). `storyProblems.test.ts` solves
every question independently.

**Lessons are spoken, pictured and unscored.** `src/data/learn.ts` holds lessons as data:
"watch" steps (narration + an animated picture from `components/learn/LessonScene.tsx`) and
"try" steps (choices shuffled at render, a hint written for every wrong choice, then the picture
plays through to the answer). Nothing in a lesson touches stars, the ladder or the SRS — it is
where she is allowed to be wrong. Speech starts from tap handlers only (iPad Safari blocks it
otherwise). The old text slides in `lessons.ts` play through the same player as `read-<levelId>`.
`learn.test.ts` checks every marked answer against the arithmetic and the picture.

**UI icons are Lucide, content is emoji.** Controls and status icons (close, back, read-aloud,
play, hint, lock, print…) come from `lucide-react` with `ICON_STROKE` from
`src/components/ui/icons.ts`; `BigButton` takes an `icon` prop. Her character, topic pictures,
story objects and celebration stars stay emoji. Math diagrams (number lines, ten frames, clocks,
fractions) stay hand-drawn SVG because they carry the numbers.

**This is used by a six-year-old.** Tap targets stay large, text stays readable without
fluent reading, and nothing should ever be able to leave her on a blank screen — the app
is wrapped in an error boundary, so keep it that way.
