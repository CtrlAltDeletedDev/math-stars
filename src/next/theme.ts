// The new look: a picture book, not a slot machine.
//
// Warm paper, near-black numerals, and the two operations colour-coded
// everywhere so she learns the sign by colour too. Green means go and right;
// amber means "try again". Red is never used on her screens.

export const C = {
  paper: '#FBF6EC',
  paperDeep: '#F3EAD7',
  card: '#FFFFFF',
  ink: '#22252B',
  inkSoft: '#5B6270',
  line: '#E4DAC6',
  plus: '#1E9C8A',
  plusSoft: '#D5F0EB',
  minus: '#E37B2A',
  minusSoft: '#FBE3CF',
  go: '#2E9E5B',
  goDark: '#22804A',
  goSoft: '#D8EFDF',
  amber: '#E8A317',
  amberSoft: '#FFF1D0',
  navy: '#34428C',
  sky: '#CFE8F7',
  grass: '#CFE6B4',
  grassDeep: '#A9D08A',
} as const;

/** Her screens: round, chunky, open numerals. */
export const KID_FONT = "'Fredoka', 'Nunito', system-ui, sans-serif";
/** The grown-ups screen: built for legibility. */
export const ADULT_FONT = "'Atkinson Hyperlegible', system-ui, -apple-system, sans-serif";

export const RADIUS = 22;
