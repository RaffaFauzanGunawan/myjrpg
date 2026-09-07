// ==========================================
// Chronicles of the Fallen Crown - Dialog Data
// ==========================================

export const DIALOGS = {
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

export const QUESTS = {
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
