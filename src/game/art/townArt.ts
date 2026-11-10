// Town drawing. Every settlement is assembled from its deterministic plan: streets, a plaza,
// houses with a local building tradition, and the small signs of a place that has been trading.
import type { Town } from '../world/world';
import type { SettlementHouse, SettlementPlan, SettlementStyle } from '../world/settlement';
import { settlementStyle } from '../world/settlement';
import { C, TAU, drawShadow } from './primitives';

function shadeHex(hex: string, f: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
  return `rgb(${r},${g},${b})`;
}

export function drawTown(ctx: C, town: Town, t: number, docked: boolean, plan: SettlementPlan, wealth = 0) {
  const style = settlementStyle(town);
  const prosperity = Math.max(0, Math.min(4, Math.floor(wealth / 25)));
  const x = town.x, y = town.y;
  const r = (k: number) => (town.seedv * 997 * (k + 1)) % 1;

  drawField(ctx, plan.field.x, plan.field.y, town.seedv, style.crop);
  if (town.tier === 'city') drawCityWall(ctx, plan, style);
  drawRoads(ctx, plan, style, town.tier === 'city');
  drawPlaza(ctx, plan, style, prosperity);
  drawMarket(ctx, plan, style, t, prosperity);
  drawGreen(ctx, plan.green.x, plan.green.y, town.seedv, style);

  const parts: { y: number; draw: () => void }[] = [];
  for (let i = 0; i < plan.houses.length; i++) {
    const h = plan.houses[i];
    parts.push({ y: h.y, draw: () => drawHouse(ctx, h, i, style, town, t, prosperity) });
  }
  parts.push({ y: plan.workshop.y, draw: () => drawWorkshop(ctx, plan.workshop.x, plan.workshop.y, style, t) });
  parts.push({ y: plan.well.y, draw: () => drawWell(ctx, plan.well.x, plan.well.y, style) });
  parts.push({ y: plan.watch.y, draw: () => drawWatch(ctx, plan.watch.x, plan.watch.y, style, town.tier === 'city' || town.tier === 'town', t) });
  parts.push({ y: plan.gate.y, draw: () => drawGate(ctx, plan.gate.x, plan.gate.y, style, docked) });
  parts.sort((a, b) => a.y - b.y);
  for (const p of parts) p.draw();

  // The name board at the gate. Small enough to feel like part of the place.
  ctx.save();
  ctx.font = 'bold 5px ui-rounded, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(30,24,20,0.7)';
  ctx.strokeText(town.name, plan.gate.x, plan.gate.y - 16);
  ctx.fillStyle = '#fff3cf';
  ctx.fillText(town.name, plan.gate.x, plan.gate.y - 16);
  ctx.restore();

  drawLamps(ctx, plan, style, prosperity);
  drawChickens(ctx, plan, town, t);
  drawBanners(ctx, plan, style, t, prosperity);

  // Town-centre sign and flag. Kept tiny; the streets do most of the storytelling.
  ctx.fillStyle = '#4e342e'; ctx.fillRect(x - 1, y - 28, 1.2, 18);
  ctx.fillStyle = docked ? '#2ecc71' : '#f1c40f';
  const wv = Math.sin(t * 4) * 1.5;
  ctx.beginPath(); ctx.moveTo(x, y - 28); ctx.lineTo(x + 8, y - 26 + wv); ctx.lineTo(x, y - 22); ctx.fill();
  if (prosperity >= 3) {
    ctx.fillStyle = style.trim; ctx.fillRect(x + 5, y - 25, 1, 5);
    ctx.fillStyle = style.roof; ctx.beginPath(); ctx.moveTo(x + 6, y - 25); ctx.lineTo(x + 12, y - 24 + wv); ctx.lineTo(x + 6, y - 21); ctx.fill();
  }
  if (r(9) > 0.5) {
    ctx.fillStyle = 'rgba(240,235,220,0.35)';
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.08 + i * 0.31) % 1;
      ctx.beginPath(); ctx.arc(x - 5 - p * 12, y - 30 - p * 14, 1.2 + p * 2.5, 0, TAU); ctx.fill();
    }
  }
}

