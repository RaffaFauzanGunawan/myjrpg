// ============================================================
// data.js — data karakter, musuh, item, quest, NPC
// (Cerita & stat dari PRD "Chronicles of the Fallen Crown")
// ============================================================
import { BIOME } from './config.js';

// ---------- KARAKTER ----------
// base/growth dipakai battle.js: hp, mp, atk, def, mag, res, spd
export const CHARACTERS = {
  cedric: {
    id: 'cedric', name: 'Sir Cedric', cls: 'Knight', emoji: '⚔️', color: '#4a90d9',
    base: { hp: 120, mp: 30, atk: 18, def: 22, mag: 8, res: 12, spd: 10 },
    growth: { hp: 12, mp: 2, atk: 2, def: 3, mag: 0, res: 1, spd: 1 },
    skills: [
      { name: 'Shield Bash', mp: 0, desc: 'Serangan tegas', type: 'phys', power: 1.1 },
      { name: 'Holy Strike', mp: 8, desc: 'Serangan cahaya suci', type: 'phys', power: 1.6, element: 'holy' },
      { name: 'Dark Edge', mp: 10, desc: 'Energi gelap pada bilah', type: 'phys', power: 1.9, element: 'dark' },
    ],
  },
  lyra: {
    id: 'lyra', name: 'Lyra', cls: 'Mage', emoji: '🔮', color: '#9b59b6',
    base: { hp: 70, mp: 80, atk: 6, def: 8, mag: 24, res: 20, spd: 14 },
    growth: { hp: 5, mp: 6, atk: 0, def: 0, mag: 4, res: 3, spd: 2 },
    skills: [
      { name: 'Fireball', mp: 5, desc: 'Bola api', type: 'mag', power: 1.3, element: 'fire' },
      { name: 'Blizzard', mp: 8, desc: 'Badai es semua musuh', type: 'mag', power: 1.2, element: 'ice', target: 'all' },
      { name: 'Thunder', mp: 6, desc: 'Petir dari langit', type: 'mag', power: 1.5, element: 'lightning' },
    ],
  },
  aldous: {
    id: 'aldous', name: 'Brother Aldous', cls: 'Cleric', emoji: '✝️', color: '#f1c40f',
    base: { hp: 90, mp: 60, atk: 10, def: 14, mag: 18, res: 22, spd: 8 },
    growth: { hp: 8, mp: 5, atk: 1, def: 1, mag: 3, res: 3, spd: 1 },
    skills: [
      { name: 'Heal', mp: 5, desc: 'Pulihkan HP satu kawan', type: 'heal', power: 1.5, target: 'single' },
      { name: 'Holy Smite', mp: 6, desc: 'Cahaya suci', type: 'mag', power: 1.2, element: 'holy' },
      { name: 'Regeneration', mp: 12, desc: 'Pulihkan seluruh party', type: 'heal', power: 0.55, target: 'party' },
    ],
  },
  rowan: {
    id: 'rowan', name: 'Rowan', cls: 'Ranger', emoji: '🏹', color: '#27ae60',
    base: { hp: 85, mp: 35, atk: 20, def: 12, mag: 10, res: 10, spd: 18 },
    growth: { hp: 7, mp: 2, atk: 3, def: 1, mag: 1, res: 1, spd: 3 },
    skills: [
      { name: 'Aimed Shot', mp: 0, desc: 'Tembakan presisi', type: 'phys', power: 1.4 },
      { name: 'Multi-Shot', mp: 6, desc: 'Panah ke semua musuh', type: 'phys', power: 0.85, target: 'all' },
      { name: 'Poison Arrow', mp: 4, desc: 'Panah beracun', type: 'phys', power: 1.1, effect: 'poison' },
    ],
  },
  mira: {
    id: 'mira', name: 'Mira', cls: 'Assassin', emoji: '🗡️', color: '#e74c3c',
    base: { hp: 75, mp: 40, atk: 22, def: 10, mag: 12, res: 8, spd: 24 },
    growth: { hp: 6, mp: 3, atk: 3, def: 0, mag: 1, res: 0, spd: 4 },
    skills: [
      { name: 'Backstab', mp: 0, desc: 'Serangan dari bayangan', type: 'phys', power: 1.5 },
      { name: 'Viper Strike', mp: 12, desc: 'Sengatan ular berbisa', type: 'phys', power: 2.0, element: 'dark', effect: 'poison' },
      { name: 'Shadow Shroud', mp: 10, desc: 'Menghindar dari serangan', type: 'guard' },
    ],
  },
  dorin: {
    id: 'dorin', name: 'Dorin', cls: 'Blacksmith', emoji: '🔨', color: '#e67e22',
    base: { hp: 140, mp: 20, atk: 24, def: 20, mag: 6, res: 8, spd: 6 },
    growth: { hp: 14, mp: 1, atk: 3, def: 3, mag: 0, res: 0, spd: 0 },
    skills: [
      { name: 'Hammer Smash', mp: 0, desc: 'Pukulan palu raksasa', type: 'phys', power: 1.5 },
      { name: 'Furnace Breath', mp: 10, desc: 'Napas api tungku', type: 'mag', power: 1.5, element: 'fire', target: 'all' },
      { name: 'Earthquake', mp: 12, desc: 'Guncang bumi', type: 'phys', power: 1.7, element: 'earth' },
    ],
  },
  seraphina: {
    id: 'seraphina', name: 'Seraphina', cls: 'Spellblade', emoji: '✨', color: '#1abc9c',
    base: { hp: 95, mp: 55, atk: 16, def: 14, mag: 20, res: 16, spd: 14 },
    growth: { hp: 8, mp: 4, atk: 2, def: 1, mag: 3, res: 2, spd: 2 },
    skills: [
      { name: 'Arcane Edge', mp: 0, desc: 'Bilah beraura sihir', type: 'phys', power: 1.2 },
      { name: 'Flame Slash', mp: 6, desc: 'Tebasan berapi', type: 'phys', power: 1.4, element: 'fire' },
      { name: 'Luminance', mp: 14, desc: 'Cahaya suci semua musuh', type: 'mag', power: 2.0, element: 'holy', target: 'all' },
    ],
  },
};

