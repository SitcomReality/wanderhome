// Deterministic settlement layout shared by town art, residents and travel.
// A settlement is a small path network first: radial streets, a ring or two, and footpaths
// to every door. Residents follow those paths, then walk the last few steps in a straight line.
import type { Game } from '../engine';
import { BIOME, RES_INFO } from '../../content/index';
import { hash2 } from './noise';
import { TILE, TOWN_RADIUS, Town, SettlementTier } from './world';

export interface SettlementPoint { x: number; y: number }
export interface SettlementHouse extends SettlementPoint { door: SettlementPoint; seed: number }
export interface SettlementRoad { x1: number; y1: number; x2: number; y2: number; width: number; kind: 'street' | 'ring' | 'foot' }

export interface SettlementPlan {
  townKey: string;
  tier: SettlementTier;
  radius: number;
  plaza: number;
  center: SettlementPoint;
  houses: SettlementHouse[];
  workshop: SettlementPoint;
  well: SettlementPoint;
  green: SettlementPoint;
  field: SettlementPoint;
  wild: SettlementPoint;
  gate: SettlementPoint;
  watch: SettlementPoint;
  roads: SettlementRoad[];
  pathNodes: SettlementPoint[];
  pathEdges: [number, number][];
}

export interface SettlementTierInfo {
  label: string;
  icon: string;
  radius: number;
  arms: number;
  plaza: number;
  lanes: number;
  blurb: string;
}

export const SETTLEMENT_TIERS: Record<SettlementTier, SettlementTierInfo> = {
  hamlet: { label: 'hamlet', icon: '🏚️', radius: TOWN_RADIUS.hamlet, arms: 4, plaza: 11, lanes: 2, blurb: 'a handful of roofs and a well that knows everyone' },
  village: { label: 'village', icon: '🏡', radius: TOWN_RADIUS.village, arms: 5, plaza: 15, lanes: 3, blurb: 'a green, a workshop, and opinions about beans' },
  town: { label: 'town', icon: '🏘️', radius: TOWN_RADIUS.town, arms: 6, plaza: 20, lanes: 3, blurb: 'a proper little tangle of streets and chimney smoke' },
  city: { label: 'city', icon: '🏙️', radius: TOWN_RADIUS.city, arms: 8, plaza: 27, lanes: 4, blurb: 'a sprawl of lanes, market awnings and lit windows' },
};

export function settlementTier(t: Town): SettlementTierInfo { return SETTLEMENT_TIERS[t.tier] ?? SETTLEMENT_TIERS.village; }
export function settlementRadius(t: Town) { return settlementTier(t).radius; }

/** Architecture vocabulary: biome first, local materials second, weather as the accent. */
export interface SettlementStyle {
  name: string;
  wall: string;
  trim: string;
  roof: string;
  roof2: string;
  roofShape: 'gable' | 'flat' | 'steep' | 'thatch';
  foundation: 'dirt' | 'stone' | 'stilts' | 'snow';
  detail: 'flowers' | 'icicles' | 'crystals' | 'lanterns' | 'nets' | 'bones' | 'mushrooms' | 'none';
  crop: 'beans' | 'wheat' | 'rye' | 'rice' | 'dates' | 'sea kale' | 'glowbeans';
  specialty: string;
}

function goodsName(t: Town) {
  const goods = BIOME[t.biome]?.goods?.cheap ?? [];
  const names = goods.slice(0, 3).map((g) => RES_INFO[g]?.name.toLowerCase()).filter(Boolean);
  return names.length ? names.join(', ') : 'whatever the road brings';
}