function drawRoads(ctx: C, plan: SettlementPlan, style: SettlementStyle, city: boolean) {
  const stone = city || style.foundation === 'stone';
  ctx.save();
  ctx.lineCap = 'round';
  for (const road of plan.roads) {
    ctx.strokeStyle = road.kind === 'foot' ? 'rgba(152,124,84,0.6)' : stone ? 'rgba(144,139,129,0.8)' : 'rgba(163,133,91,0.7)';
    ctx.lineWidth = road.kind === 'foot' ? 1.2 : road.width;
    ctx.beginPath(); ctx.moveTo(road.x1, road.y1); ctx.lineTo(road.x2, road.y2); ctx.stroke();
    if (road.kind !== 'foot') {
      ctx.strokeStyle = stone ? 'rgba(206,201,188,0.4)' : 'rgba(196,164,116,0.42)';
      ctx.lineWidth = Math.max(0.7, road.width * 0.32);
      ctx.beginPath(); ctx.moveTo(road.x1, road.y1); ctx.lineTo(road.x2, road.y2); ctx.stroke();
    }
  }
  // Paving around the centre.
  ctx.fillStyle = stone ? 'rgba(156,150,138,0.55)' : 'rgba(174,145,102,0.5)';
  ctx.beginPath(); ctx.ellipse(plan.center.x, plan.center.y, plan.plaza * 0.92, plan.plaza * 0.7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = stone ? 'rgba(192,186,174,0.4)' : 'rgba(197,168,122,0.35)';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.fillRect(plan.center.x + Math.cos(a) * plan.plaza * 0.3 - 0.8, plan.center.y + Math.sin(a) * plan.plaza * 0.22 - 0.5, 1.6, 1);
  }
  ctx.restore();
  // A little grass reclaiming the edges of the road.
  ctx.fillStyle = 'rgba(111,158,79,0.35)';
  for (let i = 0; i < plan.roads.length; i += 3) {
    const road = plan.roads[i];
    ctx.fillRect(Math.min(road.x1, road.x2) + 2, Math.min(road.y1, road.y2) - 1, 1.2, 1.2);
  }
}

function drawPlaza(ctx: C, plan: SettlementPlan, style: SettlementStyle, prosperity: number) {
  const x = plan.center.x, y = plan.center.y;
  drawShadow(ctx, x, y + 2, plan.plaza * 0.8, plan.plaza * 0.45);
  // A worn noticeboard. Its pinned notes get more numerous as the town prospers.
  const bx = x - plan.plaza * 0.45, by = y - plan.plaza * 0.25;
  ctx.fillStyle = '#6b4226'; ctx.fillRect(bx - 4, by - 6, 1.2, 9); ctx.fillRect(bx + 3, by - 6, 1.2, 9);
  ctx.fillStyle = '#8d6e63'; ctx.fillRect(bx - 5, by - 7, 10, 5);
  ctx.fillStyle = '#f3e3c3'; ctx.fillRect(bx - 3, by - 6, 2, 2); ctx.fillRect(bx, by - 6, 2, 2);
  if (prosperity >= 1) { ctx.fillStyle = '#ffe08a'; ctx.fillRect(bx + 2.5, by - 5.5, 1.5, 1.2); }
  // Benches.
  for (const side of [-1, 1]) {
    const px = x + side * plan.plaza * 0.55, py = y + plan.plaza * 0.25;
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(px - 3, py, 6, 1.2);
    ctx.fillStyle = '#5d4037'; ctx.fillRect(px - 2.6, py + 1.2, 1, 1.8); ctx.fillRect(px + 1.6, py + 1.2, 1, 1.8);
  }
  // Specialty crate: the thing this town is known for.
  const goods = style.specialty.split(',')[0];
  if (goods && goods !== 'whatever the road brings') {
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(x + plan.plaza * 0.45, y + plan.plaza * 0.34, 4, 3);
    ctx.fillStyle = style.roof; ctx.fillRect(x + plan.plaza * 0.45 + 0.7, y + plan.plaza * 0.34 + 0.5, 2.6, 1.8);
  }
}

