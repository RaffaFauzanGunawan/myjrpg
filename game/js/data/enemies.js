// ==========================================
// Chronicles of the Fallen Crown - Enemy Data
// ==========================================

export const ENEMIES = {
  slime: {
    id: 'slime', name: 'Forest Slime', emoji: '🟢', color: '#27ae60',
    hp: 30, atk: 6, def: 3, mag: 2, res: 2, spd: 4, exp: 8, gold: 5,
    elements: { weak: ['fire'], resist: ['earth'] },
    drops: [{ id: 'slime_jelly', chance: 0.5 }],
  },
  goblin: {
    id: 'goblin', name: 'Goblin Scout', emoji: '👺', color: '#8e44ad',
    hp: 45, atk: 10, def: 6, mag: 3, res: 4, spd: 8, exp: 12, gold: 10,
    elements: { weak: ['holy'], resist: [] },
    drops: [{ id: 'gold_coin', chance: 0.3 }, { id: 'rusty_dagger', chance: 0.1 }],
  },
  wolf: {
    id: 'wolf', name: 'Dire Wolf', emoji: '🐺', color: '#7f8c8d',
    hp: 55, atk: 14, def: 5, mag: 2, res: 4, spd: 14, exp: 15, gold: 8,
    elements: { weak: ['ice'], resist: [] },
    drops: [{ id: 'wolf_pelt', chance: 0.4 }],
  },
  skeleton: {
    id: 'skeleton', name: 'Skeleton Warrior', emoji: '💀', color: '#bdc3c7',
    hp: 50, atk: 12, def: 10, mag: 5, res: 8, spd: 6, exp: 14, gold: 12,
    elements: { weak: ['holy'], resist: ['dark', 'ice'] },
    drops: [{ id: 'bone_fragment', chance: 0.5 }],
  },
  fire_imp: {
    id: 'fire_imp', name: 'Fire Imp', emoji: '😈', color: '#e74c3c',
    hp: 40, atk: 8, def: 4, mag: 16, res: 12, spd: 12, exp: 16, gold: 14,
    elements: { weak: ['ice'], resist: ['fire'] },
    drops: [{ id: 'ember_dust', chance: 0.4 }],
    attackType: 'magic', magicPower: 1.2,
  },
  bandit: {
    id: 'bandit', name: 'Forest Bandit', emoji: '🥷', color: '#2c3e50',
    hp: 65, atk: 16, def: 8, mag: 6, res: 6, spd: 12, exp: 18, gold: 25,
    elements: { weak: [], resist: [] },
    drops: [{ id: 'gold_coin', chance: 0.6 }, { id: 'leather_armor', chance: 0.08 }],
  },
  golem: {
    id: 'golem', name: 'Stone Golem', emoji: '🗿', color: '#795548',
    hp: 120, atk: 18, def: 24, mag: 4, res: 10, spd: 3, exp: 25, gold: 20,
    elements: { weak: ['ice', 'lightning'], resist: ['fire', 'earth'] },
    drops: [{ id: 'stone_core', chance: 0.3 }],
  },
  mage_enemy: {
    id: 'mage_enemy', name: 'Dark Sorcerer', emoji: '🧙', color: '#6c3483',
    hp: 55, atk: 6, def: 6, mag: 22, res: 18, spd: 10, exp: 22, gold: 18,
    elements: { weak: ['holy'], resist: ['dark'] },
    drops: [{ id: 'mana_crystal', chance: 0.3 }],
    attackType: 'magic', magicPower: 1.5,
  },
  wyvern: {
    id: 'wyvern', name: 'Wyvern', emoji: '🐲', color: '#1a5276',
    hp: 180, atk: 24, def: 16, mag: 14, res: 12, spd: 8, exp: 35, gold: 40,
    elements: { weak: ['lightning'], resist: ['fire', 'earth'] },
    drops: [{ id: 'wyvern_scale', chance: 0.4 }, { id: 'mana_crystal', chance: 0.2 }],
  },

  // BOSS ENEMIES
  boss_shadow_knight: {
    id: 'boss_shadow_knight', name: 'Shadow Knight', emoji: '👿', color: '#1a1a2e',
    hp: 400, atk: 28, def: 18, mag: 20, res: 14, spd: 12, exp: 120, gold: 200,
    isBoss: true,
    elements: { weak: ['holy'], resist: ['dark'] },
    drops: [{ id: 'shadow_blade', chance: 1.0 }],
    phases: [
      { threshold: 0.5, name: 'Enraged', atkBonus: 8, spdBonus: 4 },
    ],
  },
  boss_dragon_lord: {
    id: 'boss_dragon_lord', name: 'Dragon Lord Vexar', emoji: '🐉', color: '#922b21',
    hp: 800, atk: 36, def: 22, mag: 28, res: 18, spd: 10, exp: 300, gold: 500,
    isBoss: true,
    elements: { weak: ['ice'], resist: ['fire'] },
    drops: [{ id: 'dragon_heart', chance: 1.0 }],
    phases: [
      { threshold: 0.7, name: 'Fury', atkBonus: 10, fireAll: true },
      { threshold: 0.3, name: 'Desperation', atkBonus: 15, spdBonus: 8 },
    ],
  },
  boss_tyrant: {
    id: 'boss_tyrant', name: 'Tyrant Marius', emoji: '👑', color: '#7d6608',
    hp: 600, atk: 30, def: 20, mag: 24, res: 16, spd: 14, exp: 250, gold: 400,
    isBoss: true,
    elements: { weak: [], resist: ['holy', 'dark'] },
    drops: [{ id: 'crown_fragment', chance: 1.0 }],
    phases: [
      { threshold: 0.5, name: 'Royal Guard', defBonus: 10 },
    ],
  },
};