export function settlementStyle(t: Town): SettlementStyle {
  const b = BIOME[t.biome];
  const tags = new Set(b?.tags ?? []);
  const goods = b?.goods?.cheap ?? [];
  const has = (...ids: string[]) => ids.some((id) => goods.includes(id));
  const specialty = goodsName(t);
  if (tags.has('volcanic')) return { name: 'Basalt and brass', wall: '#62585a', trim: '#d8a15d', roof: '#9e4635', roof2: '#6e302a', roofShape: 'flat', foundation: 'stone', detail: 'lanterns', crop: 'rye', specialty };
  if (tags.has('cold') || has('ice')) return { name: 'Snow-proud timber', wall: '#d9e2e7', trim: '#71665c', roof: '#536b7c', roof2: '#3e5363', roofShape: 'steep', foundation: 'snow', detail: 'icicles', crop: 'rye', specialty };
  if (tags.has('magic') || has('crystal') || has('starmetal')) return { name: 'Pale stone and crystal', wall: '#d5c9e5', trim: '#705394', roof: '#7556aa', roof2: '#4f3d7a', roofShape: 'steep', foundation: 'stone', detail: 'crystals', crop: 'glowbeans', specialty };
  if (tags.has('hot') && tags.has('dry')) return { name: 'Sun-baked adobe', wall: '#ddb97e', trim: '#8f5b3b', roof: '#b9683c', roof2: '#8e4d32', roofShape: 'flat', foundation: 'dirt', detail: 'flowers', crop: 'dates', specialty };
  if (tags.has('wet') && (tags.has('wooded') || tags.has('hot'))) return { name: 'Stilted greenwood', wall: '#a18a62', trim: '#4d6a3d', roof: '#557a48', roof2: '#3d5c37', roofShape: 'thatch', foundation: 'stilts', detail: 'mushrooms', crop: 'rice', specialty };
  if (tags.has('coastal')) return { name: 'Salt-white and blue', wall: '#efe3c9', trim: '#356b88', roof: '#3b7da3', roof2: '#2a5b7b', roofShape: 'gable', foundation: 'stone', detail: 'nets', crop: 'sea kale', specialty };
  if (has('bone')) return { name: 'Bone-white adobe', wall: '#ddd2b4', trim: '#75634c', roof: '#927b61', roof2: '#6f5c49', roofShape: 'flat', foundation: 'dirt', detail: 'bones', crop: 'rye', specialty };
  if (tags.has('rocky')) return { name: 'Cragstone and slate', wall: '#a5a3a0', trim: '#5c585e', roof: '#4f5c6c', roof2: '#384553', roofShape: 'gable', foundation: 'stone', detail: 'lanterns', crop: 'rye', specialty };
  if (tags.has('wooded')) return { name: 'Timber and thatch', wall: '#c9aa7b', trim: '#69462f', roof: '#546f43', roof2: '#7d4a36', roofShape: 'gable', foundation: 'dirt', detail: 'flowers', crop: 'beans', specialty };
  if (tags.has('fertile')) return { name: 'Cream wash and terracotta', wall: '#e7d3a6', trim: '#7a543b', roof: '#bd5b38', roof2: '#91412c', roofShape: 'gable', foundation: 'dirt', detail: 'flowers', crop: 'beans', specialty };
  return { name: 'Hearthstone and slate', wall: '#d7c5a2', trim: '#68503d', roof: '#5c6470', roof2: '#424a57', roofShape: 'gable', foundation: 'dirt', detail: 'lanterns', crop: 'wheat', specialty };
}

function landAt(g: Game, x: number, y: number) {
  const b = BIOME[g.world.rawTerrain(Math.floor(x / TILE), Math.floor(y / TILE))];
  return !!b && b.band !== 'deep' && b.band !== 'shallow' && !b.noWalk;
}

function pickLand(g: Game, t: Town, offsets: readonly (readonly [number, number])[], fallback: SettlementPoint): SettlementPoint {
  for (const [ox, oy] of offsets) {
    const x = t.x + ox, y = t.y + oy;
    if (landAt(g, x, y)) return { x, y };
  }
  if (landAt(g, fallback.x, fallback.y)) return fallback;
  return { x: t.x, y: t.y };
}

function nearExisting(p: SettlementPoint, points: SettlementPoint[], min: number) {
  return points.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < min);
}