function drawMarket(ctx: C, plan: SettlementPlan, style: SettlementStyle, t: number, prosperity: number) {
  const count = Math.min(8, 1 + (plan.tier === 'city' ? 4 : plan.tier === 'town' ? 3 : plan.tier === 'village' ? 2 : 1) + Math.floor(prosperity / 2));
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + 0.4;
    const rad = plan.plaza * 0.86;
    const x = plan.center.x + Math.cos(a) * rad, y = plan.center.y + Math.sin(a) * rad * 0.72;
    drawShadow(ctx, x, y + 1.5, 5, 2);
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 4, y - 2, 8, 3);
    ctx.fillStyle = i % 2 ? style.roof : style.trim;
    ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x, y - 8); ctx.lineTo(x + 5, y - 5); ctx.fill();
    ctx.fillStyle = i % 2 ? '#f3e3c3' : style.wall;
    ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x - 3, y - 4.5); ctx.lineTo(x - 3, y - 6.5); ctx.fill();
    if (prosperity >= 2) { ctx.fillStyle = '#ffe9a8'; ctx.fillRect(x - 1, y - 4.5, 1.2, 1); }
    for (let g = 0; g < 3; g++) {
      ctx.fillStyle = ['#ffd166', '#e07a9a', '#7fb069', '#b07cff'][(i + g) % 4];
      ctx.fillRect(x - 3.5 + g * 2.3, y - 3.6 + Math.sin(t * 1.5 + i + g) * 0.2, 1.3, 1.3);
    }
  }
}

function drawCityWall(ctx: C, plan: SettlementPlan, style: SettlementStyle) {
  const R = plan.radius + 8;
  ctx.save();
  ctx.strokeStyle = style.foundation === 'stone' ? '#8e8980' : '#a59374';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  // Four gaps, one aligned with the main gate, so the wall reads as a wall and not a fence.
  const gateA = Math.atan2(plan.gate.y - plan.center.y, plan.gate.x - plan.center.x);
  for (let i = 0; i < 4; i++) {
    const a0 = gateA + (i / 4) * TAU + 0.34, a1 = gateA + ((i + 1) / 4) * TAU - 0.34;
    ctx.moveTo(plan.center.x + Math.cos(a0) * R, plan.center.y + Math.sin(a0) * R);
    ctx.arc(plan.center.x, plan.center.y, R, a0, a1);
  }
  ctx.stroke();
  ctx.fillStyle = '#6f6a63';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    ctx.fillRect(plan.center.x + Math.cos(a) * R - 1.2, plan.center.y + Math.sin(a) * R - 1.2, 2.4, 2.4);
  }
  ctx.restore();
}

