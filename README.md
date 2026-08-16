# Math Stars ⭐

A math practice web app for a first grader. Open it in a browser, or add it to the home
screen on a tablet and it behaves like an app.

Built with Vite + React + TypeScript. No accounts, no server, no tracking — all progress
lives in the browser's local storage on the device.

---

## Running it

```
npm install
npm run dev        # http://localhost:5173
```

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Question-bank and generator invariants |
| `npm run check` | TypeScript, no emit |

---

## Deploying

Pushing to **`main`** runs `.github/workflows/deploy.yml`, which typechecks, tests, builds,
and publishes `dist/` to the `gh-pages` branch. GitHub Pages serves that branch.

The build uses a **relative asset base**, so it works from a project-site subpath
(`/math-stars/`), a custom domain, or a local preview without changes.

---

## Putting it on a tablet

**iPad / iPhone —** open the site in Safari, tap the Share button, then **Add to Home
Screen**. It launches full-screen with no browser chrome. (Safari does not offer an
automatic install prompt, so this has to be done by hand once.)

**Android —** Chrome shows an install banner in the app itself; tap **Install**.

---

## What's in it

| Category | What it covers |
|---|---|
| ➕ Addition & Subtraction | Adding to 5 → 10 → 20, taking away, mixed |
| 🔢 Counting & Numbers | Counting objects, ordering, comparing |
| 🔗 Number Bonds | Pairs that make 5, 10, 20 |
| 🧩 Missing Number | `3 + ? = 7` and the subtraction version |
| 👨‍👩‍👧 Fact Families | How addition and subtraction relate |
| ⚖️ Comparing Numbers | Using `<`, `>`, `=` |
| 🔢 Place Value | Ones and tens, building and comparing numbers |
| 🟰 Even & Odd | Identifying and finding even/odd numbers |
| 🔷 Shapes & Patterns | Shape names, repeating and number patterns |
| 📏 Measurement & Money | Longer/shorter, coins |
| 🕐 Telling Time | O'clock, half past, mixed |
| 🚀 Skip Counting | By 2s, 5s, 10s (plus times tables) |

**Features**

- Pick an animal friend who cheers you on and levels up as you earn stars
- Read-aloud on every question, plus voice answers where the browser supports it
- A gentle retry — the first wrong tap doesn't count against you
- Hints after wrong answers, and short illustrated lessons before most levels
- Stars, 15 badges, 28 stickers, and a shop for background themes
- Daily challenge, daily question goal, and a play streak
- Spaced repetition, so questions you get wrong come back sooner
- A parent dashboard (triple-tap the title on the home screen) with per-level stats,
  a printable worksheet generator, and progress export/import

---

## How it fits together

```
src/
  engine/      question generation, session building, scoring, spaced repetition
  data/        question banks + the curriculum (categories.ts is the index)
  store/       progress state and localStorage persistence
  pages/       one component per route
  components/  game/, home/, ui/, category/
  hooks/       audio, speech, session
```

To add or change questions, start in `src/data/categories.ts`. Each level either lists
`questionBankIds` (hand-written questions from a bank file) or `generatorParams`
(procedurally generated). See `CLAUDE.md` for the invariants the tests enforce.
