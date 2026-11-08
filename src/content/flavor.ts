/**
 * FLAVOR TEXT: lines for the Scrapbook, postcards, visitors and welcome-back messages.
 * Everything here is optional. Missing entries fall back to generated lines.
 */

/** One-line Scrapbook description per biome id. */
export const BIOME_FLAVOR: Record<string, string> = {
  deep: 'Dark water all the way down. Something big hums below.',
  shallow: 'Warm, clear and ankle-deep. The house wades happily.',
  reef: 'A city of colour under glass-green water.',
  beach: 'Sand in every crack of the floorboards. Worth it.',
  iceshelf: 'The sea froze mid-thought and never finished it.',
  mangrove: 'Roots like knitting needles, frogs like little bells.',
  grass: 'Soft green hills that seem made for rolling.',
  forest: 'Old trees that remember the first wheels.',
  autumn: 'Every leaf is on fire in the gentlest way.',
  taiga: 'Pine-scented quiet, snow sliding off branches.',
  snow: 'Crisp, white, and so quiet you can hear the hamster.',
  moor: 'Heather, fog and a feeling of being watched kindly.',
  swamp: 'Squelchy, misty, and full of opinions (frogs).',
  jungle: 'Green on green on green, and everything is singing.',
  savanna: 'Gold grass, wide sky, and long lazy afternoons.',
  desert: 'Dunes like slow ocean waves. Bring a hat.',
  badlands: 'Rust-red rock that crunches under the wheels.',
  crystal: 'The ground hums in chords when the wind blows.',
  ash: 'Warm grey ash and lava that glows like a hearth.',
  shroom: 'Mushrooms taller than the house, softly glowing.',
  salt: 'Flat, white and blinding. The wheels love it.',
  bloom: 'So many flowers the air tastes like honey.',
  boneyard: 'Bleached giants sleeping in the sand.',
  mountain: 'Craggy shoulders of the world. Good views.',
  mesa: 'Red stone tables set for giants.',
  glacier: 'A river of ice, moving one inch per century.',
  peak: 'The top of everything. Cold, thin, and glorious.',
};

/** Postcard line written the first time you visit a biome. */
export const BIOME_POSTCARD: Record<string, string> = {
  deep: 'We floated over blue so deep it looked like night.',
  shallow: 'Paddled through warm shallows. Tiny fish followed us all afternoon.',
  reef: 'The coral here is brighter than any paint we own.',
  beach: 'Found a perfect shell. Kept it on the dashboard.',
  iceshelf: 'The ice creaks like an old house settling. Felt right at home.',
  mangrove: 'Fell asleep to frogs. Woke up to more frogs. Lovely.',
  grass: 'Rolled downhill with the windows open. Best morning in ages.',
  forest: 'The trees are so old they made us whisper.',
  autumn: 'Leaves crunching under the wheels. Made cocoa.',
  taiga: 'The pines here smell like childhood.',
  snow: 'Everything muffled and white. Even the engine sounded polite.',
  moor: 'Fog rolled in like a blanket. We put the kettle on.',
  swamp: 'Squelched along happily. The hamster disapproves.',
  jungle: 'So loud with birds that we stopped talking and just listened.',
  savanna: 'Watched the sun go down over golden grass. Didn\'t say a word.',
  desert: 'Sand dunes like frozen waves. The stars out here are ridiculous.',
  badlands: 'Red rocks, red dust, red sunset. Matching set.',
  crystal: 'The ground chimes when you step on it. We danced a bit.',
  ash: 'Toasted marshmallows on a lava crack. Highly recommend.',
  shroom: 'Glowing mushrooms taller than the roof. Felt very small and very happy.',
  salt: 'Wheels hummed on the salt like a song. Flattest place on earth.',
  bloom: 'Bees everywhere, all of them busy, none of them grumpy.',
  boneyard: 'Picnicked in the shade of a giant\'s ribcage. Peaceful.',
  mountain: 'Climbed high enough to see three weathers at once.',
  mesa: 'Watched the mesas turn purple at dusk.',
  glacier: 'Blue ice, blue sky, blue fingers. Worth every shiver.',
  peak: 'Top of the world. Waved at the clouds below.',
};