function roof(ctx: C, x: number, w: number, h: number, style: SettlementStyle, seed: number, wallTop: number) {
  const baseRoof = seed > 0.74 ? shadeHex(style.roof2, 0.9 + seed * 0.2) : shadeHex(style.roof, 0.82 + seed * 0.32);
  ctx.fillStyle = baseRoof;
  if (style.roofShape === 'flat') {
    ctx.fillRect(x - w / 2, wallTop - h * 0.38, w, h * 0.38);
    ctx.fillStyle = style.trim; ctx.fillRect(x - w / 2 - 0.8, wallTop - h * 0.38, w + 1.6, 0.8);
    for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * (w / 3), wallTop - h * 0.38 - 0.7, 1, 1.1);
  } else if (style.roofShape === 'thatch') {
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 1, wallTop);
    ctx.quadraticCurveTo(x - w / 3, wallTop - h, x, wallTop - h * 1.02);
    ctx.quadraticCurveTo(x + w / 3, wallTop - h, x + w / 2 + 1, wallTop);
    ctx.fill();
    ctx.strokeStyle = 'rgba(83,65,42,0.55)'; ctx.lineWidth = 0.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(x + i * w * 0.16, wallTop - h * 0.18); ctx.lineTo(x + i * w * 0.24, wallTop - h * 0.8); ctx.stroke();
    }
  } else {
    const tall = style.roofShape === 'steep' ? 1.55 : 1;
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 1, wallTop); ctx.lineTo(x, wallTop - h * tall); ctx.lineTo(x + w / 2 + 1, wallTop); ctx.fill();
    ctx.fillStyle = seed > 0.6 ? style.roof2 : style.wall; ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.moveTo(x, wallTop - h * tall); ctx.lineTo(x + w / 2 + 1, wallTop); ctx.lineTo(x + 1, wallTop); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (style.foundation === 'snow') {
    ctx.fillStyle = 'rgba(240,248,255,0.92)';
    ctx.beginPath();
    if (style.roofShape === 'flat') ctx.fillRect(x - w / 2, wallTop - h * 0.38 - 0.5, w, 1.4);
    else {
      const peak = wallTop - h * (style.roofShape === 'steep' ? 1.55 : 1);
      const capY = peak + (wallTop - peak) * 0.36;
      ctx.moveTo(x - w * 0.2, capY); ctx.lineTo(x, peak); ctx.lineTo(x + w * 0.2, capY); ctx.closePath();
    }
    ctx.fill();
  }
}

