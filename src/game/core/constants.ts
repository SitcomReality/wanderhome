// Shared simulation constants and tiny pure helpers.
import { LOCO, RES_LIST, Res } from '../../content/index';
import { Stats } from '../vehicleStats';

/** Size of one vehicle grid cell in world pixels. */
export const CELL = 9;

/**
 * localStorage key of the current run's save. The "wanderhaus" namespace is kept for
 * backward compatibility: existing saves keep loading after the game was renamed Wanderhome.
 * Changing it would strand every current player's run.
 */
export const SAVE_KEY = 'wanderhaus-save-v1';

/** Length of one in-game day in seconds. */
export const DAY = 480;

export const TAU = Math.PI * 2;

export const zeroRes = (): Record<Res, number> => Object.fromEntries(RES_LIST.map((r) => [r, 0])) as Record<Res, number>;

/** Collection cap sentinel: -1 means "keep gathering this resource without a limit". */
export const NO_CAP = -1;
export const noCaps = (): Record<Res, number> => Object.fromEntries(RES_LIST.map((r) => [r, NO_CAP])) as Record<Res, number>;

export function nominalSpeed(st: Stats, locoId: string, power = st.powerMax, cargo = 0) {
  const ratio = power / Math.max(1, st.weight + cargo * 0.015);
  return 34 * (LOCO[locoId]?.speed ?? 1) * Math.max(0.22, Math.min(1.9, 0.3 + ratio * 0.55));
}
