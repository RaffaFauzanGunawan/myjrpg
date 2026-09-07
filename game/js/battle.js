// ==========================================
// Chronicles of the Fallen Crown - Battle System
// ==========================================

import { ENEMIES, ENCOUNTER_TABLES, ELEMENTS } from './data/enemies.js';
import { ITEMS } from './data/items.js';

const BATTLE_W = 960;
const BATTLE_H = 640;

// Timing Ring states
const TR_IDLE = 0;
const TR_SPINNING = 1;
const TR_RESULT = 2;
const TR_DONE = 3;

const TIMING_ZONES = [
  { angle: 0, size: 12, label: 'MISS', color: '#e74c3c', mult: 0 },
  { angle: 0, size: 20, label: 'GOOD', color: '#3498db', mult: 0.75 },
  { angle: 0, size: 12, label: 'GREAT', color: '#2ecc71', mult: 1.25 },
  { angle: 0, size: 8, label: 'PERFECT', color: '#f1c40f', mult: 1.5 },
];

export class BattleSystem {
  constructor() {
    this.active = false;
    this.enemies = [];
    this.turnOrder = [];
    this.currentTurn = 0;
    this.phase = 'start'; // start, player_select, player_target, timing_ring, execute, enemy_turn, result, victory, defeat
    this.selectedAction = null;
    this.selectedTarget = null;
    this.log = [];
    this.animating = false;
    this.animTimer = 0;
    this.animCallback = null;

    // Timing ring
    this.timingState = TR_IDLE;
    this.timingAngle = 0;
    this.timingSpeed = 3;
    this.timingResult = null;
    this.timingResultTimer = 0;
    this.timingZoneAngles = [];
    this.isPlayerTiming = false;

    // Stagger
    this.staggerTarget = null;
    this.staggerGauge = 0;
    this.staggerMax = 100;

    // Battle state
    this.turnCount = 0;
    this.isBoss = false;
    this.bossPhase = 0;
    this.reward = null;
    this.pendingRewards = null;

    // UI state
    this.subMenu = null; // null, 'skills', 'items', 'magic'
    this.scrollOffset = 0;
  }

  startBattle(state, enemyGroup) {
    this.active = true;
    this.enemies = [];
    this.turnOrder = [];
    this.currentTurn = 0;
    this.phase = 'start';
    this.log = [];
    this.turnCount = 0;
    this.staggerGauge = 0;
    this.bossPhase = 0;
    this.subMenu = null;
    this.selectedAction = null;
    this.selectedTarget = null;
    this.pendingRewards = null;

    // Create enemy instances
    for (const enemyId of enemyGroup) {
      const template = ENEMIES[enemyId];
      if (!template) continue;
      this.enemies.push({
        ...template,
        currentHp: template.hp,
        maxHp: template.hp,
        statusEffects: [],
        currentAtk: template.atk,
        currentDef: template.def,
        currentMag: template.mag,
        currentRes: template.res,
        currentSpd: template.spd,
        isDead: false,
        hitAnim: 0,
      });
    }

    this.isBoss = this.enemies.some(e => e.isBoss);

    this.addLog(`Battle Start! ${this.enemies.map(e => e.name).join(' + ')}`, 'system');
    this.phase = 'player_select';

    return true;
  }

  addLog(text, type = 'normal') {
    this.log.push({ text, type, time: Date.now() });
    if (this.log.length > 50) this.log.shift();
  }

