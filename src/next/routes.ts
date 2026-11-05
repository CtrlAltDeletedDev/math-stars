// Every screen of the new app, by path. It lives under /next until the switch
// over, so the old app keeps working at / for anyone not on the new one.
export const ROUTES = {
  home: '/next',
  walk: '/next/walk',
  grownUps: '/next/grown-ups',
  more: '/next/more',
  start: '/next/start',
  lesson: (id: string) => `/next/lesson/${id}`,
  /** Every model, for the people building them. Not linked from her screens. */
  gallery: '/next/gallery',
} as const;
