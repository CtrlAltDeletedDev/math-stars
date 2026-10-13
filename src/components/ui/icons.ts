// Every UI icon in the app comes from Lucide (lucide-react), so controls look
// the same on every device. Emoji rendered differently on each tablet and
// phone, and some (↶, ✕) were too thin to read at a glance.
//
// Thicker strokes than Lucide's default 2: these are read by a six-year-old,
// often at arm's length. Content stays emoji on purpose — her character, topic
// pictures and the apples in a story are things to look at, not controls.
export const ICON_STROKE = 2.75;

/** For an icon that is a button's only content: centred, no inline baseline gap. */
export const ICON_CENTER = { display: 'block', margin: 'auto' } as const;