function drawHouse(ctx: C, h: SettlementHouse, i: number, style: SettlementStyle, town: Town, t: number, prosperity: number) {
  const x = h.x, y = h.y;
  const seed = h.seed;
  const w = 11 + (seed > 0.8 ? 1 : 0);
  const tall = town.tier === 'city' && seed > 0.54;
  const bodyH = tall ? 11 : 8;
  const wallTop = y - bodyH - 0.5;
  drawShadow(ctx, x, y + 1, w / 2 + (tall ? 2 : 1.5), 2.4);
  if (style.foundation === 'stilts') {
    ctx.fillStyle = '#5d4037';
    for (const sx of [-w * 0.34, w * 0.34]) { ctx.fillRect(x + sx, y - 2, 1.3, 4); }
    ctx.fillStyle = '#4e3a2c'; ctx.fillRect(x - w / 2 - 1, y - 4, w + 2, 1.2);
  } else if (style.foundation === 'stone') {
    ctx.fillStyle = '#77736d'; ctx.fillRect(x - w / 2 - 1, y - 2.5, w + 2, 3.5);
    ctx.fillStyle = '#8e8980'; for (let k = -2; k <= 2; k += 2) ctx.fillRect(x + k * 2.5, y - 2.2, 1.4, 1.2);
  } else if (style.foundation === 'snow') {
    ctx.fillStyle = 'rgba(240,248,255,0.8)'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.65, 2.2, 0, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = shadeHex(style.wall, 0.92 + seed * 0.12); ctx.fillRect(x - w / 2, wallTop, w, bodyH);
  ctx.fillStyle = style.trim;
  ctx.fillRect(x - w / 2, wallTop + bodyH * 0.6, w, 0.8);
  for (const sx of [-w / 2, -w / 2 + 1, w / 2 - 1]) ctx.fillRect(x + sx, wallTop, 0.8, bodyH);
  if (tall) {
    ctx.fillStyle = style.trim; ctx.fillRect(x - w / 2, y - 7.3, w, 0.7);
    ctx.fillStyle = prosperity >= 2 ? '#ffe9a8' : '#8fb6c2';
    ctx.fillRect(x - w / 2 + 1.8, y - 9.2, 1.6, 1.5);
    ctx.fillRect(x + w / 2 - 3.4, y - 9.2, 1.6, 1.5);
  }
  // Door and windows. More lamps and flower boxes as the town gets comfortable.
  ctx.fillStyle = '#5d4037'; ctx.fillRect(x - 1.2, y - 3.4, 2.4, 3.4);
  ctx.fillStyle = prosperity >= 2 ? '#ffe9a8' : '#8fb6c2';
  ctx.fillRect(x - w / 2 + 1.8, y - 6.2, 1.8, 1.8);
  ctx.fillRect(x + w / 2 - 3.6, y - 6.2, 1.8, 1.8);
  if (prosperity >= 2) { ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x - 1.6, y - 7.8, 3.2, 0.7); }
  if (style.detail === 'flowers' || prosperity >= 3) {
    ctx.fillStyle = prosperity % 2 ? '#e07a9a' : '#f2c14e';
    ctx.fillRect(x - w / 2 + 1.5, y - 4.6, 2, 1.2);
    ctx.fillStyle = '#6f9e4f'; ctx.fillRect(x - w / 2 + 1.5, y - 3.6, 2, 0.6);
  }
  roof(ctx, x, w, tall ? 11 : 10, style, seed, wallTop);
  // Chimney and a lazy thread of smoke.
  if (seed > 0.35) {
    ctx.fillStyle = '#6d5a4d'; ctx.fillRect(x + w * 0.2, wallTop - 8, 2, 5);
    if (tall) { ctx.fillStyle = style.trim; ctx.fillRect(x + w * 0.2 - 0.7, wallTop - 8.8, 3.4, 0.8); }
    const phase = (t * 0.22 + seed) % 1;
    ctx.fillStyle = `rgba(228,225,220,${0.42 - phase * 0.3})`;
    ctx.beginPath(); ctx.arc(x + w * 0.2 + 1 + phase * 4, wallTop - 9 - phase * 9, 1 + phase * 2.2, 0, TAU); ctx.fill();
  }
  if (style.detail === 'icicles') {
    ctx.fillStyle = 'rgba(220,245,255,0.9)';
    ctx.fillRect(x - w / 2 + 1, wallTop - 0.4, 1.2, 1.8); ctx.fillRect(x + w / 2 - 2.8, wallTop - 0.4, 1, 2.4);
  } else if (style.detail === 'crystals') {
    ctx.fillStyle = '#b07cff'; ctx.beginPath(); ctx.moveTo(x + w / 2 - 1, wallTop - 1); ctx.lineTo(x + w / 2 + 0.5, wallTop - 6); ctx.lineTo(x + w / 2 + 2, wallTop - 1); ctx.fill();
  } else if (style.detail === 'mushrooms') {
    ctx.fillStyle = '#c78bff'; ctx.beginPath(); ctx.arc(x - w / 2 - 1, y - 1, 1.6, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f3e3c3'; ctx.fillRect(x - w / 2 - 1.5, y - 1, 1, 1.4);
  } else if (style.detail === 'bones') {
    ctx.fillStyle = '#efe6cf'; ctx.fillRect(x + w / 2 - 2, wallTop - 2.5, 3, 0.8); ctx.fillRect(x + w / 2 - 1.2, wallTop - 3.3, 0.8, 2.5);
  } else if (style.detail === 'nets') {
    ctx.strokeStyle = 'rgba(220,210,180,0.7)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 2, y - 1); ctx.lineTo(x - w / 2 - 2, y - 6); ctx.lineTo(x - w / 2 + 2, y - 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 1.4, y - 5.6); ctx.lineTo(x - w / 2 + 1.5, y - 1.2); ctx.moveTo(x - w / 2 + 1.5, y - 5.4); ctx.lineTo(x - w / 2 - 1.4, y - 1.2); ctx.stroke();
    ctx.fillStyle = '#7fd1e8'; ctx.fillRect(x - w / 2 - 2, y - 1.6, 1.2, 0.7);
  } else if (style.detail === 'lanterns') {
    ctx.fillStyle = '#4e342e'; ctx.fillRect(x - w / 2 - 1, y - 6, 1, 6);
    ctx.fillStyle = '#ffe9a8'; ctx.fillRect(x - w / 2 - 1.5, y - 7, 2, 1.3);
  }
  if (tall && seed > 0.62) {
    ctx.fillStyle = style.trim; ctx.fillRect(x - w / 2 - 1, y - 8.1, w + 2, 0.8);
    for (let b = -2; b <= 2; b++) ctx.fillRect(x + b * w * 0.18, y - 8.1, 0.5, 1.4);
  }
  if (tall && seed < 0.3) {
    ctx.fillStyle = seed < 0.15 ? style.roof : style.trim;
    ctx.beginPath(); ctx.moveTo(x - 2.8, y - 4.2); ctx.lineTo(x, y - 5.2); ctx.lineTo(x + 2.8, y - 4.2); ctx.fill();
  }
  if (prosperity >= 4 && i % 2 === 0) {
    ctx.fillStyle = style.trim; ctx.fillRect(x - w / 2 - 2, y - 8, 0.8, 8);
    ctx.fillStyle = style.roof; ctx.beginPath(); ctx.moveTo(x - w / 2 - 1.2, y - 8); ctx.lineTo(x - w / 2 + 2, y - 7); ctx.lineTo(x - w / 2 - 1.2, y - 5.8); ctx.fill();
  }
  if (town.tier === 'hamlet') {
    ctx.fillStyle = '#d9b88a'; ctx.fillRect(x + w / 2 + 1, y - 2, 2, 1.4); // a bench, and perhaps a cat
  }
}

function drawWorkshop(ctx: C, x: number, y: number, style: SettlementStyle, t: number) {
  drawShadow(ctx, x, y + 1, 9, 2.5);
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 8, y - 3, 16, 3);
  ctx.fillStyle = style.wall; ctx.fillRect(x - 8, y - 13, 16, 10);
  ctx.fillStyle = style.trim; ctx.fillRect(x - 8, y - 8, 16, 1);
  ctx.fillStyle = '#5d4037'; ctx.fillRect(x + 3, y - 6, 4, 6);
  ctx.fillStyle = '#ffe9a8'; ctx.fillRect(x - 5, y - 11, 3, 2.4);
  ctx.fillStyle = style.roof; ctx.beginPath(); ctx.moveTo(x - 10, y - 13); ctx.lineTo(x - 2, y - 19); ctx.lineTo(x + 10, y - 13); ctx.fill();
  // A waterwheel / gear sign, because this is where the blueprints live.
  ctx.save(); ctx.translate(x - 7, y - 15); ctx.rotate(t * 0.25);
  ctx.strokeStyle = style.trim; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, TAU); ctx.stroke();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 2.2, Math.sin(a) * 2.2); ctx.lineTo(Math.cos(a) * 3.5, Math.sin(a) * 3.5); ctx.stroke(); }
  ctx.restore();
  const smoke = (t * 0.3) % 1;
  ctx.fillStyle = `rgba(220,216,208,${0.38 - smoke * 0.28})`; ctx.beginPath(); ctx.arc(x - 2 + smoke * 3, y - 21 - smoke * 8, 1.4 + smoke * 2, 0, TAU); ctx.fill();
}

