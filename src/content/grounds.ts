import type { GroundDef } from './types';

/**
 * GROUNDS: each biome stands on one ground type, and each locomotion lists its speed
 * per ground. A new biome only needs to pick a ground and every vehicle knows how to
 * cross it. A new ground needs a speed added to each locomotion (missing = impassable).
 */
export const GROUNDS: GroundDef[] = [
  { id: 'deep', name: 'Deep water', color: '#264e8c' },
  { id: 'shallow', name: 'Shallows', color: '#3e80ba' },
  { id: 'mud', name: 'Mud & bog', color: '#4e624a' },
  { id: 'sand', name: 'Sand', color: '#dcc08a' },
  { id: 'flat', name: 'Hardpan', color: '#e8e4dc' },
  { id: 'firm', name: 'Open ground', color: '#70aa52' },
  { id: 'dense', name: 'Thick woods', color: '#3e7a42' },
  { id: 'snow', name: 'Snow', color: '#e2ecf4' },
  { id: 'rough', name: 'Rough rock', color: '#b86e48' },
  { id: 'crystal', name: 'Crystal', color: '#926cba' },
  { id: 'rock', name: 'Crags', color: '#787478' },
  { id: 'cliff', name: 'Cliffs', color: '#c4c4ce' },
];
