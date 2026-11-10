import type { CatDef, ResidentDef, ResidentRole, ResidentTrait } from './types';

/**
 * RESIDENTS: Homeport's hand-written people, plus the vocabulary used to generate the rest
 * of the world's settlements. Generated residents are deterministic for a town and index;
 * their names are not a save contract, but their ids are stable while that town exists.
 */
export const RESIDENTS: ResidentDef[] = [
  {
    id: 'mira', name: 'Mira', role: 'gardener', trait: 'bold',
    color: '#7fb069', accent: '#f2c14e', quirk: 'negotiates with vegetables',
    line: 'Mira is negotiating with the bean rows. The beans appear unconvinced.',
    remember: 'Back again? The beans were hoping you\'d forgotten.',
  },
  {
    id: 'tobin', name: 'Tobin', role: 'tinker', trait: 'curious',
    color: '#c98b4b', accent: '#9fd6e8', quirk: 'names every kettle',
    line: 'Tobin has taken the kettle apart again. He calls it maintenance.',
    remember: 'You came back. I saved you the interesting bolt.',
  },
  {
    id: 'pip', name: 'Pip', role: 'kid', trait: 'playful',
    color: '#e07a9a', accent: '#ffe08a', quirk: 'keeps a beetle in a matchbox',
    line: 'Pip is conducting a small orchestra of beetles. They are not in key.',
    remember: 'The house came back! Did you bring the cat?',
  },
  {
    id: 'sable', name: 'Sable', role: 'watch', trait: 'steady',
    color: '#6f9fd8', accent: '#ffd166', quirk: 'counts the same bird twice',
    line: 'Sable is watching the treeline with the calm of someone who has seen it all.',
    remember: 'Road\'s clear. Good to see you.',
  },
  {
    id: 'nell', name: 'Nell', role: 'baker', trait: 'dreamy',
    color: '#d9a05b', accent: '#ffe8a3', quirk: 'thinks every cloud looks like a potato',
    line: 'Nell is coaxing a stubborn starter out of its jar. It responds to flattery.',
    remember: 'You\'re just in time. This loaf came out crooked, so it\'s the good one.',
  },
  {
    id: 'oren', name: 'Oren', role: 'courier', trait: 'wry',
    color: '#9b8ac4', accent: '#7fd1e8', quirk: 'delivers very small parcels with enormous ceremony',
    line: 'Oren is sorting parcels by how mysterious they look.',
    remember: 'I have a parcel here addressed to "the house with the wheels".',
  },
];

/** One small animal makes a square feel inhabited. Biscuit has no responsibilities. */
export const TOWN_CAT: CatDef = { name: 'Biscuit', color: '#c98b4b', accent: '#f3e3c3' };

/** Other settlements get their own cat, or no cat at all. Both are correct. */
export const CAT_NAMES = ['Biscuit', 'Marmalade', 'Pebble', 'Soot', 'Clover', 'Noodle', 'Pickle', 'Moth', 'Bramble', 'Tansy', 'Crumpet', 'Willow', 'Thimble', 'Pudding', 'Rook', 'Custard', 'Pumpernickel', 'Dill', 'Nutmeg', 'Biscuit the Second'];

export const RESIDENT_TRAITS: ResidentTrait[] = ['bold', 'curious', 'playful', 'steady', 'dreamy', 'wry'];
export const RESIDENT_ROLES: ResidentRole[] = ['gardener', 'tinker', 'kid', 'watch', 'baker', 'courier'];

