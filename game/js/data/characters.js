// ==========================================
// Chronicles of the Fallen Crown - Character Data
// ==========================================

export const CHARACTERS = {
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

export const INITIAL_PARTY = ['cedric', 'lyra', 'aldous'];
export const MAX_PARTY_SIZE = 4;
