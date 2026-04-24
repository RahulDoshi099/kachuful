// 4-word unique name generator
const ADJECTIVES = [
  'swift', 'brave', 'calm', 'dark', 'eager', 'fancy', 'glad', 'happy',
  'icy', 'jolly', 'keen', 'lively', 'merry', 'noble', 'odd', 'proud',
  'quiet', 'rapid', 'sharp', 'tall', 'unique', 'vivid', 'warm', 'young',
  'zany', 'bold', 'crisp', 'daring', 'epic', 'fierce', 'grand', 'huge',
  'iron', 'jade', 'kind', 'lunar', 'mystic', 'neon', 'orange', 'pink',
  'royal', 'silver', 'teal', 'ultra', 'violet', 'wild', 'xenon', 'yellow',
];

const NOUNS = [
  'ace', 'bear', 'crow', 'dove', 'eagle', 'fox', 'goat', 'hawk',
  'ibis', 'jay', 'kite', 'lion', 'mole', 'newt', 'owl', 'puma',
  'quail', 'raven', 'seal', 'toad', 'urchin', 'vole', 'wolf', 'yak',
  'zebra', 'ant', 'bat', 'cat', 'deer', 'elk', 'frog', 'gnu',
  'hare', 'imp', 'lynx', 'moose', 'narwhal', 'orca', 'pike', 'rat',
  'shark', 'tiger', 'urial', 'viper', 'wren', 'xerus', 'yeti', 'zorilla',
];

const VERBS = [
  'runs', 'flies', 'leaps', 'dives', 'spins', 'glows', 'roars', 'sings',
  'drifts', 'hunts', 'jumps', 'kicks', 'lurks', 'moves', 'nods', 'orbits',
  'plays', 'quests', 'races', 'soars', 'turns', 'vaults', 'walks', 'zooms',
  'blinks', 'charges', 'dashes', 'echoes', 'floats', 'grabs', 'howls', 'ignites',
];

const COLORS = [
  'red', 'blue', 'gold', 'jade', 'lime', 'navy', 'onyx', 'pink',
  'rose', 'sage', 'teal', 'umber', 'violet', 'white', 'azure', 'black',
  'coral', 'dusk', 'ember', 'frost', 'gray', 'honey', 'ivory', 'khaki',
  'lemon', 'mauve', 'night', 'olive', 'plum', 'ruby', 'sand', 'tan',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generatePlayerName(): string {
  return `${pick(COLORS)}-${pick(ADJECTIVES)}-${pick(NOUNS)}-${pick(VERBS)}`;
}
