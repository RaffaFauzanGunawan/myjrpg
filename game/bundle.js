// === BUNDLED GAME FILE ===
(function() {
"use strict";

// ==========================================
// ERROR BOUNDARY & LOGGING
// ==========================================
const _errorLog = [];
const _maxLogEntries = 50;

function _logError(source, msg, err) {
  const entry = {
    time: new Date().toISOString().slice(11, 19),
    source: source,
    message: msg,
    stack: err ? err.stack || '' : '',
    id: _errorLog.length
  };
  _errorLog.push(entry);
  if (_errorLog.length > _maxLogEntries) _errorLog.shift();
  console.error('[' + source + '] ' + msg, err || '');
}

// Global uncaught error handler
window.addEventListener('error', function(e) {
  _logError('UNCAUGHT', e.message, e.error);
  _showErrorOverlay(e.message, e.filename, e.lineno);
  return true;
});

window.addEventListener('unhandledrejection', function(e) {
  _logError('PROMISE_REJECTION', String(e.reason), null);
  _showErrorOverlay('Unhandled Promise: ' + String(e.reason));
  return true;
});

function _showErrorOverlay(msg, file, line) {
  // Don't show overlay for minor warnings
  if (msg && msg.includes('ResizeObserver')) return;

  let overlay = document.getElementById('game-error-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'game-error-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:rgba(30,0,0,0.95);color:#ff6b6b;padding:12px 20px;font-family:monospace;font-size:13px;border-bottom:2px solid #c0392b;display:flex;align-items:center;gap:12px;cursor:pointer;max-height:120px;overflow:auto;';
    overlay.innerHTML = '<span style="font-size:18px">⚠️</span><div style="flex:1"><b>Runtime Error</b><div id="game-error-msg" style="color:#ddd;margin-top:4px;word-break:break-all"></div><div id="game-error-loc" style="color:#888;font-size:11px;margin-top:2px"></div></div><span style="color:#888;font-size:11px">Click to dismiss</span>';
    overlay.addEventListener('click', function() { overlay.style.display = 'none'; });
    document.body.appendChild(overlay);
  }

  document.getElementById('game-error-msg').textContent = msg || 'Unknown error';
  document.getElementById('game-error-loc').textContent = file ? (file.split('/').pop() + (line ? ':' + line : '')) : '';
  overlay.style.display = 'flex';
  // Auto-hide after 8 seconds
  clearTimeout(overlay._hideTimer);
  overlay._hideTimer = setTimeout(function() { overlay.style.display = 'none'; }, 8000);
}

// Utility: safe wrapper for game functions
function _safe(fn, fallback) {
  return function() {
    try {
      return fn.apply(this, arguments);
    } catch(e) {
      _logError('GAME', e.message, e);
      _showErrorOverlay(e.message);
      return fallback !== undefined ? fallback : null;
    }
  };
}

// === characters.js ===
// ==========================================
// Chronicles of the Fallen Crown - Character Data
// ==========================================

const CHARACTERS = {
  cedric: {
    id: 'cedric',
    name: 'Sir Cedric',
    title: 'Knight of the Fallen Crown',
    class: 'Sword & Shield Knight',
    emoji: '⚔️',
    color: '#4a90d9',
    isProtagonist: true,
    baseStats: { hp: 120, mp: 30, atk: 18, def: 22, mag: 8, res: 12, spd: 10, luk: 12 },
    growthRates: { hp: 12, mp: 2, atk: 2, def: 3, mag: 0, res: 1, spd: 1, luk: 1 },
    skills: [
      { id: 'cedric_slash', name: 'Shield Bash', type: 'physical', mpCost: 0, power: 1.0, element: 'none', desc: 'A sturdy blow with shield and blade', branch: 'knight_lord' },
      { id: 'cedric_guard', name: 'Guard', type: 'buff', mpCost: 0, effect: 'def_up', turns: 3, desc: 'Raise your guard, boosting defense', branch: 'knight_lord' },
      { id: 'cedric_holy_strike', name: 'Holy Strike', type: 'physical', mpCost: 8, power: 1.5, element: 'holy', desc: 'A blessed attack that smites the unholy', branch: 'holy_avenger' },
      { id: 'cedric_shield_wall', name: 'Shield Wall', type: 'buff', mpCost: 12, effect: 'party_def_up', turns: 3, desc: 'Protect the entire party with your shield', branch: 'holy_avenger' },
      { id: 'cedric_dark_slash', name: 'Dark Edge', type: 'physical', mpCost: 10, power: 1.8, element: 'dark', desc: 'Channel dark energy into your blade', branch: 'dark_vanguard' },
      { id: 'cedric_vengeance', name: 'Vengeance', type: 'physical', mpCost: 15, power: 2.2, element: 'none', desc: 'Strike with the fury of betrayal', branch: 'dark_vanguard' },
    ],
    skillTrees: [
      { id: 'knight_lord', name: 'Knight Lord', desc: 'The balanced path of a true knight', color: '#4a90d9' },
      { id: 'holy_avenger', name: 'Holy Avenger', desc: 'Channel divine light against darkness', color: '#f1c40f' },
      { id: 'dark_vanguard', name: 'Dark Vanguard', desc: 'Embrace the darkness within', color: '#8e44ad' },
    ],
  },

  lyra: {
    id: 'lyra',
    name: 'Lyra',
    title: 'Elemental Sorceress',
    class: 'Elemental Mage',
    emoji: '🔮',
    color: '#9b59b6',
    isProtagonist: false,
    baseStats: { hp: 70, mp: 80, atk: 6, def: 8, mag: 24, res: 20, spd: 14, luk: 10 },
    growthRates: { hp: 5, mp: 6, atk: 0, def: 0, mag: 4, res: 3, spd: 2, luk: 1 },
    skills: [
      { id: 'lyra_fire', name: 'Fireball', type: 'magic', mpCost: 5, power: 1.3, element: 'fire', target: 'single', desc: 'Hurl a ball of fire at the enemy', branch: 'archmage' },
      { id: 'lyra_ice', name: 'Blizzard', type: 'magic', mpCost: 8, power: 1.2, element: 'ice', target: 'all', desc: 'Freeze all enemies with a storm of ice', branch: 'archmage' },
      { id: 'lyra_thunder', name: 'Thunder', type: 'magic', mpCost: 6, power: 1.5, element: 'lightning', target: 'single', desc: 'Call lightning upon your foe', branch: 'archmage' },
      { id: 'lyra_flame_nova', name: 'Flame Nova', type: 'magic', mpCost: 16, power: 2.0, element: 'fire', target: 'all', desc: 'A devastating explosion of flames', branch: 'warlock' },
      { id: 'lyra_dark_ritual', name: 'Dark Ritual', type: 'buff', mpCost: 0, effect: 'mag_up_sacrifice', desc: 'Sacrifice HP to boost magic power', branch: 'warlock' },
      { id: 'lyra_void_bolt', name: 'Void Bolt', type: 'magic', mpCost: 12, power: 2.2, element: 'dark', target: 'single', desc: 'A bolt of pure void energy', branch: 'warlock' },
    ],
    skillTrees: [
      { id: 'archmage', name: 'Archmage', desc: 'Master of all elemental magic', color: '#3498db' },
      { id: 'warlock', name: 'Warlock', desc: 'Harness dark and destructive power', color: '#8e44ad' },
    ],
  },

  aldous: {
    id: 'aldous',
    name: 'Brother Aldous',
    title: 'Cleric of the Silver Faith',
    class: 'Cleric / Healer',
    emoji: '✝️',
    color: '#f1c40f',
    isProtagonist: false,
    baseStats: { hp: 90, mp: 60, atk: 10, def: 14, mag: 18, res: 22, spd: 8, luk: 14 },
    growthRates: { hp: 8, mp: 5, atk: 1, def: 1, mag: 3, res: 3, spd: 1, luk: 2 },
    skills: [
      { id: 'aldous_heal', name: 'Heal', type: 'heal', mpCost: 5, power: 1.5, target: 'single', desc: 'Restore HP to one ally', branch: 'saint' },
      { id: 'aldous_holy', name: 'Holy Smite', type: 'magic', mpCost: 6, power: 1.2, element: 'holy', target: 'single', desc: 'Strike the undead with holy light', branch: 'saint' },
      { id: 'aldous_barrier', name: 'Barrier', type: 'buff', mpCost: 10, effect: 'res_up', turns: 4, desc: 'Protect an ally from magic damage', branch: 'saint' },
      { id: 'aldous_regen', name: 'Regeneration', type: 'heal', mpCost: 12, power: 0.5, effect: 'regen', turns: 5, target: 'party', desc: 'Heal the party over time', branch: 'inquisitor' },
      { id: 'aldous_purify', name: 'Purify', type: 'magic', mpCost: 8, power: 1.8, element: 'holy', target: 'all', desc: 'Cleanse evil from all enemies', branch: 'inquisitor' },
      { id: 'aldous_resurrect', name: 'Resurrection', mpCost: 20, type: 'heal', power: 0.5, target: 'dead', desc: 'Revive a fallen ally', branch: 'saint' },
    ],
    skillTrees: [
      { id: 'saint', name: 'Saint', desc: 'The path of divine healing and protection', color: '#f1c40f' },
      { id: 'inquisitor', name: 'Inquisitor', desc: 'Wield faith as a weapon', color: '#e67e22' },
    ],
  },

  rowan: {
    id: 'rowan',
    name: 'Rowan',
    title: 'Shadow Ranger',
    class: 'Ranger / Archer',
    emoji: '🏹',
    color: '#27ae60',
    isProtagonist: false,
    baseStats: { hp: 85, mp: 35, atk: 20, def: 12, mag: 10, res: 10, spd: 18, luk: 14 },
    growthRates: { hp: 7, mp: 2, atk: 3, def: 1, mag: 1, res: 1, spd: 3, luk: 2 },
    skills: [
      { id: 'rowan_aim', name: 'Aimed Shot', type: 'physical', mpCost: 0, power: 1.3, element: 'none', desc: 'A carefully aimed arrow', branch: 'sharpshooter' },
      { id: 'rowan_multishot', name: 'Multi-Shot', type: 'physical', mpCost: 6, power: 0.8, element: 'none', target: 'all', desc: 'Fire arrows at all enemies', branch: 'sharpshooter' },
      { id: 'rowan_poison', name: 'Poison Arrow', type: 'physical', mpCost: 4, power: 1.0, element: 'none', effect: 'poison', desc: 'A toxic arrow that poisons', branch: 'beastmaster' },
      { id: 'rowan_trap', name: 'Bear Trap', type: 'debuff', mpCost: 8, effect: 'slow', turns: 3, desc: 'Slow an enemy with a trap', branch: 'beastmaster' },
      { id: 'rowan_headshot', name: 'Headshot', type: 'physical', mpCost: 12, power: 2.5, element: 'none', desc: 'A devastating precision shot', branch: 'sharpshooter' },
      { id: 'rowan_call_beast', name: 'Call Companion', type: 'summon', mpCost: 14, power: 1.5, element: 'none', desc: 'Summon a wolf companion to attack', branch: 'beastmaster' },
    ],
    skillTrees: [
      { id: 'sharpshooter', name: 'Sharpshooter', desc: 'Deadly precision with bow and arrow', color: '#27ae60' },
      { id: 'beastmaster', name: 'Beastmaster', desc: 'Tame the wild and fight alongside beasts', color: '#d35400' },
    ],
  },

  mira: {
    id: 'mira',
    name: 'Mira',
    title: 'Phantom Blade',
    class: 'Thief / Assassin',
    emoji: '🗡️',
    color: '#e74c3c',
    isProtagonist: false,
    baseStats: { hp: 75, mp: 40, atk: 22, def: 10, mag: 12, res: 8, spd: 24, luk: 18 },
    growthRates: { hp: 6, mp: 3, atk: 3, def: 0, mag: 1, res: 0, spd: 4, luk: 3 },
    skills: [
      { id: 'mira_backstab', name: 'Backstab', type: 'physical', mpCost: 0, power: 1.5, element: 'none', desc: 'A sneak attack from the shadows', branch: 'shadow_dancer' },
      { id: 'mira_steal', name: 'Steal', type: 'steal', mpCost: 0, desc: 'Attempt to steal an item from the enemy', branch: 'shadow_dancer' },
      { id: 'mira_poison_dag', name: 'Poison Blades', type: 'physical', mpCost: 5, power: 1.2, element: 'none', effect: 'poison', desc: 'Coat blades in venom', branch: 'shadow_dancer' },
      { id: 'mira_shroud', name: 'Shadow Shroud', type: 'buff', mpCost: 10, effect: 'eva_up', turns: 3, desc: 'Become nearly invisible', branch: 'nightblade' },
      { id: 'mira_viper', name: 'Viper Strike', type: 'physical', mpCost: 12, power: 2.0, element: 'dark', effect: 'poison', desc: 'Strike like a venomous serpent', branch: 'nightblade' },
      { id: 'mira_shadowstep', name: 'Shadow Step', type: 'buff', mpCost: 8, effect: 'spd_up', turns: 3, desc: 'Move like a shadow', branch: 'nightblade' },
    ],
    skillTrees: [
      { id: 'shadow_dancer', name: 'Shadow Dancer', desc: 'The art of thievery and poison', color: '#e74c3c' },
      { id: 'nightblade', name: 'Nightblade', desc: 'Swift as shadow, sharp as night', color: '#2c3e50' },
    ],
  },

  dorin: {
    id: 'dorin',
    name: 'Dorin',
    title: 'Ironhand Blacksmith',
    class: 'Blacksmith / Warrior',
    emoji: '🔨',
    color: '#e67e22',
    isProtagonist: false,
    baseStats: { hp: 140, mp: 20, atk: 24, def: 20, mag: 6, res: 8, spd: 6, luk: 8 },
    growthRates: { hp: 14, mp: 1, atk: 3, def: 3, mag: 0, res: 0, spd: 0, luk: 1 },
    skills: [
      { id: 'dorin_smash', name: 'Hammer Smash', type: 'physical', mpCost: 0, power: 1.4, element: 'none', desc: 'A mighty hammer blow', branch: 'forge_lord' },
      { id: 'dorin_fortify', name: 'Fortify', type: 'buff', mpCost: 6, effect: 'def_up_party', turns: 3, desc: 'Strengthen the party\'s defenses', branch: 'forge_lord' },
      { id: 'dorin_furnace', name: 'Furnace Breath', type: 'magic', mpCost: 10, power: 1.5, element: 'fire', target: 'all', desc: 'Breathe fire like a forge', branch: 'berserker' },
      { id: 'dorin_rage', name: 'Berserker Rage', type: 'buff', mpCost: 0, effect: 'atk_up_sacrifice_hp', desc: 'Sacrifice defense for overwhelming power', branch: 'berserker' },
      { id: 'dorin_stun', name: 'Earthquake', type: 'physical', mpCost: 12, power: 1.6, element: 'earth', effect: 'stun', desc: 'Shake the earth beneath enemies', branch: 'forge_lord' },
      { id: 'dorin_execute', name: 'Judgment Hammer', type: 'physical', mpCost: 18, power: 3.0, element: 'none', desc: 'A final, devastating strike', branch: 'berserker' },
    ],
    skillTrees: [
      { id: 'forge_lord', name: 'Forge Lord', desc: 'Mastery of defense and the forge', color: '#e67e22' },
      { id: 'berserker', name: 'Berserker', desc: 'Unleash unstoppable destructive rage', color: '#c0392b' },
    ],
  },

  seraphina: {
    id: 'seraphina',
    name: 'Seraphina',
    title: 'Noble Spellblade',
    class: 'Spellblade / Hybrid',
    emoji: '✨',
    color: '#1abc9c',
    isProtagonist: false,
    baseStats: { hp: 95, mp: 55, atk: 16, def: 14, mag: 20, res: 16, spd: 14, luk: 12 },
    growthRates: { hp: 8, mp: 4, atk: 2, def: 1, mag: 3, res: 2, spd: 2, luk: 1 },
    skills: [
      { id: 'sera_edge', name: 'Arcane Edge', type: 'physical', mpCost: 0, power: 1.2, element: 'none', desc: 'Strike with magic-infused blade', branch: 'spell_knight' },
      { id: 'sera_flame_slash', name: 'Flame Slash', type: 'physical', mpCost: 6, power: 1.4, element: 'fire', desc: 'A blazing sword strike', branch: 'spell_knight' },
      { id: 'sera_frost_blade', name: 'Frost Blade', type: 'physical', mpCost: 8, power: 1.5, element: 'ice', desc: 'A blade wreathed in frost', branch: 'spell_knight' },
      { id: 'sera_luminance', name: 'Luminance', type: 'magic', mpCost: 14, power: 2.0, element: 'holy', target: 'all', desc: 'Bathe the field in holy light', branch: 'aristocrat' },
      { id: 'sera_mana_shield', name: 'Mana Shield', type: 'buff', mpCost: 10, effect: 'mana_shield', turns: 4, desc: 'Convert damage to MP cost', branch: 'aristocrat' },
      { id: 'sera_divine_blade', name: 'Divine Blade', type: 'physical', mpCost: 18, power: 2.5, element: 'holy', desc: 'Channel all power into one divine strike', branch: 'aristocrat' },
    ],
    skillTrees: [
      { id: 'spell_knight', name: 'Spell Knight', desc: 'Master the fusion of sword and sorcery', color: '#1abc9c' },
      { id: 'aristocrat', name: 'Aristocrat', desc: 'Command the power of nobility and light', color: '#f1c40f' },
    ],
  },
};

const INITIAL_PARTY = ['cedric', 'lyra', 'aldous'];
const MAX_PARTY_SIZE = 4;

// === enemies.js ===
// ==========================================
// Chronicles of the Fallen Crown - Enemy Data
// ==========================================

const ENEMIES = {
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
const ENCOUNTER_TABLES = {
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

const ELEMENTS = {
  fire: { name: 'Fire', color: '#e74c3c', emoji: '🔥' },
  ice: { name: 'Ice', color: '#3498db', emoji: '❄️' },
  lightning: { name: 'Lightning', color: '#f1c40f', emoji: '⚡' },
  holy: { name: 'Holy', color: '#f39c12', emoji: '☀️' },
  dark: { name: 'Dark', color: '#8e44ad', emoji: '🌑' },
  earth: { name: 'Earth', color: '#795548', emoji: '🪨' },
  none: { name: 'Physical', color: '#bdc3c7', emoji: '⚔️' },
};

// === items.js ===
// ==========================================
// Chronicles of the Fallen Crown - Items Data
// ==========================================

const ITEMS = {
  // === CONSUMABLES ===
  hp_potion: { id: 'hp_potion', name: 'Health Potion', emoji: '🧪', type: 'consumable', subtype: 'heal_hp', value: 50, price: 20, desc: 'Restores 50 HP' },
  hp_potion_m: { id: 'hp_potion_m', name: 'Hi-Potion', emoji: '🧪', type: 'consumable', subtype: 'heal_hp', value: 120, price: 80, desc: 'Restores 120 HP' },
  hp_potion_l: { id: 'hp_potion_l', name: 'Grand Potion', emoji: '🧪', type: 'consumable', subtype: 'heal_hp', value: 300, price: 250, desc: 'Restores 300 HP' },
  mp_potion: { id: 'mp_potion', name: 'Mana Elixir', emoji: '💧', type: 'consumable', subtype: 'heal_mp', value: 30, price: 30, desc: 'Restores 30 MP' },
  mp_potion_m: { id: 'mp_potion_m', name: 'Greater Elixir', emoji: '💧', type: 'consumable', subtype: 'heal_mp', value: 80, price: 100, desc: 'Restores 80 MP' },
  full_heal: { id: 'full_heal', name: 'Elixir of Life', emoji: '⭐', type: 'consumable', subtype: 'heal_full', price: 500, desc: 'Restores full HP and MP' },
  revive: { id: 'revive', name: 'Phoenix Feather', emoji: '🪶', type: 'consumable', subtype: 'revive', value: 0.5, price: 200, desc: 'Revives fallen ally with 50% HP' },
  antidote: { id: 'antidote', name: 'Antidote', emoji: '🌿', type: 'consumable', subtype: 'cure_status', status: 'poison', price: 15, desc: 'Cures poison' },
  bomb: { id: 'bomb', name: 'Bomb', emoji: '💣', type: 'consumable', subtype: 'damage_all', value: 80, price: 60, desc: 'Deals 80 fire damage to all enemies' },
  smoke_bomb: { id: 'smoke_bomb', name: 'Smoke Bomb', emoji: '💨', type: 'consumable', subtype: 'escape', price: 40, desc: 'Escape from battle' },

  // === WEAPONS ===
  rusty_sword: { id: 'rusty_sword', name: 'Rusty Sword', emoji: '🗡️', type: 'equipment', slot: 'weapon', atk: 5, price: 30, desc: 'A weathered blade. Better than bare hands.' },
  iron_sword: { id: 'iron_sword', name: 'Iron Sword', emoji: '⚔️', type: 'equipment', slot: 'weapon', atk: 12, price: 150, desc: 'A reliable iron blade' },
  steel_sword: { id: 'steel_sword', name: 'Steel Longsword', emoji: '⚔️', type: 'equipment', slot: 'weapon', atk: 20, price: 400, desc: 'Fine steel forged by a master smith' },
  flame_blade: { id: 'flame_blade', name: 'Flame Blade', emoji: '🔥', type: 'equipment', slot: 'weapon', atk: 28, mag: 5, element: 'fire', price: 800, desc: 'A blade wreathed in perpetual flame' },
  holy_mace: { id: 'holy_mace', name: 'Holy Mace', emoji: '✝️', type: 'equipment', slot: 'weapon', atk: 16, mag: 8, element: 'holy', price: 600, desc: 'Blessed by the Silver Faith' },
  shadow_blade: { id: 'shadow_blade', name: 'Shadow Blade', emoji: '🌑', type: 'equipment', slot: 'weapon', atk: 32, spd: 3, element: 'dark', price: 0, desc: 'A blade forged from pure shadow (Boss drop)' },
  staff_arcana: { id: 'staff_arcana', name: 'Staff of Arcana', emoji: '🪄', type: 'equipment', slot: 'weapon', mag: 18, mp: 20, price: 500, desc: 'A staff crackling with arcane energy' },
  rune_bow: { id: 'rune_bow', name: 'Rune Bow', emoji: '🏹', type: 'equipment', slot: 'weapon', atk: 18, spd: 2, price: 350, desc: 'An elven bow inscribed with runes' },
  dagger_poison: { id: 'dagger_poison', name: 'Viper Fang', emoji: '🐍', type: 'equipment', slot: 'weapon', atk: 15, spd: 5, effect: 'poison', price: 280, desc: 'A dagger that drips with venom' },
  warhammer: { id: 'warhammer', name: 'Warhammer', emoji: '🔨', type: 'equipment', slot: 'weapon', atk: 26, price: 500, desc: 'A devastating hammer of war' },
  rapier_noble: { id: 'rapier_noble', name: 'Noble Rapier', emoji: '✨', type: 'equipment', slot: 'weapon', atk: 16, mag: 10, spd: 3, price: 600, desc: 'A rapier of noble craftsmanship' },
  dragon_heart: { id: 'dragon_heart', name: 'Dragon Heart', emoji: '🐉', type: 'equipment', slot: 'weapon', atk: 40, mag: 10, hp: 50, price: 0, desc: 'Forged from a dragon\'s beating heart (Legendary)' },
  crown_fragment: { id: 'crown_fragment', name: 'Crown Fragment', emoji: '👑', type: 'equipment', slot: 'accessory', atk: 10, def: 10, mag: 10, res: 10, price: 0, desc: 'A shard of the Fallen Crown (Legendary)' },

  // === ARMOR ===
  leather_armor: { id: 'leather_armor', name: 'Leather Armor', emoji: '🦺', type: 'equipment', slot: 'armor', def: 5, price: 50, desc: 'Basic leather protection' },
  chain_mail: { id: 'chain_mail', name: 'Chain Mail', emoji: '🦺', type: 'equipment', slot: 'armor', def: 12, spd: -1, price: 200, desc: 'Interlocking metal rings' },
  plate_armor: { id: 'plate_armor', name: 'Plate Armor', emoji: '🛡️', type: 'equipment', slot: 'armor', def: 22, spd: -3, price: 600, desc: 'Heavy plate armor. Maximum protection.' },
  mage_robe: { id: 'mage_robe', name: 'Mage Robe', emoji: '👘', type: 'equipment', slot: 'armor', def: 6, mag: 8, res: 10, mp: 20, price: 300, desc: 'Enchanted robes that amplify magic' },
  shadow_cloak: { id: 'shadow_cloak', name: 'Shadow Cloak', emoji: '🧣', type: 'equipment', slot: 'armor', def: 8, spd: 5, luk: 5, price: 400, desc: 'A cloak that blends with shadows' },
  paladin_armor: { id: 'paladin_armor', name: 'Paladin Armor', emoji: '🛡️', type: 'equipment', slot: 'armor', def: 18, res: 8, mag: 3, price: 700, desc: 'Armor blessed by the Silver Faith' },

  // === ACCESSORIES ===
  speed_ring: { id: 'speed_ring', name: 'Swiftwind Ring', emoji: '💍', type: 'equipment', slot: 'accessory', spd: 8, price: 350, desc: 'Increases speed significantly' },
  magic_ring: { id: 'magic_ring', name: 'Arcane Ring', emoji: '💍', type: 'equipment', slot: 'accessory', mag: 8, mp: 30, price: 400, desc: 'Boosts magical power and mana' },
  guard_amulet: { id: 'guard_amulet', name: 'Guardian Amulet', emoji: '📿', type: 'equipment', slot: 'accessory', def: 6, res: 6, hp: 30, price: 300, desc: 'Increases physical and magical defense' },

  // === CRAFTING MATERIALS ===
  slime_jelly: { id: 'slime_jelly', name: 'Slime Jelly', emoji: '🟩', type: 'material', price: 3, desc: 'Viscous jelly from a forest slime' },
  wolf_pelt: { id: 'wolf_pelt', name: 'Wolf Pelt', emoji: '🟫', type: 'material', price: 5, desc: 'Thick fur from a dire wolf' },
  bone_fragment: { id: 'bone_fragment', name: 'Bone Fragment', emoji: '🦴', type: 'material', price: 4, desc: 'Bleached bone from a skeleton' },
  ember_dust: { id: 'ember_dust', name: 'Ember Dust', emoji: '🔶', type: 'material', price: 8, desc: 'Glowing dust from a fire imp' },
  stone_core: { id: 'stone_core', name: 'Stone Core', emoji: '🪨', type: 'material', price: 12, desc: 'The heart of a stone golem' },
  mana_crystal: { id: 'mana_crystal', name: 'Mana Crystal', emoji: '💎', type: 'material', price: 20, desc: 'A crystal pulsing with magical energy' },
  wyvern_scale: { id: 'wyvern_scale', name: 'Wyvern Scale', emoji: '🟦', type: 'material', price: 25, desc: 'A tough, iridescent scale' },
  gold_coin: { id: 'gold_coin', name: 'Gold Coin', emoji: '🪙', type: 'material', price: 10, desc: 'A shiny gold coin' },
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', emoji: '⛏️', type: 'material', price: 8, desc: 'Raw iron ore' },
  crystal_shard: { id: 'crystal_shard', name: 'Crystal Shard', emoji: '💠', type: 'material', price: 15, desc: 'A shard of an elemental crystal' },
};

const SHOP_INVENTORY = {
  verdant_woods_shop: ['hp_potion', 'hp_potion', 'mp_potion', 'antidote', 'smoke_bomb', 'rusty_sword', 'iron_sword', 'leather_armor'],
  capital_shop: ['hp_potion', 'hp_potion_m', 'mp_potion', 'mp_potion_m', 'antidote', 'bomb', 'revive', 'iron_sword', 'steel_sword', 'chain_mail', 'mage_robe', 'holy_mace', 'rune_bow'],
  crystal_shop: ['hp_potion_m', 'hp_potion_l', 'mp_potion_m', 'full_heal', 'revive', 'bomb', 'steel_sword', 'flame_blade', 'plate_armor', 'shadow_cloak', 'speed_ring', 'magic_ring'],
};

// === areas.js ===
// ==========================================
// Chronicles of the Fallen Crown - World & Area Data
// ==========================================

// Tile types: 0=floor, 1=wall, 2=tree, 3=water, 4=door, 5=chest, 6=npc, 7=sign, 8=stairs_down, 9=stairs_up, 10=chest_open, 11=crafting_bench, 12=shop, 13=boss_trigger, 14=waystone, 15=save_point, 16=grass, 17=flower, 18=rock, 19=bridge, 20=path, 21=door_locked, 22=void
const T = {
  FLOOR: 0, WALL: 1, TREE: 2, WATER: 3, DOOR: 4, CHEST: 5, NPC: 6, SIGN: 7,
  STAIRS_DOWN: 8, STAIRS_UP: 9, CHEST_OPEN: 10, CRAFT: 11, SHOP: 12,
  BOSS: 13, WAYSTONE: 14, SAVE: 15, GRASS: 16, FLOWER: 17, ROCK: 18,
  BRIDGE: 19, PATH: 20, DOOR_LOCK: 21, VOID: 22
};

{ T };

const TILE_COLORS = {
  [T.FLOOR]: '#4a4a5a',
  [T.WALL]: '#2a2a3a',
  [T.TREE]: '#1a5a2a',
  [T.WATER]: '#2a4a8a',
  [T.DOOR]: '#8a6a2a',
  [T.CHEST]: '#c0a030',
  [T.NPC]: '#6a6a8a',
  [T.SIGN]: '#8a7a5a',
  [T.STAIRS_DOWN]: '#5a5a3a',
  [T.STAIRS_UP]: '#5a5a3a',
  [T.CHEST_OPEN]: '#6a6a30',
  [T.CRAFT]: '#8a4a1a',
  [T.SHOP]: '#4a8a6a',
  [T.BOSS]: '#8a1a1a',
  [T.WAYSTONE]: '#3a5a9a',
  [T.SAVE]: '#2a6a4a',
  [T.GRASS]: '#3a6a2a',
  [T.FLOWER]: '#5a8a3a',
  [T.ROCK]: '#6a6a6a',
  [T.BRIDGE]: '#6a5a3a',
  [T.PATH]: '#5a5a4a',
  [T.DOOR_LOCK]: '#5a3a1a',
  [T.VOID]: '#0a0a0a',
};

const TILE_EMOJIS = {
  [T.NPC]: '👤',
  [T.SIGN]: '📜',
  [T.CHEST]: '📦',
  [T.CRAFT]: '🔨',
  [T.SHOP]: '🏪',
  [T.BOSS]: '💀',
  [T.WAYSTONE]: '💎',
  [T.SAVE]: '💾',
};

// Which tiles block movement
const BLOCKING_TILES = new Set([T.WALL, T.TREE, T.WATER, T.VOID, T.DOOR_LOCK]);

// Which tiles have special interactions
const INTERACTABLE_TILES = new Set([T.DOOR, T.CHEST, T.NPC, T.SIGN, T.STAIRS_DOWN, T.STAIRS_UP, T.CRAFT, T.SHOP, T.BOSS, T.WAYSTONE, T.SAVE, T.DOOR_LOCK]);

const AREAS = {
  // =========================
  // AREA: Verdant Woods (Starting Area)
  // =========================
  verdant_woods: {
    id: 'verdant_woods',
    name: 'Verdant Woods',
    description: 'A lush forest on the outskirts of Valdria. Home to slimes and goblins.',
    type: 'outdoor',
    music: 'forest',
    encounterTable: 'verdant_woods',
    encounterRate: 0.06,
    width: 30,
    height: 20,
    playerStart: { x: 14, y: 18 },
    tiles: null, // Generated procedurally below
    generated: true,
    exits: [
      { x: 14, y: 0, target: 'capital_square', targetX: 14, targetY: 18, label: 'To Valdria Capital' },
      { x: 28, y: 10, target: 'crystal_caves_entrance', targetX: 1, targetY: 10, label: 'To Crystal Caves' },
    ],
    chests: [
      { x: 5, y: 4, contents: 'hp_potion', qty: 3, id: 'vw_chest1' },
      { x: 24, y: 3, contents: 'iron_sword', qty: 1, id: 'vw_chest2' },
    ],
    npcs: [
      { id: 'npc_elder', x: 10, y: 10, emoji: '👴', name: 'Elder Thornwood', dialogId: 'elder_intro' },
      { id: 'npc_guard', x: 14, y: 15, emoji: '💂', name: 'Forest Guard', dialogId: 'guard_woods' },
      { id: 'npc_herbalist', x: 6, y: 12, emoji: '🧝', name: 'Herbalist Fae', dialogId: 'herbalist' },
    ],
    signs: [
      { x: 12, y: 16, text: '=== Verdant Woods ===\nThe forest teems with slime and goblin.\nProceed with caution, traveler.' },
    ],
    waystones: [{ x: 14, y: 12, id: 'vs_verdant' }],
  },

  // =========================
  // AREA: Capital Square (Main Hub)
  // =========================
  capital_square: {
    id: 'capital_square',
    name: 'Valdria Capital Square',
    description: 'The heart of the fallen kingdom. NPCs bustle amidst the ruins of former glory.',
    type: 'town',
    music: 'town',
    encounterTable: null,
    encounterRate: 0,
    width: 25,
    height: 20,
    playerStart: { x: 12, y: 18 },
    generated: true,
    exits: [
      { x: 12, y: 0, target: 'verdant_woods', targetX: 14, targetY: 18, label: 'To Verdant Woods' },
      { x: 24, y: 10, target: 'capital_outskirts', targetX: 0, targetY: 10, label: 'To Capital Outskirts' },
    ],
    chests: [
      { x: 3, y: 3, contents: 'mp_potion', qty: 3, id: 'cs_chest1' },
    ],
    npcs: [
      { id: 'npc_captain', x: 12, y: 8, emoji: '👮', name: 'Captain Rhea', dialogId: 'captain_intro' },
      { id: 'npc_merchant', x: 6, y: 10, emoji: '🧑‍🌾', name: 'Merchant Gareth', dialogId: 'merchant_main', shopId: 'capital_shop' },
      { id: 'npc_scholar', x: 18, y: 6, emoji: '📚', name: 'Scholar Elara', dialogId: 'scholar_lore' },
      { id: 'npc_bard', x: 8, y: 14, emoji: '🎵', name: 'Bard Finnian', dialogId: 'bard_story' },
      { id: 'npc_orphan', x: 20, y: 14, emoji: '👧', name: 'Orphan Lily', dialogId: 'orphan_quest' },
    ],
    signs: [
      { x: 12, y: 16, text: '=== Welcome to Valdria Capital ===\n"From the ashes, a new dawn"\nPopulation: 2,400 (down from 8,000)' },
      { x: 4, y: 8, text: 'Blacksmith & Crafting Station\nOpen during daylight hours' },
    ],
    waystones: [{ x: 12, y: 12, id: 'vs_capital' }],
    shops: [
      { x: 6, y: 10, shopId: 'capital_shop' },
    ],
    craftingBenches: [
      { x: 4, y: 8 },
    ],
  },

  // =========================
  // AREA: Capital Outskirts (Battle Area)
  // =========================
  capital_outskirts: {
    id: 'capital_outskirts',
    name: 'Capital Outskirts',
    description: 'Dangerous ruins outside the capital walls. Bandits and undead lurk in every shadow.',
    type: 'dungeon',
    music: 'danger',
    encounterTable: 'capital_outskirts',
    encounterRate: 0.08,
    width: 30,
    height: 20,
    playerStart: { x: 0, y: 10 },
    generated: true,
    exits: [
      { x: 0, y: 10, target: 'capital_square', targetX: 23, targetY: 10, label: 'To Capital' },
      { x: 14, y: 0, target: 'dragon_mountain', targetX: 14, targetY: 18, label: 'To Dragon Mountain (Danger!)' },
      { x: 29, y: 10, target: 'ashlands', targetX: 0, targetY: 10, label: 'To The Ashlands' },
    ],
    chests: [
      { x: 12, y: 5, contents: 'chain_mail', qty: 1, id: 'co_chest1' },
      { x: 22, y: 15, contents: 'hp_potion_m', qty: 3, id: 'co_chest2' },
      { x: 8, y: 8, contents: 'mana_crystal', qty: 2, id: 'co_chest3' },
    ],
    npcs: [
      { id: 'npc_refugee', x: 5, y: 12, emoji: '🧕', name: 'Refugee Maren', dialogId: 'refugee_outskirts' },
    ],
    signs: [
      { x: 2, y: 10, text: '=== Capital Outskirts ===\nDanger! Bandits and undead patrol this area.\nThe Black Knight has been spotted to the east.' },
    ],
    waystones: [{ x: 14, y: 12, id: 'vs_outskirts' }],
    bossEncounter: { x: 25, y: 5, enemyId: 'boss_shadow_knight', flag: 'boss_shadow_defeated' },
  },

  // =========================
  // AREA: Crystal Caves
  // =========================
  crystal_caves_entrance: {
    id: 'crystal_caves_entrance',
    name: 'Crystal Caves - Entrance',
    description: 'Glowing crystals illuminate the damp cavern walls. The air hums with magic.',
    type: 'dungeon',
    music: 'dungeon',
    encounterTable: 'crystal_caves',
    encounterRate: 0.07,
    width: 25,
    height: 20,
    playerStart: { x: 0, y: 10 },
    generated: true,
    exits: [
      { x: 0, y: 10, target: 'verdant_woods', targetX: 27, targetY: 10, label: 'To Verdant Woods' },
      { x: 24, y: 10, target: 'crystal_caves_deep', targetX: 1, targetY: 10, label: 'To Deep Caves' },
    ],
    chests: [
      { x: 10, y: 3, contents: 'staff_arcana', qty: 1, id: 'cc_chest1' },
      { x: 18, y: 16, contents: 'crystal_shard', qty: 5, id: 'cc_chest2' },
    ],
    npcs: [
      { id: 'npc_miner', x: 12, y: 14, emoji: '⛏️', name: 'Miner Oskar', dialogId: 'miner_caves' },
    ],
    waystones: [{ x: 12, y: 10, id: 'vs_caves' }],
    craftingBenches: [
      { x: 14, y: 14 },
    ],
  },

  crystal_caves_deep: {
    id: 'crystal_caves_deep',
    name: 'Crystal Caves - Deep',
    description: 'The deepest reaches of the crystal caves. Enormous crystals pulse with ancient power.',
    type: 'dungeon',
    music: 'dungeon_deep',
    encounterTable: 'crystal_caves',
    encounterRate: 0.10,
    width: 25,
    height: 20,
    playerStart: { x: 0, y: 10 },
    generated: true,
    exits: [
      { x: 0, y: 10, target: 'crystal_caves_entrance', targetX: 23, targetY: 10, label: 'To Cave Entrance' },
    ],
    chests: [
      { x: 20, y: 3, contents: 'flame_blade', qty: 1, id: 'ccd_chest1' },
      { x: 8, y: 16, contents: 'shadow_cloak', qty: 1, id: 'ccd_chest2' },
    ],
    npcs: [],
    bossEncounter: { x: 20, y: 10, enemyId: 'boss_dragon_lord', flag: 'boss_dragon_defeated' },
  },

  // =========================
  // AREA: Dragon Mountain
  // =========================
  dragon_mountain: {
    id: 'dragon_mountain',
    name: 'Dragon Mountain',
    description: 'The treacherous slopes of Mount Vexar. Only the strongest survive.',
    type: 'dungeon',
    music: 'boss_area',
    encounterTable: 'dragon_mountain',
    encounterRate: 0.09,
    width: 25,
    height: 20,
    playerStart: { x: 14, y: 19 },
    generated: true,
    exits: [
      { x: 14, y: 19, target: 'capital_outskirts', targetX: 14, targetY: 1, label: 'To Capital Outskirts' },
    ],
    chests: [
      { x: 5, y: 5, contents: 'warhammer', qty: 1, id: 'dm_chest1' },
      { x: 19, y: 5, contents: 'hp_potion_l', qty: 5, id: 'dm_chest2' },
    ],
    npcs: [],
    waystones: [{ x: 14, y: 12, id: 'vs_mountain' }],
    bossEncounter: { x: 14, y: 3, enemyId: 'boss_dragon_lord', flag: 'boss_dragon_defeated' },
  },

  // =========================
  // AREA: The Ashlands
  // =========================
  ashlands: {
    id: 'ashlands',
    name: 'The Ashlands',
    description: 'A scorched wasteland where fire imps and dark mages gather. The final stronghold of Tyrant Marius.',
    type: 'dungeon',
    music: 'final_dungeon',
    encounterTable: 'ashlands',
    encounterRate: 0.10,
    width: 25,
    height: 20,
    playerStart: { x: 0, y: 10 },
    generated: true,
    exits: [
      { x: 0, y: 10, target: 'capital_outskirts', targetX: 28, targetY: 10, label: 'To Capital Outskirts' },
    ],
    chests: [
      { x: 20, y: 5, contents: 'full_heal', qty: 3, id: 'al_chest1' },
      { x: 10, y: 15, contents: 'dragon_heart', qty: 1, id: 'al_chest2' },
    ],
    npcs: [],
    waystones: [{ x: 12, y: 10, id: 'vs_ashlands' }],
    bossEncounter: { x: 20, y: 10, enemyId: 'boss_tyrant', flag: 'boss_tyrant_defeated' },
  },
};

const RECIPIES = {
  iron_sword: { result: 'iron_sword', qty: 1, materials: { iron_ore: 3, wolf_pelt: 1 }, description: 'Forge an iron sword from raw materials' },
  steel_sword: { result: 'steel_sword', qty: 1, materials: { iron_ore: 5, stone_core: 2 }, description: 'Forge a superior steel sword' },
  flame_blade: { result: 'flame_blade', qty: 1, materials: { ember_dust: 5, crystal_shard: 2, iron_ore: 3 }, description: 'Enchant a blade with fire essence' },
  chain_mail: { result: 'chain_mail', qty: 1, materials: { iron_ore: 4, wolf_pelt: 2 }, description: 'Weave chain links into armor' },
  plate_armor: { result: 'plate_armor', qty: 1, materials: { iron_ore: 8, stone_core: 3, wyvern_scale: 1 }, description: 'Craft heavy plate armor' },
  mage_robe: { result: 'mage_robe', qty: 1, materials: { mana_crystal: 2, slime_jelly: 5 }, description: 'Stitch enchanted robes' },
  hp_potion_m: { result: 'hp_potion_m', qty: 2, materials: { slime_jelly: 3, ember_dust: 1 }, description: 'Brew enhanced healing potions' },
  bomb: { result: 'bomb', qty: 2, materials: { ember_dust: 3, stone_core: 1 }, description: 'Craft explosive bombs' },
  full_heal: { result: 'full_heal', qty: 1, materials: { mana_crystal: 3, crystal_shard: 2, slime_jelly: 5 }, description: 'Create a legendary elixir of life' },
};

// === dialogs.js ===
// ==========================================
// Chronicles of the Fallen Crown - Dialog Data
// ==========================================

const DIALOGS = {
  // =========================
  // TITLE PROLOGUE
  // =========================
  prologue: [
    { speaker: 'Narrator', text: 'In the year 1247 of the Valdrian Calendar, the Kingdom of Valdria was blessed by four Elemental Crystals — Fire, Ice, Lightning, and Holy.' },
    { speaker: 'Narrator', text: 'For centuries, these crystals maintained peace across the land. The Kingdom flourished under the rule of King Aldric IV.' },
    { speaker: 'Narrator', text: 'But on the eve of the Harvest Moon Festival, everything changed...' },
    { speaker: 'Narrator', text: 'King Aldric IV was found dead in his throne room. The Crown of Valdria — said to hold the power of all four crystals — had shattered.' },
    { speaker: 'Narrator', text: 'Three noble houses vied for the throne. War erupted across the kingdom.' },
    { speaker: 'Narrator', text: 'In the chaos, a young knight named Sir Cedric discovered the truth: the King\'s death was no accident...' },
    { speaker: 'Narrator', text: '=== Chronicles of the Fallen Crown ===' },
    { speaker: 'Narrator', text: 'Your adventure begins now. The fate of Valdria rests in your hands.' },
  ],

  // =========================
  // VERDANT WOODS
  // =========================
  elder_intro: {
    flag: null,
    dialog: [
      { speaker: 'Elder Thornwood', text: 'Ah, Sir Cedric! You survived the attack on the castle. The whole kingdom mourns King Aldric.' },
      { speaker: 'Sir Cedric', text: 'Elder, I witnessed the assassin. It was... it was one of the nobles.' },
      { speaker: 'Elder Thornwood', text: 'Say no more here. Walls have ears in these times. Take your party to the Capital. Captain Rhea will know what to do.' },
      { speaker: 'Elder Thornwood', text: 'Be warned — the roads are dangerous. Bandits, goblins, and worse roam the forest. Stay on the path when you can.' },
    ],
    onComplete: { quest: 'main_capital_run', stage: 1 },
  },

  guard_woods: {
    flag: null,
    dialog: [
      { speaker: 'Forest Guard', text: 'The path north leads to the Capital. Be careful out here — we\'ve had reports of increased goblin activity.' },
      { speaker: 'Forest Guard', text: 'If you need supplies, Herbalist Fae has a small shop to the west.' },
    ],
  },

  herbalist: {
    flag: null,
    dialog: [
      { speaker: 'Herbalist Fae', text: 'Welcome, traveler! I have potions and remedies for sale. The forest slimes produce excellent healing jelly.' },
      { speaker: 'Herbalist Fae', text: 'I also collect materials. If you find crystal shards or ember dust, I\'d be happy to trade.' },
    ],
  },

  // =========================
  // CAPITAL SQUARE
  // =========================
  captain_intro: {
    flag: null,
    dialog: [
      { speaker: 'Captain Rhea', text: 'Sir Cedric! By the gods, you\'re alive. We thought the entire royal guard was wiped out.' },
      { speaker: 'Sir Cedric', text: 'Captain Rhea. I know who killed the King. But we need proof — without it, no house will believe us.' },
      { speaker: 'Captain Rhea', text: 'Tyrant Marius has seized the eastern capital. He commands the largest army.' },
      { speaker: 'Captain Rhea', text: 'But I\'ve heard rumors... Lady Seraphina, the noble spellblade, seeks allies. And there\'s a ranger called Rowan in the outskirts.' },
      { speaker: 'Captain Rhea', text: 'Gather your allies. We need to find proof of the conspiracy before Marius crushes us all.' },
      { speaker: 'Sir Cedric', text: 'I won\'t let the King\'s death go unanswered. I swear it on my honor.' },
    ],
    onComplete: { quest: 'main_gather_allies', stage: 1 },
  },

  merchant_main: {
    flag: null,
    dialog: [
      { speaker: 'Merchant Gareth', text: 'Welcome to my shop! I have weapons, armor, and potions. Times are tough, but I keep the supplies coming.' },
      { speaker: 'Merchant Gareth', text: 'Need to craft something? There\'s a blacksmith\'s bench nearby. Bring materials and I can teach you recipes.' },
    ],
  },

  scholar_lore: {
    flag: null,
    dialog: [
      { speaker: 'Scholar Elara', text: 'Fascinating times we live in, aren\'t they? The Fall of the Crown has disrupted the Crystal Spires.' },
      { speaker: 'Scholar Elara', text: 'Legend says the Crown was forged from the essence of all four crystals. Its destruction has weakened the elemental barriers.' },
      { speaker: 'Scholar Elara', text: 'If someone were to collect the Crown Fragments... they could potentially restore the kingdom\'s magic.' },
    ],
  },

  bard_story: {
    flag: null,
    dialog: [
      { speaker: 'Bard Finnian', text: 'Ah, a fellow traveler! Let me sing you a tale of old Valdria...' },
      { speaker: 'Bard Finnian', text: '~♪ "When the crown fell from the sky / Three houses raised their banners high / But a knight of steel and soul / Will unite the broken whole" ♪~' },
      { speaker: 'Bard Finnian', text: 'That\'s my newest composition. What do you think? I call it "The Song of the Fallen Crown."' },
    ],
  },

  orphan_quest: {
    flag: null,
    dialog: [
      { speaker: 'Orphan Lily', text: 'Please, sir knight! My parents were taken when the war started. I have nothing...' },
      { speaker: 'Orphan Lily', text: 'If you find any food or supplies, could you spare some? I just need 3 Health Potions to get by.' },
    ],
    questId: 'side_help_orphan',
  },

  // =========================
  // CAPITAL OUTSKIRTS
  // =========================
  refugee_outskirts: {
    flag: null,
    dialog: [
      { speaker: 'Refugee Maren', text: 'Thank the gods you\'re here! The Shadow Knight has been terrorizing this area.' },
      { speaker: 'Refugee Maren', text: 'He was once Sir Vexar, one of the King\'s best knights. But after the Crown shattered... something changed in him.' },
      { speaker: 'Refugee Maren', text: 'Be careful if you venture deeper. He guards something important to the north.' },
    ],
  },

  // =========================
  // CRYSTAL CAVES
  // =========================
  miner_caves: {
    flag: null,
    dialog: [
      { speaker: 'Miner Oskar', text: 'These caves are rich with crystal shards! But dangerous creatures lurk deeper inside.' },
      { speaker: 'Miner Oskar', text: 'I\'ve heard a massive dragon has made its lair in the deepest chamber. Best stay away from there...' },
      { speaker: 'Miner Oskar', text: 'If you bring me materials, I can help you craft equipment. There\'s a workbench right here.' },
    ],
  },

  // =========================
  // ENDGAME DIALOG
  // =========================
  tyrant_confrontation: [
    { speaker: 'Tyrant Marius', text: 'So, the little knight finally arrives. You think you can challenge ME?' },
    { speaker: 'Sir Cedric', text: 'Marius! You murdered King Aldric. You shattered the Crown. This ends now.' },
    { speaker: 'Tyrant Marius', text: 'Murdered? I LIBERATED this kingdom from a weak fool! The crystals would have eventually failed.' },
    { speaker: 'Tyrant Marius', text: 'Only by seizing power can Valdria survive. And with the Crown Fragments, I shall become unstoppable!' },
    { speaker: 'Seraphina', text: 'Your ambition has destroyed thousands of lives, Marius. We won\'t let you continue.' },
    { speaker: 'Tyrant Marius', text: 'Then DIE, all of you!' },
  ],

  ending_good: [
    { speaker: 'Narrator', text: 'With Tyrant Marius defeated and the Crown Fragments reunited, a new light washes over Valdria.' },
    { speaker: 'Narrator', text: 'Sir Cedric is offered the throne, but instead proposes a council — all three houses ruling together.' },
    { speaker: 'Narrator', text: 'The Elemental Crystals are restored, and peace returns to the land.' },
    { speaker: 'Sir Cedric', text: 'We fought not for power, but for the people. That is what makes us different from Marius.' },
    { speaker: 'Narrator', text: '=== THE END — The True King ===\nThank you for playing Chronicles of the Fallen Crown!' },
  ],

  ending_neutral: [
    { speaker: 'Narrator', text: 'Marius is defeated, but the Crown cannot be fully restored. Valdria is free, but broken.' },
    { speaker: 'Narrator', text: 'Sir Cedric takes the throne as regent, vowing to rebuild the kingdom piece by piece.' },
    { speaker: 'Narrator', text: '=== THE END — The Regent ===\nThank you for playing Chronicles of the Fallen Crown!' },
  ],

  ending_dark: [
    { speaker: 'Narrator', text: 'In the chaos of battle, Cedric claims the power of the Crown Fragments for himself.' },
    { speaker: 'Narrator', text: 'With unlimited power at his fingertips, he forges a new kingdom in his image.' },
    { speaker: 'Narrator', text: 'Some call him a tyrant. Others call him a savior. Only time will tell.' },
    { speaker: 'Narrator', text: '=== THE END — The Fallen Crown ===\nThank you for playing Chronicles of the Fallen Crown!' },
  ],
};

const QUESTS = {
  // ===== MAIN QUESTS =====
  main_capital_run: {
    id: 'main_capital_run',
    name: 'The Escape',
    desc: 'Flee the Verdant Woods and reach the Capital Square safely.',
    type: 'main',
    stages: [
      { desc: 'Speak with Elder Thornwood', area: 'verdant_woods' },
      { desc: 'Travel to Valdria Capital', area: 'capital_square' },
    ],
    rewards: { exp: 50, gold: 100 },
  },
  main_gather_allies: {
    id: 'main_gather_allies',
    name: 'Gathering of Allies',
    desc: 'Recruit Seraphina, Rowan, and Mira to your cause.',
    type: 'main',
    stages: [
      { desc: 'Speak with Captain Rhea', area: 'capital_square' },
      { desc: 'Find allies in the Capital and Outskirts', area: 'capital_outskirts' },
    ],
    rewards: { exp: 100, gold: 200 },
  },
  main_find_evidence: {
    id: 'main_find_evidence',
    name: 'Proof of Treason',
    desc: 'Venture into the Crystal Caves to find evidence of Marius\'s conspiracy.',
    type: 'main',
    stages: [
      { desc: 'Explore the Crystal Caves', area: 'crystal_caves_entrance' },
      { desc: 'Defeat the Guardian in the Deep Caves', area: 'crystal_caves_deep' },
    ],
    rewards: { exp: 200, gold: 500, items: [{ id: 'crown_fragment', qty: 1 }] },
  },
  main_confront_marius: {
    id: 'main_confront_marius',
    name: 'The Tyrant\'s End',
    desc: 'Travel to the Ashlands and confront Tyrant Marius once and for all.',
    type: 'main',
    stages: [
      { desc: 'Travel to the Ashlands', area: 'ashlands' },
      { desc: 'Defeat Tyrant Marius', area: 'ashlands' },
    ],
    rewards: { exp: 500, gold: 1000 },
  },

  // ===== SIDE QUESTS =====
  side_help_orphan: {
    id: 'side_help_orphan',
    name: 'A Light in the Dark',
    desc: 'Bring 3 Health Potions to orphan Lily in the Capital Square.',
    type: 'side',
    stages: [
      { desc: 'Collect 3 Health Potions', count: true, required: { item: 'hp_potion', qty: 3 } },
      { desc: 'Give potions to Lily', area: 'capital_square', npc: 'npc_orphan' },
    ],
    rewards: { exp: 30, gold: 50, items: [{ id: 'magic_ring', qty: 1 }] },
  },
  side_wolf_hunt: {
    id: 'side_wolf_hunt',
    name: 'Wolf Hunter',
    desc: 'Defeat 5 Dire Wolves in the Verdant Woods.',
    type: 'side',
    stages: [
      { desc: 'Defeat 5 Dire Wolves', count: true, required: { enemy: 'wolf', qty: 5 } },
    ],
    rewards: { exp: 60, gold: 80, items: [{ id: 'rune_bow', qty: 1 }] },
  },
  side_crystal_collect: {
    id: 'side_crystal_collect',
    name: 'Crystal Collector',
    desc: 'Collect 10 Crystal Shards from the Crystal Caves.',
    type: 'side',
    stages: [
      { desc: 'Collect 10 Crystal Shards', count: true, required: { item: 'crystal_shard', qty: 10 } },
    ],
    rewards: { exp: 80, gold: 120, items: [{ id: 'full_heal', qty: 2 }] },
  },
  side_dragon_slayer: {
    id: 'side_dragon_slayer',
    name: 'Dragon Slayer',
    desc: 'Defeat the Dragon Lord Vexar in the Dragon Mountain.',
    type: 'side',
    stages: [
      { desc: 'Reach Dragon Mountain', area: 'dragon_mountain' },
      { desc: 'Defeat Dragon Lord Vexar', area: 'dragon_mountain' },
    ],
    rewards: { exp: 300, gold: 500 },
  },
  side_craft_master: {
    id: 'side_craft_master',
    name: 'Master Smith',
    desc: 'Craft 5 different items at a crafting bench.',
    type: 'side',
    stages: [
      { desc: 'Craft 5 different items', count: true, required: { craft: 5 } },
    ],
    rewards: { exp: 100, gold: 200, items: [{ id: 'plate_armor', qty: 1 }] },
  },
};

// === state.js ===
// ==========================================
// Chronicles of the Fallen Crown - Game State
// ==========================================





class GameState {
  constructor() {
    this.screen = 'title'; // title, exploring, battle, dialog, menu, gameover, victory
    this.currentArea = 'verdant_woods';
    this.playerPos = { x: 14, y: 18 };
    this.playerDir = 'up'; // up, down, left, right
    this.playerMoving = false;
    this.animFrame = 0;
    this.animTimer = 0;

    // Party
    this.party = this.createInitialParty();
    this.activePartyMembers = ['cedric', 'lyra', 'aldous'];
    this.reserveParty = ['rowan', 'mira', 'dorin', 'seraphina'];

    // Inventory
    this.inventory = this.createInitialInventory();
    this.gold = 200;

    // Quests
    this.activeQuests = ['main_capital_run'];
    this.completedQuests = [];
    this.questProgress = {};
    this.flags = {};

    // Stats tracking
    this.stats = {
      battlesWon: 0,
      enemiesDefeated: {},
      itemsCrafted: 0,
      totalDamage: 0,
      playTime: 0,
    };

    // Opened chests
    this.openedChests = new Set();

    // Dialog
    this.currentDialog = null;
    this.dialogIndex = 0;

    // Menu
    this.menuTab = 'party';
    this.selectedCharacter = 'cedric';
    this.selectedSkillBranch = 0;

    // Battle
    this.battleState = null;

    // Notification queue
    this.notifications = [];

    // World flags for generated tile maps
    this.worldFlags = {};

    // Unlocked waystones
    this.unlockedWaystones = new Set(['vs_verdant']);

    // Notification timer
    this._notifTimer = 0;
  }

  createInitialParty() {
    const party = {};
    for (const [id, char] of Object.entries(CHARACTERS)) {
      party[id] = {
        ...char,
        level: 1,
        exp: 0,
        expToNext: 30,
        currentHp: char.baseStats.hp,
        currentMp: char.baseStats.mp,
        maxHp: char.baseStats.hp,
        maxMp: char.baseStats.mp,
        stats: { ...char.baseStats },
        equipment: { weapon: null, armor: null, accessory: null },
        statusEffects: [],
        unlockedSkills: [char.skills[0].id, char.skills[1].id], // First two skills unlocked
        skillPoints: 0,
        affection: 0,
      };
    }
    return party;
  }

  createInitialInventory() {
    return {
      'hp_potion': 5,
      'mp_potion': 3,
      'antidote': 2,
      'smoke_bomb': 1,
    };
  }

  // ============ LEVELING ============
  addExp(memberId, amount) {
    const member = this.party[memberId];
    if (!member || member.currentHp <= 0) return;

    member.exp += amount;
    const messages = [];

    while (member.exp >= member.expToNext) {
      member.exp -= member.expToNext;
      member.level++;
      member.expToNext = Math.floor(30 * Math.pow(1.3, member.level - 1));
      member.skillPoints++;

      // Apply growth rates
      for (const [stat, growth] of Object.entries(member.growthRates)) {
        member.stats[stat] += growth;
        if (stat === 'hp') { member.maxHp += growth; member.currentHp += growth; }
        if (stat === 'mp') { member.maxMp += growth; member.currentMp += growth; }
      }

      // Job class evolution at level 30
      if (member.level === 30) {
        messages.push(`${member.name} has reached the pinnacle! Class evolution available!`);
      } else {
        messages.push(`${member.name} leveled up to ${member.level}!`);
      }
    }

    return messages;
  }

  addExpToParty(amount) {
    const messages = [];
    for (const id of this.activePartyMembers) {
      const msgs = this.addExp(id, amount);
      if (msgs) messages.push(...msgs);
    }
    return messages;
  }

  // ============ INVENTORY ============
  addItem(itemId, qty = 1) {
    this.inventory[itemId] = (this.inventory[itemId] || 0) + qty;
  }

  removeItem(itemId, qty = 1) {
    if ((this.inventory[itemId] || 0) >= qty) {
      this.inventory[itemId] -= qty;
      if (this.inventory[itemId] <= 0) delete this.inventory[itemId];
      return true;
    }
    return false;
  }

  hasItem(itemId, qty = 1) {
    return (this.inventory[itemId] || 0) >= qty;
  }

  useItem(itemId, targetId) {
    const item = ITEMS[itemId];
    if (!item || item.type !== 'consumable') return false;

    switch (item.subtype) {
      case 'heal_hp': {
        const target = this.party[targetId];
        if (!target || target.currentHp <= 0) return false;
        target.currentHp = Math.min(target.maxHp, target.currentHp + item.value);
        this.removeItem(itemId);
        return { message: `${target.name} recovered ${item.value} HP!`, type: 'heal' };
      }
      case 'heal_mp': {
        const target = this.party[targetId];
        if (!target || target.currentHp <= 0) return false;
        target.currentMp = Math.min(target.maxMp, target.currentMp + item.value);
        this.removeItem(itemId);
        return { message: `${target.name} recovered ${item.value} MP!`, type: 'heal' };
      }
      case 'heal_full': {
        const target = this.party[targetId];
        if (!target || target.currentHp <= 0) return false;
        target.currentHp = target.maxHp;
        target.currentMp = target.maxMp;
        this.removeItem(itemId);
        return { message: `${target.name} fully restored!`, type: 'heal' };
      }
      case 'revive': {
        const target = this.party[targetId];
        if (!target || target.currentHp > 0) return false;
        target.currentHp = Math.floor(target.maxHp * item.value);
        this.removeItem(itemId);
        return { message: `${target.name} has been revived!`, type: 'heal' };
      }
      case 'cure_status': {
        const target = this.party[targetId];
        if (!target) return false;
        target.statusEffects = target.statusEffects.filter(s => s.type !== item.status);
        this.removeItem(itemId);
        return { message: `${target.name}'s ${item.status} was cured!`, type: 'status' };
      }
    }
    return false;
  }

  // ============ EQUIPMENT ============
  equipItem(memberId, itemId) {
    const member = this.party[memberId];
    const item = ITEMS[itemId];
    if (!member || !item || item.type !== 'equipment') return false;

    const oldEquip = member.equipment[item.slot];
    if (oldEquip) this.addItem(oldEquip);
    this.removeItem(itemId);
    member.equipment[item.slot] = itemId;

    this.recalcStats(memberId);
    return true;
  }

  unequipItem(memberId, slot) {
    const member = this.party[memberId];
    if (!member || !member.equipment[slot]) return false;

    this.addItem(member.equipment[slot]);
    member.equipment[slot] = null;
    this.recalcStats(memberId);
    return true;
  }

  recalcStats(memberId) {
    const member = this.party[memberId];
    if (!member) return;

    // Start from base stats + growth
    const base = { ...CHARACTERS[member.id].baseStats };
    for (let i = 1; i < member.level; i++) {
      for (const [stat, growth] of Object.entries(CHARACTERS[member.id].growthRates)) {
        base[stat] += growth;
      }
    }

    // Add equipment bonuses
    for (const slot of ['weapon', 'armor', 'accessory']) {
      const eqId = member.equipment[slot];
      if (eqId) {
        const eq = ITEMS[eqId];
        for (const [stat, val] of Object.entries(eq)) {
          if (stat in base && typeof val === 'number') {
            base[stat] += val;
          }
        }
      }
    }

    member.stats = base;
    member.maxHp = base.hp;
    member.maxMp = base.mp;
    member.currentHp = Math.min(member.currentHp, member.maxHp);
    member.currentMp = Math.min(member.currentMp, member.maxMp);
  }

  // ============ QUESTS ============
  activateQuest(questId) {
    if (!this.activeQuests.includes(questId) && !this.completedQuests.includes(questId)) {
      this.activeQuests.push(questId);
      this.questProgress[questId] = { stage: 0, counters: {} };
      const quest = QUESTS[questId];
      if (quest) {
        this.showNotification(`New Quest: ${quest.name}`);
      }
    }
  }

  advanceQuest(questId, stage) {
    if (!this.activeQuests.includes(questId)) return;
    const progress = this.questProgress[questId] || { stage: 0, counters: {} };
    progress.stage = Math.max(progress.stage, stage || 0);
    this.questProgress[questId] = progress;
  }

  completeQuest(questId) {
    const quest = QUESTS[questId];
    if (!quest) return;

    this.activeQuests = this.activeQuests.filter(q => q !== questId);
    this.completedQuests.push(questId);

    // Grant rewards
    if (quest.rewards.exp) this.addExpToParty(quest.rewards.exp);
    if (quest.rewards.gold) this.gold += quest.rewards.gold;
    if (quest.rewards.items) {
      for (const item of quest.rewards.items) {
        this.addItem(item.id, item.qty);
      }
    }

    this.showNotification(`Quest Complete: ${quest.name}!`);
  }

  // ============ FLAGS ============
  setFlag(flag, value = true) {
    this.flags[flag] = value;
  }

  hasFlag(flag) {
    return this.flags[flag] === true;
  }

  // ============ NOTIFICATIONS ============
  showNotification(text) {
    this.notifications.push({ text, timer: 3000 });
  }

  // ============ SAVE/LOAD ============
  saveGame() {
    const saveData = {
      currentArea: this.currentArea,
      playerPos: this.playerPos,
      party: this.party,
      activePartyMembers: this.activePartyMembers,
      reserveParty: this.reserveParty,
      inventory: this.inventory,
      gold: this.gold,
      activeQuests: this.activeQuests,
      completedQuests: this.completedQuests,
      questProgress: this.questProgress,
      flags: this.flags,
      stats: this.stats,
      openedChests: [...this.openedChests],
      unlockedWaystones: [...this.unlockedWaystones],
    };
    localStorage.setItem('cotfc_save', JSON.stringify(saveData));
    this.showNotification('Game saved!');
  }

  loadGame() {
    const data = localStorage.getItem('cotfc_save');
    if (!data) return false;

    try {
      const save = JSON.parse(data);
      this.currentArea = save.currentArea;
      this.playerPos = save.playerPos;
      this.party = save.party;
      this.activePartyMembers = save.activePartyMembers;
      this.reserveParty = save.reserveParty;
      this.inventory = save.inventory;
      this.gold = save.gold;
      this.activeQuests = save.activeQuests;
      this.completedQuests = save.completedQuests;
      this.questProgress = save.questProgress;
      this.flags = save.flags;
      this.stats = save.stats;
      this.openedChests = new Set(save.openedChests);
      this.unlockedWaystones = new Set(save.unlockedWaystones);
      this.screen = 'exploring';
      this.showNotification('Game loaded!');
      return true;
    } catch (e) {
      console.error('Failed to load save:', e);
      return false;
    }
  }

  hasSaveGame() {
    return !!localStorage.getItem('cotfc_save');
  }

  resetGame() {
    this.party = this.createInitialParty();
    this.activePartyMembers = ['cedric', 'lyra', 'aldous'];
    this.reserveParty = ['rowan', 'mira', 'dorin', 'seraphina'];
    this.inventory = this.createInitialInventory();
    this.gold = 200;
    this.currentArea = 'verdant_woods';
    this.playerPos = { x: 14, y: 18 };
    this.activeQuests = ['main_capital_run'];
    this.completedQuests = [];
    this.questProgress = {};
    this.flags = {};
    this.stats = { battlesWon: 0, enemiesDefeated: {}, itemsCrafted: 0, totalDamage: 0, playTime: 0 };
    this.openedChests = new Set();
    this.unlockedWaystones = new Set(['vs_verdant']);
  }
}

// === world.js ===
// ==========================================
// Chronicles of the Fallen Crown - World System
// ==========================================



const TILE_SIZE = 32;
const VIEWPORT_W = 960;
const VIEWPORT_H = 640;

// Pseudorandom seeded generator
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

class World {
  constructor() {
    this.tileMaps = {};
    this.animTime = 0;
    this.particleEffects = [];
  }

  getTileMap(areaId) {
    if (this.tileMaps[areaId]) return this.tileMaps[areaId];
    const area = AREAS[areaId];
    if (!area) return null;
    if (area.generated) {
      this.tileMaps[areaId] = this.generateMap(area, areaId);
    }
    return this.tileMaps[areaId];
  }

  generateMap(area, areaId) {
    const w = area.width;
    const h = area.height;
    const tiles = [];
    const seed = this.hashCode(areaId);
    const rng = seededRandom(Math.abs(seed) + 1);

    // Fill base tiles based on area type
    for (let y = 0; y < h; y++) {
      tiles[y] = [];
      for (let x = 0; x < w; x++) {
        if (area.type === 'outdoor') {
          tiles[y][x] = T.GRASS;
        } else if (area.type === 'town') {
          tiles[y][x] = T.FLOOR;
        } else {
          tiles[y][x] = T.FLOOR;
        }
      }
    }

    // Add borders/walls
    for (let x = 0; x < w; x++) {
      tiles[0][x] = T.WALL;
      tiles[h - 1][x] = T.WALL;
    }
    for (let y = 0; y < h; y++) {
      tiles[y][0] = T.WALL;
      tiles[y][w - 1] = T.WALL;
    }

    // Add natural features based on area type
    if (area.type === 'outdoor') {
      // Trees
      for (let i = 0; i < w * h * 0.15; i++) {
        const x = Math.floor(rng() * (w - 2)) + 1;
        const y = Math.floor(rng() * (h - 2)) + 1;
        if (tiles[y][x] === T.GRASS && !this.isNearPlayerStart(x, y, area)) {
          tiles[y][x] = T.TREE;
        }
      }
      // Rocks
      for (let i = 0; i < w * h * 0.03; i++) {
        const x = Math.floor(rng() * (w - 2)) + 1;
        const y = Math.floor(rng() * (h - 2)) + 1;
        if (tiles[y][x] === T.GRASS && !this.isNearPlayerStart(x, y, area)) {
          tiles[y][x] = T.ROCK;
        }
      }
      // Flowers
      for (let i = 0; i < w * h * 0.05; i++) {
        const x = Math.floor(rng() * (w - 2)) + 1;
        const y = Math.floor(rng() * (h - 2)) + 1;
        if (tiles[y][x] === T.GRASS) {
          tiles[y][x] = T.FLOWER;
        }
      }
      // Water patches
      for (let i = 0; i < 3; i++) {
        const cx = Math.floor(rng() * (w - 6)) + 3;
        const cy = Math.floor(rng() * (h - 6)) + 3;
        const size = Math.floor(rng() * 2) + 1;
        for (let dy = -size; dy <= size; dy++) {
          for (let dx = -size; dx <= size; dx++) {
            const nx = cx + dx, ny = cy + dy;
            if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
              if (dx * dx + dy * dy <= size * size) {
                tiles[ny][nx] = T.WATER;
              }
            }
          }
        }
      }
    } else if (area.type === 'dungeon') {
      // Add walls to create corridors
      const rooms = [];
      for (let i = 0; i < 6; i++) {
        const rx = Math.floor(rng() * (w - 10)) + 3;
        const ry = Math.floor(rng() * (h - 10)) + 3;
        const rw = Math.floor(rng() * 5) + 4;
        const rh = Math.floor(rng() * 4) + 3;
        rooms.push({ x: rx, y: ry, w: rw, h: rh });

        // Carve room
        for (let dy = 0; dy < rh; dy++) {
          for (let dx = 0; dx < rw; dx++) {
            const nx = rx + dx, ny = ry + dy;
            if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
              tiles[ny][nx] = T.FLOOR;
            }
          }
        }
      }

      // Fill unused space with walls
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (tiles[y][x] === T.FLOOR) continue;
          tiles[y][x] = T.WALL;
        }
      }

      // Connect rooms with corridors
      for (let i = 0; i < rooms.length - 1; i++) {
        const a = rooms[i], b = rooms[i + 1];
        const ax = Math.floor(a.x + a.w / 2);
        const ay = Math.floor(a.y + a.h / 2);
        const bx = Math.floor(b.x + b.w / 2);
        const by = Math.floor(b.y + b.h / 2);

        // Horizontal then vertical
        let cx = ax;
        while (cx !== bx) {
          if (ay > 0 && ay < h - 1 && cx > 0 && cx < w - 1) {
            tiles[ay][cx] = T.FLOOR;
          }
          cx += cx < bx ? 1 : -1;
        }
        let cy = ay;
        while (cy !== by) {
          if (cy > 0 && cy < h - 1 && bx > 0 && bx < w - 1) {
            tiles[cy][bx] = T.FLOOR;
          }
          cy += cy < by ? 1 : -1;
        }
      }
    } else if (area.type === 'town') {
      // Add buildings (walls) with doors
      const buildings = [];
      for (let i = 0; i < 5; i++) {
        const bx = Math.floor(rng() * (w - 8)) + 2;
        const by = Math.floor(rng() * (h - 8)) + 2;
        const bw = Math.floor(rng() * 3) + 3;
        const bh = Math.floor(rng() * 2) + 3;
        buildings.push({ x: bx, y: by, w: bw, h: bh });

        // Building walls
        for (let dy = 0; dy < bh; dy++) {
          for (let dx = 0; dx < bw; dx++) {
            const nx = bx + dx, ny = by + dy;
            if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
              if (dy === 0 || dy === bh - 1 || dx === 0 || dx === bw - 1) {
                tiles[ny][nx] = T.WALL;
              } else {
                tiles[ny][nx] = T.FLOOR;
              }
            }
          }
        }

        // Door
        const doorX = bx + Math.floor(bw / 2);
        const doorY = by + bh - 1;
        if (doorY < h - 1 && doorX > 0 && doorX < w - 1) {
          tiles[doorY][doorX] = T.DOOR;
        }
      }

      // Paths
      for (let x = 1; x < w - 1; x++) {
        if (tiles[Math.floor(h / 2)][x] === T.GRASS || tiles[Math.floor(h / 2)][x] === T.FLOWER) {
          tiles[Math.floor(h / 2)][x] = T.PATH;
        }
      }
      for (let y = 1; y < h - 1; y++) {
        if (tiles[y][Math.floor(w / 2)] === T.GRASS || tiles[y][Math.floor(w / 2)] === T.FLOWER) {
          tiles[y][Math.floor(w / 2)] = T.PATH;
        }
      }
    }

    // Clear around player start
    const px = area.playerStart.x;
    const py = area.playerStart.y;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1) {
          if (tiles[ny][nx] !== T.FLOOR && tiles[ny][nx] !== T.PATH) {
            tiles[ny][nx] = area.type === 'outdoor' ? T.GRASS : T.FLOOR;
          }
        }
      }
    }

    // Place special tiles
    // Exits
    for (const exit of (area.exits || [])) {
      if (exit.x >= 0 && exit.x < w && exit.y >= 0 && exit.y < h) {
        tiles[exit.y][exit.x] = T.DOOR;
      }
    }

    // Chests
    for (const chest of (area.chests || [])) {
      if (chest.x >= 0 && chest.x < w && chest.y >= 0 && chest.y < h) {
        tiles[chest.y][chest.x] = T.CHEST;
      }
    }

    // NPCs
    for (const npc of (area.npcs || [])) {
      if (npc.x >= 0 && npc.x < w && npc.y >= 0 && npc.y < h) {
        tiles[npc.y][npc.x] = T.NPC;
      }
    }

    // Signs
    for (const sign of (area.signs || [])) {
      if (sign.x >= 0 && sign.x < w && sign.y >= 0 && sign.y < h) {
        tiles[sign.y][sign.x] = T.SIGN;
      }
    }

    // Waystones
    for (const ws of (area.waystones || [])) {
      if (ws.x >= 0 && ws.x < w && ws.y >= 0 && ws.y < h) {
        tiles[ws.y][ws.x] = T.WAYSTONE;
      }
    }

    // Crafting benches
    for (const cb of (area.craftingBenches || [])) {
      if (cb.x >= 0 && cb.x < w && cb.y >= 0 && cb.y < h) {
        tiles[cb.y][cb.x] = T.CRAFT;
      }
    }

    // Shops
    for (const shop of (area.shops || [])) {
      if (shop.x >= 0 && shop.x < w && shop.y >= 0 && shop.y < h) {
        tiles[shop.y][shop.x] = T.SHOP;
      }
    }

    // Boss
    if (area.bossEncounter) {
      const be = area.bossEncounter;
      if (be.x >= 0 && be.x < w && be.y >= 0 && be.y < h) {
        tiles[be.y][be.x] = T.BOSS;
      }
    }

    // Save points (always near waystones)
    for (const ws of (area.waystones || [])) {
      if (ws.x > 0 && ws.x < w - 1) {
        tiles[ws.y][ws.x + 1] = T.SAVE;
      }
    }

    return tiles;
  }

  isNearPlayerStart(x, y, area) {
    const dx = Math.abs(x - area.playerStart.x);
    const dy = Math.abs(y - area.playerStart.y);
    return dx < 3 && dy < 3;
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash;
  }

  isBlocking(tiles, x, y) {
    if (!tiles || y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) return true;
    return BLOCKING_TILES.has(tiles[y][x]);
  }

  isInteractable(tiles, x, y) {
    if (!tiles || y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) return false;
    return INTERACTABLE_TILES.has(tiles[y][x]);
  }

  render(ctx, state, cameraX, cameraY) {
    const area = AREAS[state.currentArea];
    const tiles = this.getTileMap(state.currentArea);
    if (!area || !tiles) return;

    this.animTime += 0.02;

    const startTileX = Math.max(0, Math.floor(cameraX / TILE_SIZE));
    const startTileY = Math.max(0, Math.floor(cameraY / TILE_SIZE));
    const endTileX = Math.min(area.width, Math.ceil((cameraX + VIEWPORT_W) / TILE_SIZE) + 1);
    const endTileY = Math.min(area.height, Math.ceil((cameraY + VIEWPORT_H) / TILE_SIZE) + 1);

    // Render tiles
    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        const tile = tiles[y][x];
        const screenX = x * TILE_SIZE - cameraX;
        const screenY = y * TILE_SIZE - cameraY;

        // Base color
        let color = TILE_COLORS[tile] || '#333';

        // Animate certain tiles
        if (tile === T.WATER) {
          const wave = Math.sin(this.animTime * 2 + x * 0.5 + y * 0.3) * 20;
          color = this.adjustColor(color, wave);
        } else if (tile === T.FLOWER) {
          const bright = Math.sin(this.animTime * 3 + x + y) * 10;
          color = this.adjustColor(color, bright);
        } else if (tile === T.WAYSTONE) {
          const glow = Math.sin(this.animTime * 4) * 30 + 20;
          color = this.adjustColor('#3a5a9a', glow);
        } else if (tile === T.SAVE) {
          const glow = Math.sin(this.animTime * 3 + 1) * 20 + 10;
          color = this.adjustColor('#2a6a4a', glow);
        } else if (tile === T.CHEST) {
          color = '#c0a030';
        } else if (tile === T.CHEST_OPEN) {
          color = '#6a6a30';
        } else if (tile === T.BOSS) {
          const pulse = Math.sin(this.animTime * 3) * 30;
          color = this.adjustColor('#8a1a1a', pulse);
        }

        // Draw tile
        ctx.fillStyle = color;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Add subtle grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Draw special tile indicators
        const emoji = TILE_EMOJIS[tile];
        if (emoji) {
          ctx.font = '18px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
        }
      }
    }

    // Render NPCs with names
    for (const npc of (area.npcs || [])) {
      const screenX = npc.x * TILE_SIZE - cameraX;
      const screenY = npc.y * TILE_SIZE - cameraY;
      if (screenX > -TILE_SIZE && screenX < VIEWPORT_W + TILE_SIZE &&
        screenY > -TILE_SIZE && screenY < VIEWPORT_H + TILE_SIZE) {
        // NPC body
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(npc.emoji, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);

        // Name label
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, screenX + TILE_SIZE / 2, screenY - 6);

        // Interaction hint
        const dx = Math.abs(state.playerPos.x - npc.x);
        const dy = Math.abs(state.playerPos.y - npc.y);
        if (dx + dy <= 2) {
          ctx.fillStyle = 'rgba(212,175,55,0.9)';
          ctx.fillText('[E] Talk', screenX + TILE_SIZE / 2, screenY + TILE_SIZE + 10);
        }
      }
    }

    // Render player
    const playerScreenX = state.playerPos.x * TILE_SIZE - cameraX;
    const playerScreenY = state.playerPos.y * TILE_SIZE - cameraY;
    const bobY = Math.sin(this.animTime * 5) * 1.5;

    // Player shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE - 2, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player emoji
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚔️', playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE / 2 + bobY);

    // Direction indicator
    const dirOffsets = { up: [0, -10], down: [0, 10], left: [-10, 0], right: [10, 0] };
    const [dx, dy] = dirOffsets[state.playerDir];
    ctx.fillStyle = 'rgba(212,175,55,0.6)';
    ctx.beginPath();
    ctx.moveTo(playerScreenX + TILE_SIZE / 2 + dx * 0.3, playerScreenY + TILE_SIZE / 2 + dy * 0.3);
    ctx.lineTo(playerScreenX + TILE_SIZE / 2 + dx * 0.8, playerScreenY + TILE_SIZE / 2 + dy * 0.8);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d4af37';
    ctx.stroke();

    // Render minimap
    this.renderMinimap(ctx, area, tiles, state);

    // Render area name (fade in/out)
    this.renderAreaLabel(ctx, area);

    // Render particles
    this.updateParticles(ctx, cameraX, cameraY);
  }

  renderMinimap(ctx, area, tiles, state) {
    const mmX = VIEWPORT_W - 160;
    const mmY = VIEWPORT_H - 120;
    const mmW = 148;
    const mmH = 108;
    const scale = Math.min(mmW / area.width, mmH / area.height);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mmX, mmY, mmW, mmH);
    ctx.strokeStyle = '#c0a050';
    ctx.strokeRect(mmX, mmY, mmW, mmH);

    // Title
    ctx.fillStyle = '#c0a050';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MAP', mmX + 4, mmY - 4);

    // Tiles (simplified)
    for (let y = 0; y < area.height; y++) {
      for (let x = 0; x < area.width; x++) {
        const tile = tiles[y][x];
        let color;
        if (tile === T.WALL || tile === T.TREE || tile === T.ROCK) color = '#555';
        else if (tile === T.WATER) color = '#2a4a8a';
        else if (tile === T.DOOR || tile === T.EXIT) color = '#c0a030';
        else if (tile === T.BOSS) color = '#ff0000';
        else if (tile === T.CHEST) color = '#ffd700';
        else color = '#3a5a3a';

        ctx.fillStyle = color;
        ctx.fillRect(
          mmX + x * scale,
          mmY + y * scale,
          Math.max(1, scale),
          Math.max(1, scale)
        );
      }
    }

    // Player position
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(
      mmX + state.playerPos.x * scale - 1,
      mmY + state.playerPos.y * scale - 1,
      3, 3
    );
  }

  _areaNameAlpha = 1;
  _lastArea = '';
  renderAreaLabel(ctx, area) {
    if (this._lastArea !== area.id) {
      this._lastArea = area.id;
      this._areaNameAlpha = 1;
    }
    if (this._areaNameAlpha > 0) {
      ctx.globalAlpha = Math.min(1, this._areaNameAlpha);
      ctx.fillStyle = '#c0a050';
      ctx.font = 'bold 24px serif';
      ctx.textAlign = 'center';
      ctx.fillText(area.name, VIEWPORT_W / 2, 80);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText(area.description, VIEWPORT_W / 2, 102);
      ctx.globalAlpha = 1;
      this._areaNameAlpha -= 0.005;
    }
  }

  addParticle(x, y, color, life = 60) {
    this.particleEffects.push({ x, y, color, life, maxLife: life, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 2 });
  }

  updateParticles(ctx, cameraX, cameraY) {
    this.particleEffects = this.particleEffects.filter(p => {
      p.life--;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - cameraX, p.y - cameraY, 3, 3);
      ctx.globalAlpha = 1;
      return p.life > 0;
    });
  }

  adjustColor(hex, amount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}

