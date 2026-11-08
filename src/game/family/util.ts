// Little helpers shared by the family systems.


// Legacy, Scrapbook, Milestones and Visitors: everything that connects a run to the family meta.
// The engine only calls small hooks (onDiscover, legacyTick, permMul, ...). The rest lives here.
export const pick = <T,>(a: T[]): T => a[(Math.random() * a.length) | 0];

export const fill = (tpl: string, v: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? k);