export const INITIAL_PARTY = ['cedric', 'lyra', 'aldous'];

// ---------- MUSUH ----------
export const ENEMIES = {
  slime:    { id: 'slime', name: 'Forest Slime', emoji: '🟢', color: '#27ae60', hp: 30, atk: 6,  def: 3,  mag: 2,  res: 2,  spd: 4,  exp: 8,  gold: 5,  weak: ['fire'] },
  goblin:   { id: 'goblin', name: 'Goblin Scout', emoji: '👺', color: '#8e44ad', hp: 45, atk: 10, def: 6,  mag: 3,  res: 4,  spd: 8,  exp: 12, gold: 10, weak: ['holy'] },
  wolf:     { id: 'wolf', name: 'Dire Wolf', emoji: '🐺', color: '#7f8c8d', hp: 55, atk: 14, def: 5,  mag: 2,  res: 4,  spd: 14, exp: 15, gold: 8,  weak: ['ice'] },
  skeleton: { id: 'skeleton', name: 'Skeleton Warrior', emoji: '💀', color: '#bdc3c7', hp: 50, atk: 12, def: 10, mag: 5, res: 8, spd: 6, exp: 14, gold: 12, weak: ['holy'] },
  fire_imp: { id: 'fire_imp', name: 'Fire Imp', emoji: '😈', color: '#e74c3c', hp: 40, atk: 8, def: 4, mag: 16, res: 12, spd: 12, exp: 16, gold: 14, weak: ['ice'] },
  bandit:   { id: 'bandit', name: 'Forest Bandit', emoji: '🥷', color: '#2c3e50', hp: 65, atk: 16, def: 8, mag: 6, res: 6, spd: 12, exp: 18, gold: 25, weak: [] },
  golem:    { id: 'golem', name: 'Stone Golem', emoji: '🗿', color: '#795548', hp: 120, atk: 18, def: 24, mag: 4, res: 10, spd: 3, exp: 25, gold: 20, weak: ['ice', 'lightning'] },
  mage_enemy: { id: 'mage_enemy', name: 'Dark Sorcerer', emoji: '🧙', color: '#6c3483', hp: 55, atk: 6, def: 6, mag: 22, res: 18, spd: 10, exp: 22, gold: 18, weak: ['holy'] },
  wyvern:   { id: 'wyvern', name: 'Wyvern', emoji: '🐲', color: '#1a5276', hp: 180, atk: 24, def: 16, mag: 14, res: 12, spd: 8, exp: 35, gold: 40, weak: ['lightning'] },

  boss_shadow_knight: { id: 'boss_shadow_knight', name: 'Shadow Knight', emoji: '👿', color: '#1a1a2e', isBoss: true, hp: 400, atk: 28, def: 18, mag: 20, res: 14, spd: 12, exp: 120, gold: 200, weak: ['holy'] },
  boss_dragon_lord:   { id: 'boss_dragon_lord', name: 'Dragon Lord Vexar', emoji: '🐉', color: '#922b21', isBoss: true, hp: 800, atk: 36, def: 22, mag: 28, res: 18, spd: 10, exp: 300, gold: 500, weak: ['ice'] },
  boss_tyrant:        { id: 'boss_tyrant', name: 'Tyrant Marius', emoji: '👑', color: '#7d6608', isBoss: true, hp: 600, atk: 30, def: 20, mag: 24, res: 16, spd: 14, exp: 250, gold: 400, weak: [] },
};

