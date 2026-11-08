/**
 * COZY VISITORS: rare, non-blocking event cards. Behaviour per `kind` lives in game/legacy.ts.
 * If ignored for `linger` seconds they resolve on their own, always in a positive or neutral way.
 */
export type VisitorKind = 'cat' | 'trader' | 'letter' | 'aurora' | 'meteors' | 'hitchhiker';
export interface VisitorDef { kind: VisitorKind; icon: string; title: string; weight: number; linger: number }

export const VISITORS: VisitorDef[] = [
  { kind: 'cat', icon: '🐈', title: 'A stray cat', weight: 3, linger: 80 },
  { kind: 'trader', icon: '🧳', title: 'A travelling trader', weight: 3, linger: 90 },
  { kind: 'letter', icon: '✉️', title: 'A letter arrives', weight: 3, linger: 70 },
  { kind: 'aurora', icon: '🌌', title: 'Aurora overhead', weight: 1.5, linger: 75 },
  { kind: 'meteors', icon: '🌠', title: 'Meteor shower', weight: 1.5, linger: 75 },
  { kind: 'hitchhiker', icon: '🎒', title: 'A hitchhiker waves', weight: 2.5, linger: 80 },
];

/** seconds of play between visitors (random in range) */
export const VISITOR_INTERVAL: [number, number] = [240, 480];
