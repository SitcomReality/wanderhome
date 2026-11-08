// Small helpers shared by the Workshop components.
import { GRID_MAX_W } from '../../content/index';
import type { Game } from '../../game/engine';
import { CELL } from '../../game/engine';

/** Is this grid cell inside the current chassis? */
export const activeCell = (game: Game, idx: number) => idx % GRID_MAX_W < game.gridW && Math.floor(idx / GRID_MAX_W) < game.gridH;
/** Pixels per world unit for the workbench drawing at a given canvas size. */
export const benchScale = (game: Game, W: number, H: number) => Math.min(10, (W - 40) / (game.gridW * CELL + 34), (H - 40) / (game.gridH * CELL + 30));
