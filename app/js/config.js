// ============================================================
// config.js — SEMUA konstanta & palet di satu tempat
// ============================================================

export const CFG = {
  // ---- world ----
  WORLD_SIZE: 192,          // tile di satu sisi (seamless)
  CHUNK_SIZE: 16,           // tile per chunk
  RENDER_RADIUS: 3,         // chunk di sekitar pemain yang di-mesh
  SEA_LEVEL: 6,
  MAX_HEIGHT: 16,

  // ---- player ----
  PLAYER_SPEED: 9.5,
  JUMP_SPEED: 10,
  GRAVITY: 28,
  EYE_HEIGHT: 1.45,
  CAMERA_DIST: 9,
  CAMERA_HEIGHT: 6.2,

  // ---- encounter ----
  ENCOUNTER_RATE: 0.09,     // probabilitas per detik berjalan di area liar
  ENCOUNTER_SAFE: 2.2,      // detik aman setelah battle
  FLEE_CHANCE: 0.65,

  // ---- battle ----
  CRIT_CHANCE: 0.12,
  CRIT_MULT: 1.8,

  // ---- time ----
  DAY_LENGTH: 150,          // detik real per hari penuh
  START_DAY: 1,
  START_HOUR: 9,

  // ---- sky ----
  SKY_DAY: 0x7ec8e3,
  SKY_DUSK: 0xf08a5d,
  SKY_NIGHT: 0x0a1030,
  FOG_DAY: 0x9fc9dd,
  FOG_NIGHT: 0x0a1030,

  // ---- kualitas render ----
  // scale = supersampling (kali resolusi layar), shadow = resolusi shadow map
  QUALITY: {
    low: { scale: 1,    shadow: 1024, label: 'Ringan' },
    hd:  { scale: 1.5,  shadow: 2048, label: 'HD' },
    uhd: { scale: 2,    shadow: 4096, label: '4K' },
  },
  DEFAULT_QUALITY: 'hd',
};

// Bioma: indeks dipakai di data biome-grid untuk minimap
export const BIOME = {
  CITY: 0, FOREST: 1, SNOW: 2, ASH: 3, LAKE: 4, BEACH: 5,
};

export const BIOME_INFO = {
  [BIOME.CITY]:   { name: 'Kota Valdria',      sub: 'Ibukota yang runtuh',           color: '#d4af37', minimap: '#c9a84c' },
  [BIOME.FOREST]: { name: 'Hutan Verdant',    sub: 'Hutan lebat di selatan',        color: '#2e7d32', minimap: '#2e5d28' },
  [BIOME.SNOW]:   { name: 'Pegunungan Kristal', sub: 'Puncak bersalju di utara',    color: '#b0bec5', minimap: '#9a9aa8' },
  [BIOME.ASH]:    { name: 'Ashlands',         sub: 'Negeri hangus sang tiran',      color: '#8a4a3a', minimap: '#4a4038' },
  [BIOME.LAKE]:   { name: 'Danau Mistral',    sub: 'Perairan tenang di barat',      color: '#3a7bd5', minimap: '#2f6fb8' },
  [BIOME.BEACH]:  { name: 'Pantai Emas',      sub: 'Garis pantai selatan',          color: '#d8c58a', minimap: '#d8c58a' },
};

// Palet blok per bioma (warna voxel)
export const TILE_PALETTES = {
  grass:      ['#3a7a2f', '#34712b', '#41843a', '#2f6a28'],
  dirt:       ['#7a5230', '#6e4a2b', '#825a37'],
  stone:      ['#8d8d97', '#83838d', '#9797a1'],
  snow:       ['#e8eef4', '#dde6ee', '#f0f4f8'],
  ash:        ['#5a4a42', '#4e4038', '#64544a'],
  sand:       ['#d8c58a', '#cfb97c', '#e0cf96'],
  water:      ['#2f6fb8', '#2a65a8', '#3578c2'],
  wood:       ['#8a5a2b', '#7d5126', '#97652f'],
  leaf:       ['#2e7d32', '#276b2c', '#358a3a'],
  snowLeaf:   ['#4a6b52', '#3f5c48'],
  crystal:    ['#7ee8fa', '#5fd8f0', '#9af0ff'],
  roof:       ['#7d3a4a', '#703548', '#8a4352'],
  wall:       ['#c9b89a', '#bca98c', '#d3c3a8'],
  path:       ['#c9b896', '#bda982', '#d4c4a4'],
  lava:       ['#e25822', '#d14a1c', '#f06a2e'],
  flower1:    ['#e74c8b', '#f062a0'],
  flower2:    ['#f1c40f', '#ffd54f'],
};

// ============================================================
// RNG deterministik (seed) — dunia selalu sama tiap main
// ============================================================
export function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Noise 2D deterministik (value noise dengan interpolasi)
export function makeNoise(seed) {
  const rng = makeRng(seed);
  const grid = new Float32Array(1024);
  for (let i = 0; i < grid.length; i++) grid[i] = rng();
  const fade = (t) => t * t * (3 - 2 * t);
  return function (x, z) {
    const xi = Math.floor(x), zi = Math.floor(z);
    const xf = x - xi, zf = z - zi;
    const g = (ix, iz) => grid[((ix & 31) << 5) | (iz & 31)];
    const a = g(xi, zi), b = g(xi + 1, zi), c = g(xi, zi + 1), d = g(xi + 1, zi + 1);
    const u = fade(xf), v = fade(zf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}