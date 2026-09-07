// ==========================================
// Chronicles of the Fallen Crown - Game State
// ==========================================

import { CHARACTERS, INITIAL_PARTY, MAX_PARTY_SIZE } from './data/characters.js';
import { ITEMS } from './data/items.js';
import { QUESTS, DIALOGS } from './data/dialogs.js';

export class GameState {
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