function drawWell(ctx: C, x: number, y: number, style: SettlementStyle) {
  drawShadow(ctx, x, y + 1, 6, 2);
  ctx.fillStyle = '#77797c'; ctx.beginPath(); ctx.ellipse(x, y, 6, 3.8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3f4b56'; ctx.beginPath(); ctx.ellipse(x, y - 0.5, 4, 2.3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = style.trim; ctx.fillRect(x - 4.5, y - 9, 1.2, 7); ctx.fillRect(x + 3.3, y - 9, 1.2, 7);
  ctx.fillStyle = style.roof; ctx.beginPath(); ctx.moveTo(x - 6, y - 9); ctx.lineTo(x, y - 13); ctx.lineTo(x + 6, y - 9); ctx.fill();
  ctx.fillStyle = '#e8d8b8'; ctx.fillRect(x - 1, y - 8, 2, 2.5);
  ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y - 5); ctx.stroke();
}

function drawWatch(ctx: C, x: number, y: number, style: SettlementStyle, second: boolean, t: number) {
  const tower = (tx: number, ty: number) => {
    drawShadow(ctx, tx, ty + 1, 4, 2);
    ctx.fillStyle = style.foundation === 'stone' ? '#77736d' : '#5d4037'; ctx.fillRect(tx - 1.8, ty - 14, 3.6, 14);
    ctx.fillStyle = style.trim; ctx.fillRect(tx - 4, ty - 16, 8, 2.5);
    ctx.fillStyle = style.roof; ctx.beginPath(); ctx.moveTo(tx - 5, ty - 16); ctx.lineTo(tx, ty - 21); ctx.lineTo(tx + 5, ty - 16); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.fillRect(tx - 0.5, ty - 18, 1, 2);
    const glow = 0.25 + 0.08 * Math.sin(t * 2 + tx);
    ctx.fillStyle = `rgba(255,209,102,${glow})`; ctx.beginPath(); ctx.arc(tx + 1, ty - 14, 3, 0, TAU); ctx.fill();
  };
  tower(x, y);
  if (second) tower(x < 0 ? x + 12 : x - 12, y + 2);
}