// === battle.js ===
// ==========================================
// Chronicles of the Fallen Crown - Hack & Slash Battle System
// Real-time action combat with WASD movement, click-to-attack, dodge, and skill cooldowns
// ==========================================

const BATTLE_W = 960;
const BATTLE_H = 640;

// Battle arena bounds
const ARENA_LEFT = 40;
const ARENA_RIGHT = 920;
const ARENA_TOP = 100;
const ARENA_BOTTOM = 500;

class BattleSystem {
  constructor() {
    this.active = false;
    this.enemies = [];
    this.log = [];
    this.pendingRewards = null;

    // Player battle state
    this.player = {
      x: BATTLE_W / 2,
      y: 400,
      vx: 0,
      vy: 0,
      speed: 200,
      facing: { x: 0, y: -1 },
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      atk: 18,
      def: 15,
      isAttacking: false,
      attackTimer: 0,
      attackDuration: 0.3,
      attackCooldown: 0,
      attackCooldownMax: 0.35,
      comboCount: 0,
      comboTimer: 0,
      comboMax: 0.8,
      isDodging: false,
      dodgeTimer: 0,
      dodgeDuration: 0.25,
      dodgeCooldown: 0,
      dodgeCooldownMax: 0.5,
      dodgeDir: { x: 0, y: 0 },
      hitTimer: 0,
      skills: [],
      animFrame: 0,
      animTimer: 0,
    };

    // Input state
    this.keys = {};
    this.mouseDown = false;
    this.mouseX = 0;
    this.mouseY = 0;

    // Damage numbers
    this.damageNumbers = [];

    // Hit effects
    this.hitEffects = [];

    // Screen shake
    this.shakeTimer = 0;
    this.shakeIntensity = 0;

    // Battle state
    this.battleTimer = 0;
    this.isBoss = false;
    this.reward = null;

    // Slash trail visuals
    this.slashTrails = [];
  }