// Random encounter tables per area
export const ENCOUNTER_TABLES = {
  verdant_woods: [
    { enemies: ['slime'], weight: 30 },
    { enemies: ['goblin'], weight: 30 },
    { enemies: ['wolf'], weight: 25 },
    { enemies: ['slime', 'slime'], weight: 15 },
  ],
  capital_outskirts: [
    { enemies: ['bandit'], weight: 30 },
    { enemies: ['bandit', 'bandit'], weight: 15 },
    { enemies: ['goblin', 'goblin'], weight: 20 },
    { enemies: ['skeleton'], weight: 20 },
    { enemies: ['mage_enemy'], weight: 15 },
  ],
  crystal_caves: [
    { enemies: ['skeleton', 'skeleton'], weight: 20 },
    { enemies: ['mage_enemy'], weight: 20 },
    { enemies: ['golem'], weight: 20 },
    { enemies: ['fire_imp', 'fire_imp'], weight: 20 },
    { enemies: ['fire_imp', 'mage_enemy'], weight: 20 },
  ],
  dragon_mountain: [
    { enemies: ['golem'], weight: 20 },
    { enemies: ['wyvern'], weight: 25 },
    { enemies: ['mage_enemy', 'mage_enemy'], weight: 20 },
    { enemies: ['golem', 'skeleton'], weight: 20 },
    { enemies: ['wyvern', 'fire_imp'], weight: 15 },
  ],
  ashlands: [
    { enemies: ['fire_imp', 'fire_imp'], weight: 25 },
    { enemies: ['wyvern'], weight: 25 },
    { enemies: ['mage_enemy', 'fire_imp'], weight: 25 },
    { enemies: ['bandit', 'mage_enemy'], weight: 25 },
  ],
};

export const ELEMENTS = {
  fire: { name: 'Fire', color: '#e74c3c', emoji: '🔥' },
  ice: { name: 'Ice', color: '#3498db', emoji: '❄️' },
  lightning: { name: 'Lightning', color: '#f1c40f', emoji: '⚡' },
  holy: { name: 'Holy', color: '#f39c12', emoji: '☀️' },
  dark: { name: 'Dark', color: '#8e44ad', emoji: '🌑' },
  earth: { name: 'Earth', color: '#795548', emoji: '🪨' },
  none: { name: 'Physical', color: '#bdc3c7', emoji: '⚔️' },
};