function drawGate(ctx: C, x: number, y: number, style: SettlementStyle, docked: boolean) {
  drawShadow(ctx, x, y + 1, 10, 2);
  ctx.fillStyle = style.trim; ctx.fillRect(x - 8, y - 11, 2.4, 11); ctx.fillRect(x + 5.6, y - 11, 2.4, 11);
  ctx.fillStyle = style.wall; ctx.fillRect(x - 8, y - 12, 16, 2.2);
  ctx.fillStyle = style.roof; ctx.fillRect(x - 9, y - 14, 18, 2);
  ctx.fillStyle = '#f3e3c3'; ctx.fillRect(x - 2, y - 10, 4, 3);
  ctx.fillStyle = '#8d6e63'; ctx.fillRect(x - 1, y - 8, 2, 1.2);
  ctx.fillStyle = docked ? '#2ecc71' : '#ffd166';
  ctx.beginPath(); ctx.arc(x, y - 9, 0.8, 0, TAU); ctx.fill();
}

function drawLamps(ctx: C, plan: SettlementPlan, style: SettlementStyle, prosperity: number) {
  const count = 3 + prosperity + (plan.tier === 'city' ? 2 : 0);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + 0.15;
    const x = plan.center.x + Math.cos(a) * plan.plaza * 0.72, y = plan.center.y + Math.sin(a) * plan.plaza * 0.55;
    ctx.fillStyle = '#4e342e'; ctx.fillRect(x, y - 7, 1, 7);
    ctx.fillStyle = style.trim; ctx.fillRect(x - 1, y - 8, 3, 1.2);
    ctx.fillStyle = '#ffe9a8'; ctx.fillRect(x, y - 7.5, 1, 1.2);
  }
}

function drawBanners(ctx: C, plan: SettlementPlan, style: SettlementStyle, t: number, prosperity: number) {
  if (prosperity < 1) return;
  const n = 2 + prosperity;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + 0.9;
    const x = plan.center.x + Math.cos(a) * plan.plaza * 0.8, y = plan.center.y + Math.sin(a) * plan.plaza * 0.6;
    ctx.fillStyle = '#5d4037'; ctx.fillRect(x, y - 12, 0.8, 12);
    const flap = Math.sin(t * 3 + i) * 1.2;
    ctx.fillStyle = i % 2 ? style.roof : style.trim;
    ctx.beginPath(); ctx.moveTo(x + 0.8, y - 12); ctx.lineTo(x + 6 + flap, y - 10.5); ctx.lineTo(x + 0.8, y - 8); ctx.fill();
  }
}