  // ============ TURN ORDER ============
  calculateTurnOrder(activePartyMembers, party) {
    const combatants = [];

    // Player characters
    for (const id of activePartyMembers) {
      const member = party[id];
      if (member && member.currentHp > 0) {
        combatants.push({
          type: 'party',
          id: id,
          name: member.name,
          spd: member.stats.spd,
          ref: member,
        });
      }
    }

    // Enemies
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy.isDead) {
        combatants.push({
          type: 'enemy',
          index: i,
          name: enemy.name,
          spd: enemy.currentSpd,
          ref: enemy,
        });
      }
    }

    // Sort by speed
    combatants.sort((a, b) => b.spd - a.spd + (Math.random() * 4 - 2));
    this.turnOrder = combatants;
    this.currentTurn = 0;
    this.turnCount++;
  }

  getCurrentCombatant() {
    if (this.currentTurn >= this.turnOrder.length) return null;
    return this.turnOrder[this.currentTurn];
  }

  advanceTurn() {
    this.currentTurn++;
    this.selectedAction = null;
    this.selectedTarget = null;
    this.subMenu = null;

    if (this.currentTurn >= this.turnOrder.length) {
      this.calculateTurnOrder(this._activePartyMembers, this._party);
    }

    // Skip dead combatants
    const combatant = this.getCurrentCombatant();
    if (combatant) {
      if (combatant.type === 'party' && combatant.ref.currentHp <= 0) {
        this.advanceTurn();
        return;
      }
      if (combatant.type === 'enemy' && combatant.ref.isDead) {
        this.advanceTurn();
        return;
      }
    }
  }

  // ============ PLAYER ACTIONS ============
  selectAction(action) {
    this.selectedAction = action;

    if (action.type === 'defend' || action.type === 'item') {
      if (action.type === 'item') {
        this.phase = 'player_target_item';
      } else {
        this.phase = 'timing_ring';
        this.startTimingRing(false);
      }
      return;
    }

    this.phase = 'player_target';
  }

  selectTarget(targetIndex) {
    this.selectedTarget = targetIndex;
    this.phase = 'timing_ring';
    this.startTimingRing(true);
  }

  selectItemTarget(itemIndex, targetId) {
    this.selectedTarget = { itemIndex, targetId };
    // Item use doesn't need timing ring
    this.executeItemUse(itemIndex, targetId);
  }

  // ============ TIMING RING ============
  startTimingRing(isAttack) {
    this.timingState = TR_SPINNING;
    this.timingAngle = 0;
    this.timingSpeed = this.isBoss ? 4 : 3;
    this.timingResult = null;
    this.timingResultTimer = 0;
    this.isPlayerTiming = isAttack;

    // Generate zones (randomized perfect zone position)
    const perfectAngle = Math.random() * 360;
    this.timingZoneAngles = [
      { start: perfectAngle - 4, end: perfectAngle + 4, type: 3 },   // PERFECT
      { start: perfectAngle - 10, end: perfectAngle + 10, type: 2 },  // GREAT
      { start: perfectAngle - 20, end: perfectAngle + 20, type: 1 },  // GOOD
    ];
  }

  triggerTimingRing() {
    if (this.timingState !== TR_SPINNING) return null;

    this.timingState = TR_RESULT;

    // Determine result based on angle
    const angle = this.timingAngle % 360;
    let result = 0; // MISS

    for (const zone of this.timingZoneAngles) {
      let start = ((zone.start % 360) + 360) % 360;
      let end = ((zone.end % 360) + 360) % 360;

      let inZone;
      if (start < end) {
        inZone = angle >= start && angle <= end;
      } else {
        inZone = angle >= start || angle <= end;
      }

      if (inZone) {
        result = zone.type;
        break;
      }
    }

    const zones = TIMING_ZONES;
    this.timingResult = {
      label: zones[result].label,
      color: zones[result].color,
      mult: zones[result].mult,
      index: result,
    };
    this.timingResultTimer = 60;

    // Execute action with multiplier
    if (this.isPlayerTiming) {
      this.executePlayerAction(this.timingResult.mult);
    } else {
      this.executeDefend(this.timingResult.mult);
    }

    return this.timingResult;
  }

  // ============ ACTION EXECUTION ============
  executePlayerAction(mult) {
    const combatant = this.getCurrentCombatant();
    if (!combatant || combatant.type !== 'party') return;

    const member = combatant.ref;
    const action = this.selectedAction;

    if (!action) return;

    if (action.type === 'attack') {
      const target = this.enemies[this.selectedTarget];
      if (!target || target.isDead) return;

      // Calculate damage
      let baseDmg = member.stats.atk - target.currentDef * 0.5;
      baseDmg = Math.max(1, baseDmg);
      let damage = Math.floor(baseDmg * mult * (0.9 + Math.random() * 0.2));

      // Element check
      if (action.element && target.elements) {
        if (target.elements.weak.includes(action.element)) {
          damage = Math.floor(damage * 1.5);
          this.addLog(`${target.name} is weak to ${ELEMENTS[action.element]?.name || action.element}!`, 'status');
          this.staggerGauge += 25;
        }
        if (target.elements.resist.includes(action.element)) {
          damage = Math.floor(damage * 0.5);
          this.addLog(`${target.name} resists ${ELEMENTS[action.element]?.name || action.element}!`, 'status');
        }
      }

      // Stagger check
      if (this.staggerGauge >= this.staggerMax) {
        damage = Math.floor(damage * 2);
        this.staggerGauge = 0;
        this.addLog(`STAGGER! ${target.name} is staggered! Double damage!`, 'status');
      }

      this.dealDamage(target, damage);
      this.addLog(`${member.name} attacks ${target.name} for ${damage} damage!`, 'damage');

    } else if (action.type === 'skill') {
      // MP cost
      if (action.mpCost > 0 && member.currentMp < action.mpCost) {
        this.addLog(`Not enough MP for ${action.name}!`, 'status');
        return;
      }
      if (action.mpCost > 0) member.currentMp -= action.mpCost;

      if (action.type === 'skill' && action.subtype === 'heal') {
        // Healing
        const target = this.findPartyTarget(this.selectedTarget);
        if (target) {
          const heal = Math.floor(member.stats.mag * action.power * mult);
          target.currentHp = Math.min(target.maxHp, target.currentHp + heal);
          this.addLog(`${member.name} uses ${action.name}! ${target.name} heals ${heal} HP!`, 'heal');
        }
      } else if (action.type === 'skill' && action.subtype === 'buff') {
        this.addLog(`${member.name} uses ${action.name}!`, 'status');
        // Simplified buff application
      } else if (action.target === 'all') {
        let totalDmg = 0;
        for (const enemy of this.enemies) {
          if (enemy.isDead) continue;
          let baseDmg = member.stats.mag * action.power - enemy.currentRes * 0.3;
          baseDmg = Math.max(1, baseDmg);
          let damage = Math.floor(baseDmg * mult * (0.9 + Math.random() * 0.2));
          if (action.element && enemy.elements) {
            if (enemy.elements.weak.includes(action.element)) {
              damage = Math.floor(damage * 1.5);
              this.staggerGauge += 15;
            }
            if (enemy.elements.resist.includes(action.element)) {
              damage = Math.floor(damage * 0.5);
            }
          }
          this.dealDamage(enemy, damage);
          totalDmg += damage;
        }
        this.addLog(`${member.name} uses ${action.name}! Hits all enemies for ${totalDmg} total damage!`, 'damage');
      } else {
        const target = this.enemies[this.selectedTarget];
        if (target && !target.isDead) {
          let baseDmg = member.stats.mag * action.power - target.currentRes * 0.3;
          baseDmg = Math.max(1, baseDmg);
          let damage = Math.floor(baseDmg * mult * (0.9 + Math.random() * 0.2));
          if (action.element && target.elements) {
            if (target.elements.weak.includes(action.element)) {
              damage = Math.floor(damage * 1.5);
              this.addLog(`${target.name} is weak to ${ELEMENTS[action.element]?.name}!`, 'status');
              this.staggerGauge += 25;
            }
            if (target.elements.resist.includes(action.element)) {
              damage = Math.floor(damage * 0.5);
              this.addLog(`${target.name} resists ${ELEMENTS[action.element]?.name}!`, 'status');
            }
          }
          this.dealDamage(target, damage);
          this.addLog(`${member.name} uses ${action.name} on ${target.name} for ${damage} damage!`, 'damage');
        }
      }
    } else if (action.type === 'magic') {
      if (action.mpCost > 0 && member.currentMp < action.mpCost) {
        this.addLog(`Not enough MP for ${action.name}!`, 'status');
        return;
      }
      if (action.mpCost > 0) member.currentMp -= action.mpCost;

      if (action.target === 'all') {
        for (const enemy of this.enemies) {
          if (enemy.isDead) continue;
          let baseDmg = member.stats.mag * action.power - enemy.currentRes * 0.3;
          baseDmg = Math.max(1, baseDmg);
          let damage = Math.floor(baseDmg * mult * (0.9 + Math.random() * 0.2));
          if (action.element && enemy.elements) {
            if (enemy.elements.weak.includes(action.element)) {
              damage = Math.floor(damage * 1.5);
              this.staggerGauge += 15;
            }
            if (enemy.elements.resist.includes(action.element)) {
              damage = Math.floor(damage * 0.5);
            }
          }
          this.dealDamage(enemy, damage);
        }
        this.addLog(`${member.name} casts ${action.name}! Hits all enemies!`, 'damage');
      } else {
        const target = this.enemies[this.selectedTarget];
        if (target && !target.isDead) {
          let baseDmg = member.stats.mag * action.power - target.currentRes * 0.3;
          baseDmg = Math.max(1, baseDmg);
          let damage = Math.floor(baseDmg * mult * (0.9 + Math.random() * 0.2));
          if (action.element && target.elements) {
            if (target.elements.weak.includes(action.element)) {
              damage = Math.floor(damage * 1.5);
              this.addLog(`${target.name} is weak to ${ELEMENTS[action.element]?.name}!`, 'status');
              this.staggerGauge += 25;
            }
            if (target.elements.resist.includes(action.element)) {
              damage = Math.floor(damage * 0.5);
            }
          }
          this.dealDamage(target, damage);
          this.addLog(`${member.name} casts ${action.name} on ${target.name} for ${damage} damage!`, 'damage');
        }
      }
    }

    // Check boss phases
    this.checkBossPhases();

    // Check victory
    if (this.enemies.every(e => e.isDead)) {
      this.phase = 'victory';
      this.calculateRewards();
      return;
    }

    // Advance after delay
    this.startResultPhase();
  }

  executeDefend(mult) {
    const combatant = this.getCurrentCombatant();
    if (!combatant || combatant.type !== 'party') return;
    const member = combatant.ref;

    if (this.selectedAction?.type === 'defend') {
      member.statusEffects.push({ type: 'defending', turns: 1, defBonus: Math.floor(member.stats.def * 0.5 * mult) });
      const defBonus = Math.floor(member.stats.def * 0.5 * mult);
      this.addLog(`${member.name} defends! Defense up by ${defBonus}!`, 'status');
    }

    this.startResultPhase();
  }

  executeItemUse(itemIndex, targetId) {
    const combatant = this.getCurrentCombatant();
    if (!combatant) return;

    const result = this._state.useItem(itemIndex, targetId);
    if (result) {
      this.addLog(result.message, result.type);
    }

    this.startResultPhase();
  }

  // ============ ENEMY AI ============
  executeEnemyTurn(party, activePartyMembers) {
    const combatant = this.getCurrentCombatant();
    if (!combatant || combatant.type !== 'enemy') return;

    const enemy = combatant.ref;
    if (enemy.isDead) {
      this.advanceTurn();
      return;
    }

    // Simple AI: pick a random living target and attack
    const targets = activePartyMembers.filter(id => party[id] && party[id].currentHp > 0);
    if (targets.length === 0) {
      this.phase = 'defeat';
      return;
    }

    const targetId = targets[Math.floor(Math.random() * targets.length)];
    const target = party[targetId];

    // Determine attack
    let damage;
    if (enemy.attackType === 'magic') {
      damage = Math.floor(enemy.currentMag * enemy.magicPower - target.stats.res * 0.3);
    } else {
      damage = Math.floor(enemy.currentAtk - target.stats.def * 0.5);
    }
    damage = Math.max(1, Math.floor(damage * (0.85 + Math.random() * 0.3)));

    // Defending check
    const defendBuff = target.statusEffects.find(s => s.type === 'defending');
    if (defendBuff) {
      damage = Math.max(1, damage - defendBuff.defBonus);
    }

    target.currentHp -= damage;
    this.addLog(`${enemy.name} attacks ${target.name} for ${damage} damage!`, 'damage');

    if (target.currentHp <= 0) {
      target.currentHp = 0;
      this.addLog(`${target.name} has fallen!`, 'status');
    }

    // Check defeat
    if (activePartyMembers.every(id => !party[id] || party[id].currentHp <= 0)) {
      this.phase = 'defeat';
      return;
    }

    this.startResultPhase();
  }

  startResultPhase() {
    this.phase = 'result';
    this.animTimer = 45;
  }

  // ============ DAMAGE ============
  dealDamage(enemy, damage) {
    enemy.currentHp -= damage;
    enemy.hitAnim = 10;

    if (enemy.currentHp <= 0) {
      enemy.currentHp = 0;
      enemy.isDead = true;
      this.addLog(`${enemy.name} has been defeated!`, 'status');
    }
  }

  findPartyTarget(targetId) {
    if (!this._party || !targetId) return null;
    return this._party[targetId] || this._party[this._activePartyMembers[0]];
  }

  // ============ BOSS PHASES ============
  checkBossPhases() {
    for (const enemy of this.enemies) {
      if (!enemy.isBoss || !enemy.phases) continue;
      const hpPercent = enemy.currentHp / enemy.maxHp;

      for (let i = 0; i < enemy.phases.length; i++) {
        if (i > this.bossPhase && hpPercent <= enemy.phases[i].threshold) {
          this.bossPhase = i;
          const phase = enemy.phases[i];
          this.addLog(`⚡ ${enemy.name} enters ${phase.name} phase!`, 'status');

          if (phase.atkBonus) enemy.currentAtk += phase.atkBonus;
          if (phase.defBonus) enemy.currentDef += phase.defBonus;
          if (phase.spdBonus) enemy.currentSpd += phase.spdBonus;
        }
      }
    }
  }

  // ============ REWARDS ============
  calculateRewards() {
    let totalExp = 0;
    let totalGold = 0;
    const drops = [];

    for (const enemy of this.enemies) {
      totalExp += enemy.exp;
      totalGold += enemy.gold;
      if (enemy.drops) {
        for (const drop of enemy.drops) {
          if (Math.random() < drop.chance) {
            drops.push(drop.id);
          }
        }
      }
    }

    this.pendingRewards = { exp: totalExp, gold: totalGold, drops };
    this.addLog(`Victory! +${totalExp} EXP, +${totalGold} Gold`, 'system');
    if (drops.length > 0) {
      this.addLog(`Items obtained: ${drops.map(d => ITEMS[d]?.name || d).join(', ')}`, 'system');
    }
  }

  // ============ TIMING RING UPDATE ============
  updateTimingRing() {
    if (this.timingState === TR_SPINNING) {
      this.timingAngle = (this.timingAngle + this.timingSpeed) % 360;
    } else if (this.timingState === TR_RESULT) {
      this.timingResultTimer--;
      if (this.timingResultTimer <= 0) {
        this.timingState = TR_DONE;
      }
    }
  }

  // ============ UPDATE ============
  update(party, activePartyMembers) {
    this._party = party;
    this._activePartyMembers = activePartyMembers;
    this._state = null; // Set externally

    // Update timing ring
    this.updateTimingRing();

    // Update hit animations
    for (const enemy of this.enemies) {
      if (enemy.hitAnim > 0) enemy.hitAnim--;
    }

    // Update result phase timer
    if (this.phase === 'result') {
      this.animTimer--;
      if (this.animTimer <= 0) {
        this.advanceTurn();
        const combatant = this.getCurrentCombatant();
        if (combatant) {
          if (combatant.type === 'enemy') {
            this.phase = 'enemy_turn';
          } else {
            this.phase = 'player_select';
          }
        }
      }
    }
  }

  // ============ RENDERING ============
  render(ctx, state) {
    if (!this.active) return;

    // Battle background
    this.renderBackground(ctx);

    // Enemies
    this.renderEnemies(ctx);

    // Stagger bar
    this.renderStaggerBar(ctx);

    // Party
    this.renderParty(ctx, state);

    // Battle log
    this.renderLog(ctx);

    // Command panel
    this.renderCommandPanel(ctx, state);

    // Timing ring overlay
    if (this.phase === 'timing_ring' || this.timingState > TR_IDLE) {
      this.renderTimingRing(ctx);
    }

    // Victory/Defeat screens
    if (this.phase === 'victory') this.renderVictory(ctx, state);
    if (this.phase === 'defeat') this.renderDefeat(ctx);
  }

  renderBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, BATTLE_H);
    gradient.addColorStop(0, '#1a0a2e');
    gradient.addColorStop(0.4, '#2d1b4e');
    gradient.addColorStop(0.7, '#1a3a2a');
    gradient.addColorStop(1, '#0a1a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, BATTLE_W, BATTLE_H);

    // Floor
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(0, 400, BATTLE_W, 240);

    // Floor grid
    ctx.strokeStyle = 'rgba(192,160,80,0.1)';
    for (let x = 0; x < BATTLE_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 400);
      ctx.lineTo(x - 50, BATTLE_H);
      ctx.stroke();
    }
    for (let y = 400; y < BATTLE_H; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(BATTLE_W, y);
      ctx.stroke();
    }
  }

  renderEnemies(ctx) {
    const spacing = Math.min(120, 600 / Math.max(1, this.enemies.length));
    const startX = (BATTLE_W - (this.enemies.length - 1) * spacing) / 2;

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      const x = startX + i * spacing;
      const y = 200;

      if (enemy.isDead) {
        ctx.globalAlpha = 0.3;
      }

      // Hit flash
      if (enemy.hitAnim > 5) {
        ctx.globalAlpha = 0.7 + Math.sin(enemy.hitAnim * 2) * 0.3;
      }

      // Enemy body
      const bodySize = enemy.isBoss ? 90 : 60;
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(x, y, bodySize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Enemy emoji
      ctx.font = `${enemy.isBoss ? 48 : 36}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(enemy.emoji, x, y);

      // Boss glow
      if (enemy.isBoss) {
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, bodySize / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // Name
      ctx.font = '12px sans-serif';
      ctx.fillStyle = enemy.isBoss ? '#f1c40f' : '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(enemy.name, x, y + bodySize / 2 + 16);

      // HP bar
      const barW = 70;
      const barH = 6;
      const barX = x - barW / 2;
      const barY = y + bodySize / 2 + 24;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(barX, barY, barW * (enemy.currentHp / enemy.maxHp), barH);

      // HP text
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#ccc';
      ctx.fillText(`${enemy.currentHp}/${enemy.maxHp}`, x, barY + barH + 10);

      // Target indicator
      if (this.phase === 'player_target' && this.selectedAction && this.selectedAction.target !== 'all') {
        if (i === this.selectedTarget || this.selectedTarget === undefined) {
          ctx.fillStyle = 'rgba(212,175,55,0.8)';
          ctx.font = '16px sans-serif';
          ctx.fillText('▼', x, y - bodySize / 2 - 10);
        }
      }
    }
  }

  renderStaggerBar(ctx) {
    if (this.staggerMax <= 0) return;
    const x = BATTLE_W / 2 - 100;
    const y = 50;
    const w = 200;
    const h = 10;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - 2, y - 18, w + 4, 40);

    ctx.fillStyle = '#c0a050';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STAGGER', BATTLE_W / 2, y - 4);

    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, w, h);

    const fillW = (this.staggerGauge / this.staggerMax) * w;
    if (this.staggerGauge > this.staggerMax * 0.7) {
      const grd = ctx.createLinearGradient(x, y, x + fillW, y);
      grd.addColorStop(0, '#f39c12');
      grd.addColorStop(1, '#fff');
      ctx.fillStyle = grd;
    } else {
      ctx.fillStyle = '#f39c12';
    }
    ctx.fillRect(x, y, fillW, h);
  }

  renderParty(ctx, state) {
    const startX = BATTLE_W / 2 - 100;
    const y = 430;
    const spacing = 60;

    for (let i = 0; i < this._activePartyMembers.length; i++) {
      const id = this._activePartyMembers[i];
      const member = state.party[id];
      if (!member) continue;

      const x = startX + i * spacing;
      const isActive = this.getCurrentCombatant()?.id === id;

      if (member.currentHp <= 0) {
        ctx.globalAlpha = 0.3;
      }

      // Character sprite
      ctx.fillStyle = member.color;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.fillText(member.emoji, x, y);

      if (isActive) {
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 24, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // Name
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(member.name, x, y + 30);

      // HP
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText(`HP ${member.currentHp}/${member.maxHp}`, x, y + 42);

      // MP
      ctx.fillStyle = '#74b9ff';
      ctx.fillText(`MP ${member.currentMp}/${member.maxMp}`, x, y + 54);
    }
  }

  renderLog(ctx) {
    const logX = 12;
    const logY = 48;
    const logW = 280;
    const logH = 160;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(logX, logY, logW, logH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(logX, logY, logW, logH);
    ctx.clip();

    const visibleLogs = this.log.slice(-6);
    for (let i = 0; i < visibleLogs.length; i++) {
      const entry = visibleLogs[i];
      ctx.font = '12px sans-serif';
      ctx.fillStyle = entry.type === 'damage' ? '#ff6b6b' :
        entry.type === 'heal' ? '#2ecc71' :
          entry.type === 'status' ? '#f39c12' :
            entry.type === 'system' ? '#74b9ff' : '#ccc';
      ctx.textAlign = 'left';
      ctx.fillText(entry.text, logX + 8, logY + 16 + i * 22);
    }
    ctx.restore();
  }

  renderCommandPanel(ctx, state) {
    if (this.phase === 'victory' || this.phase === 'defeat') return;

    const panelY = 540;
    const panelH = 100;

    // Panel background
    const grd = ctx.createLinearGradient(0, panelY, 0, BATTLE_H);
    grd.addColorStop(0, 'rgba(10,10,30,0.9)');
    grd.addColorStop(1, 'rgba(10,10,30,0.98)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, panelY, BATTLE_W, panelH);
    ctx.strokeStyle = '#c0a050';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, panelY);
    ctx.lineTo(BATTLE_W, panelY);
    ctx.stroke();

    const combatant = this.getCurrentCombatant();
    if (!combatant) return;

    if (combatant.type === 'party' && this.phase !== 'enemy_turn' && this.phase !== 'result') {
      const member = combatant.ref;

      // Actor info
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#e0c878';
      ctx.textAlign = 'left';
      ctx.fillText(`${member.emoji} ${member.name}`, 20, panelY + 20);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText(`HP: ${member.currentHp}/${member.maxHp}`, 20, panelY + 38);
      ctx.fillStyle = '#74b9ff';
      ctx.fillText(`MP: ${member.currentMp}/${member.maxMp}`, 20, panelY + 54);

      if (this.phase === 'player_select') {
        // Action buttons
        const buttons = [
          { label: '⚔️ Attack', action: 'attack', x: 200, y: panelY + 16 },
          { label: '✨ Skills', action: 'skills', x: 200, y: panelY + 46 },
          { label: '🔮 Magic', action: 'magic', x: 320, y: panelY + 16 },
          { label: '🧪 Items', action: 'items', x: 320, y: panelY + 46 },
          { label: '🛡️ Defend', action: 'defend', x: 440, y: panelY + 16 },
          { label: '💨 Flee', action: 'flee', x: 440, y: panelY + 46 },
        ];

        for (const btn of buttons) {
          ctx.fillStyle = 'rgba(192,160,80,0.15)';
          ctx.strokeStyle = '#887030';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(btn.x, btn.y, 110, 26, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#e0c878';
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(btn.label, btn.x + 8, btn.y + 17);
        }

        // Click handling stored for later
        this._commandButtons = buttons;

      } else if (this.phase === 'player_target') {
        ctx.fillStyle = '#e0c878';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Select target (click on enemy)', BATTLE_W / 2, panelY + 30);

        // Show skill if it's an AoE
        if (this.selectedAction?.target === 'all') {
          ctx.fillStyle = '#74b9ff';
          ctx.fillText('AoE — hits all enemies!', BATTLE_W / 2, panelY + 50);
          // Auto-target
          this.selectedTarget = 0;
        }

      } else if (this.phase === 'timing_ring') {
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE or Click the ring for best timing!', BATTLE_W / 2, panelY + 30);

      } else if (this.phase === 'result') {
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('...', BATTLE_W / 2, panelY + 30);

      } else if (this.phase === 'enemy_turn') {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Enemy turn...', BATTLE_W / 2, panelY + 30);
      }

      // Sub-menus
      if (this.subMenu === 'skills' || this.subMenu === 'magic') {
        this.renderSkillMenu(ctx, member, panelY);
      } else if (this.subMenu === 'items') {
        this.renderItemMenu(ctx, state, panelY);
      }
    }
  }

  renderSkillMenu(ctx, member, panelY) {
    const isMagic = this.subMenu === 'magic';
    const skills = member.skills.filter(s => {
      if (isMagic) return s.type === 'magic' || s.type === 'heal';
      return s.type !== 'magic';
    });

    let x = 200;
    let y = panelY + 10;

    for (const skill of skills) {
      const unlocked = member.unlockedSkills?.includes(skill.id);
      const canUse = member.currentMp >= skill.mpCost;

      ctx.fillStyle = canUse && unlocked ? 'rgba(41,128,185,0.2)' : 'rgba(41,128,185,0.05)';
      ctx.strokeStyle = canUse && unlocked ? '#2471a3' : '#333';
      ctx.beginPath();
      ctx.roundRect(x, y, 180, 22, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = canUse && unlocked ? '#aed6f1' : '#555';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${skill.name} (${skill.mpCost} MP)`, x + 6, y + 15);

      if (!unlocked) {
        ctx.fillStyle = '#f39c12';
        ctx.fillText('🔒', x + 160, y + 15);
      }

      y += 26;
      if (y > panelY + 90) { x += 200; y = panelY + 10; }
    }

    // Back button
    ctx.fillStyle = 'rgba(192,160,80,0.15)';
    ctx.strokeStyle = '#887030';
    ctx.beginPath();
    ctx.roundRect(200, panelY + 70, 80, 22, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e0c878';
    ctx.fillText('← Back', 210, panelY + 85);

    this._skillMenuRect = { skills, x: 200, y: panelY + 10, isMagic };
    this._backButtonRect = { x: 200, y: panelY + 70, w: 80, h: 22 };
  }

  renderItemMenu(ctx, state, panelY) {
    const items = Object.entries(state.inventory).filter(([id, qty]) => qty > 0 && ITEMS[id]?.type === 'consumable');
    let x = 200;
    let y = panelY + 10;

    for (const [itemId, qty] of items) {
      const item = ITEMS[itemId];
      ctx.fillStyle = 'rgba(39,174,96,0.2)';
      ctx.strokeStyle = '#1e8449';
      ctx.beginPath();
      ctx.roundRect(x, y, 180, 22, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a9dfbf';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.emoji} ${item.name} x${qty}`, x + 6, y + 15);

      y += 26;
      if (y > panelY + 90) { x += 200; y = panelY + 10; }
    }

    // Back button
    ctx.fillStyle = 'rgba(192,160,80,0.15)';
    ctx.strokeStyle = '#887030';
    ctx.beginPath();
    ctx.roundRect(200, panelY + 70, 80, 22, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e0c878';
    ctx.fillText('← Back', 210, panelY + 85);

    this._itemMenuRect = { items, x: 200, y: panelY + 10 };
    this._backButtonRect = { x: 200, y: panelY + 70, w: 80, h: 22 };
  }

  renderTimingRing(ctx) {
    const cx = BATTLE_W / 2;
    const cy = 300;
    const radius = 80;

    // Dim overlay
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, BATTLE_W, BATTLE_H);

    // Outer ring
    ctx.strokeStyle = 'rgba(192,160,80,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Timing zones (draw arcs)
    for (const zone of this.timingZoneAngles) {
      const startAngle = (zone.start * Math.PI) / 180;
      const endAngle = (zone.end * Math.PI) / 180;
      const colors = ['rgba(231,76,60,0.3)', 'rgba(52,152,219,0.3)', 'rgba(46,204,113,0.3)', 'rgba(241,196,15,0.5)'];
      ctx.fillStyle = colors[zone.type];
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius - 5, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
    }

    // Inner circle
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(212,175,55,0.1)';
    ctx.fill();

    // Spinning pointer
    if (this.timingState === TR_SPINNING) {
      const angle = (this.timingAngle * Math.PI) / 180;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Glow
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Result text
    if (this.timingResult) {
      ctx.font = 'bold 28px sans-serif';
      ctx.fillStyle = this.timingResult.color;
      ctx.textAlign = 'center';
      ctx.fillText(this.timingResult.label, cx, cy - 10);

      if (this.timingResult.mult > 0) {
        ctx.font = '16px sans-serif';
        ctx.fillText(`${Math.round(this.timingResult.mult * 100)}% Power`, cx, cy + 16);
      }
    }

    // Instruction
    if (this.timingState === TR_SPINNING) {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Press SPACE / Click to time your attack!', cx, cy + radius + 30);
    }

    this._timingRingRect = { cx, cy, radius };
  }

  renderVictory(ctx, state) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, BATTLE_W, BATTLE_H);

    ctx.font = 'bold 48px serif';
    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', BATTLE_W / 2, 200);

    if (this.pendingRewards) {
      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(`+${this.pendingRewards.exp} EXP`, BATTLE_W / 2, 260);
      ctx.fillText(`+${this.pendingRewards.gold} Gold`, BATTLE_W / 2, 290);

      if (this.pendingRewards.drops.length > 0) {
        const drops = this.pendingRewards.drops.map(d => ITEMS[d]?.emoji || '').join(' ');
        ctx.fillText(`Items: ${drops}`, BATTLE_W / 2, 320);
      }
    }

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('Press ENTER or click to continue', BATTLE_W / 2, 380);

    this._victoryRect = { x: 0, y: 0, w: BATTLE_W, h: BATTLE_H };
  }

  renderDefeat(ctx) {
    ctx.fillStyle = 'rgba(30,0,0,0.9)';
    ctx.fillRect(0, 0, BATTLE_W, BATTLE_H);

    ctx.font = 'bold 48px serif';
    ctx.fillStyle = '#c0392b';
    ctx.textAlign = 'center';
    ctx.fillText('DEFEATED', BATTLE_W / 2, 240);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('The party has fallen...', BATTLE_W / 2, 280);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('Press ENTER to return to the world', BATTLE_W / 2, 340);

    this._defeatRect = { x: 0, y: 0, w: BATTLE_W, h: BATTLE_H };
  }

  // ============ CLICK HANDLING ============
  handleClick(x, y, state) {
    // Timing ring click
    if (this.phase === 'timing_ring' && this.timingState === TR_SPINNING) {
      this.triggerTimingRing();
      return;
    }

    // Victory/defeat click
    if (this.phase === 'victory') return 'victory_complete';
    if (this.phase === 'defeat') return 'defeat';

    // Back button
    if (this._backButtonRect) {
      const bb = this._backButtonRect;
      if (x >= bb.x && x <= bb.x + bb.w && y >= bb.y && y <= bb.y + bb.h) {
        this.subMenu = null;
        return;
      }
    }

    // Skill menu clicks
    if (this._skillMenuRect && (this.subMenu === 'skills' || this.subMenu === 'magic')) {
      const sm = this._skillMenuRect;
      let sy = sm.y;
      for (const skill of sm.skills) {
        if (x >= sm.x && x <= sm.x + 180 && y >= sy && y <= sy + 22) {
          const member = this.getCurrentCombatant()?.ref;
          if (member && member.unlockedSkills?.includes(skill.id) && member.currentMp >= skill.mpCost) {
            this.selectAction({ type: skill.type, ...skill, subtype: skill.type });
            if (skill.target === 'all') {
              this.selectedTarget = 0;
            }
          }
          return;
        }
        sy += 26;
      }
    }

    // Item menu clicks
    if (this._itemMenuRect && this.subMenu === 'items') {
      const im = this._itemMenuRect;
      let iy = im.y;
      for (const [itemId, qty] of im.items) {
        if (x >= im.x && x <= im.x + 180 && y >= iy && y <= iy + 22) {
          // Item selected - now pick target
          this.selectedAction = { type: 'item', itemId };
          this.phase = 'player_target';
          return;
        }
        iy += 26;
      }
    }

    // Command buttons
    if (this.phase === 'player_select' && this._commandButtons) {
      for (const btn of this._commandButtons) {
        if (x >= btn.x && x <= btn.x + 110 && y >= btn.y && y <= btn.y + 26) {
          this.handleCommandClick(btn.action, state);
          return;
        }
      }
    }

    // Enemy target selection
    if (this.phase === 'player_target') {
      const spacing = Math.min(120, 600 / Math.max(1, this.enemies.length));
      const startX = (BATTLE_W - (this.enemies.length - 1) * spacing) / 2;

      for (let i = 0; i < this.enemies.length; i++) {
        if (this.enemies[i].isDead) continue;
        const ex = startX + i * spacing;
        const ey = 200;
        const dist = Math.sqrt((x - ex) ** 2 + (y - ey) ** 2);
        if (dist < 40) {
          this.selectTarget(i);
          return;
        }
      }
    }
  }

  handleCommandClick(action, state) {
    const member = this.getCurrentCombatant()?.ref;
    if (!member) return;

    switch (action) {
      case 'attack':
        this.selectAction({
          type: 'attack',
          name: 'Attack',
          power: 1.0,
          element: member.equipment?.weapon ? undefined : 'none',
        });
        break;
      case 'skills':
        this.subMenu = 'skills';
        break;
      case 'magic':
        this.subMenu = 'magic';
        break;
      case 'items':
        this.subMenu = 'items';
        break;
      case 'defend':
        this.selectAction({ type: 'defend', name: 'Defend' });
        break;
      case 'flee':
        if (this.isBoss) {
          this.addLog('Cannot flee from a boss battle!', 'status');
        } else if (Math.random() < 0.5) {
          this.addLog('Escaped successfully!', 'system');
          return 'flee';
        } else {
          this.addLog('Failed to escape!', 'status');
          this.startResultPhase();
        }
        break;
    }
  }

  handleKeyInput(key, state) {
    if (key === ' ' || key === 'Enter') {
      if (this.phase === 'timing_ring' && this.timingState === TR_SPINNING) {
        this.triggerTimingRing();
        return;
      }
      if (this.phase === 'victory') return 'victory_complete';
      if (this.phase === 'defeat') return 'defeat';
    }
    if (key === 'Escape') {
      if (this.subMenu) {
        this.subMenu = null;
      } else if (this.phase === 'player_target') {
        this.phase = 'player_select';
      }
    }
  }
}
