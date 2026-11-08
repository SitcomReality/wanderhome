// Cozy visitors: spawning, offers and resolution (every outcome is positive or neutral).
import { BuffStat, CAT_COLORS, CAT_NAMES, CREW, Cost, LETTERS, MISC_POSTCARD, PART, PARTS, RES_INFO, VISITORS, VISITOR_INTERVAL, VisitorKind } from '../../content';
import type { Game } from '../engine';
import { meta, saveMeta } from './meta';
import { addPostcard, onDiscover } from './scrapbook';
import { awayEvent, toast } from './toasts';
import { pick } from './util';

export interface Crew { name: string; role: string; line: string; stat: BuffStat; mult: number; until: number }

export interface ActiveVisitor { id: number; kind: VisitorKind; icon: string; title: string; text: string; expires: number; linger: number; data: any }

// ------------------------------------------------------------ visitors
export function visitorTick(g: Game, dt: number) {
  if (g.visitor) { if (g.time > g.visitor.expires) resolveVisitor(g, 'auto'); return; }
  g.visitorT -= dt;
  if (g.visitorT > 0) return;
  g.visitorT = VISITOR_INTERVAL[0] + Math.random() * (VISITOR_INTERVAL[1] - VISITOR_INTERVAL[0]);
  spawnVisitor(g);
}

export function traderOffer(g: Game) {
  const maxTier = g.distTiles() > 200 ? 3 : 2;
  const pool = PARTS.filter((p) => p.shop && p.shop.tier <= maxTier && !g.known.includes(p.id));
  if (!pool.length) return null;
  const part = pick(pool);
  const price = Math.round(part.shop!.price * (1 + g.distTiles() / 3000));
  let best = '', bv = 0;
  for (const r in g.res) { const v = Math.floor(g.res[r]) * (RES_INFO[r]?.base ?? 0); if (v > bv) { bv = v; best = r; } }
  const resCost: Cost = best ? { [best]: Math.ceil((price * 0.75) / RES_INFO[best].base) } : {};
  return { partId: part.id, coinPrice: Math.round(price * 0.85), resCost };
}

export function spawnVisitor(g: Game, force?: VisitorKind) {
  const defs = VISITORS.filter((v) => {
    if (force) return v.kind === force;
    if (v.kind === 'cat') return !meta.cat;
    if (v.kind === 'hitchhiker') return !g.crew;
    return true;
  });
  if (!defs.length) return;
  let roll = Math.random() * defs.reduce((a, d) => a + d.weight, 0);
  let def = defs[0];
  for (const d of defs) { roll -= d.weight; if (roll <= 0) { def = d; break; } }
  let text = '', data: any = {};
  switch (def.kind) {
    case 'cat': data = { name: pick(CAT_NAMES), color: pick(CAT_COLORS) }; text = 'A scruffy cat is sitting on the front step, looking at you like it already lives here.'; break;
    case 'trader': {
      const o = traderOffer(g);
      if (!o) { def = VISITORS.find((v) => v.kind === 'letter')!; data = letterData(g); text = data.text; break; }
      data = o;
      const rc = Object.entries(o.resCost)[0];
      text = `"Psst. I've got plans for a ${PART[o.partId].name}. Yours for ${rc ? `${rc[1]} ${RES_INFO[rc[0]].icon}` : ''}${rc ? ' or ' : ''}${o.coinPrice} 🪙."`;
      break;
    }
    case 'letter': data = letterData(g); text = data.text; break;
    case 'aurora':
      g.addBuff({ id: 'aurora', name: 'Aurora Glow', icon: '🌌', stat: 'luck', mult: 1.5, duration: 300 });
      g.sky = { kind: 'aurora', until: g.time + def.linger + 90 };
      text = 'Ribbons of green and violet ripple across the sky. Lucky finds ×1.5 for a while.'; break;
    case 'meteors':
      g.addBuff({ id: 'meteors', name: 'Starfall', icon: '🌠', stat: 'yield', mult: 1.25, duration: 300 });
      g.sky = { kind: 'meteors', until: g.time + def.linger + 90 };
      text = 'Shooting stars streak overhead. Harvests +25% for a while. Make a wish?'; break;
    case 'hitchhiker': {
      const c = pick(CREW);
      const stat: BuffStat = pick(['yield', 'speed', 'luck'] as BuffStat[]);
      data = { ...c, stat, mult: stat === 'luck' ? 1.3 : stat === 'speed' ? 1.08 : 1.12 };
      text = `${c.name}, a ${c.role}, asks for a ride. They'd help out with ${stat === 'luck' ? 'lucky finds' : stat} along the way.`;
      break;
    }
  }
  g.visitor = { id: Date.now() + Math.random(), kind: def.kind, icon: def.icon, title: def.title, text, expires: g.time + def.linger, linger: def.linger, data };
  g.addLog(`${def.icon} ${def.title}…`, '#e0c8ff');
  awayEvent(g, `${def.icon} ${def.title} is waiting`);
}

