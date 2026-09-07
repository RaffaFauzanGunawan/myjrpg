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

export { T };

export const TILE_COLORS = {
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

export const TILE_EMOJIS = {
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
export const BLOCKING_TILES = new Set([T.WALL, T.TREE, T.WATER, T.VOID, T.DOOR_LOCK]);

// Which tiles have special interactions
export const INTERACTABLE_TILES = new Set([T.DOOR, T.CHEST, T.NPC, T.SIGN, T.STAIRS_DOWN, T.STAIRS_UP, T.CRAFT, T.SHOP, T.BOSS, T.WAYSTONE, T.SAVE, T.DOOR_LOCK]);

export const AREAS = {
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

export const RECIPIES = {
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