// Tabel encounter per bioma liar
export const ENCOUNTER_TABLES = {
  forest: [
    { enemies: ['slime'], weight: 30 },
    { enemies: ['goblin'], weight: 28 },
    { enemies: ['wolf'], weight: 25 },
    { enemies: ['slime', 'slime'], weight: 17 },
  ],
  snow: [
    { enemies: ['golem'], weight: 24 },
    { enemies: ['skeleton', 'skeleton'], weight: 26 },
    { enemies: ['mage_enemy'], weight: 22 },
    { enemies: ['wyvern'], weight: 16 },
    { enemies: ['golem', 'skeleton'], weight: 12 },
  ],
  ash: [
    { enemies: ['fire_imp', 'fire_imp'], weight: 28 },
    { enemies: ['mage_enemy', 'fire_imp'], weight: 26 },
    { enemies: ['bandit', 'mage_enemy'], weight: 24 },
    { enemies: ['wyvern'], weight: 22 },
  ],
  beach: [
    { enemies: ['slime'], weight: 45 },
    { enemies: ['goblin'], weight: 35 },
    { enemies: ['wolf'], weight: 20 },
  ],
};

// ---------- ITEM ----------
export const ITEMS = {
  hp_potion:  { id: 'hp_potion', name: 'Health Potion', emoji: '🧪', desc: 'Pulihkan 50 HP', heal: 50, price: 20 },
  hp_potion_m:{ id: 'hp_potion_m', name: 'Hi-Potion', emoji: '🧪', desc: 'Pulihkan 120 HP', heal: 120, price: 80 },
  hp_potion_l:{ id: 'hp_potion_l', name: 'Grand Potion', emoji: '🧪', desc: 'Pulihkan 300 HP', heal: 300, price: 250 },
  mp_potion:  { id: 'mp_potion', name: 'Mana Elixir', emoji: '💧', desc: 'Pulihkan 30 MP', mana: 30, price: 30 },
  mp_potion_m:{ id: 'mp_potion_m', name: 'Greater Elixir', emoji: '💧', desc: 'Pulihkan 80 MP', mana: 80, price: 100 },
  full_heal:  { id: 'full_heal', name: 'Elixir of Life', emoji: '⭐', desc: 'Pulihkan penuh seluruh party', full: true, price: 500 },
  revive:     { id: 'revive', name: 'Phoenix Feather', emoji: '🪶', desc: 'Bangkitkan kawan 50% HP', revive: true, price: 200 },
  antidote:   { id: 'antidote', name: 'Antidote', emoji: '🌿', desc: 'Sembuhkan racun', cure: 'poison', price: 15 },
  bomb:       { id: 'bomb', name: 'Bomb', emoji: '💣', desc: '80 damage api ke semua musuh', bomb: 80, price: 60 },
};

// Stok toko per penjual
export const SHOPS = {
  herbalist: ['hp_potion', 'hp_potion', 'mp_potion', 'antidote', 'hp_potion_m'],
  merchant:  ['hp_potion', 'hp_potion_m', 'mp_potion', 'mp_potion_m', 'antidote', 'revive', 'bomb'],
  capital:   ['hp_potion_m', 'hp_potion_l', 'mp_potion_m', 'full_heal', 'revive', 'bomb'],
};

