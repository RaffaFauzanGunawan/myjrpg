// ==========================================
// Chronicles of the Fallen Crown - Main Game Controller
// ==========================================

import { GameState } from './state.js';
import { World } from './world.js';
import { BattleSystem } from './battle.js';
import { AREAS, T, BLOCKING_TILES, INTERACTABLE_TILES } from './data/areas.js';
import { ENEMIES, ENCOUNTER_TABLES, ELEMENTS } from './data/enemies.js';
import { ITEMS, RECIPIES, SHOP_INVENTORY } from './data/items.js';
import { DIALOGS, QUESTS } from './data/dialogs.js';
import { CHARACTERS, MAX_PARTY_SIZE } from './data/characters.js';

const W = 960;
const H = 640;
const TILE_SIZE = 32;
const MOVE_SPEED = 0.12;

export class Game {
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

    this.lastTime = 0;
    this.running = false;

    this.setupInput();
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      this.handleKeyPress(e.key);
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      this.handleClick(x, y);
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

    this.update(dt);
    this.render();

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
}