const FIRST_NAMES = [
  'Ada', 'Alba', 'Arlo', 'Bex', 'Bram', 'Cass', 'Cleo', 'Corin', 'Dara', 'Ede', 'Elio', 'Fen',
  'Fia', 'Gus', 'Hattie', 'Ivo', 'Jory', 'Juno', 'Kit', 'Lena', 'Linden', 'Mabel', 'Milo', 'Nia',
  'Odie', 'Orla', 'Pella', 'Quin', 'Rhea', 'Rook', 'Sadie', 'Sol', 'Tamas', 'Tilly', 'Una', 'Vey',
  'Wren', 'Yara', 'Zeph', 'Alfie', 'Briar', 'Cedar', 'Della', 'Ember', 'Fable', 'Greta', 'Hollis',
  'Ines', 'Jem', 'Kira', 'Lark', 'Moss', 'Nim', 'Olive', 'Piet', 'Remy', 'Saffron', 'Tove', 'Willa',
];
const LAST_NAMES = [
  'Ashby', 'Bellweather', 'Clover', 'Coppice', 'Dovetail', 'Fernsby', 'Goodnettle', 'Hearth',
  'Honeywell', 'Inkpen', 'Kettle', 'Larkin', 'Mossfoot', 'Nook', 'Pebble', 'Quill', 'Reed',
  'Rookery', 'Thistlewood', 'Underhill', 'Wicker', 'Yarrow', 'Bramble', 'Cinder', 'Dapple',
  'Emberly', 'Fallow', 'Gorse', 'Hazel', 'Juniper', 'Lumen', 'Marrow', 'Nettle', 'Oaken', 'Pike',
  'Saffron', 'Tumble', 'Vesper', 'Wick', 'Yew',
];
const CLOTHES: { color: string; accent: string }[] = [
  { color: '#7fb069', accent: '#f2c14e' }, { color: '#c98b4b', accent: '#9fd6e8' },
  { color: '#e07a9a', accent: '#ffe08a' }, { color: '#6f9fd8', accent: '#ffd166' },
  { color: '#d9a05b', accent: '#ffe8a3' }, { color: '#9b8ac4', accent: '#7fd1e8' },
  { color: '#5f9e8f', accent: '#f3e3c3' }, { color: '#b56576', accent: '#ffd9a0' },
  { color: '#8a9a5b', accent: '#e9c46a' }, { color: '#7a6f9b', accent: '#f4a261' },
  { color: '#c47a4a', accent: '#bfe9f0' }, { color: '#4f7c8c', accent: '#f2c14e' },
  { color: '#a36b8a', accent: '#ffe8a3' }, { color: '#6b8f71', accent: '#f5b631' },
];
const QUIRKS = [
  'hums while working', 'collects smooth stones', 'always knows which way the wind is going',
  'apologises to furniture', 'keeps a beetle in a matchbox', 'cannot pass a cat without saying hello',
  'names every kettle', 'leaves pencil drawings in borrowed books', 'counts stairs',
  'wears a scarf in summer', 'makes up the weather', 'is convinced the well is listening',
  'practises conversations with turnips', 'knows a song for every kind of rain',
  'keeps a pocket of emergency crumbs', 'thinks every cloud looks like a potato',
  'has strong opinions about soup thickness', 'talks to bees respectfully',
  'never trusts a quiet hinge', 'writes letters to distant lighthouses',
  'can sleep anywhere except a bed', 'arranges pebbles into tiny parliaments',
  'is always halfway through a very good idea', 'saves the last bite for someone else',
  'sweeps the doorstep in a thoughtful way', 'has a favourite wooden spoon',
  'knows exactly how many steps to the bakery', 'calls the cat "colleague"',
  'leaves the window open for moths', 'keeps a list of excellent puddles',
];
const ROLE_LINES: Record<ResidentRole, string[]> = {
  gardener: [
    '{name} is negotiating with a row of beans. The beans remain unconvinced.',
    '{name} has found a tomato that thinks it is in charge.',
    '{name} is patting soil and saying encouraging things to it.',
    '{name} is deciding whether the weeds are technically a cover crop.',
    '{name} is carrying a cabbage like a small, proud baby.',
    '{name} is explaining crop rotation to a doubtful beetroot.',
  ],
  tinker: [
    '{name} has taken something apart and is now looking for the bit that made it work.',
    '{name} is oiling a hinge that has never once complained.',
    '{name} is measuring twice and cutting a third time, quietly.',
    '{name} is sorting a jar of bolts by personality.',
    '{name} is repairing a kettle that was, on reflection, not broken.',
    '{name} is inventing a tool for a job nobody has needed yet.',
  ],
  kid: [
    '{name} is conducting a beetle orchestra. They are not in key.',
    '{name} is building a fort out of sticks and unshakable confidence.',
    '{name} is trying to teach a chicken to sit.',
    '{name} is halfway through a cartwheel and reconsidering.',
    '{name} is racing a leaf down the gutter and losing badly.',
    '{name} is pretending to be a very important parcel.',
  ],
  watch: [
    '{name} is watching the treeline with the calm of someone who has seen it all.',
    '{name} is polishing a lantern that is already clean.',
    '{name} is counting the road\'s travellers, including the same bird twice.',
    '{name} is practising a very serious "halt".',
    '{name} is listening to the woods with one ear and the kettle with the other.',
    '{name} is deciding that the horizon looks satisfactory today.',
  ],
  baker: [
    '{name} is coaxing a stubborn starter out of its jar.',
    '{name} is dusted in flour and pretending that was the plan.',
    '{name} is cutting a loaf and eating the evidence.',
    '{name} is telling the oven to be reasonable.',
    '{name} is braiding dough with the concentration of a locksmith.',
    '{name} is saving the best crust for somebody who has not arrived yet.',
  ],
  courier: [
    '{name} is sorting parcels by how mysterious they look.',
    '{name} is reading the address on a letter for the third time.',
    '{name} is tightening a satchel strap and preparing for importance.',
    '{name} is delivering a very small parcel with enormous ceremony.',
    '{name} is checking the road for news and finding mostly weather.',
    '{name} is deciding which letter has waited longest.',
  ],
};
const ROLE_REMEMBER: Record<ResidentRole, string[]> = {
  gardener: ['The beans remembered you. They were hoping for rain.', 'You came back. The good trowel is still yours.'],
  tinker: ['I kept the interesting bolt. It\'s yours if you want it.', 'The kettle asked after you. I told it to be patient.'],
  kid: ['You came back! Did you bring the cat?', 'I saved you a really good stick.'],
  watch: ['Road\'s clear. Good to see you.', 'All quiet. I counted you from the gate.'],
  baker: ['This one came out crooked, so it\'s the good one.', 'The kettle\'s on. Sit down before the bread gets ideas.'],
  courier: ['I have a parcel here addressed to "the house with the wheels".', 'No letters for you today. Only the good kind of news.'],
};

