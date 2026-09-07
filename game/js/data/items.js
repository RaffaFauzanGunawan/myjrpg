// ==========================================
// Chronicles of the Fallen Crown - Items Data
// ==========================================

export const ITEMS = {
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

export const SHOP_INVENTORY = {
  verdant_woods_shop: ['hp_potion', 'hp_potion', 'mp_potion', 'antidote', 'smoke_bomb', 'rusty_sword', 'iron_sword', 'leather_armor'],
  capital_shop: ['hp_potion', 'hp_potion_m', 'mp_potion', 'mp_potion_m', 'antidote', 'bomb', 'revive', 'iron_sword', 'steel_sword', 'chain_mail', 'mage_robe', 'holy_mace', 'rune_bow'],
  crystal_shop: ['hp_potion_m', 'hp_potion_l', 'mp_potion_m', 'full_heal', 'revive', 'bomb', 'steel_sword', 'flame_blade', 'plate_armor', 'shadow_cloak', 'speed_ring', 'magic_ring'],
};
