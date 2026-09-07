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
