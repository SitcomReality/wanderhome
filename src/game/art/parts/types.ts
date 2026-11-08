import type { ModuleDef } from '../../../content/index';
import type { C } from '../primitives';

export interface PartOpts { wind?: number; active?: boolean; shadow?: boolean }
/** Draws one part in a 9×9 unit cell centred on (0,0). */
export type PartArtFn = (ctx: C, t: number, o: PartOpts, def: ModuleDef) => void;
/** Give several part ids the same drawing. */
export const shared = (ids: string[], fn: PartArtFn): Record<string, PartArtFn> => Object.fromEntries(ids.map((id) => [id, fn]));
