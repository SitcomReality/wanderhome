// Locomotion drawn under the hull (wheels, legs, fins…), keyed by LocoDef.art ?? id.
import { LOCO } from '../../content';
import { C, TAU } from './primitives';

/** Locomotion drawn under the hull, in vehicle-local space. Unknown ids fall back to wheels. */
export function drawLoco(ctx: C, id: string, hw: number, hh: number, t: number, moving: number) {
  const ph = t * moving * 0.6;
  const art = LOCO[id]?.art ?? id;
  switch (art) {
    case 'tracks':
      for (const sy of [-1, 1]) {
        ctx.fillStyle = '#26262c'; ctx.fillRect(-hw - 2, sy * (hh + 2) - 2.6, hw * 2 + 4, 5.2);
        ctx.fillStyle = '#5a5a63';
        const off = (ph * 6) % 3;
        for (let k = -hw - 2; k < hw + 2; k += 3) ctx.fillRect(k + off, sy * (hh + 2) - 2.6, 1, 5.2);
      }
      break;
    case 'fins':
      for (const sy of [-1, 1]) for (const fx of [-hw + 5, hw - 6]) {
        const flap = Math.sin(ph * 2 + fx) * 0.5;
        ctx.save(); ctx.translate(fx, sy * hh); ctx.rotate(sy * (0.3 + flap));
        ctx.fillStyle = '#ff9f68'; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(-1, sy * 7); ctx.fill();
        ctx.restore();
      }
      break;
    case 'pontoons':
      for (const sy of [-1, 1]) {
        const bob = Math.sin(t * 2 + sy) * 0.4;
        ctx.fillStyle = '#5a3a20'; ctx.fillRect(-hw + 2, sy * hh - 0.6, 1.2, sy * 3); ctx.fillRect(hw - 3, sy * hh - 0.6, 1.2, sy * 3);
        ctx.fillStyle = '#d9a35a'; ctx.beginPath(); ctx.roundRect(-hw - 3, sy * (hh + 3.5) - 2.2 + bob, hw * 2 + 6, 4.4, 2.2); ctx.fill();
        ctx.fillStyle = '#b07a3a'; ctx.fillRect(-hw - 1, sy * (hh + 3.5) + bob, hw * 2 + 2, 0.6);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(hw + 1, sy * (hh + 3.5) - 1.5 + bob, 1.4, 3);
      }
      break;
    case 'camel': {
      const pts = [[-hw + 3, -1], [hw - 3, -1], [-hw + 3, 1], [hw - 3, 1]];
      pts.forEach(([lx, sy], i) => {
        const sw = Math.sin(ph * 2.2 + i * 1.6) * 2.5;
        ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(lx, sy * hh); ctx.lineTo(lx + sw * 0.6, sy * (hh + 3)); ctx.lineTo(lx + sw, sy * (hh + 5)); ctx.stroke();
        ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.ellipse(lx + sw, sy * (hh + 5.5), 2, 1.3, 0, 0, TAU); ctx.fill();
      });
      break;
    }
    case 'sled':
      for (const sy of [-1, 1]) {
        ctx.fillStyle = '#5b3a24'; ctx.fillRect(-hw - 1, sy * (hh + 1.5) - 1, hw * 2 + 2, 2);
        ctx.fillStyle = '#cfd8dc'; ctx.fillRect(-hw - 1, sy * (hh + 1.5) - 0.4, hw * 2 + 4, 0.8);
        ctx.beginPath(); ctx.arc(hw + 3, sy * (hh + 1.5) - sy * 1.2, 1.4, 0, TAU); ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 0.8; ctx.stroke();
      }
      break;
    case 'stilts': {
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      [[-hw + 2, -1], [hw - 2, -1], [-hw + 2, 1], [hw - 2, 1]].forEach(([lx, sy], i) => {
        const sw = Math.sin(ph * 1.8 + i * 1.7) * 3.5;
        ctx.beginPath(); ctx.moveTo(lx, sy * hh); ctx.lineTo(lx + sw, sy * (hh + 7)); ctx.stroke();
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(lx + sw - 1, sy * (hh + 7) - 1, 2, 2);
      });
      break;
    }
    case 'spider': {
      ctx.strokeStyle = '#2d2d36'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) for (const sy of [-1, 1]) {
        const lx = -hw + 3 + (i * (hw * 2 - 6)) / 3;
        const sw = Math.sin(ph * 2.5 + i * 1.6 + (sy > 0 ? Math.PI : 0)) * 3;
        ctx.beginPath(); ctx.moveTo(lx, sy * hh); ctx.lineTo(lx + sw * 0.5, sy * (hh + 6)); ctx.lineTo(lx + sw, sy * (hh + 10)); ctx.stroke();
        ctx.fillStyle = '#8e44ad'; ctx.fillRect(lx + sw * 0.5 - 0.8, sy * (hh + 6) - 0.8, 1.6, 1.6);
      }
      break;
    }
    case 'hover': {
      const p = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.fillStyle = `rgba(120,220,255,${0.25 + p * 0.2})`;
      ctx.beginPath(); ctx.ellipse(0, 0, hw + 6, hh + 6, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#3a4a5a'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.ellipse(0, 0, hw + 3, hh + 3, 0, 0, TAU); ctx.stroke();
      break;
    }
    default: {
      const xs = hw > 14 ? [-hw + 4, 0, hw - 4] : [-hw + 4, hw - 4];
      for (const wx of xs) for (const sy of [-1, 1]) {
        ctx.fillStyle = '#1e1e24'; ctx.fillRect(wx - 3.5, sy * (hh + 1.5) - 2, 7, 4);
        ctx.fillStyle = '#555';
        const off = (ph * 4) % 2.5;
        for (let k = -3; k < 4; k += 2.5) ctx.fillRect(wx + ((k + off + 3.5) % 7) - 3.5, sy * (hh + 1.5) - 2, 0.7, 4);
        ctx.fillStyle = '#c9c9c9'; ctx.fillRect(wx - 1, sy * (hh + 1.5) - 0.7, 2, 1.4);
      }
    }
  }
}
