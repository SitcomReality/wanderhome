import { MOD, LOCO, FRAME, ModuleDef, GRID_MAX_W, Res } from '../content/index';

export interface Note { text: string; good: boolean }
export interface CellEff {
  idx: number; def: ModuleDef; gx: number; gy: number; edge: boolean;
  mul: number; range: number; rate: number; burn: number; power: number; notes: Note[];
}
export interface Stats {
  powerMax: number; weight: number; cargoCap: number; maxHp: number; regen: number; comfort: number;
  spikes: number; magnet: number; shield: number; scare: number; solarMul: number; dps: number; light: number; preserve: boolean;
  cells: Map<number, CellEff>; upkeep: Partial<Record<Res, number>>; cellCount: number;
}

export function computeStats(grid: (string | null)[], gw: number, gh: number, locoId: string, frameId: string): Stats {
  const frame = FRAME[frameId] ?? FRAME.f_timber;
  const loco = LOCO[locoId] ?? LOCO.wheels;
  const at = (x: number, y: number): ModuleDef | null => {
    if (x < 0 || y < 0 || x >= gw || y >= gh) return null;
    const id = grid[y * GRID_MAX_W + x];
    return id ? MOD[id] ?? null : null;
  };
  const cells = new Map<number, CellEff>();
  const s: Stats = {
    powerMax: 0, weight: frame.wpc * gw * gh + loco.weight, cargoCap: 20, maxHp: 60 + frame.hpc * gw * gh + loco.hp, regen: 0.3 + (frame.rpc ?? 0) * gw * gh,
    comfort: frame.comfort ?? 0, spikes: 0, magnet: 40, shield: 0, scare: 0, solarMul: frame.solarMul ?? 1, dps: 0, light: 0, preserve: false,
    cells, upkeep: {}, cellCount: gw * gh,
  };

  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const d = at(gx, gy);
    if (!d) continue;
    const idx = gy * GRID_MAX_W + gx;
    const nb = [at(gx - 1, gy), at(gx + 1, gy), at(gx, gy - 1), at(gx, gy + 1)].filter(Boolean) as ModuleDef[];
    const count = (fn: (m: ModuleDef) => boolean) => nb.filter(fn).length;
    const noisyN = count((m) => !!m.tags?.includes('noisy'));
    const hotN = count((m) => !!m.tags?.includes('hot'));
    const coldN = count((m) => !!m.tags?.includes('cold'));
    const cozyN = count((m) => (m.comfort ?? 0) > 0);
    const plantN = count((m) => m.id === 'plant' || m.id === 'hedge');
    const edge = gx === 0 || gy === 0 || gx === gw - 1 || gy === gh - 1;
    const e: CellEff = { idx, def: d, gx, gy, edge, mul: 1, range: 1, rate: 1, burn: 1, power: 1, notes: [] };

    if (d.tags?.includes('edge')) {
      if (edge) e.notes.push({ text: 'Mounted on the hull edge', good: true });
      else {
        if (d.harvest || d.weapon) { e.range = 0.6; e.notes.push({ text: 'Stuck inside the hull: −40% reach', good: false }); }
        if (d.hp && d.hp > 0) { e.mul = 0.5; e.notes.push({ text: 'Inner plating: only half the hull bonus', good: false }); }
        if (d.spikes) e.notes.push({ text: 'Spikes do nothing inside the hull!', good: false });
      }
    }
    if ((d.comfort ?? 0) > 0) {
      let m = 1;
      if (cozyN) { m += 0.25 * cozyN; e.notes.push({ text: `Cozy corner: +${25 * cozyN}% (${cozyN} comfy neighbour${cozyN > 1 ? 's' : ''})`, good: true }); }
      if (hotN && !d.tags?.includes('hot')) { m += 0.2; e.notes.push({ text: 'Toasty warmth: +20%', good: true }); }
      if (noisyN) { m -= 0.4 * noisyN; e.notes.push({ text: `Racket next door: −${40 * noisyN}%`, good: false }); }
      if (d.id === 'library' && noisyN) { m = 0; e.notes.push({ text: "Too noisy to read! (no comfort)", good: false }); }
      e.mul = d.id === 'library' ? Math.max(0, m) : Math.max(0.2, m);
    }
    if (d.process?.heatLoving && hotN) { e.rate = Math.min(2, 1 + 0.5 * hotN); e.notes.push({ text: `Shared heat: ${Math.round(e.rate * 100)}% speed`, good: true }); }
    if (d.weapon && coldN) { e.rate *= 1.25; e.notes.push({ text: 'Coolant nearby: +25% fire rate', good: true }); }
    if (d.burns && d.tags?.includes('hot') && coldN) { e.burn = 0.7; e.notes.push({ text: 'Cooled: burns 30% less fuel', good: true }); }
    if (d.id === 'frost' && hotN) { e.power = 1.3; e.notes.push({ text: 'Heat exchange: +30% power', good: true }); }
    if (d.id === 'hamster' && plantN) { e.power = 1.4; e.notes.push({ text: 'Happy hamster (plants!): +40% power', good: true }); }
    if (d.solar && s.solarMul > 1) { e.power *= s.solarMul; e.notes.push({ text: `Glass dome: ×${s.solarMul} sunlight`, good: true }); }
    if (d.id === 'balloon' && hotN) { e.mul = 1.6; e.notes.push({ text: 'Hot air! +60% lift', good: true }); }
    if (d.id === 'balloon' && noisyN === 0 && hotN === 0) e.notes.push({ text: 'Tip: put something hot next to it for more lift', good: true });
    if (d.tags?.includes('noisy') && cozyN) e.notes.push({ text: 'Noisy: bothering comfy neighbours', good: false });

    cells.set(idx, e);
    s.weight += d.weight < 0 ? d.weight * e.mul : d.weight;
    if (d.power) s.powerMax += d.power > 0 ? d.power * e.power : d.power;
    if (d.cargo) s.cargoCap += d.cargo;
    if (d.hp) s.maxHp += d.hp > 0 && d.tags?.includes('edge') ? d.hp * e.mul : d.hp;
    if (d.regen) s.regen += d.regen;
    if (d.comfort) s.comfort += d.comfort > 0 ? d.comfort * e.mul : d.comfort;
    if (d.spikes && edge) s.spikes += d.spikes;
    if (d.harvest?.magnet) s.magnet += d.harvest.magnet;
    if (d.shield) s.shield += d.shield;
    if (d.scare) s.scare += d.scare;
    if (d.light) s.light += d.light;
    if (d.preserve) s.preserve = true;
    if (d.weapon) s.dps += d.weapon.dmg * d.weapon.rate * e.rate * (d.weapon.splash ? 1.6 : 1);
    if (d.burns) s.upkeep[d.burns.res] = (s.upkeep[d.burns.res] ?? 0) + d.burns.rate * e.burn;
  }
  s.maxHp = Math.max(30, Math.round(s.maxHp));
  s.comfort = Math.round(s.comfort * 10) / 10;
  s.weight = Math.max(1, s.weight);
  return s;
}
