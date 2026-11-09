import type { ResidentDef } from './types';

/**
 * RESIDENTS: the first slice of settlement life, currently Homeport only.
 * Ids are content ids; the first slice keeps resident state transient, so they are
 * not part of the save contract yet. When residents become persistent, treat these
 * ids the same way as part and biome ids.
 */
export const RESIDENTS: ResidentDef[] = [
  {
    id: 'mira', name: 'Mira', role: 'gardener', trait: 'bold',
    color: '#7fb069', accent: '#f2c14e',
    line: 'Mira is negotiating with the bean rows. The beans appear unconvinced.',
  },
  {
    id: 'tobin', name: 'Tobin', role: 'tinker', trait: 'curious',
    color: '#c98b4b', accent: '#9fd6e8',
    line: 'Tobin has taken the kettle apart again. He calls it maintenance.',
  },
  {
    id: 'pip', name: 'Pip', role: 'kid', trait: 'playful',
    color: '#e07a9a', accent: '#ffe08a',
    line: 'Pip is conducting a small orchestra of beetles. They are not in key.',
  },
  {
    id: 'sable', name: 'Sable', role: 'watch', trait: 'steady',
    color: '#6f9fd8', accent: '#ffd166',
    line: 'Sable is watching the treeline with the calm of someone who has seen it all.',
  },
];