function mix(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}
function rnd(seed: number, salt: number) { return mix(seed + Math.imul(salt, 0x9e3779b9)) / 4294967296; }
function pick<T>(list: T[], seed: number, salt: number) { return list[Math.floor(rnd(seed, salt) * list.length) % list.length]; }

export interface GeneratedResidentOptions {
  townKey: string; townName: string; index: number; seed: number;
  role: ResidentRole; trait: ResidentTrait;
}

/** Build one procedural person. Deterministic for a town and index. */
export function makeGeneratedResident(o: GeneratedResidentOptions): ResidentDef {
  const seed = mix(o.seed + Math.imul(o.index + 1, 7919));
  const first = pick(FIRST_NAMES, seed, 1);
  const surname = rnd(seed, 2) < (o.role === 'kid' ? 0.25 : 0.58) ? ` ${pick(LAST_NAMES, seed, 3)}` : '';
  const name = first + surname;
  const clothes = pick(CLOTHES, seed, 4);
  const quirk = pick(QUIRKS, seed, 5);
  const line = pick(ROLE_LINES[o.role], seed, 6).replace(/\{name\}/g, name);
  const remember = pick(ROLE_REMEMBER[o.role], seed, 7).replace(/\{town\}/g, o.townName);
  return {
    id: `${o.townKey}:${o.index}`,
    name, role: o.role, trait: o.trait,
    color: clothes.color, accent: clothes.accent,
    line, remember, quirk,
  };
}
