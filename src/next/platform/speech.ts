// Speech, in one place.
//
// The old app spoke from three different files, and auto-read fired from an
// effect -- which iPad Safari ignores unless speech has already been started
// by a tap. Here `unlock()` runs inside the Go tap (an empty utterance is
// enough), after which speaking from anywhere works for the rest of the visit.

let unlocked = false;
let voice: SpeechSynthesisVoice | null = null;

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

function pickVoice() {
  const s = synth();
  if (!s) return;
  const voices = s.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('en'));
  // A local voice answers instantly and works offline.
  voice = voices.find((v) => v.localService && /samantha|karen|daniel|moira|google us/i.test(v.name))
    ?? voices.find((v) => v.localService)
    ?? voices[0]
    ?? null;
}

if (synth()) {
  pickVoice();
  synth()!.addEventListener?.('voiceschanged', pickVoice);
  // Stop talking when she leaves the app, not halfway through the next thing.
  document.addEventListener('visibilitychange', () => { if (document.hidden) synth()?.cancel(); });
}

/** Call from a tap handler, before anything is spoken automatically. */
export function unlockSpeech() {
  const s = synth();
  if (!s || unlocked) return;
  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  s.speak(u);
  unlocked = true;
}

export function speak(text: string) {
  const s = synth();
  if (!s || !text) return;
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.rate = 0.88;
  u.pitch = 1.05;
  s.speak(u);
}

export function stopSpeaking() {
  synth()?.cancel();
}

/** "9 - 3 = ?" as a six-year-old hears it in class: "9 take away 3". */
export function sumToSpeech(prompt: string): string {
  const m = prompt.match(/^(\d+)\s*([+\-−])\s*(\d+)/);
  if (!m) return prompt.replace('?', 'what');
  return `${m[1]} ${m[2] === '+' ? 'plus' : 'take away'} ${m[3]}`;
}