  startBattle(state, enemyGroup) {
    this.active = true;
    this.enemies = [];
    this.log = [];
    this.damageNumbers = [];
    this.hitEffects = [];
    this.slashTrails = [];
    this.battleTimer = 0;
    this.shakeTimer = 0;
    this.pendingRewards = null;

    // Init player from party leader
    const leaderId = state.activePartyMembers[0];
    const leader = state.party[leaderId];
    if (leader) {
      this.player.hp = leader.currentHp;
      this.player.maxHp = leader.maxHp;
      this.player.mp = leader.currentMp;
      this.player.maxMp = leader.maxMp;
      this.player.atk = leader.stats.atk;
      this.player.def = leader.stats.def;
    }
    this.player.x = BATTLE_W / 2;
    this.player.y = 400;
    this.player.isAttacking = false;
    this.player.isDodging = false;
    this.player.comboCount = 0;
    this.player.comboTimer = 0;
    this.player.skills = [];

    // Load skills from party leader
    if (leader && leader.skills) {
      this.player.skills = leader.skills.slice(0, 3).map(function(s, i) {
        return Object.assign({}, s, {
          cooldown: 0,
          maxCooldown: 3 + i * 2,
          key: ['1', '2', '3'][i],
        });
      });
    }

    // Create enemies
    for (var i = 0; i < enemyGroup.length; i++) {
      var enemyId = enemyGroup[i];
      var template = ENEMIES[enemyId];
      if (!template) continue;
      var enemy = Object.assign({}, template, {
        currentHp: template.hp,
        maxHp: template.hp,
        x: 150 + Math.random() * 660,
        y: 150 + Math.random() * 200,
        vx: 0,
        vy: 0,
        speed: 60 + Math.random() * 40,
        isDead: false,
        hitTimer: 0,
        attackTimer: 0,
        attackCooldown: 2 + Math.random() * 2,
        attackRange: 40,
        aiState: 'chase',
        aiTimer: 0,
        staggerGauge: 0,
        staggerMax: 100,
        isStaggered: false,
        staggerTimer: 0,
      });
      this.enemies.push(enemy);
    }

    this.isBoss = this.enemies.some(function(e) { return e.isBoss; });
    this.addLog('Battle! ' + this.enemies.map(function(e) { return e.name; }).join(' + '), 'system');
  }

