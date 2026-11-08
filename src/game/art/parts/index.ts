// Part art registry entrypoint: every category's drawings merged into one lookup.
import type { PartArtFn } from './types';
import { CORE_ART } from './core';
import { POWER_ART } from './power';
import { CARGO_ART } from './cargo';
import { HARVEST_ART } from './harvest';
import { WEAPON_ART } from './weapons';
import { DEFENSE_ART } from './defense';
import { PROCESSING_ART } from './processing';
import { COMFORT_ART } from './comfort';

export type { PartArtFn, PartOpts } from './types';
export const PART_ART: Record<string, PartArtFn> = { ...CORE_ART, ...POWER_ART, ...CARGO_ART, ...HARVEST_ART, ...WEAPON_ART, ...DEFENSE_ART, ...PROCESSING_ART, ...COMFORT_ART };