/** Add a lane from an anchor to the nearest street node, so it is reachable by the same walkers. */
function connectAnchor(p: SettlementPoint, nodes: SettlementPoint[], edges: [number, number][], roads: SettlementRoad[], width = 2) {
  let best = -1, bd = 150;
  for (let i = 0; i < nodes.length; i++) {
    const d = Math.hypot(nodes[i].x - p.x, nodes[i].y - p.y);
    if (d < bd) { bd = d; best = i; }
  }
  if (best >= 0 && bd < 4) return best;
  nodes.push({ x: p.x, y: p.y });
  const idx = nodes.length - 1;
  if (best >= 0) {
    edges.push([best, idx]);
    roads.push({ x1: nodes[best].x, y1: nodes[best].y, x2: p.x, y2: p.y, width, kind: 'foot' });
  }
  return idx;
}

/**
 * Build (and cache) a settlement's layout. This is deterministic for a town and independent
 * of when the player arrives, so the place looks the same on every visit.
 */
export function planSettlement(g: Game, t: Town): SettlementPlan {
  const info = settlementTier(t);
  const seed = Math.floor(t.seedv * 1e6) + t.tx * 17 + t.ty * 31;
  const r = (n: number) => hash2(seed, n, g.world.seed + 4141);
  const center = { x: t.x, y: t.y };
  const radius = info.radius;
  const arms = info.arms;
  const a0 = r(1) * Math.PI * 2;
  const points: SettlementPoint[] = [center];
  const edges: [number, number][] = [];
  const roads: SettlementRoad[] = [];
  const layers = [0.33, 0.58, 0.81, 1].slice(0, Math.max(2, info.lanes));
  const armNodes: number[][] = Array.from({ length: arms }, () => []);

  // Radial streets. Arms stop at water, so a coastal town can be lopsided.
  for (let arm = 0; arm < arms; arm++) {
    const a = a0 + (arm / arms) * Math.PI * 2;
    let prev = 0;
    for (const f of layers) {
      const p = { x: center.x + Math.cos(a) * radius * f, y: center.y + Math.sin(a) * radius * f };
      if (!landAt(g, p.x, p.y)) break;
      points.push(p);
      const idx = points.length - 1;
      armNodes[arm].push(idx);
      edges.push([prev, idx]);
      roads.push({ x1: points[prev].x, y1: points[prev].y, x2: p.x, y2: p.y, width: f < 0.7 ? 5 : 3.5, kind: 'street' });
      prev = idx;
    }
    if (!armNodes[arm].length) armNodes[arm].push(0);
  }
  // Ring streets stitch the arms together at matching depths.
  for (let layer = 0; layer < layers.length; layer++) {
    for (let arm = 0; arm < arms; arm++) {
      const next = (arm + 1) % arms;
      const a = armNodes[arm][layer], b = armNodes[next][layer];
      if (!a || !b || a === 0 || b === 0 || a === b) continue;
      if (Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y) > radius * 0.9) continue;
      edges.push([a, b]);
      roads.push({ x1: points[a].x, y1: points[a].y, x2: points[b].x, y2: points[b].y, width: 2.8, kind: 'ring' });
    }
  }

  const gate = points[armNodes[0][armNodes[0].length - 1] ?? 0] ?? center;
  const gateSpot = { x: gate.x + Math.cos(a0) * 5, y: gate.y + Math.sin(a0) * 5 };

  const anchors: SettlementPoint[] = [];
  const addAnchor = (p: SettlementPoint, min = 14) => {
    if (nearExisting(p, anchors, min)) return false;
    anchors.push(p);
    return true;
  };
  const at = (a: number, d: number) => [Math.cos(a) * d, Math.sin(a) * d] as const;
  const R = radius;
  const well = pickLand(g, t, [at(a0 + 0.4, info.plaza * 0.5), at(a0 + 2.2, info.plaza * 0.55), at(a0 + 4.2, info.plaza * 0.5)], { x: t.x + 10, y: t.y + 8 });
  addAnchor(well, 10);
  const workshop = pickLand(g, t, [at(a0 + 1.1, R * 0.38), at(a0 + 1.5, R * 0.42), at(a0 + 3.7, R * 0.38), at(a0 + 5.0, R * 0.42)], { x: t.x + R * 0.3, y: t.y + 8 });
  addAnchor(workshop);
  const green = pickLand(g, t, [at(a0 + 2.6, R * 0.52), at(a0 + 3.1, R * 0.55), at(a0 + 4.8, R * 0.5), at(a0 + 0.9, R * 0.58)], { x: t.x, y: t.y + R * 0.5 });
  addAnchor(green, 12);
  const watch = pickLand(g, t, [at(a0 + 3.8, R * 0.68), at(a0 + 4.5, R * 0.72), at(a0 + 2.9, R * 0.7), at(a0 + 5.4, R * 0.68)], { x: t.x - R * 0.4, y: t.y + 4 });
  addAnchor(watch, 10);
  const field = pickLand(g, t, [at(a0 + 1.6, R + 34), at(a0 + 4.2, R + 38), at(a0 + 0.7, R + 30), at(a0 + 5.5, R + 40)], { x: t.x + R * 0.6, y: t.y });
  const wild = pickLand(g, t, [at(a0 + 3.4, R + 62), at(a0 + 0.2, R + 66), at(a0 + 5.9, R + 58), at(a0 + 2.0, R + 60)], field);
  addAnchor(field, 8);
  addAnchor(wild, 8);

  // A town can have a few more roofs than residents: workshops, stores, empty rooms.
  const houseTarget = t.key === 'home' ? t.pop : t.pop + (t.tier === 'city' ? Math.ceil(t.pop * 0.45) : t.tier === 'town' ? 3 : t.tier === 'village' ? 1 : 0);

  // Houses sit just off the street, facing it. Pick from all road-side plots, seeded.
  const plots: { p: SettlementPoint; door: SettlementPoint; n: number }[] = [];
  for (let layer = 0; layer < Math.min(3, layers.length); layer++) {
    for (let arm = 0; arm < arms; arm++) {
      const idx = armNodes[arm][layer];
      if (!idx || idx === 0) continue;
      const node = points[idx];
      const a = a0 + (arm / arms) * Math.PI * 2;
      const sideX = Math.cos(a + Math.PI / 2), sideY = Math.sin(a + Math.PI / 2);
      for (const side of [-1, 1]) {
        const off = t.tier === 'city' ? 17 : 14;
        const p = { x: node.x + sideX * side * off, y: node.y + sideY * side * off };
        const door = { x: node.x + sideX * side * 4.5, y: node.y + sideY * side * 4.5 };
        if (!landAt(g, p.x, p.y)) continue;
        if (Math.hypot(p.x - center.x, p.y - center.y) < info.plaza + 4) continue;
        if (anchors.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 15)) continue;
        plots.push({ p, door, n: plots.length });
      }
    }
  }
  // Always leave a few homes even if coastline pinched the streets.
  if (plots.length < houseTarget) {
    for (let i = 0; i < 64 && plots.length < houseTarget; i++) {
      const a = r(100 + i) * Math.PI * 2, rad = radius * (0.34 + r(200 + i) * 0.5);
      const p = { x: center.x + Math.cos(a) * rad, y: center.y + Math.sin(a) * rad };
      if (!landAt(g, p.x, p.y)) continue;
      if (anchors.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 15)) continue;
      if (plots.some((q) => Math.hypot(q.p.x - p.x, q.p.y - p.y) < 19)) continue;
      plots.push({ p, door: { x: p.x, y: p.y + 4 }, n: 1000 + i });
    }
  }
  const ranked = plots.map((p) => ({ ...p, k: r(300 + p.n) })).sort((a, b) => a.k - b.k);
  const houses: SettlementHouse[] = [];
  for (const plot of ranked) {
    if (houses.length >= houseTarget) break;
    if (houses.some((q) => Math.hypot(q.x - plot.p.x, q.y - plot.p.y) < 18)) continue;
    houses.push({ x: plot.p.x, y: plot.p.y, door: plot.door, seed: r(400 + plot.n) });
  }
  const housePoints = houses.map((h) => ({ x: h.x, y: h.y }));
  const placeWide = (p: SettlementPoint) => {
    if (!nearExisting(p, housePoints, 16)) return p;
    return { x: p.x + 8, y: p.y + 6 };
  };
  const workshopSpot = placeWide(workshop);
  const watchSpot = placeWide(watch);
  const greenSpot = placeWide(green);

  // Lanes and graph nodes to the places people actually go.
  connectAnchor(well, points, edges, roads, 2);
  connectAnchor(workshopSpot, points, edges, roads, 2.5);
  connectAnchor(greenSpot, points, edges, roads, 2);
  connectAnchor(watchSpot, points, edges, roads, 2);
  const gateNode = connectAnchor(gateSpot, points, edges, roads, 3);
  connectAnchor(field, points, edges, roads, 2);
  connectAnchor(wild, points, edges, roads, 1.8);
  // A footpath to every door means residents can leave the street at the last moment.
  for (const h of houses) connectAnchor(h.door, points, edges, roads, 1.5);

  return {
    townKey: t.key, tier: t.tier, radius, plaza: info.plaza, center,
    houses, workshop: workshopSpot, well, green: greenSpot, field, wild,
    gate: points[gateNode] ?? gateSpot, watch: watchSpot,
    roads, pathNodes: points, pathEdges: edges,
  };
}