  addLog(text, type) {
    if (!type) type = 'normal';
    this.log.push({ text: text, type: type, time: Date.now() });
    if (this.log.length > 30) this.log.shift();
  }

  // ============ INPUT ============
  handleKeyInput(key, state) {
    if (!this.active) return null;

    this.keys[key] = true;

    // Skill keys: 1, 2, 3
    if (['1', '2', '3'].indexOf(key) !== -1) {
      var skillIdx = parseInt(key) - 1;
      this.useSkill(skillIdx);
    }

    // Dodge: Space or Shift
    if (key === ' ' || key === 'Shift') {
      this.startDodge();
    }

    // Check victory/defeat
    if (this.enemies.every(function(e) { return e.isDead; })) {
      return 'victory_complete';
    }
    if (this.player.hp <= 0) {
      return 'defeat';
    }

    return null;
  }

  handleClick(x, y, state) {
    if (!this.active) return null;

    // Click = attack toward mouse position
    this.mouseX = x;
    this.mouseY = y;
    this.startAttack();

    // Check victory/defeat
    if (this.enemies.every(function(e) { return e.isDead; })) {
      return 'victory_complete';
    }
    if (this.player.hp <= 0) {
      return 'defeat';
    }

    return null;
  }

  // ============ ACTIONS ============
  startAttack() {
    var p = this.player;
    if (p.isDodging || p.attackCooldown > 0) return;

    p.isAttacking = true;
    p.attackTimer = p.attackDuration;
    p.attackCooldown = p.attackCooldownMax;

    // Update facing direction toward mouse
    var dx = this.mouseX - p.x;
    var dy = this.mouseY - p.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len > 5) {
      p.facing.x = dx / len;
      p.facing.y = dy / len;
    }