// ---------- QUEST ----------
export const QUESTS = {
  main_escape: {
    id: 'main_escape', name: 'Pelarian dari Hutan', type: 'main',
    desc: 'Bicaralah dengan Elder Thornwood, lalu tiba di Kota Valdria.',
    stages: [
      { desc: 'Bicara dengan Elder Thornwood', check: 'talk', target: 'elder' },
      { desc: 'Tiba di Kota Valdria', check: 'enter', target: 'city' },
    ],
    rewards: { exp: 50, gold: 100 },
  },
  main_allies: {
    id: 'main_allies', name: 'Kumpulkan Sekutu', type: 'main',
    desc: 'Temukan Seraphina di kota dan kalahkan Shadow Knight di Hutan.',
    stages: [
      { desc: 'Bicara dengan Seraphina', check: 'talk', target: 'seraphina' },
      { desc: 'Kalahkan Shadow Knight', check: 'boss', target: 'boss_shadow_knight' },
    ],
    rewards: { exp: 120, gold: 200 },
  },
  main_dragon: {
    id: 'main_dragon', name: 'Taklukkan Naga', type: 'main',
    desc: 'Kalahkan Dragon Lord Vexar di Pegunungan Kristal.',
    stages: [
      { desc: 'Kalahkan Dragon Lord Vexar', check: 'boss', target: 'boss_dragon_lord' },
    ],
    rewards: { exp: 300, gold: 500 },
  },
  main_tyrant: {
    id: 'main_tyrant', name: 'Akhir Sang Tiran', type: 'main',
    desc: 'Hadapi Tyrant Marius di Ashlands dan rebut kembali Valdria.',
    stages: [
      { desc: 'Kalahkan Tyrant Marius', check: 'boss', target: 'boss_tyrant' },
    ],
    rewards: { exp: 500, gold: 1000 },
  },
  side_wolf: {
    id: 'side_wolf', name: 'Pemburu Serigala', type: 'side',
    desc: 'Kalahkan 5 Dire Wolf di Hutan Verdant.',
    stages: [
      { desc: 'Kalahkan 5 Dire Wolf (0/5)', check: 'kill', target: 'wolf', qty: 5 },
    ],
    rewards: { exp: 60, gold: 80 },
  },
  side_orphan: {
    id: 'side_orphan', name: 'Cahaya di Kegelapan', type: 'side',
    desc: 'Bawakan 3 Health Potion untuk Lily di kota.',
    stages: [
      { desc: 'Bawa 3 Health Potion (0/3)', check: 'item', target: 'hp_potion', qty: 3 },
    ],
    rewards: { exp: 30, gold: 50 },
  },
};

// ---------- NPC (posisi di dunia voxel) ----------
// World 192x192; kota di sekitar (96,96)
export const NPCS = [
  { id: 'elder',     name: 'Elder Thornwood', x: 78, z: 128, dialog: 'elder', skin: '#d9a066', shirt: '#5b8f4e' },
  { id: 'herbalist', name: 'Herbalist Fae',   x: 84, z: 134, dialog: 'herbalist', shop: 'herbalist', skin: '#c68b59', shirt: '#4e8f5b' },
  { id: 'captain',   name: 'Captain Rhea',    x: 92, z: 88,  dialog: 'captain', skin: '#c68b59', shirt: '#4a6f9e' },
  { id: 'merchant',  name: 'Merchant Gareth', x: 100, z: 92, dialog: 'merchant', shop: 'merchant', skin: '#d9a066', shirt: '#7a5230' },
  { id: 'seraphina', name: 'Seraphina',       x: 104, z: 84, dialog: 'seraphina', join: 'seraphina', skin: '#e8c9a0', shirt: '#1abc9c' },
  { id: 'rowan',     name: 'Rowan',           x: 88, z: 84,  dialog: 'rowan', join: 'rowan', skin: '#c68b59', shirt: '#27ae60' },
  { id: 'mira',      name: 'Mira',            x: 96, z: 80,  dialog: 'mira', join: 'mira', skin: '#e0a37e', shirt: '#e74c3c' },
  { id: 'lily',      name: 'Lily',            x: 108, z: 96, dialog: 'lily', quest: 'side_orphan', skin: '#f0c8a8', shirt: '#d98a8a' },
  { id: 'scholar',   name: 'Scholar Elara',   x: 108, z: 88, dialog: 'scholar', skin: '#d9a066', shirt: '#6a5a9e' },
  { id: 'miner',     name: 'Miner Oskar',     x: 140, z: 60, dialog: 'miner', skin: '#b07a4a', shirt: '#8a6a3a' },
];

// Peti harta (buka sekali; isi item + qty)
export const CHESTS = [
  { id: 'c1', x: 74, z: 122, item: 'hp_potion', qty: 3 },
  { id: 'c2', x: 112, z: 78, item: 'mp_potion', qty: 3 },
  { id: 'c3', x: 82, z: 120, item: 'hp_potion_m', qty: 2 },
  { id: 'c4', x: 142, z: 58, item: 'mp_potion_m', qty: 2 },
  { id: 'c5', x: 150, z: 110, item: 'bomb', qty: 2 },
  { id: 'c6', x: 60, z: 60, item: 'hp_potion_m', qty: 3 },
];

// Boss arena di dunia
// lvl = level musuh (dipakai main.js untuk scaling battle)
export const BOSS_SPOTS = [
  { id: 'boss_shadow_knight', x: 70, z: 100, enemy: 'boss_shadow_knight', biome: BIOME.FOREST, lvl: 6 },
  { id: 'boss_dragon_lord', x: 152, z: 44, enemy: 'boss_dragon_lord', biome: BIOME.SNOW, lvl: 9 },
  { id: 'boss_tyrant', x: 156, z: 140, enemy: 'boss_tyrant', biome: BIOME.ASH, lvl: 12 },
];