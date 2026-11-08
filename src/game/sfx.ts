let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const last: Record<string, number> = {};
export const sfxState = { enabled: false, volume: 0.35 };

function ac() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.connect(ctx.destination);
  }
  master!.gain.value = sfxState.volume;
  return ctx;
}

export function sfx(kind: 'pick' | 'coin' | 'shot' | 'boom' | 'hit' | 'zap' | 'buy' | 'chop' | 'pop' | 'hurt', pitch = 1) {
  if (!sfxState.enabled) return;
  const now = performance.now();
  const gap = kind === 'shot' ? 70 : kind === 'pick' || kind === 'coin' ? 45 : 60;
  if (last[kind] && now - last[kind] < gap) return;
  last[kind] = now;
  try {
    const a = ac();
    const t = a.currentTime;
    const g = a.createGain();
    g.connect(master!);
    if (kind === 'boom' || kind === 'hit' || kind === 'chop') {
      const len = kind === 'boom' ? 0.5 : 0.08;
      const buf = a.createBuffer(1, Math.floor(a.sampleRate * len), a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, kind === 'boom' ? 2 : 4);
      const src = a.createBufferSource();
      src.buffer = buf;
      const f = a.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = kind === 'boom' ? 700 : kind === 'chop' ? 2200 * pitch : 1400;
      src.connect(f); f.connect(g);
      g.gain.value = kind === 'boom' ? 0.9 : 0.35;
      src.start(t);
      return;
    }
    const o = a.createOscillator();
    o.connect(g);
    const cfg: Record<string, [OscillatorType, number, number, number, number]> = {
      pick: ['triangle', 660, 990, 0.08, 0.2],
      coin: ['square', 988, 1318, 0.09, 0.12],
      shot: ['square', 220, 90, 0.04, 0.06],
      zap: ['sawtooth', 1200, 200, 0.12, 0.1],
      buy: ['triangle', 523, 1046, 0.18, 0.25],
      pop: ['sine', 500, 1200, 0.06, 0.2],
      hurt: ['sawtooth', 300, 80, 0.2, 0.15],
    };
    const [type, f0, f1, dur, vol] = cfg[kind];
    o.type = type;
    o.frequency.setValueAtTime(f0 * pitch, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f1 * pitch), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {
    /* ignore */
  }
}
