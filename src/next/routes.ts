// Every screen of the new app, by path. It lives under /next until the switch
// over, so the old app keeps working at / for anyone not on the new one.
export const ROUTES = {
  home: '/next',
  walk: '/next/walk',
  grownUps: '/next/grown-ups',
  more: '/next/more',
  start: '/next/start',
} as const;
