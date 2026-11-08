import type { ModuleDef, ModCat } from '../types';
import { POWER } from './power';
import { CARGO } from './cargo';
import { HARVEST } from './harvest';
import { WEAPONS } from './weapons';
import { DEFENSE } from './defense';
import { PROCESSING } from './processing';
import { COMFORT } from './comfort';

/** The cockpit is always present and cannot be removed. */
export const CORE: ModuleDef[] = [
  { id: 'cockpit', name: 'Cockpit', cat: 'core', desc: 'The heart of your home. A pedal drive and a trusty pea shooter.', cost: {}, weight: 3, color: '#f4c95d', power: 5, hp: 20, weapon: { kind: 'pea', range: 85, rate: 1.6, dmg: 3 } },
];

/** All vehicle modules. Add a new category file above and spread it in here. */
export const MODULES: ModuleDef[] = [...CORE, ...POWER, ...CARGO, ...HARVEST, ...WEAPONS, ...DEFENSE, ...PROCESSING, ...COMFORT];

export const CAT_INFO: Record<ModCat, { name: string; color: string; blurb: string }> = {
  core: { name: 'Core', color: '#f4c95d', blurb: '' },
  power: { name: 'Power', color: '#e67e22', blurb: 'More power = faster. Each engine has its own appetite.' },
  cargo: { name: 'Cargo', color: '#b5835a', blurb: 'Room for loot. Mind the weight.' },
  harvest: { name: 'Harvest', color: '#e0c030', blurb: 'Tools that gather as you roll. Mount them on the edge.' },
  weapon: { name: 'Weapons', color: '#e74c3c', blurb: 'Automated defense. Most need ammo.' },
  defense: { name: 'Defense', color: '#5dade2', blurb: 'Hull, healing and deterrents.' },
  process: { name: 'Processing', color: '#1abc9c', blurb: 'Turns raw goods into refined ones while you drive.' },
  comfort: { name: 'Comfort', color: '#ff8fab', blurb: 'More harvest yield & away earnings. Hates noise, loves company.' },
};
