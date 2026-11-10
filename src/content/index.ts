// Content entrypoint: every kind of game content, the registry's lookup tables and helpers.
export * from './types';
export * from './legacy';
export * from './milestones';
export * from './flavor';
export * from './visitors';
export { RESOURCES } from './resources';
export { GROUNDS } from './grounds';
export { BIOMES, BIOME_TAGS } from './biomes';
export { NODES } from './nodes';
export { MOBS } from './mobs';
export { LANDMARKS } from './landmarks';
export { RESIDENTS, TOWN_CAT, CAT_NAMES, RESIDENT_ROLES, RESIDENT_TRAITS, makeGeneratedResident } from './residents';
export { LOCOS } from './locomotion';
export { FRAMES } from './frames';
export { MODULES, CAT_INFO } from './parts';
export * from './registry';
export * from './helpers';