/** Find the nearest path node, then walk the network and leave it for the final few steps. */
export function routeAlongPaths(plan: SettlementPlan, from: SettlementPoint, to: SettlementPoint): SettlementPoint[] {
  const direct = Math.hypot(to.x - from.x, to.y - from.y);
  if (direct < 26 || plan.pathNodes.length < 2) return [to];
  const nearest = (p: SettlementPoint) => {
    let best = -1, bd = Infinity;
    for (let i = 0; i < plan.pathNodes.length; i++) {
      const d = Math.hypot(plan.pathNodes[i].x - p.x, plan.pathNodes[i].y - p.y);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };
  const start = nearest(from), goal = nearest(to);
  if (start < 0 || goal < 0) return [to];
  if (start === goal) return [to];

  const n = plan.pathNodes.length;
  const dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
  dist[start] = 0;
  const adj: { to: number; w: number }[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of plan.pathEdges) {
    const w = Math.hypot(plan.pathNodes[a].x - plan.pathNodes[b].x, plan.pathNodes[a].y - plan.pathNodes[b].y);
    adj[a].push({ to: b, w }); adj[b].push({ to: a, w });
  }
  for (let step = 0; step < n; step++) {
    let u = -1, ud = Infinity;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < ud) { ud = dist[i]; u = i; }
    if (u < 0 || u === goal) break;
    done[u] = true;
    for (const e of adj[u]) if (dist[u] + e.w < dist[e.to]) { dist[e.to] = dist[u] + e.w; prev[e.to] = u; }
  }
  if (!Number.isFinite(dist[goal])) return [to];
  const chain: number[] = [];
  for (let u = goal; u >= 0; u = prev[u]) { chain.push(u); if (u === start) break; }
  chain.reverse();
  if (chain[0] !== start) return [to];

  const out: SettlementPoint[] = [];
  const push = (p: SettlementPoint) => {
    const last = out[out.length - 1];
    if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 2.5) out.push({ x: p.x, y: p.y });
  };
  if (Math.hypot(from.x - plan.pathNodes[start].x, from.y - plan.pathNodes[start].y) > 4) push(plan.pathNodes[start]);
  for (let i = 1; i < chain.length; i++) push(plan.pathNodes[chain[i]]);
  if (Math.hypot(to.x - plan.pathNodes[goal].x, to.y - plan.pathNodes[goal].y) > 4) push(plan.pathNodes[goal]);
  push(to);
  return out.length ? out : [to];
}