    // Combo system
    p.comboTimer = p.comboMax;
    p.comboCount++;

    // Add slash trail visual
    this.slashTrails.push({
      x: p.x + p.facing.x * 30,
      y: p.y + p.facing.y * 30,
      angle: Math.atan2(p.facing.y, p.facing.x),
      timer: 0.2,
      maxTimer: 0.2,
    });

    // Check hit on enemies
    var attackRange = 50;
    var self = this;

    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (enemy.isDead) continue;
      var ex = enemy.x - p.x;
      var ey = enemy.y - p.y;
      var dist = Math.sqrt(ex * ex + ey * ey);

      if (dist < attackRange) {
        // Calculate damage
        var damage = p.atk + Math.floor(Math.random() * 5);
        // Combo bonus
        if (p.comboCount >= 5) damage = Math.floor(damage * 2.0);
        else if (p.comboCount >= 3) damage = Math.floor(damage * 1.5);
        else if (p.comboCount >= 2) damage = Math.floor(damage * 1.2);

        // Apply damage
        var actualDmg = Math.max(1, damage - (enemy.def || 0));
        enemy.currentHp -= actualDmg;
        enemy.hitTimer = 0.15;

        // Stagger gauge
        enemy.staggerGauge += 15;
        if (enemy.staggerGauge >= enemy.staggerMax && !enemy.isStaggered) {
          enemy.isStaggered = true;
          enemy.staggerTimer = 2.0;
          self.addLog(enemy.name + ' STAGGERED!', 'status');
        }

        // Knockback
        var kb = 80;
        var kbAngle = Math.atan2(ey, ex);
        enemy.vx += Math.cos(kbAngle) * kb;
        enemy.vy += Math.sin(kbAngle) * kb;

        // Damage number
        self.damageNumbers.push({
          x: enemy.x,
          y: enemy.y - 20,
          text: String(actualDmg),
          color: p.comboCount >= 3 ? '#f1c40f' : '#ff6b6b',
          timer: 0.8,
          vy: -60,
        });

        // Hit effect
        self.hitEffects.push({
          x: enemy.x,
          y: enemy.y,
          timer: 0.2,
        });

        // Screen shake
        self.shakeTimer = 0.1;
        self.shakeIntensity = 3;

        // Check death
        if (enemy.currentHp <= 0) {
          enemy.isDead = true;
          self.addLog(enemy.name + ' defeated!', 'damage');
        }
      }
    }
  }

  useSkill(skillIdx) {
    var p = this.player;
    if (p.isDodging) return;
    var skill = p.skills[skillIdx];
    if (!skill || skill.cooldown > 0 || p.mp < (skill.mpCost || 5)) return;

    p.mp -= skill.mpCost || 5;
    skill.cooldown = skill.maxCooldown;

    // AOE skill: hit all enemies in range
    var skillRange = 120;
    var self = this;

    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (enemy.isDead) continue;
      var dx = enemy.x - p.x;
      var dy = enemy.y - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < skillRange) {
        var damage = Math.floor(p.atk * (skill.power || 1.5));
        var actualDmg = Math.max(1, damage - (enemy.def || 0));
        enemy.currentHp -= actualDmg;
        enemy.hitTimer = 0.2;

        // Big stagger
        enemy.staggerGauge += 40;

        self.damageNumbers.push({
          x: enemy.x,
          y: enemy.y - 20,
          text: String(actualDmg),
          color: '#74b9ff',
          timer: 1.0,
          vy: -80,
        });

        self.hitEffects.push({
          x: enemy.x,
          y: enemy.y,
          timer: 0.3,
        });

        if (enemy.currentHp <= 0) {
          enemy.isDead = true;
          self.addLog(enemy.name + ' defeated!', 'damage');
        }
      }
    }

    // Visual effect - big slash
    this.slashTrails.push({
      x: p.x + p.facing.x * 40,
      y: p.y + p.facing.y * 40,
      angle: Math.atan2(p.facing.y, p.facing.x),
      timer: 0.4,
      maxTimer: 0.4,
      big: true,
    });

    this.shakeTimer = 0.2;
    this.shakeIntensity = 6;
    this.addLog((skill.name || skill.id) + '!', 'system');
  }

  startDodge() {
    var p = this.player;
    if (p.isDodging || p.dodgeCooldown > 0) return;

    p.isDodging = true;
    p.dodgeTimer = p.dodgeDuration;
    p.dodgeCooldown = p.dodgeCooldownMax;

    // Dodge in movement direction or backward
    var dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['ArrowUp']) dy = -1;
    else if (this.keys['s'] || this.keys['ArrowDown']) dy = 1;
    else if (this.keys['a'] || this.keys['ArrowLeft']) dx = -1;
    else if (this.keys['d'] || this.keys['ArrowRight']) dx = 1;
    else { dx = -p.facing.x; dy = -p.facing.y; }

    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    p.dodgeDir.x = (dx / len) * p.speed * 3;
    p.dodgeDir.y = (dy / len) * p.speed * 3;
  }

  // ============ UPDATE ============
  update(party, activePartyMembers) {
    if (!this.active) return;

    var dt = 1 / 60;
    this.battleTimer += dt;
    var p = this.player;

    // --- Player movement (WASD) ---
    if (!p.isDodging) {
      var mx = 0, my = 0;
      if (this.keys['w'] || this.keys['ArrowUp']) my = -1;
      if (this.keys['s'] || this.keys['ArrowDown']) my = 1;
      if (this.keys['a'] || this.keys['ArrowLeft']) mx = -1;
      if (this.keys['d'] || this.keys['ArrowRight']) mx = 1;

      if (mx !== 0 || my !== 0) {
        var len2 = Math.sqrt(mx * mx + my * my);
        p.x += (mx / len2) * p.speed * dt;
        p.y += (my / len2) * p.speed * dt;
      }
    }

    // --- Player dodge ---
    if (p.isDodging) {
      p.dodgeTimer -= dt;
      p.x += p.dodgeDir.x * dt;
      p.y += p.dodgeDir.y * dt;
      if (p.dodgeTimer <= 0) p.isDodging = false;
    }

    // Clamp player to arena
    p.x = Math.max(ARENA_LEFT + 16, Math.min(ARENA_RIGHT - 16, p.x));
    p.y = Math.max(ARENA_TOP + 16, Math.min(ARENA_BOTTOM - 16, p.y));

    // --- Cooldowns ---
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.dodgeCooldown > 0) p.dodgeCooldown -= dt;
    if (p.hitTimer > 0) p.hitTimer -= dt;
    if (p.comboTimer > 0) {
      p.comboTimer -= dt;
      if (p.comboTimer <= 0) p.comboCount = 0;
    }

    // Skill cooldowns
    for (var si = 0; si < p.skills.length; si++) {
      if (p.skills[si].cooldown > 0) p.skills[si].cooldown -= dt;
    }

    // Animation
    p.animTimer += dt;
    if (p.animTimer > 0.15) {
      p.animTimer = 0;
      p.animFrame = (p.animFrame + 1) % 4;
    }

    // --- Enemy AI ---
    for (var ei = 0; ei < this.enemies.length; ei++) {
      var enemy = this.enemies[ei];
      if (enemy.isDead) continue;

      enemy.hitTimer = Math.max(0, enemy.hitTimer - dt);

      // Stagger handling
      if (enemy.isStaggered) {
        enemy.staggerTimer -= dt;
        if (enemy.staggerTimer <= 0) {
          enemy.isStaggered = false;
          enemy.staggerGauge = 0;
        }
        continue;
      }

      // AI: move toward player and attack
      var edx = p.x - enemy.x;
      var edy = p.y - enemy.y;
      var edist = Math.sqrt(edx * edx + edy * edy);

      enemy.attackCooldown -= dt;

      if (edist < enemy.attackRange && enemy.attackCooldown <= 0) {
        // Attack the player
        enemy.attackCooldown = 1.5 + Math.random();
        var dmg = Math.max(1, (enemy.atk || 10) - Math.floor(p.def / 2));

        if (!p.isDodging) {
          p.hp -= dmg;
          p.hitTimer = 0.2;
          this.damageNumbers.push({
            x: p.x,
            y: p.y - 30,
            text: String(dmg),
            color: '#e74c3c',
            timer: 0.8,
            vy: -50,
          });
          this.shakeTimer = 0.15;
          this.shakeIntensity = 4;

          if (p.hp <= 0) {
            p.hp = 0;
          }
        }
      } else if (edist > 30) {
        // Chase player
        var espd = enemy.speed * dt;
        enemy.x += (edx / edist) * espd;
        enemy.y += (edy / edist) * espd;
      }

      // Apply velocity (knockback)
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.vx *= 0.9;
      enemy.vy *= 0.9;

      // Clamp to arena
      enemy.x = Math.max(ARENA_LEFT + 16, Math.min(ARENA_RIGHT - 16, enemy.x));
      enemy.y = Math.max(ARENA_TOP + 16, Math.min(ARENA_BOTTOM - 16, enemy.y));
    }

    // --- Effects ---
    this.damageNumbers = this.damageNumbers.filter(function(d) {
      d.timer -= dt;
      d.y += d.vy * dt;
      return d.timer > 0;
    });

    this.hitEffects = this.hitEffects.filter(function(e) {
      e.timer -= dt;
      return e.timer > 0;
    });

    this.slashTrails = this.slashTrails.filter(function(s) {
      s.timer -= dt;
      return s.timer > 0;
    });

    // Screen shake
    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    // MP regen
    p.mp = Math.min(p.maxMp, p.mp + 2 * dt);

    // Sync HP back to party
    if (party && activePartyMembers && activePartyMembers[0]) {
      var leader = party[activePartyMembers[0]];
      if (leader) {
        leader.currentHp = Math.max(0, Math.round(p.hp));
        leader.currentMp = Math.round(p.mp);
      }
    }
  }

  // ============ RENDER ============
  render(ctx, state) {
    if (!this.active) return;

    // Screen shake
    var shakeX = 0, shakeY = 0;
    if (this.shakeTimer > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // --- Background ---
    var grd = ctx.createLinearGradient(0, 0, 0, BATTLE_H);
    grd.addColorStop(0, '#1a0a2e');
    grd.addColorStop(0.4, '#2d1b4e');
    grd.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, BATTLE_W, BATTLE_H);

    // Arena floor grid
    ctx.strokeStyle = 'rgba(192,160,80,0.15)';
    ctx.lineWidth = 1;
    for (var gx = ARENA_LEFT; gx <= ARENA_RIGHT; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, ARENA_TOP);
      ctx.lineTo(gx, ARENA_BOTTOM);
      ctx.stroke();
    }
    for (var gy = ARENA_TOP; gy <= ARENA_BOTTOM; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(ARENA_LEFT, gy);
      ctx.lineTo(ARENA_RIGHT, gy);
      ctx.stroke();
    }

    // Arena border
    ctx.strokeStyle = '#c0a050';
    ctx.lineWidth = 2;
    ctx.strokeRect(ARENA_LEFT, ARENA_TOP, ARENA_RIGHT - ARENA_LEFT, ARENA_BOTTOM - ARENA_TOP);

    // --- Enemies ---
    for (var ei = 0; ei < this.enemies.length; ei++) {
      var enemy = this.enemies[ei];
      if (enemy.isDead) continue;

      var ex = enemy.x;
      var ey = enemy.y;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(ex, ey + 20, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Enemy body
      var hitFlash = enemy.hitTimer > 0 ? '#fff' : (enemy.isStaggered ? '#f39c12' : null);
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      if (hitFlash) {
        ctx.shadowColor = hitFlash;
        ctx.shadowBlur = 20;
      }
      ctx.fillText(enemy.emoji || '\uD83D\uDC79', ex, ey + 8);
      ctx.shadowBlur = 0;

      // Name
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#ccc';
      ctx.fillText(enemy.name, ex, ey - 30);

      // HP bar
      var hpPct = enemy.currentHp / enemy.maxHp;
      ctx.fillStyle = '#333';
      ctx.fillRect(ex - 30, ey - 40, 60, 6);
      ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(ex - 30, ey - 40, 60 * hpPct, 6);

      // Stagger bar
      if (enemy.staggerGauge > 0) {
        var sgPct = enemy.staggerGauge / enemy.staggerMax;
        ctx.fillStyle = '#333';
        ctx.fillRect(ex - 30, ey - 48, 60, 3);
        ctx.fillStyle = enemy.isStaggered ? '#f1c40f' : '#e67e22';
        ctx.fillRect(ex - 30, ey - 48, 60 * sgPct, 3);
      }
    }

    // --- Slash trails ---
    for (var si = 0; si < this.slashTrails.length; si++) {
      var trail = this.slashTrails[si];
      var alpha = trail.timer / trail.maxTimer;
      var size = trail.big ? 80 : 40;
      ctx.save();
      ctx.translate(trail.x, trail.y);
      ctx.rotate(trail.angle);
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = trail.big ? '#f1c40f' : '#e0c878';
      ctx.lineWidth = trail.big ? 4 : 3;
      ctx.beginPath();
      ctx.arc(0, 0, size, -0.5, 0.5);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // --- Player ---
    var p = this.player;
    var px = p.x;
    var py = p.y;

    // Player shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px, py + 22, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player character
    if (p.isDodging) {
      ctx.globalAlpha = 0.4;
    }
    if (p.hitTimer > 0) {
      ctx.shadowColor = '#e74c3c';
      ctx.shadowBlur = 15;
    }

    ctx.font = '44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u2694\uFE0F', px, py + 8);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Player name
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#4a90d9';
    var leaderName = 'Cedric';
    if (state && state.party && state.activePartyMembers && state.activePartyMembers[0]) {
      var leaderData = state.party[state.activePartyMembers[0]];
      if (leaderData && leaderData.name) leaderName = leaderData.name;
    }
    ctx.fillText(leaderName, px, py - 32);

    // --- Player HP/MP bars ---
    var barW = 80;
    ctx.fillStyle = '#333';
    ctx.fillRect(px - barW / 2, py - 42, barW, 5);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(px - barW / 2, py - 42, barW * Math.max(0, p.hp / p.maxHp), 5);

    ctx.fillStyle = '#333';
    ctx.fillRect(px - barW / 2, py - 36, barW, 4);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(px - barW / 2, py - 36, barW * Math.max(0, p.mp / p.maxMp), 4);

    // --- Damage numbers ---
    for (var di = 0; di < this.damageNumbers.length; di++) {
      var dmg = this.damageNumbers[di];
      var dalpha = Math.min(1, dmg.timer / 0.3);
      ctx.globalAlpha = dalpha;
      ctx.font = dmg.text.length > 3 ? 'bold 24px sans-serif' : 'bold 20px sans-serif';
      ctx.fillStyle = dmg.color;
      ctx.textAlign = 'center';
      ctx.fillText(dmg.text, dmg.x, dmg.y);
      ctx.globalAlpha = 1;
    }

    // --- Hit effects ---
    for (var fi = 0; fi < this.hitEffects.length; fi++) {
      var fx = this.hitEffects[fi];
      var falpha = fx.timer / 0.2;
      var fsize = 20 * (1 - fx.timer / 0.2);
      ctx.globalAlpha = falpha;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fsize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore(); // End shake transform

    // --- HUD ---
    // Combo counter
    if (p.comboCount >= 2) {
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.comboCount >= 5 ? '#f1c40f' : p.comboCount >= 3 ? '#e67e22' : '#e0c878';
      ctx.fillText(p.comboCount + ' COMBO!', BATTLE_W / 2, 50);
    }

    // Skill cooldowns
    for (var ski = 0; ski < p.skills.length; ski++) {
      var skill = p.skills[ski];
      var sx = 300 + ski * 80;
      var sy = BATTLE_H - 30;
      var cdPct = skill.cooldown > 0 ? skill.cooldown / skill.maxCooldown : 0;

      ctx.fillStyle = cdPct > 0 ? 'rgba(50,50,50,0.8)' : 'rgba(41,128,185,0.3)';
      ctx.beginPath();
      ctx.roundRect(sx - 30, sy - 15, 60, 30, 4);
      ctx.fill();
      ctx.strokeStyle = cdPct > 0 ? '#555' : '#2980b9';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = cdPct > 0 ? '#666' : '#aed6f1';
      ctx.fillText(skill.name || skill.id, sx, sy + 4);
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText('[' + skill.key + ']', sx, sy + 15);

      if (cdPct > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(sx - 30, sy - 15, 60 * cdPct, 30);
      }
    }

    // MP bar (bottom left)
    ctx.fillStyle = 'rgba(10,10,30,0.8)';
    ctx.beginPath();
    ctx.roundRect(16, BATTLE_H - 50, 120, 36, 4);
    ctx.fill();
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#74b9ff';
    ctx.fillText('MP ' + Math.round(p.mp) + '/' + p.maxMp, 24, BATTLE_H - 28);
    ctx.fillStyle = '#333';
    ctx.fillRect(24, BATTLE_H - 22, 100, 4);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(24, BATTLE_H - 22, 100 * Math.max(0, p.mp / p.maxMp), 4);

    // Controls hint
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    ctx.fillText('WASD Move | Click Attack | 1/2/3 Skills | Space Dodge', BATTLE_W / 2, BATTLE_H - 8);

    // Battle log (top-left)
    var recentLog = this.log.slice(-5);
    for (var li = 0; li < recentLog.length; li++) {
      var entry = recentLog[li];
      var lalpha = 1 - li * 0.2;
      ctx.globalAlpha = lalpha * 0.8;
      ctx.fillStyle = entry.type === 'damage' ? '#ff6b6b' :
                      entry.type === 'status' ? '#f39c12' :
                      entry.type === 'system' ? '#74b9ff' : '#ccc';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(entry.text, 16, 20 + li * 16);
      ctx.globalAlpha = 1;
    }

    // Victory check
    if (this.enemies.every(function(e) { return e.isDead; })) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, BATTLE_W, BATTLE_H);
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f1c40f';
      ctx.fillText('VICTORY!', BATTLE_W / 2, BATTLE_H / 2);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#ccc';
      ctx.fillText('Click to continue...', BATTLE_W / 2, BATTLE_H / 2 + 40);
    }

    // Defeat check
    if (p.hp <= 0) {
      ctx.fillStyle = 'rgba(30,0,0,0.7)';
      ctx.fillRect(0, 0, BATTLE_W, BATTLE_H);
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#c0392b';
      ctx.fillText('DEFEATED', BATTLE_W / 2, BATTLE_H / 2);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText('Click to continue...', BATTLE_W / 2, BATTLE_H / 2 + 40);
    }
  }
}

