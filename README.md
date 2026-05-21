# Math Stars ⭐

A math learning app built for kids going into 1st grade.

---

## How to run on her iPad (no computer needed)

You'll use **GitHub Codespaces** (a computer in the cloud) to run the app, and **Expo Go** on her iPad to play it. Since everything runs on the iPad, you can't scan a QR code — instead you'll copy a URL directly into Expo Go.

---

### One-time setup (do this once)

**On the iPad:**

1. Open the **App Store** and install **Expo Go** (free, by Expo Project)

2. Open **Safari** and go to your GitHub account — sign in if needed

---

### Every time you want to play

**Step 1 — Open the Codespace**

1. Go to this repo on GitHub in Safari on the iPad
2. Tap the green **Code** button
3. Tap the **Codespaces** tab
4. Tap **Create codespace** (first time) or tap your existing codespace to reopen it
5. Wait for it to finish loading — you'll see a terminal at the bottom

> The first time takes about 2 minutes. After that it opens in about 30 seconds.

---

**Step 2 — Start the app**

Tap the terminal at the bottom of the screen and type:

```
npx expo start --tunnel
```

Then tap the **return** key. Wait about 30 seconds.

---

**Step 3 — Copy the URL**

Look for a line in the terminal that starts with:

```
› Metro waiting on exp://
```

It will look something like:

```
› Metro waiting on exp://abc12345.anonymous.19000.exp.direct
```

**Long-press that URL and copy it.**

---

**Step 4 — Open the app in Expo Go**

1. Switch to the **Expo Go** app on the iPad
2. Tap **"Enter URL manually"** (at the bottom of the home screen)
3. Paste the URL you copied
4. Tap **Connect**
5. The app will load in a few seconds 🎉

---

**Step 5 — When she's done playing**

Go back to Safari and close the Codespace tab. This stops the server and saves your free hours.

> GitHub gives **60 free hours per month** — that's 2 hours every day with room to spare.

---

### If the URL disappears from the terminal

Scroll up in the terminal — it stays there. Or press `s` in the terminal to show it again.

### If the app won't connect

Make sure the Codespace tab is still open in Safari in the background. If you closed it, go back to GitHub → Code → Codespaces → tap your codespace to reopen it, then run `npx expo start --tunnel` again.

---

## What's in the app

| Category | Levels |
|---|---|
| ➕ Adding & Taking Away | Add to 5 → Add to 10 → Add to 20 → Subtract → Mixed |
| 🔢 Counting & Numbers | Count objects → Order numbers → Compare bigger/smaller |
| 🔷 Shapes & Patterns | Basic shapes → More shapes → Patterns |
| 🚀 Skip Counting | Count by 2s → 5s → 10s → ×2 table → ×5 table → ×10 table |

- Score **80% or higher** to pass a level and unlock the next one
- Earn **1–3 stars** per level (60% / 80% / 90%)
- Questions you get wrong come back sooner (spaced repetition)
- Daily play streaks tracked with 🔥