function drawGreen(ctx: C, x: number, y: number, seed: number, style: SettlementStyle) {
  ctx.fillStyle = 'rgba(111,158,79,0.3)';
  ctx.beginPath(); ctx.ellipse(x, y, 16, 10, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + seed * 3;
    ctx.fillStyle = i % 3 ? '#8fbe63' : style.detail === 'flowers' || style.detail === 'mushrooms' ? '#e07a9a' : '#d9d26a';
    ctx.fillRect(x + Math.cos(a) * (5 + (i % 4) * 2), y + Math.sin(a) * (3 + (i % 3) * 2), 1.2, 1.2);
  }
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x + 8, y - 3, 4, 1.2);
}

function drawField(ctx: C, x: number, y: number, seed: number, crop: SettlementStyle['crop']) {
  const dry = crop === 'dates';
  const wet = crop === 'rice';
  ctx.fillStyle = wet ? 'rgba(75,103,58,0.52)' : dry ? 'rgba(132,102,58,0.45)' : 'rgba(92,70,44,0.5)';
  ctx.beginPath(); ctx.ellipse(x, y, 21, 13, 0, 0, TAU); ctx.fill();
  const cropColor = crop === 'glowbeans' ? '#b07cff' : crop === 'rice' ? '#9bc06a' : crop === 'dates' ? '#d8a34a' : crop === 'rye' ? '#d9c06a' : crop === 'sea kale' ? '#7fb8a2' : '#6f9e4f';
  ctx.strokeStyle = '#5b422d'; ctx.lineWidth = 1;
  for (let row = -8; row <= 8; row += 8) {
    ctx.beginPath(); ctx.moveTo(x - 16, y + row); ctx.lineTo(x + 16, y + row); ctx.stroke();
    for (let col = -13; col <= 13; col += 5) {
      const n = ((col * 7 + row * 11 + Math.floor(seed * 100)) % 5 + 5) % 5;
      ctx.fillStyle = n === 0 ? '#f2c14e' : n === 1 ? cropColor : '#6f9e4f';
      ctx.fillRect(x + col, y + row - 1, 1.6, 2.4);
    }
  }
  if (wet) {
    ctx.fillStyle = 'rgba(127,209,232,0.22)';
    ctx.fillRect(x - 16, y - 1, 32, 0.8); ctx.fillRect(x - 16, y + 7, 32, 0.8);
  }
  ctx.fillStyle = '#7a5a3a';
  for (let i = -20; i <= 20; i += 9) { ctx.fillRect(x + i, y - 15, 1.2, 4); ctx.fillRect(x + i, y + 11, 1.2, 4); }
  ctx.strokeStyle = 'rgba(122,90,58,0.8)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(x - 19, y - 13); ctx.lineTo(x + 19, y - 13); ctx.moveTo(x - 19, y + 13); ctx.lineTo(x + 19, y + 13); ctx.stroke();
}

function drawChickens(ctx: C, plan: SettlementPlan, town: Town, t: number) {
  const count = town.tier === 'city' ? 5 : town.tier === 'town' ? 4 : town.tier === 'village' ? 2 : 1;
  for (let i = 0; i < count; i++) {
    const a = ((town.seedv * 97 + i * 1.7) % 1) * TAU;
    const rad = plan.plaza * (0.3 + ((town.seedv * 31 + i * 0.23) % 1) * 0.55);
    const x = plan.center.x + Math.cos(a) * rad, y = plan.center.y + Math.sin(a) * rad * 0.7 + 2;
    const peck = Math.sin(t * 2.5 + i * 2) > 0.65 ? 1 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, y + 0.8, 2.2, 0.7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = i % 3 ? '#f3e3c3' : '#c98b4b'; ctx.beginPath(); ctx.ellipse(x, y - 1, 1.8, 1.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d64545'; ctx.fillRect(x + 1.2, y - 2.6, 0.8, 0.8);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x + 1.9 + peck * 0.4, y - 1.6 + peck * 0.5, 0.7, 0.5);
    ctx.fillStyle = '#3a2d28'; ctx.fillRect(x - 1.2, y - 1.5, 0.5, 0.5);
  }
}
