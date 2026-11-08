// The family Scrapbook (discoveries) and postcards.
import { BIOME, BIOMES, BIOME_FLAVOR, BIOME_POSTCARD, BookCat, LANDMARK, LANDMARKS, LANDMARK_POSTCARD, MOB, MOBS, PART, PARTS, RESOURCES, RES_INFO, TOWN_BOOK_TARGET, TOWN_POSTCARD } from '../../content';
import type { Game } from '../engine';
import { hashString } from '../world/noise';
import { Postcard, meta } from './meta';
import { awayEvent, toast } from './toasts';
import { fill, pick } from './util';

// ------------------------------------------------------------ scrapbook
export function bookTotal(cat: BookCat) {
  switch (cat) {
    case 'biomes': return BIOMES.length;
    case 'resources': return RESOURCES.length;
    case 'critters': return MOBS.length;
    case 'landmarks': return LANDMARKS.length;
    case 'towns': return TOWN_BOOK_TARGET;
    case 'blueprints': return PARTS.length;
  }
}

/** Entries that still exist in the content lists (a removed mod item doesn't count). Towns are open-ended. */
export function bookFound(cat: BookCat) {
  const ids = Object.keys(meta.book[cat]);
  if (cat === 'towns') return Math.min(ids.length, bookTotal(cat));
  const valid = cat === 'biomes' ? BIOME : cat === 'resources' ? RES_INFO : cat === 'critters' ? MOB : cat === 'landmarks' ? LANDMARK : PART;
  return ids.filter((id) => valid[id]).length;
}
/** Completion percentage, 0–100 (exact; floor it for display so 99.5% never shows as 100%). */
export const bookPct = (cat: BookCat) => (bookFound(cat) / Math.max(1, bookTotal(cat))) * 100;
/** How many 25% reward steps (0–4) have been reached, using integer maths so there's no float edge. */
export const bookSteps = (cat: BookCat) => Math.min(4, Math.floor((bookFound(cat) * 4) / Math.max(1, bookTotal(cat))));

export function addPostcard(g: Game | null, kind: Postcard['kind'], ref: string, title: string, line: string, biome: string, icon?: string) {
  meta.postcards.unshift({ id: `${kind}:${ref}:${Date.now()}`, kind, ref, title, line, date: Date.now(), gen: meta.generation, biome, seed: hashString(ref + Date.now()), icon });
  if (meta.postcards.length > 300) meta.postcards.pop();
  if (g) { g.addLog(`💌 Postcard: “${line}”`, '#ffc8dd'); awayEvent(g, `💌 ${title}`); }
}

/** Record a discovery. Returns true if it was new to the family Scrapbook. */
export function onDiscover(g: Game, cat: BookCat, id: string, info: { name?: string; biome?: string } = {}) {
  // The live preview world behind the title screen must not write family memories.
  if (!g.legacyOn) return false;
  const b = meta.book[cat];
  const e = b[id];
  if (e) { e.count++; return false; }
  b[id] = { first: Date.now(), count: 1, gen: meta.generation, ...(cat === 'towns' ? { name: info.name, biome: info.biome } : {}) };
  if (cat === 'biomes') {
    const bd = BIOME[id];
    if (!bd) return true;
    g.addLog(`📖 New Scrapbook page: ${bd.name}!`, '#f0c8ff');
    toast(g, '🗺️', `New biome: ${bd.name}`, BIOME_FLAVOR[id] ?? 'A brand new corner of the world.', '#c8a0ff');
    addPostcard(g, 'biome', id, bd.name, BIOME_POSTCARD[id] ?? `Rolled into the ${bd.name}. Wish you were here.`, id);
  } else if (cat === 'landmarks') {
    const biome = info.biome ?? 'grass';
    const name = info.name ?? LANDMARK[id]?.name ?? id;
    addPostcard(g, 'landmark', id, name, fill(pick(LANDMARK_POSTCARD), { name, biome: BIOME[biome]?.name ?? 'wilds' }), biome);
  } else if (cat === 'towns') {
    const biome = info.biome ?? 'grass';
    addPostcard(g, 'town', id, info.name ?? 'A town', fill(pick(TOWN_POSTCARD), { name: info.name ?? 'town', biome: BIOME[biome]?.name ?? 'wilds' }), biome);
  } else if (cat === 'critters') {
    g.addLog(`🐾 New critter in the Scrapbook: ${MOB[id]?.name ?? id}`, '#f0c8ff');
  }
  return true;
}

/** Silently add things the current run already knows (old saves, starter parts). */
export function syncBook(g: Game) {
  const add = (cat: BookCat, id: string) => { if (!meta.book[cat][id]) meta.book[cat][id] = { first: Date.now(), count: 1, gen: meta.generation }; };
  for (const r of g.seenRes) add('resources', r);
  for (const id of g.known) add('blueprints', id);
  for (const k in g.towns) add('towns', `${g.seedStr}:${k}`);
  for (const k in g.visited) add('landmarks', g.visited[k].id);
  for (const b of g.runBiomes) add('biomes', b);
}
