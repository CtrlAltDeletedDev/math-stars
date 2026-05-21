# Math Stars ⭐

A math learning app built for kids going into 1st grade. Runs on iPad via Expo Go.

---

## How to run on her iPad

The app is published to Expo's servers. Expo Go on the iPad downloads it from there — no computer, no server, no tunnel needed.

---

### One-time setup

**On the iPad — install Expo Go:**
1. Open the App Store
2. Search **Expo Go** (by Expo Project) and install it — it's free

**Somewhere with a terminal (Codespace, any computer, etc.):**

```bash
npm install -g eas-cli
eas login
```

This will ask for your Expo username and password. Sign up free at **expo.dev** if you don't have an account.

```bash
eas update:configure
```

This links the project to your Expo account. It will add a `projectId` to `app.json` — commit and push that change.

```bash
eas update --branch production --message "first release"
```

This uploads the app to Expo's servers. When it finishes it will print something like:

```
🚀 Published!
https://expo.dev/accounts/YOUR_USERNAME/projects/math-stars/updates/...
```

---

### Opening the app on the iPad

1. Open **Expo Go** on the iPad
2. Tap **"Enter URL manually"** at the bottom of the screen
3. Type: `exp://exp.host/@YOUR_USERNAME/math-stars`
   - Replace `YOUR_USERNAME` with your Expo username
4. Tap **Connect**
5. The app loads! 🎉

Bookmark this screen in Expo Go — next time she just taps it from the recent list.

---

### Updating the app after making changes

Any time you change the code, just run:

```bash
eas update --branch production --message "what changed"
```

Expo Go will automatically pick up the new version next time it opens.

---

## What's in the app

| Category | Levels |
|---|---|
| ➕ Adding & Taking Away | Add to 5 → 10 → 20 → Subtract → Word problems |
| 🔢 Counting & Numbers | Count objects → Order numbers → Compare bigger/smaller |
| 🔷 Shapes & Patterns | Basic shapes → More shapes → Patterns |
| 🚀 Skip Counting | By 2s → 5s → 10s → ×2 table → ×5 table → ×10 table |
| 🕐 Telling Time | O'clock → Half past → Mixed |

**Features:**
- Pick an animal friend who cheers you on (cat, unicorn, frog, bunny, dog, bear)
- 🔊 Speaker button on every question — tap to hear it read aloud
- 💡 Hints appear after wrong answers
- ⭐ Earn stars, unlock 13 achievement badges
- 🛍️ Spend stars in the shop to unlock background themes
- 🔥 Daily streak tracking
- Score 80%+ to pass a level and unlock the next one
- Wrong answers come back sooner (spaced repetition)