export function letterData(g: Game) {
  const towns = Object.values(g.towns);
  const from = towns.length ? pick(towns).name : 'Homeport';
  const coins = Math.round((30 + Math.random() * 50) * (1 + g.distTiles() / 1500));
  return { from, coins, text: `From ${from}: “${pick(LETTERS)}”` };
}

/** choice: 'a' / 'b' / 'c' buttons, or 'auto' when ignored. Every outcome is positive or neutral. */
/**
 * Resolve the active visitor exactly once. expectId guards against a stale card click resolving a
 * newer visitor. The visitor is cleared before any outcome applies, so re-entry is impossible.
 */
export function resolveVisitor(g: Game, choice: 'a' | 'b' | 'c' | 'auto', name?: string, expectId?: number) {
  const v = g.visitor;
  if (!v || (expectId !== undefined && v.id !== expectId)) return false;
  g.visitor = null;
  let out = '';
  const d = v.data;
  switch (v.kind) {
    case 'cat':
      if (choice === 'b') { g.addRes('fiber', 5); out = 'The cat headbutts your hand, leaves a feather on the step and trots off. (+5 fiber)'; }
      else {
        const nm = (name ?? '').trim().slice(0, 18) || d.name;
        meta.cat = { name: nm, color: d.color, adopted: Date.now() };
        out = choice === 'auto' ? `While you weren't looking, ${nm} the cat moved in. Apparently this is home now.` : `${nm} the cat has adopted the house! (+2 comfort)`;
        addPostcard(g, 'visitor', 'cat', `${nm} moves in`, MISC_POSTCARD.cat, g.world.terrainAt(g.v.x, g.v.y), '🐈');
        g.computeStats();
      }
      break;
    case 'trader': {
      const part = PART[d.partId];
      const learn = () => { if (!g.known.includes(d.partId)) { g.known.push(d.partId); onDiscover(g, 'blueprints', d.partId); meta.lifetime.bought++; } };
      if (choice === 'a' && g.canAfford(d.resCost)) { g.pay(d.resCost); learn(); out = `Traded for the ${part.name} blueprint!`; }
      else if (choice === 'b' && g.coins >= d.coinPrice) { g.coins -= d.coinPrice; learn(); out = `Bought the ${part.name} blueprint!`; }
      else { const gift = Math.round(15 + Math.random() * 20); g.coins += gift; out = `The trader tips their hat and leaves a little something for the road. (+${gift} 🪙)`; }
      break;
    }
    case 'letter':
      g.coins += d.coins;
      out = `${d.text} (+${d.coins} 🪙)`;
      break;
    case 'aurora':
    case 'meteors':
      if (choice === 'a') {
        if (v.kind === 'meteors') { const n = 2 + ((Math.random() * 3) | 0); g.addRes('crystal', n); out = `You made a wish. In the morning, ${n} 💎 stardust crystals glitter on the roof.`; }
        else { g.addBuff({ id: 'aurora', name: 'Aurora Glow', icon: '🌌', stat: 'luck', mult: 1.5, duration: 600 }); out = 'You watched the aurora until it faded. The glow lingers longer. (Lucky finds extended)'; }
        addPostcard(g, 'visitor', v.kind, v.title, MISC_POSTCARD[v.kind], g.world.terrainAt(g.v.x, g.v.y), v.icon);
      } else out = v.kind === 'aurora' ? 'The aurora shimmered and faded softly.' : 'The last shooting star fizzled out over the horizon.';
      break;
    case 'hitchhiker':
      if (choice === 'b') { g.coins += 10; out = `${d.name} waves you on with a smile and presses 10 🪙 into your hand.`; addPostcard(g, 'visitor', 'hitch-' + d.name, `${d.name}'s wave`, MISC_POSTCARD.hitchhiker, g.world.terrainAt(g.v.x, g.v.y), '🎒'); }
      else { g.crew = { name: d.name, role: d.role, line: d.line, stat: d.stat, mult: d.mult, until: g.time + 600 }; out = `${d.name} hopped aboard for a while.`; }
      break;
  }
  meta.lifetime.visitors++;
  meta.guestbook.unshift({ date: Date.now(), gen: meta.generation, icon: v.icon, text: out });
  if (meta.guestbook.length > 120) meta.guestbook.pop();
  g.addLog(`${v.icon} ${out}`, '#e0c8ff');
  toast(g, v.icon, v.title, out, '#e0c8ff');
  saveMeta();
  return true;
}