/** One-line Scrapbook description per critter id. */
export const MOB_FLAVOR: Record<string, string> = {
  slime: 'Wobbly, sticky, oddly cheerful.',
  beetle: 'Chews bark and occasionally hubcaps.',
  crab: 'Walks sideways out of principle.',
  scorp: 'All pinch, no manners.',
  croc: 'Mostly teeth, partly log.',
  spider: 'Weaves beautiful silk and bad intentions.',
  shroomling: 'A mushroom that decided to go for a walk.',
  skeleton: 'Rattles when it runs. Never wins races.',
  bat: 'Comes out at dusk, squeaks at the moon.',
  yeti: 'Fluffy, grumpy, surprisingly small.',
  golem: 'A pile of rocks with a grudge.',
  wisp: 'A sparkle that got curious.',
  emberling: 'A spark that never went out.',
  frostling: 'Leaves a trail of tiny snowflakes.',
  drone: 'Somebody\'s lost gadget. Very rude.',
};

/** Generic postcard templates. {name} = place name, {biome} = biome name. */
export const LANDMARK_POSTCARD = [
  'Stopped at the {name}. Stayed longer than planned.',
  'The {name} was even better than the stories.',
  'Found the {name} in the {biome}. Took a mental photograph.',
  'Sat by the {name} until the light went gold.',
];
export const TOWN_POSTCARD = [
  'Rolled into {name}. Everyone waved.',
  '{name} has the best market stalls in the {biome}.',
  'Bought something we didn\'t need in {name}. No regrets.',
  'The bakery in {name} sells warm bread at dusk.',
  'Kids in {name} chased the house down the main street.',
];

export const FAMILY_NAMES = ['Thistlewick', 'Pebblebrook', 'Marrowby', 'Lanternfoot', 'Kettleworth', 'Puddlecombe', 'Wobblesworth', 'Fernhollow', 'Biscuitbury', 'Dapplemoor', 'Quillsby', 'Hearthstone'];
export const CAT_NAMES = ['Biscuit', 'Mochi', 'Pickle', 'Sardine', 'Noodle', 'Toast', 'Pumpkin', 'Socks', 'Waffle', 'Beans', 'Marmalade', 'Pebble', 'Tofu', 'Clementine'];
export const CAT_COLORS = ['#f0a35a', '#3a3a42', '#e8e2d6', '#a0a0a8', '#8a5a3a', '#f4d6a0'];

export const CREW = [
  { name: 'Odile', role: 'retired cartographer', line: 'Odile left a hand-drawn map of a town that may not exist.' },
  { name: 'Bram', role: 'wandering cook', line: 'Bram left a jar of pickles and a recipe for "road soup".' },
  { name: 'Pip', role: 'apprentice tinker', line: 'Pip tightened every bolt in the house before hopping off.' },
  { name: 'Marisol', role: 'botanist', line: 'Marisol pressed a flower into the logbook as a thank-you.' },
  { name: 'Old Fenwick', role: 'storyteller', line: 'Fenwick\'s last story was about a house just like this one.' },
  { name: 'Juniper', role: 'birdwatcher', line: 'Juniper counted 41 birds and named every single one.' },
];

export const LETTERS = [
  'Dear travellers, we still talk about the day your house rolled through. Come back soon!',
  'The baker says your visit was the highlight of the season. She sent a little something.',
  'A child drew a picture of your house. It has eleven wheels and a dragon. Enclosed.',
  'The town council voted you "Most Pleasant Passers-By" (unanimously, one abstention: a goat).',
  'We found something of yours under the market stall. Or possibly not yours. Keep it anyway.',
];

export const WELCOME_LINES = [
  'Welcome home. The kettle\'s still warm.',
  'The house kept the lights on for you.',
  'Good to see you. The hamster missed you most.',
  'You\'re back! Nothing broke. Well, nothing important.',
  'Pull up a chair. The road waited for you.',
];

export const COFFEE_LINES = [
  'A slow cup of coffee on the front step. Everything feels possible.',
  'Steam curls off the mug. The house hums along contentedly.',
  'Coffee, a blanket, and a view that changes every minute.',
  'You sip your coffee while the world rolls gently past.',
];

/** postcard lines for visitors & special moments */
export const MISC_POSTCARD = {
  cat: 'A cat adopted us today. We were not consulted.',
  aurora: 'The sky put on a light show just for us.',
  meteors: 'Wished on more shooting stars than we could count.',
  hitchhiker: 'Gave someone a lift. They waved for a long time.',
};
