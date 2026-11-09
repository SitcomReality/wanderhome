// Save export/import + version migration. Nothing here ever wipes data silently:
// before an import overwrites anything, the previous data is copied to a backup key.
import { Game, SAVE_KEY } from './engine';
import { meta, normalizeMeta, saveMeta, META_KEY } from './family/meta';

export const SAVE_VERSION = 4;
const BACKUP_KEY = 'wanderhaus-backup-before-import';

/** Bring an old run save up to the current version (v1/v2/v3 → v4). Unknown fields are preserved. */
export function migrateRunSave(s: any): any {
  if (!s || typeof s !== 'object') return null;
  const out = { ...s };
  const v = typeof out.v === 'number' ? out.v : 1;
  if (v < 2) { out.towns = out.towns ?? (out.known && !Array.isArray(out.known) ? out.known : {}); }
  if (v < 3) { out.runBiomes = out.runBiomes ?? []; out.biomeTime = out.biomeTime ?? {}; out.crew = out.crew ?? null; }
  if (v < 4) { out.collectCap = out.collectCap ?? {}; out.goal = out.goal ?? null; }
  out.v = SAVE_VERSION;
  return out;
}

/** `format` stays "wanderhaus" so export files made before the rename still import. */
export interface ExportBundle { format: 'wanderhaus'; version: number; exported: number; save: any | null; meta: any }

export function makeBundle(game: Game | null): ExportBundle {
  if (game) game.save(); else saveMeta();
  return { format: 'wanderhaus', version: SAVE_VERSION, exported: Date.now(), save: Game.loadSave(), meta };
}
const toB64 = (s: string) => btoa(unescape(encodeURIComponent(s)));
const fromB64 = (s: string) => decodeURIComponent(escape(atob(s)));

export function exportString(game: Game | null) { return toB64(JSON.stringify(makeBundle(game))); }
export function downloadSave(game: Game | null) {
  const blob = new Blob([JSON.stringify(makeBundle(game), null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `wanderhome-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Accepts a base64 string, a bundle JSON, or a bare run-save JSON. */
export function parseImport(text: string): { ok: true; bundle: ExportBundle; summary: string } | { ok: false; error: string } {
  const t = text.trim();
  if (!t) return { ok: false, error: 'Nothing to import.' };
  let obj: any = null;
  try { obj = JSON.parse(t); } catch { try { obj = JSON.parse(fromB64(t.replace(/\s+/g, ''))); } catch { return { ok: false, error: "That doesn't look like a Wanderhome save." }; } }
  if (obj && obj.format !== 'wanderhaus' && typeof obj.seedStr === 'string') obj = { format: 'wanderhaus', version: obj.v ?? 1, exported: Date.now(), save: obj, meta: null };
  if (!obj || obj.format !== 'wanderhaus') return { ok: false, error: "That doesn't look like a Wanderhome save." };
  if (obj.save && (typeof obj.save.seedStr !== 'string' || !Array.isArray(obj.save.grid))) return { ok: false, error: 'The save inside looks damaged (missing world or house).' };
  if (obj.version > SAVE_VERSION) return { ok: false, error: 'This save is from a newer version of the game.' };
  const m = obj.meta ? normalizeMeta(obj.meta) : null;
  const summary = [
    m ? `The ${m.family} family, generation ${m.generation}` : 'No family data (run only)',
    obj.save ? `house in world "${obj.save.seedStr}" with ${Math.floor(obj.save.coins ?? 0)} coins` : 'no active house',
    m ? `${m.postcards.length} postcards, ${Object.keys(m.book.biomes).length} biomes` : '',
  ].filter(Boolean).join(' · ');
  return { ok: true, bundle: { ...obj, meta: m }, summary };
}

/** Writes the bundle to storage (after backing up current data). The caller should reload. */
export function applyImport(b: ExportBundle) {
  try { localStorage.setItem(BACKUP_KEY, JSON.stringify({ save: localStorage.getItem(SAVE_KEY), meta: localStorage.getItem(META_KEY), at: Date.now() })); } catch { /* ignore */ }
  if (b.save) localStorage.setItem(SAVE_KEY, JSON.stringify(migrateRunSave(b.save)));
  else localStorage.removeItem(SAVE_KEY);
  if (b.meta) localStorage.setItem(META_KEY, JSON.stringify(normalizeMeta(b.meta)));
}