// === game.js ===
// ==========================================
// Chronicles of the Fallen Crown - Main Game Controller
// ==========================================










const W = 960;
const H = 640;
const MOVE_SPEED = 0.12;

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;

    this.state = new GameState();
    this.world = new World();
    this.battle = new BattleSystem();

    this.cameraX = 0;
    this.cameraY = 0;
    this.targetCameraX = 0;
    this.targetCameraY = 0;

    this.keys = {};
    this.moveTimer = 0;
    this.isMoving = false;
    this.dialogActive = false;
    this.menuOpen = false;
    this.craftingOpen = false;
    this.shopOpen = false;
    this.showErrorLog = false;

    this.lastTime = 0;
    this.running = false;

    this.setupInput();
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      try { this.handleKeyPress(e.key); } catch(err) { _logError('KEY_INPUT', err.message, err); _showErrorOverlay(err.message); }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      try { this.handleClick(x, y); } catch(err) { _logError('CLICK_INPUT', err.message, err); _showErrorOverlay(err.message); }
    });

    // Track mouse for battle (hold to auto-attack)
    this.canvas.addEventListener('mousedown', (e) => {
      this.battle.mouseDown = true;
      const rect = this.canvas.getBoundingClientRect();
      this.battle.mouseX = (e.clientX - rect.left) * (W / rect.width);
      this.battle.mouseY = (e.clientY - rect.top) * (H / rect.height);
    });
    this.canvas.addEventListener('mouseup', (e) => {
      this.battle.mouseDown = false;
    });
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.battle.mouseX = (e.clientX - rect.left) * (W / rect.width);
      this.battle.mouseY = (e.clientY - rect.top) * (H / rect.height);
    });
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  gameLoop() {
    if (!this.running) return;

    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    try {
      this.update(dt);
    } catch(e) {
      _logError('UPDATE', e.message, e);
    }
    try {
      this.render();
    } catch(e) {
      _logError('RENDER', e.message, e);
    }

    requestAnimationFrame(() => this.gameLoop());
  }

  // ============ UPDATE ============
  update(dt) {
    this.state.stats.playTime += dt;

    if (this.state.screen === 'title') return;

    if (this.state.screen === 'exploring') {
      this.handleExplorationInput(dt);
      this.updateCamera(dt);
    }

    if (this.state.screen === 'battle') {
      this.battle.update(this.state.party, this.state.activePartyMembers);
      this.battle._state = this.state;
    }

    // Update notifications
    this.state.notifications = this.state.notifications.filter(n => {
      n.timer -= dt * 1000;
      return n.timer > 0;
    });
  }

  // ============ EXPLORATION INPUT ============
  handleExplorationInput(dt) {
    if (this.dialogActive || this.menuOpen || this.craftingOpen || this.shopOpen) return;

    this.moveTimer -= dt;
    if (this.moveTimer > 0) return;

    const tiles = this.world.getTileMap(this.state.currentArea);
    const area = AREAS[this.state.currentArea];
    if (!tiles || !area) return;

    let dx = 0, dy = 0;
    let dir = this.state.playerDir;

    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) { dy = -1; dir = 'up'; }
    else if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) { dy = 1; dir = 'down'; }
    else if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) { dx = -1; dir = 'left'; }
    else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) { dx = 1; dir = 'right'; }

    if (dx !== 0 || dy !== 0) {
      const newX = this.state.playerPos.x + dx;
      const newY = this.state.playerPos.y + dy;

      // Check collision
      if (!this.world.isBlocking(tiles, newX, newY)) {
        this.state.playerPos.x = newX;
        this.state.playerPos.y = newY;
        this.state.playerDir = dir;
        this.moveTimer = MOVE_SPEED;
        this.isMoving = true;

        // Check for special tile triggers
        this.checkTileTrigger(newX, newY, tiles, area);

        // Random encounter check
        this.checkRandomEncounter(area);
      } else {
        this.state.playerDir = dir;
      }
    } else {
      this.isMoving = false;
    }
  }

  checkTileTrigger(x, y, tiles, area) {
    const tile = tiles[y]?.[x];
    if (tile === undefined) return;

    // Exit check
    for (const exit of (area.exits || [])) {
      if (exit.x === x && exit.y === y) {
        this.changeArea(exit.target, exit.targetX, exit.targetY);
        return;
      }
    }
  }

  handleInteraction() {
    const tiles = this.world.getTileMap(this.state.currentArea);
    const area = AREAS[this.state.currentArea];
    if (!tiles || !area) return;

    const facing = this.getFacingPos();
    const tile = tiles[facing.y]?.[facing.x];

    if (tile === T.CHEST) {
      this.openChest(facing.x, facing.y, area);
    } else if (tile === T.NPC) {
      this.talkToNPC(facing.x, facing.y, area);
    } else if (tile === T.SIGN) {
      this.readSign(facing.x, facing.y, area);
    } else if (tile === T.WAYSTONE) {
      this.activateWaystone(facing.x, facing.y, area);
    } else if (tile === T.SAVE) {
      this.state.saveGame();
    } else if (tile === T.CRAFT) {
      this.openCrafting();
    } else if (tile === T.SHOP) {
      this.openShop(area);
    } else if (tile === T.BOSS) {
      this.triggerBossBattle(area);
    } else if (tile === T.DOOR_LOCK) {
      this.state.showNotification('The door is locked. You need a key.');
    }
  }

  getFacingPos() {
    const offsets = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const [dx, dy] = offsets[this.state.playerDir];
    return { x: this.state.playerPos.x + dx, y: this.state.playerPos.y + dy };
  }

  // ============ AREA TRANSITIONS ============
  changeArea(areaId, x, y) {
    this.state.currentArea = areaId;
    this.state.playerPos = { x, y };

    // Unlock waystones
    const area = AREAS[areaId];
    if (area) {
      for (const ws of (area.waystones || [])) {
        this.state.unlockedWaystones.add(ws.id);
      }

      // Quest triggers
      if (areaId === 'capital_square' && !this.state.completedQuests.includes('main_capital_run')) {
        this.state.showNotification('Quest Updated: The Escape');
        this.state.advanceQuest('main_capital_run', 1);
      }
    }

    // Random battle chance on area change
    if (area && area.encounterRate > 0 && Math.random() < 0.3) {
      this.triggerRandomEncounter(area);
    }
  }

  // ============ ENCOUNTERS ============
  checkRandomEncounter(area) {
    if (!area.encounterTable || area.encounterRate <= 0) return;
    if (Math.random() < area.encounterRate) {
      this.triggerRandomEncounter(area);
    }
  }

  triggerRandomEncounter(area) {
    const table = ENCOUNTER_TABLES[area.encounterTable];
    if (!table) return;

    // Weighted random selection
    const totalWeight = table.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const entry of table) {
      roll -= entry.weight;
      if (roll <= 0) {
        this.startBattle(entry.enemies);
        return;
      }
    }
  }

  triggerBossBattle(area) {
    if (!area.bossEncounter) return;
    if (this.state.hasFlag(area.bossEncounter.flag)) {
      this.state.showNotification('The boss has already been defeated.');
      return;
    }

    this.startBattle([area.bossEncounter.enemyId]);
  }

  startBattle(enemyGroup) {
    this.state.screen = 'battle';
    this.battle.startBattle(this.state, enemyGroup);
  }

  endBattle(victory) {
    if (victory && this.battle.pendingRewards) {
      const rewards = this.battle.pendingRewards;

      // Apply rewards
      const msgs = this.state.addExpToParty(rewards.exp);
      this.state.gold += rewards.gold;
      for (const drop of rewards.drops) {
        this.state.addItem(drop);
      }
      this.state.stats.battlesWon++;

      // Track kills
      for (const enemy of this.battle.enemies) {
        this.state.stats.enemiesDefeated[enemy.id] = (this.state.stats.enemiesDefeated[enemy.id] || 0) + 1;
      }

      // Update quest tracking
      this.updateQuestTracking();

      // Check if boss was defeated
      const area = AREAS[this.state.currentArea];
      if (area?.bossEncounter) {
        const boss = this.battle.enemies.find(e => e.isBoss);
        if (boss && boss.isDead) {
          this.state.setFlag(area.bossEncounter.flag);
          this.state.showNotification('Boss defeated!');

          // Trigger ending
          if (area.bossEncounter.enemyId === 'boss_tyrant') {
            this.triggerEnding();
            return;
          }
        }
      }
    } else if (!victory) {
      // Revive party with some HP
      for (const id of this.state.activePartyMembers) {
        const member = this.state.party[id];
        if (member && member.currentHp <= 0) {
          member.currentHp = Math.floor(member.maxHp * 0.1);
        }
      }
    }

    this.state.screen = 'exploring';
    this.battle.active = false;
  }

  triggerEnding() {
    // Determine ending based on choices
    this.state.screen = 'victory';
  }

  // ============ QUEST TRACKING ============
  updateQuestTracking() {
    for (const questId of this.state.activeQuests) {
      const quest = QUESTS[questId];
      if (!quest) continue;
      const progress = this.state.questProgress[questId] || { stage: 0, counters: {} };

      for (const stage of quest.stages) {
        if (stage.count && stage.required) {
          if (stage.required.enemy) {
            const count = this.state.stats.enemiesDefeated[stage.required.enemy] || 0;
            progress.counters[stage.required.enemy] = count;
            if (count >= stage.required.qty) {
              progress.stage = Math.max(progress.stage, quest.stages.indexOf(stage) + 1);
            }
          }
          if (stage.required.item) {
            const count = this.state.inventory[stage.required.item] || 0;
            if (count >= stage.required.qty) {
              progress.stage = Math.max(progress.stage, quest.stages.indexOf(stage) + 1);
            }
          }
          if (stage.required.craft) {
            if (this.state.stats.itemsCrafted >= stage.required.craft) {
              progress.stage = Math.max(progress.stage, quest.stages.indexOf(stage) + 1);
            }
          }
        }
      }

      // Check completion
      if (progress.stage >= quest.stages.length) {
        this.state.completeQuest(questId);
      } else {
        this.state.questProgress[questId] = progress;
      }
    }
  }

  // ============ INTERACTIONS ============
  openChest(x, y, area) {
    const chest = area.chests?.find(c => c.x === x && c.y === y);
    if (!chest || this.state.openedChests.has(chest.id)) {
      this.state.showNotification('This chest is empty.');
      return;
    }

    this.state.openedChests.add(chest.id);
    this.state.addItem(chest.contents, chest.qty);
    const item = ITEMS[chest.contents];
    this.state.showNotification(`Found ${item?.name || chest.contents} x${chest.qty}!`);

    // Mark tile as opened
    const tiles = this.world.getTileMap(this.state.currentArea);
    if (tiles?.[y]) tiles[y][x] = T.CHEST_OPEN;
  }

  talkToNPC(x, y, area) {
    const npc = area.npcs?.find(n => n.x === x && n.y === y);
    if (!npc) return;

    const dialog = DIALOGS[npc.dialogId];
    if (!dialog) {
      this.startDialog([{ speaker: npc.name, text: '...' }]);
      return;
    }

    // Handle dialog with choices
    if (dialog.flag && this.state.hasFlag(dialog.flag)) {
      this.startDialog([{ speaker: npc.name, text: 'We already spoke about that.' }]);
      return;
    }

    const dialogArray = dialog.dialog || dialog;
    this.startDialog(dialogArray);

    // Apply completion effects
    if (dialog.onComplete) {
      if (dialog.onComplete.quest) {
        this.state.activateQuest(dialog.onComplete.quest);
      }
      if (dialog.onComplete.flag) {
        this.state.setFlag(dialog.onComplete.flag);
      }
      if (dialog.onComplete.stage !== undefined) {
        this.state.advanceQuest(dialog.onComplete.quest, dialog.onComplete.stage);
      }
    }

    // Activate quests from NPC
    if (dialog.questId) {
      this.state.activateQuest(dialog.questId);
    }
  }

  readSign(x, y, area) {
    const sign = area.signs?.find(s => s.x === x && s.y === y);
    if (!sign) return;
    this.startDialog([{ speaker: 'Sign', text: sign.text }]);
  }

  activateWaystone(x, y, area) {
    const ws = area.waystones?.find(w => w.x === x && w.y === y);
    if (ws) {
      this.state.unlockedWaystones.add(ws.id);
      this.state.showNotification(`Waystone activated: ${area.name}`);
    }
  }

  startDialog(dialogArray) {
    this.dialogActive = true;
    this.state.currentDialog = dialogArray;
    this.state.dialogIndex = 0;
  }

  advanceDialog() {
    if (!this.state.currentDialog) return;
    this.state.dialogIndex++;
    if (this.state.dialogIndex >= this.state.currentDialog.length) {
      this.state.currentDialog = null;
      this.state.dialogIndex = 0;
      this.dialogActive = false;
    }
  }

  // ============ CRAFTING ============
  openCrafting() {
    this.craftingOpen = true;
    this.craftingMenu = 'select'; // select, confirm
    this.selectedRecipe = null;
  }

  craftItem(recipeId) {
    const recipe = RECIPIES[recipeId];
    if (!recipe) return;

    // Check materials
    for (const [matId, qty] of Object.entries(recipe.materials)) {
      if (!this.state.hasItem(matId, qty)) {
        this.state.showNotification('Not enough materials!');
        return;
      }
    }

    // Consume materials and create item
    for (const [matId, qty] of Object.entries(recipe.materials)) {
      this.state.removeItem(matId, qty);
    }
    this.state.addItem(recipe.result, recipe.qty);
    this.state.stats.itemsCrafted++;

    const item = ITEMS[recipe.result];
    this.state.showNotification(`Crafted ${item?.name || recipe.result} x${recipe.qty}!`);
    this.updateQuestTracking();
  }

  // ============ SHOP ============
  openShop(area) {
    this.shopOpen = true;

    // Find shop inventory
    for (const shop of (area.shops || [])) {
      if (Math.abs(shop.x - this.state.playerPos.x) <= 1 && Math.abs(shop.y - this.state.playerPos.y) <= 1) {
        this.currentShopItems = SHOP_INVENTORY[shop.shopId] || [];
        return;
      }
    }
    this.currentShopItems = [];
  }

  buyItem(itemId) {
    const item = ITEMS[itemId];
    if (!item || !item.price) return;
    if (this.state.gold < item.price) {
      this.state.showNotification('Not enough gold!');
      return;
    }

    this.state.gold -= item.price;
    this.state.addItem(itemId);
    this.state.showNotification(`Bought ${item.name}!`);
  }

  sellItem(itemId) {
    const item = ITEMS[itemId];
    if (!item || !item.price) return;
    if (!this.state.hasItem(itemId)) return;

    this.state.removeItem(itemId);
    const sellPrice = Math.floor(item.price * 0.5);
    this.state.gold += sellPrice;
    this.state.showNotification(`Sold ${item.name} for ${sellPrice} gold.`);
  }

  // ============ MENU ============
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.state.menuTab = 'party';
      this.state.selectedCharacter = this.state.activePartyMembers[0];
    }
  }

  // ============ INPUT HANDLING ============
  handleKeyPress(key) {
    // F1: Toggle error log display
    if (key === 'F1') {
      this.showErrorLog = !this.showErrorLog;
      if (this.showErrorLog) {
        console.log('[DEBUG] Error log (' + _errorLog.length + ' entries):', _errorLog);
      }
      return;
    }

    if (this.state.screen === 'title') {
      if (key === 'Enter') {
        this.state.screen = 'prologue';
        this.state.currentDialog = DIALOGS.prologue;
        this.state.dialogIndex = 0;
        this.dialogActive = true;
      }
      return;
    }

    if (this.state.screen === 'prologue' || this.state.screen === 'victory') {
      if (key === 'Enter' || key === ' ') {
        if (this.state.currentDialog) {
          this.advanceDialog();
          if (!this.state.currentDialog) {
            if (this.state.screen === 'prologue') {
              this.state.screen = 'exploring';
            } else if (this.state.screen === 'victory') {
              this.state.screen = 'title';
              this.state.resetGame();
            }
          }
        }
      }
      return;
    }

    if (this.state.screen === 'battle') {
      const result = this.battle.handleKeyInput(key, this.state);
      if (result === 'victory_complete') {
        this.endBattle(true);
      } else if (result === 'defeat') {
        this.endBattle(false);
      }
      return;
    }

    if (this.state.screen === 'exploring') {
      if (key === 'e' || key === 'E') {
        if (this.dialogActive) {
          this.advanceDialog();
        } else if (this.menuOpen || this.craftingOpen || this.shopOpen) {
          // Close menus
          this.menuOpen = false;
          this.craftingOpen = false;
          this.shopOpen = false;
        } else {
          this.handleInteraction();
        }
      }

      if (key === 'Escape') {
        if (this.dialogActive) {
          this.advanceDialog();
        } else if (this.craftingOpen) {
          this.craftingOpen = false;
        } else if (this.shopOpen) {
          this.shopOpen = false;
        } else if (this.menuOpen) {
          this.menuOpen = false;
        } else {
          this.toggleMenu();
        }
      }

      if (key === 'm' || key === 'M') {
        if (!this.dialogActive && !this.craftingOpen && !this.shopOpen) {
          this.toggleMenu();
        }
      }

      if (key === ' ' && !this.dialogActive && !this.menuOpen) {
        this.handleInteraction();
      }
    }
  }

  handleClick(x, y) {
    if (this.state.screen === 'title') {
      this.state.screen = 'prologue';
      this.state.currentDialog = DIALOGS.prologue;
      this.state.dialogIndex = 0;
      this.dialogActive = true;
      return;
    }

    if (this.state.screen === 'prologue' || this.state.screen === 'victory') {
      if (this.state.currentDialog) {
        this.advanceDialog();
        if (!this.state.currentDialog) {
          if (this.state.screen === 'prologue') {
            this.state.screen = 'exploring';
          } else if (this.state.screen === 'victory') {
            this.state.screen = 'title';
            this.state.resetGame();
          }
        }
      }
      return;
    }

    if (this.state.screen === 'battle') {
      const result = this.battle.handleClick(x, y, this.state);
      if (result === 'victory_complete') {
        this.endBattle(true);
      } else if (result === 'defeat') {
        this.endBattle(false);
      }
      return;
    }

    if (this.state.screen === 'exploring') {
      if (this.dialogActive) {
        this.advanceDialog();
        return;
      }

      if (this.craftingOpen) {
        this.handleCraftingClick(x, y);
        return;
      }

      if (this.shopOpen) {
        this.handleShopClick(x, y);
        return;
      }

      if (this.menuOpen) {
        this.handleMenuClick(x, y);
        return;
      }
    }
  }

  handleCraftingClick(x, y) {
    const recipes = Object.entries(RECIPIES);
    const startX = 60;
    const startY = 80;
    const cardW = 280;
    const cardH = 100;
    const gap = 16;

    for (let i = 0; i < recipes.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = startX + col * (cardW + gap);
      const cy = startY + row * (cardH + gap);

      if (x >= cx && x <= cx + cardW && y >= cy && y <= cy + cardH) {
        this.craftItem(recipes[i][0]);
        return;
      }
    }

    // Close button
    if (x >= 880 && x <= 940 && y >= 20 && y <= 50) {
      this.craftingOpen = false;
    }
  }

  handleShopClick(x, y) {
    const items = this.currentShopItems || [];
    const startX = 60;
    const startY = 80;
    const itemH = 36;
    const itemW = 300;

    for (let i = 0; i < items.length; i++) {
      const iy = startY + i * (itemH + 4);
      if (x >= startX && x <= startX + itemW && y >= iy && y <= iy + itemH) {
        this.buyItem(items[i]);
        return;
      }
    }

    // Sell tab items
    const sellStartX = 420;
    const inv = Object.entries(this.state.inventory);
    for (let i = 0; i < inv.length; i++) {
      const iy = startY + i * (itemH + 4);
      if (x >= sellStartX && x <= sellStartX + itemW && y >= iy && y <= iy + itemH) {
        this.sellItem(inv[i][0]);
        return;
      }
    }

    // Close
    if (x >= 880 && x <= 940 && y >= 20 && y <= 50) {
      this.shopOpen = false;
    }
  }

  handleMenuClick(x, y) {
    // Sidebar tabs
    const tabs = ['party', 'inventory', 'skills', 'quests', 'crafting', 'save'];
    const tabY = 64;
    const tabH = 36;

    for (let i = 0; i < tabs.length; i++) {
      if (x >= 0 && x <= 180 && y >= tabY + i * tabH && y <= tabY + (i + 1) * tabH) {
        if (tabs[i] === 'crafting') {
          this.menuOpen = false;
          this.craftingOpen = true;
          return;
        }
        this.state.menuTab = tabs[i];
        return;
      }
    }

    // Close button
    if (x >= 920 && x <= 960 && y >= 0 && y <= 30) {
      this.menuOpen = false;
    }

    // Character selection in party tab
    if (this.state.menuTab === 'party') {
      const charY = 80;
      const charH = 72;
      const allChars = [...this.state.activePartyMembers, ...this.state.reserveParty];
      for (let i = 0; i < allChars.length; i++) {
        if (x >= 200 && x <= 500 && y >= charY + i * charH && y <= charY + (i + 1) * charH) {
          this.state.selectedCharacter = allChars[i];
          return;
        }
      }
    }

    // Inventory item clicks
    if (this.state.menuTab === 'inventory') {
      const inv = Object.entries(this.state.inventory);
      const slotSize = 80;
      const gap = 8;
      const cols = 6;
      for (let i = 0; i < inv.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const sx = 200 + col * (slotSize + gap);
        const sy = 80 + row * (slotSize + gap);
        if (x >= sx && x <= sx + slotSize && y >= sy && y <= sy + slotSize) {
          // Use item on first party member if consumable
          const item = ITEMS[inv[i][0]];
          if (item?.type === 'consumable') {
            const target = this.state.activePartyMembers[0];
            const result = this.state.useItem(inv[i][0], target);
            if (result) this.state.showNotification(result.message);
          }
          return;
        }
      }
    }
  }

  // ============ CAMERA ============
  updateCamera(dt) {
    const area = AREAS[this.state.currentArea];
    if (!area) return;

    this.targetCameraX = this.state.playerPos.x * TILE_SIZE - W / 2 + TILE_SIZE / 2;
    this.targetCameraY = this.state.playerPos.y * TILE_SIZE - H / 2 + TILE_SIZE / 2;

    // Clamp
    this.targetCameraX = Math.max(0, Math.min(area.width * TILE_SIZE - W, this.targetCameraX));
    this.targetCameraY = Math.max(0, Math.min(area.height * TILE_SIZE - H, this.targetCameraY));

    // Smooth follow
    this.cameraX += (this.targetCameraX - this.cameraX) * 0.1;
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;
  }

  // ============ RENDERING ============
  render() {
    this.ctx.clearRect(0, 0, W, H);

    switch (this.state.screen) {
      case 'title':
        this.renderTitleScreen();
        break;
      case 'prologue':
        this.renderPrologueScreen();
        break;
      case 'exploring':
        this.renderExploration();
        break;
      case 'battle':
        this.renderBattle();
        break;
      case 'victory':
        this.renderEnding();
        break;
    }

    // Notifications (always on top)
    this.renderNotifications();

    // Error log overlay (F1 toggle)
    if (this.showErrorLog) {
      this.renderErrorLog();
    }
  }

  renderTitleScreen() {
    const ctx = this.ctx;

    // Background
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#0a0a1a');
    grd.addColorStop(0.3, '#1a0a2e');
    grd.addColorStop(0.6, '#2d1b4e');
    grd.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 100; i++) {
      const sx = (i * 137.5) % W;
      const sy = (i * 97.3) % H;
      const brightness = Math.sin(Date.now() * 0.001 + i) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255,255,255,${brightness * 0.5})`;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Crown emoji
    ctx.font = '64px serif';
    ctx.textAlign = 'center';
    const crownY = 180 + Math.sin(Date.now() * 0.002) * 8;
    ctx.fillText('👑', W / 2, crownY);

    // Title
    ctx.font = 'bold 36px serif';
    ctx.fillStyle = '#e0c878';
    ctx.fillText('Chronicles of the Fallen Crown', W / 2, 250);

    // Subtitle
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#c0a050';
    ctx.letterSpacing = '4px';
    ctx.fillText('A J R P G  A D V E N T U R E', W / 2, 280);

    // Menu
    const menuY = 340;
    const menuItems = ['New Game', 'Continue'];
    for (let i = 0; i < menuItems.length; i++) {
      const my = menuY + i * 48;
      const canContinue = i === 1 && this.state.hasSaveGame();

      ctx.strokeStyle = '#c0a050';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 110, my - 18, 220, 36, 4);
      ctx.stroke();

      ctx.font = '16px sans-serif';
      ctx.fillStyle = canContinue || i === 0 ? '#e0c878' : '#555';
      ctx.fillText(menuItems[i], W / 2, my + 4);
    }

    // Credits
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText('Press ENTER or Click to Start', W / 2, H - 40);
    ctx.fillText('Arrow Keys / WASD to Move | E/Space to Interact | M for Menu', W / 2, H - 20);
  }

  renderPrologueScreen() {
    if (!this.state.currentDialog) return;
    const ctx = this.ctx;

    // Dark background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    const entry = this.state.currentDialog[this.state.dialogIndex];
    if (!entry) return;

    ctx.font = '18px serif';
    ctx.fillStyle = '#ccc';
    ctx.textAlign = 'center';

    // Word wrap
    const words = entry.text.split(' ');
    let lines = [];
    let currentLine = '';
    for (const word of words) {
      if (ctx.measureText(currentLine + ' ' + word).width > W - 160) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }
    lines.push(currentLine);

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], W / 2, H / 2 - 20 + i * 28);
    }

    // Continue prompt
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#888';
    const blink = Math.sin(Date.now() * 0.003) > 0;
    if (blink) ctx.fillText('▼', W / 2, H / 2 + lines.length * 28 + 20);
  }

  renderExploration() {
    const ctx = this.ctx;

    // World
    this.world.render(ctx, this.state, this.cameraX, this.cameraY);

    // HUD
    this.renderHUD(ctx);

    // Dialog box
    if (this.dialogActive && this.state.currentDialog) {
      this.renderDialog(ctx);
    }

    // Crafting overlay
    if (this.craftingOpen) {
      this.renderCraftingUI(ctx);
    }

    // Shop overlay
    if (this.shopOpen) {
      this.renderShopUI(ctx);
    }

    // Menu overlay
    if (this.menuOpen) {
      this.renderMenu(ctx);
    }
  }

  renderHUD(ctx) {
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, W, 44);

    // Party info
    let x = 16;
    for (const id of this.state.activePartyMembers) {
      const member = this.state.party[id];
      if (!member) continue;

      // Portrait circle
      ctx.fillStyle = member.color;
      ctx.beginPath();
      ctx.arc(x + 14, 22, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '14px serif';
      ctx.textAlign = 'center';
      ctx.fillText(member.emoji, x + 14, 23);

      // Name & bars
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(member.name, x + 32, 14);

      // HP bar
      ctx.fillStyle = '#333';
      ctx.fillRect(x + 32, 18, 70, 5);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(x + 32, 18, 70 * (member.currentHp / member.maxHp), 5);

      // MP bar
      ctx.fillStyle = '#333';
      ctx.fillRect(x + 32, 25, 70, 5);
      ctx.fillStyle = '#3498db';
      ctx.fillRect(x + 32, 25, 70 * (member.currentMp / member.maxMp), 5);

      // Level
      ctx.fillStyle = '#c0a050';
      ctx.fillText(`Lv${member.level}`, x + 106, 22);

      x += 140;
    }

    // Gold
    ctx.fillStyle = '#c0a050';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`💰 ${this.state.gold}`, W - 16, 20);

    // Location
    const area = AREAS[this.state.currentArea];
    if (area) {
      ctx.fillStyle = '#888';
      ctx.font = '11px sans-serif';
      ctx.fillText(area.name, W - 16, 36);
    }

    // Mini controls hint
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, H - 24, W, 24);
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Arrow/WASD: Move | E/Space: Interact | M: Menu | ESC: Close', W / 2, H - 8);

    // Quest tracker
    this.renderQuestTracker(ctx);
  }

  renderQuestTracker(ctx) {
    const activeQuests = this.state.activeQuests.slice(0, 3);
    if (activeQuests.length === 0) return;

    const qx = W - 220;
    const qy = 48;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(qx, qy, 210, 20 + activeQuests.length * 36, 4);
    ctx.fill();

    ctx.fillStyle = '#c0a050';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ACTIVE QUESTS', qx + 8, qy + 14);

    for (let i = 0; i < activeQuests.length; i++) {
      const quest = QUESTS[activeQuests[i]];
      if (!quest) continue;
      const progress = this.state.questProgress[activeQuests[i]] || { stage: 0 };
      const currentStage = quest.stages[progress.stage] || quest.stages[0];

      ctx.fillStyle = '#fff';
      ctx.font = '11px sans-serif';
      ctx.fillText(quest.name, qx + 8, qy + 34 + i * 36);

      ctx.fillStyle = '#aaa';
      ctx.font = '10px sans-serif';
      ctx.fillText(currentStage?.desc || '', qx + 8, qy + 48 + i * 36);
    }
  }

  renderDialog(ctx) {
    const entry = this.state.currentDialog[this.state.dialogIndex];
    if (!entry) return;

    const boxH = 160;
    const boxY = H - boxH;

    // Background
    const grd = ctx.createLinearGradient(0, boxY, 0, H);
    grd.addColorStop(0, 'rgba(10,10,30,0.9)');
    grd.addColorStop(1, 'rgba(10,10,30,0.98)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, boxY, W, boxH);

    // Border
    ctx.strokeStyle = '#c0a050';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, boxY);
    ctx.lineTo(W, boxY);
    ctx.stroke();

    // Speaker
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#e0c878';
    ctx.textAlign = 'left';
    ctx.fillText(entry.speaker, 24, boxY + 28);

    // Text (word wrapped)
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#ddd';
    const words = entry.text.split(' ');
    let lines = [];
    let currentLine = '';
    for (const word of words) {
      if (ctx.measureText(currentLine + ' ' + word).width > W - 60) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }
    lines.push(currentLine);

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 24, boxY + 52 + i * 22);
    }

    // Continue indicator
    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    const blink = Math.sin(Date.now() * 0.004) > 0;
    if (blink) ctx.fillText('▼ Continue', W - 24, boxY + boxH - 12);
  }

  renderBattle() {
    this.battle.render(this.ctx, this.state);
  }

  renderCraftingUI(ctx) {
    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.font = 'bold 24px serif';
    ctx.fillStyle = '#e0c878';
    ctx.textAlign = 'center';
    ctx.fillText('🔨 Crafting Station', W / 2, 40);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`Materials: ${Object.keys(this.state.inventory).filter(k => ITEMS[k]?.type === 'material').length} types | Gold: ${this.state.gold}`, W / 2, 60);

    // Recipes
    const recipes = Object.entries(RECIPIES);
    const startX = 60;
    const startY = 80;
    const cardW = 280;
    const cardH = 100;
    const gap = 16;

    for (let i = 0; i < recipes.length; i++) {
      const [recipeId, recipe] = recipes[i];
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = startX + col * (cardW + gap);
      const cy = startY + row * (cardH + gap);

      // Check if craftable
      let canCraft = true;
      for (const [matId, qty] of Object.entries(recipe.materials)) {
        if (!this.state.hasItem(matId, qty)) canCraft = false;
      }

      // Card background
      ctx.fillStyle = canCraft ? 'rgba(46,204,113,0.1)' : 'rgba(26,10,46,0.5)';
      ctx.strokeStyle = canCraft ? '#2ecc71' : '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cardW, cardH, 6);
      ctx.fill();
      ctx.stroke();

      // Item name
      const item = ITEMS[recipe.result];
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#e0c878';
      ctx.textAlign = 'left';
      ctx.fillText(`${item?.emoji || ''} ${item?.name || recipe.result} x${recipe.qty}`, cx + 12, cy + 24);

      // Materials needed
      ctx.font = '11px sans-serif';
      let my = cy + 44;
      for (const [matId, qty] of Object.entries(recipe.materials)) {
        const mat = ITEMS[matId];
        const has = this.state.inventory[matId] || 0;
        ctx.fillStyle = has >= qty ? '#2ecc71' : '#e74c3c';
        ctx.fillText(`${mat?.emoji || ''} ${mat?.name || matId}: ${has}/${qty}`, cx + 12, my);
        my += 16;
      }

      // Status
      ctx.textAlign = 'right';
      ctx.fillStyle = canCraft ? '#2ecc71' : '#888';
      ctx.fillText(canCraft ? '✅ Craft' : '❌ Need materials', cx + cardW - 12, cy + 24);
    }

    // Close button
    ctx.fillStyle = 'rgba(192,160,80,0.2)';
    ctx.strokeStyle = '#c0a050';
    ctx.beginPath();
    ctx.roundRect(880, 20, 60, 30, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e0c878';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Close', 910, 40);
  }

  renderShopUI(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, W, H);

    // Buy section
    ctx.font = 'bold 20px serif';
    ctx.fillStyle = '#e0c878';
    ctx.textAlign = 'left';
    ctx.fillText('🏪 Buy', 60, 50);

    ctx.fillStyle = '#c0a050';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Gold: ${this.state.gold}`, 60, 72);

    const items = this.currentShopItems || [];
    for (let i = 0; i < items.length; i++) {
      const item = ITEMS[items[i]];
      if (!item) continue;
      const iy = 88 + i * 36;
      const canBuy = this.state.gold >= item.price;

      ctx.fillStyle = canBuy ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.1)';
      ctx.beginPath();
      ctx.roundRect(60, iy, 300, 32, 4);
      ctx.fill();

      ctx.fillStyle = canBuy ? '#2ecc71' : '#e74c3c';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.emoji} ${item.name}`, 70, iy + 20);

      ctx.textAlign = 'right';
      ctx.fillText(`💰 ${item.price}`, 350, iy + 20);
    }

    // Sell section
    ctx.fillStyle = '#e0c878';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'left';
    ctx.fillText('💰 Sell', 420, 50);

    const inv = Object.entries(this.state.inventory);
    for (let i = 0; i < inv.length; i++) {
      const [itemId, qty] = inv[i];
      const item = ITEMS[itemId];
      if (!item) continue;
      const iy = 88 + i * 36;

      ctx.fillStyle = 'rgba(192,160,80,0.1)';
      ctx.beginPath();
      ctx.roundRect(420, iy, 300, 32, 4);
      ctx.fill();

      ctx.fillStyle = '#ccc';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.emoji} ${item.name} x${qty}`, 430, iy + 20);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#c0a050';
      ctx.fillText(`💰 ${Math.floor((item.price || 0) * 0.5)}`, 710, iy + 20);
    }

    // Close
    ctx.fillStyle = 'rgba(192,160,80,0.2)';
    ctx.strokeStyle = '#c0a050';
    ctx.beginPath();
    ctx.roundRect(880, 20, 60, 30, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e0c878';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Close', 910, 40);
  }

  renderMenu(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, W, H);

    // Sidebar
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(0, 0, 180, H);
    ctx.strokeStyle = '#c0a050';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(180, 0);
    ctx.lineTo(180, H);
    ctx.stroke();

    const tabs = [
      { id: 'party', label: '⚔️ Party' },
      { id: 'inventory', label: '🎒 Inventory' },
      { id: 'skills', label: '✨ Skills' },
      { id: 'quests', label: '📜 Quests' },
      { id: 'save', label: '💾 Save' },
    ];

    for (let i = 0; i < tabs.length; i++) {
      const ty = 64 + i * 36;
      const isActive = this.state.menuTab === tabs[i].id;

      if (isActive) {
        ctx.fillStyle = 'rgba(192,160,80,0.15)';
        ctx.fillRect(0, ty, 180, 36);
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(0, ty);
        ctx.lineTo(4, ty + 4);
        ctx.lineTo(0, ty + 36);
        ctx.fill();
      }

      ctx.font = isActive ? 'bold 13px sans-serif' : '13px sans-serif';
      ctx.fillStyle = isActive ? '#e0c878' : '#aaa';
      ctx.textAlign = 'left';
      ctx.fillText(tabs[i].label, 16, ty + 22);
    }

    // Menu title
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#c0a050';
    ctx.textAlign = 'left';
    ctx.fillText('MENU', 16, 40);

    // Tab content
    switch (this.state.menuTab) {
      case 'party': this.renderMenuParty(ctx); break;
      case 'inventory': this.renderMenuInventory(ctx); break;
      case 'skills': this.renderMenuSkills(ctx); break;
      case 'quests': this.renderMenuQuests(ctx); break;
      case 'save': this.renderMenuSave(ctx); break;
    }

    // Close button
    ctx.fillStyle = 'rgba(192,160,80,0.2)';
    ctx.strokeStyle = '#c0a050';
    ctx.beginPath();
    ctx.roundRect(920, 4, 36, 24, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e0c878';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', 938, 21);
  }

  renderMenuParty(ctx) {
    const allChars = [...this.state.activePartyMembers, ...this.state.reserveParty];
    const startY = 80;

    ctx.fillStyle = '#c0a050';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ACTIVE PARTY', 200, 66);
    ctx.fillText('RESERVE', 520, 66);

    for (let i = 0; i < allChars.length; i++) {
      const member = this.state.party[allChars[i]];
      if (!member) continue;
      const cy = startY + i * 72;
      const isActive = i < this.state.activePartyMembers.length;

      // Background
      ctx.fillStyle = isActive ? 'rgba(74,144,217,0.1)' : 'rgba(100,100,100,0.1)';
      ctx.beginPath();
      ctx.roundRect(200, cy, 720, 64, 6);
      ctx.fill();

      // Portrait
      ctx.fillStyle = member.color;
      ctx.beginPath();
      ctx.arc(240, cy + 32, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.fillText(member.emoji, 240, cy + 34);

      // Name & class
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(member.name, 274, cy + 22);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText(`Lv.${member.level} ${member.class}`, 274, cy + 38);

      // Stats
      const statX = 450;
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText(`HP ${member.currentHp}/${member.maxHp}`, statX, cy + 18);
      ctx.fillStyle = '#74b9ff';
      ctx.fillText(`MP ${member.currentMp}/${member.maxMp}`, statX, cy + 34);
      ctx.fillStyle = '#ccc';
      ctx.fillText(`ATK:${member.stats.atk} DEF:${member.stats.def} MAG:${member.stats.mag}`, statX, cy + 50);

      // EXP
      ctx.fillStyle = '#f1c40f';
      ctx.fillText(`EXP ${member.exp}/${member.expToNext}`, 640, cy + 18);

      // Equipment
      ctx.fillStyle = '#aaa';
      ctx.fillText(`Weapon: ${member.equipment.weapon ? ITEMS[member.equipment.weapon]?.name : 'None'}`, 640, cy + 34);
      ctx.fillText(`Armor: ${member.equipment.armor ? ITEMS[member.equipment.armor]?.name : 'None'}`, 640, cy + 50);
    }
  }

  renderMenuInventory(ctx) {
    ctx.fillStyle = '#c0a050';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Items (${Object.keys(this.state.inventory).length}) | Gold: ${this.state.gold}`, 200, 66);

    const inv = Object.entries(this.state.inventory);
    const slotSize = 80;
    const gap = 8;
    const cols = 6;
    const startX = 200;

    for (let i = 0; i < inv.length; i++) {
      const [itemId, qty] = inv[i];
      const item = ITEMS[itemId];
      if (!item) continue;

      const col = i % cols;
      const row = Math.floor(i / cols);
      const sx = startX + col * (slotSize + gap);
      const sy = 80 + row * (slotSize + gap);

      ctx.fillStyle = 'rgba(10,10,30,0.8)';
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(sx, sy, slotSize, slotSize, 4);
      ctx.fill();
      ctx.stroke();

      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.emoji, sx + slotSize / 2, sy + slotSize / 2 - 4);

      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#ccc';
      ctx.fillText(`x${qty}`, sx + slotSize / 2, sy + slotSize / 2 + 18);

      ctx.fillStyle = '#aaa';
      ctx.font = '8px sans-serif';
      ctx.fillText(item.name.substring(0, 12), sx + slotSize / 2, sy + slotSize - 4);
    }

    // Tooltip area
    ctx.fillStyle = 'rgba(10,10,30,0.9)';
    ctx.strokeStyle = '#c0a050';
    ctx.beginPath();
    ctx.roundRect(200, 460, 700, 120, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click an item to use it (consumables)', 550, 530);
  }

  renderMenuSkills(ctx) {
    const selectedChar = this.state.party[this.state.selectedCharacter];
    if (!selectedChar) return;

    const char = CHARACTERS[selectedChar.id];

    // Character selector
    ctx.fillStyle = '#c0a050';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Select Character:', 200, 66);

    const chars = [...this.state.activePartyMembers, ...this.state.reserveParty];
    for (let i = 0; i < chars.length; i++) {
      const m = this.state.party[chars[i]];
      const cx = 200 + i * 100;
      const isSelected = chars[i] === this.state.selectedCharacter;

      ctx.fillStyle = isSelected ? m.color : '#333';
      ctx.beginPath();
      ctx.roundRect(cx, 76, 90, 40, 4);
      ctx.fill();

      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(`${m.emoji} ${m.name}`, cx + 45, 100);
    }

    // Skill tree
    if (char.skillTrees) {
      let treeY = 140;
      for (const tree of char.skillTrees) {
        ctx.fillStyle = 'rgba(26,10,46,0.5)';
        ctx.strokeStyle = tree.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(200, treeY, 700, 120, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = tree.color;
        ctx.textAlign = 'left';
        ctx.fillText(tree.name, 216, treeY + 22);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText(tree.desc, 216, treeY + 40);

        // Skill nodes
        const branchSkills = char.skills.filter(s => s.branch === tree.id);
        for (let i = 0; i < branchSkills.length; i++) {
          const skill = branchSkills[i];
          const sx = 220 + i * 140;
          const sy = treeY + 55;
          const unlocked = selectedChar.unlockedSkills?.includes(skill.id);

          ctx.fillStyle = unlocked ? 'rgba(46,204,113,0.2)' : 'rgba(50,50,50,0.5)';
          ctx.strokeStyle = unlocked ? '#2ecc71' : '#555';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(sx, sy, 120, 50, 6);
          ctx.fill();
          ctx.stroke();

          ctx.font = '11px sans-serif';
          ctx.fillStyle = unlocked ? '#fff' : '#888';
          ctx.textAlign = 'center';
          ctx.fillText(skill.name, sx + 60, sy + 18);

          ctx.font = '10px sans-serif';
          ctx.fillStyle = unlocked ? '#2ecc71' : '#666';
          ctx.fillText(unlocked ? '✅ Unlocked' : `🔒 Lv.${(char.skills.indexOf(skill) + 1) * 5}`, sx + 60, sy + 36);

          ctx.fillStyle = '#74b9ff';
          ctx.fillText(`${skill.mpCost} MP`, sx + 60, sy + 48);
        }

        treeY += 136;
      }
    }

    // Skill points
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Skill Points: ${selectedChar.skillPoints}`, 200, treeY + 20);
  }

  renderMenuQuests(ctx) {
    ctx.fillStyle = '#c0a050';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Active Quests', 200, 66);

    let qy = 86;
    for (const questId of this.state.activeQuests) {
      const quest = QUESTS[questId];
      if (!quest) continue;
      const progress = this.state.questProgress[questId] || { stage: 0 };

      ctx.fillStyle = 'rgba(26,10,46,0.3)';
      ctx.beginPath();
      ctx.roundRect(200, qy, 700, 60, 4);
      ctx.fill();

      ctx.fillStyle = quest.type === 'main' ? '#f1c40f' : '#3498db';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${quest.type === 'main' ? '★' : '☆'} ${quest.name}`, 212, qy + 22);

      ctx.fillStyle = '#aaa';
      ctx.font = '11px sans-serif';
      ctx.fillText(quest.desc, 212, qy + 40);

      // Progress
      ctx.fillStyle = '#888';
      ctx.textAlign = 'right';
      ctx.fillText(`Stage ${progress.stage + 1}/${quest.stages.length}`, 888, qy + 22);

      // Rewards
      if (quest.rewards.exp) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`+${quest.rewards.exp} EXP`, 888, qy + 40);
      }

      qy += 72;
    }

    if (this.state.completedQuests.length > 0) {
      ctx.fillStyle = '#c0a050';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Completed', 200, qy + 10);
      qy += 24;

      for (const questId of this.state.completedQuests) {
        const quest = QUESTS[questId];
        if (!quest) continue;
        ctx.fillStyle = '#555';
        ctx.font = '12px sans-serif';
        ctx.fillText(`✅ ${quest.name}`, 212, qy + 16);
        qy += 22;
      }
    }
  }

  renderMenuSave(ctx) {
    ctx.fillStyle = '#c0a050';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💾 Save / Load Game', W / 2, 120);

    // Save button
    ctx.fillStyle = 'rgba(46,204,113,0.2)';
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 120, 160, 240, 50, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Save Game', W / 2, 190);

    // Load button
    if (this.state.hasSaveGame()) {
      ctx.fillStyle = 'rgba(52,152,219,0.2)';
      ctx.strokeStyle = '#3498db';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 120, 230, 240, 50, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#3498db';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Load Game', W / 2, 260);
    }

    // Stats
    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Play Time: ${Math.floor(this.state.stats.playTime / 60)}m`, W / 2, 320);
    ctx.fillText(`Battles Won: ${this.state.stats.battlesWon}`, W / 2, 340);
    ctx.fillText(`Quests Completed: ${this.state.completedQuests.length}`, W / 2, 360);
  }

  renderEnding() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, W, H);

    if (this.state.currentDialog) {
      const entry = this.state.currentDialog[this.state.dialogIndex];
      if (entry) {
        ctx.font = '16px serif';
        ctx.fillStyle = entry.speaker === 'Narrator' ? '#ccc' : '#e0c878';
        ctx.textAlign = 'center';

        const words = entry.text.split(' ');
        let lines = [];
        let currentLine = '';
        for (const word of words) {
          if (ctx.measureText(currentLine + ' ' + word).width > W - 160) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine += (currentLine ? ' ' : '') + word;
          }
        }
        lines.push(currentLine);

        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], W / 2, H / 2 - 20 + i * 28);
        }

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#888';
        if (Math.sin(Date.now() * 0.003) > 0) {
          ctx.fillText('▼', W / 2, H / 2 + lines.length * 28 + 20);
        }
      }
    }
  }

  renderNotifications() {
    const ctx = this.ctx;
    let ny = 80;
    for (const notif of this.state.notifications) {
      const alpha = Math.min(1, notif.timer / 500);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(10,10,30,0.9)';
      ctx.strokeStyle = '#c0a050';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 150, ny, 300, 32, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e0c878';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(notif.text, W / 2, ny + 20);
      ctx.globalAlpha = 1;
      ny += 40;
    }
  }

  // ============ ERROR LOG DISPLAY ============
  renderErrorLog() {
    if (_errorLog.length === 0) return;
    const ctx = this.ctx;
    const x = 16;
    let y = H - 16;

    // Draw from bottom up, most recent first
    const toShow = _errorLog.slice(-8).reverse();
    for (let i = 0; i < toShow.length; i++) {
      const entry = toShow[i];
      const alpha = 1 - (i * 0.1);
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = 'rgba(40,0,0,0.9)';
      ctx.beginPath();
      ctx.roundRect(x, y - 24, 500, 22, 3);
      ctx.fill();

      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText('[' + entry.time + '] ' + entry.source + ': ' + entry.message.slice(0, 70), x + 6, y - 8);
      ctx.globalAlpha = 1;
      y -= 26;
    }
  }

  // ============ DEBUG HELPERS ============
  getErrorLog() {
    return _errorLog.slice();
  }

  clearErrorLog() {
    _errorLog.length = 0;
  }
}

// === MAIN ===
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) { console.error('Canvas not found!'); return; }
  const game = new Game(canvas);
  window._game = game;
  game.start();

  function resizeCanvas() {
    const container = document.getElementById('game-container');
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    const aspect = 960 / 640;
    let width = maxWidth;
    let height = width / aspect;
    if (height > maxHeight) { height = maxHeight; width = height * aspect; }
    container.style.width = width + 'px';
    container.style.height = height + 'px';
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  console.log('Chronicles of the Fallen Crown initialized!');
});

})();
