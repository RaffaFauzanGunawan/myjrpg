// ============================================================
// battle.js — sistem pertarungan turn-based (overlay DOM)
// ============================================================
import { ENEMIES, CHARACTERS, ITEMS } from './data.js';
import { CFG } from './config.js';

const $ = (id) => document.getElementById(id);
const expNeed = (l) => 40 * l + 10 * l * l;

function statsAt(c, lvl) {
  const s = {};
  for (const k of Object.keys(c.base)) s[k] = c.base[k] + c.growth[k] * (lvl - 1);
  return s;
}

export class Battle {
  constructor(sfx) {
    this.sfx = sfx;
    this.overlay = $('battle-overlay');
    this.enemiesEl = $('battle-enemies');
    this.logEl = $('battle-log');
    this.partyEl = $('battle-party');
    this.actionsEl = $('battle-actions');
    this.bannerEl = $('battle-banner');
    this.active = false;
    this.targetUid = 0;
    this.current = null;
  }

  // partyState dimutasi langsung (hp/mp/level tersimpan otomatis)
  start(partyState, foes, opts, onEnd) {
    this.opts = opts; this.onEnd = onEnd;
    this.active = true;
    this.overlay.classList.remove('hidden');
    this.bannerEl.classList.add('hidden');
    this.logEl.innerHTML = '';

    this.party = partyState.map((ps) => {
      const c = CHARACTERS[ps.charId];
      const st = statsAt(c, ps.lvl);
      return Object.assign(ps, {
        name: c.name, cls: c.cls, emoji: c.emoji, color: c.color, skills: c.skills,
        maxHp: st.hp, maxMp: st.mp, atk: st.atk, def: st.def, mag: st.mag, res: st.res, spd: st.spd,
        guard: false, poisonT: 0, alive: ps.hp > 0,
      });
    });
    for (const p of this.party) { p.hp = Math.min(p.hp, p.maxHp); p.mp = Math.min(p.mp, p.maxMp); }

    this.foes = foes.map((f, i) => {
      const d = ENEMIES[f.id];
      const m = 1 + (f.lvl - 1) * 0.13;
      return {
        uid: i, id: f.id, name: d.name, emoji: d.emoji, isBoss: !!d.isBoss, weak: d.weak || [],
        lvl: f.lvl, hp: Math.round(d.hp * m), maxHp: Math.round(d.hp * m),
        atk: Math.round(d.atk * m), def: Math.round(d.def * m), mag: Math.round(d.mag * m),
        res: Math.round(d.res * m), spd: d.spd, poisonT: 0, alive: true,
      };
    });

    this._renderEnemies();
    this._renderParty();
    this._log(opts.boss ? `👿 ${this.foes[0].name} menghadang party!` : 'Serangan mendadak dari semak-semak!', 'sys');
    this.sfx.encounter();

    this.order = [...this.party, ...this.foes].sort((a, b) => b.spd - a.spd);
    this.turnIdx = -1;
    this._run();
  }

  _wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async _run() {
    await this._wait(650);
    while (this.active) {
      this.turnIdx++;
      if (this.turnIdx >= this.order.length) {
        this.turnIdx = 0;
        for (const c of this.order) c.guard = false;
      }
      const c = this.order[this.turnIdx];
      if (!c.alive) continue;
      if (this.party.includes(c)) await this._partyTurn(c);
      else await this._foeTurn(c);
      if (this._checkEnd()) return;
    }
  }

  // ---------- Giliran party ----------
  async _partyTurn(p) {
    this.current = p;
    this._renderParty();
    if (p.poisonT > 0) {
      p.poisonT--;
      const d = Math.max(1, Math.round(p.maxHp * 0.08));
      p.hp -= d;
      this._log(`${p.name} terluka racun (-${d})`, 'dmg');
      if (p.hp <= 0) { this._killParty(p); return; }
    }
    const act = await this._menu(p);
    if (!this.active) return;
    if (act.type === 'attack') await this._strike(p, this._target(), { power: 1, stat: 'atk' });
    else if (act.type === 'skill') await this._useSkill(p, act.skill);
    else if (act.type === 'guard') { p.guard = true; this._log(`${p.name} bersiap bertahan!`, 'sys'); this.sfx.blip(); }
    else if (act.type === 'item') this._useItem(p, act.item);
    else if (act.type === 'flee') {
      if (Math.random() < CFG.FLEE_CHANCE) {
        this._log('Kau berhasil kabur!', 'sys');
        await this._wait(500);
        this._finish({ fled: true, title: 'KABUR!', sub: 'Kau melarikan diri dari pertarungan.' });
        return;
      }
      this._log('Gagal kabur!', 'sys');
    }
    this.current = null;
    this._renderParty();
  }

  _menu(p) {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this._renderMainMenu(p);
    });
  }

  _btn(label, cls, fn, sub) {
    const b = document.createElement('button');
    b.className = 'battle-btn ' + (cls || '');
    b.innerHTML = label + (sub ? `<span class="cost">${sub}</span>` : '');
    b.onclick = fn;
    this.actionsEl.appendChild(b);
    return b;
  }

  _renderMainMenu(p) {
    this.actionsEl.innerHTML = '';
    this._btn('⚔ Serang', '', () => this._resolve({ type: 'attack' }));
    this._btn('✦ Skill', 'skill', () => this._renderSkills(p));
    this._btn('🛡 Bertahan', '', () => this._resolve({ type: 'guard' }));
    this._btn('🧪 Item', '', () => this._renderItems(p));
    if (!this.opts.boss) this._btn('🏃 Kabur', '', () => this._resolve({ type: 'flee' }));
  }

  _renderSkills(p) {
    this.actionsEl.innerHTML = '';
    for (const s of p.skills) {
      this._btn(`✦ ${s.name}`, 'skill', () => {
        if (p.mp < s.mp) return;
        p.mp -= s.mp;
        this._resolve({ type: 'skill', skill: s });
      }, `${s.mp} MP — ${s.desc}`).disabled = p.mp < s.mp;
    }
    this._btn('← Kembali', '', () => this._renderMainMenu(p));
  }

  _renderItems(p) {
    this.actionsEl.innerHTML = '';
    const inv = this.opts.items;
    const any = Object.keys(ITEMS).some((id) => (inv[id] || 0) > 0);
    if (!any) this._btn('Tidak ada item', '', () => {}, '').disabled = true;
    for (const [id, it] of Object.entries(ITEMS)) {
      if ((inv[id] || 0) <= 0) continue;
      this._btn(`${it.emoji} ${it.name} ×${inv[id]}`, '', () => {
        inv[id]--;
        this._resolve({ type: 'item', item: it });
      }, it.desc);
    }
    this._btn('← Kembali', '', () => this._renderMainMenu(p));
  }

  async _useSkill(p, s) {
    this._log(`${p.name} menggunakan ${s.name}!`, 'sys');
    this.sfx.blip();
    await this._wait(350);
    if (s.type === 'heal') {
      const amt = Math.round(p.mag * s.power * 1.6);
      const targets = s.target === 'party'
        ? this.party.filter((x) => x.alive)
        : [this.party.filter((x) => x.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]];
      for (const t of targets) {
        if (!t) continue;
        t.hp = Math.min(t.maxHp, t.hp + amt);
        this._log(`${t.name} pulih +${amt} HP`, 'heal');
        this._floatOnParty(t, '+' + amt);
      }
      this.sfx.heal();
    } else if (s.target === 'all') {
      for (const f of this.foes.filter((x) => x.alive)) {
        await this._strike(p, f, { power: s.power, stat: s.type === 'mag' ? 'mag' : 'atk', element: s.element, effect: s.effect });
      }
    } else {
      await this._strike(p, this._target(), { power: s.power, stat: s.type === 'mag' ? 'mag' : 'atk', element: s.element, effect: s.effect });
    }
  }

  _useItem(p, it) {
    if (it.full) {
      for (const t of this.party.filter((x) => x.alive)) { t.hp = t.maxHp; t.mp = t.maxMp; }
      this._log('Elixir memulihkan seluruh party!', 'heal');
    } else if (it.revive) {
      const dead = this.party.filter((x) => !x.alive);
      if (dead.length) {
        const t = dead[0];
        t.alive = true; t.hp = Math.round(t.maxHp * 0.5);
        this._log(`${t.name} bangkit kembali!`, 'heal');
      } else {
        this._log('Tidak ada yang tumbang…', 'sys');
      }
    } else if (it.heal) {
      const t = this.party.filter((x) => x.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      t.hp = Math.min(t.maxHp, t.hp + it.heal);
      this._log(`${t.name} pulih +${it.heal} HP`, 'heal');
      this._floatOnParty(t, '+' + it.heal);
    } else if (it.mana) {
      const t = this.party.filter((x) => x.alive).sort((a, b) => a.mp / a.maxMp - b.mp / b.maxMp)[0];
      t.mp = Math.min(t.maxMp, t.mp + it.mana);
      this._log(`${t.name} pulih +${it.mana} MP`, 'heal');
    } else if (it.bomb) {
      this._log('BOM! Ledakan menghantam semua musuh!', 'sys');
      for (const f of this.foes.filter((x) => x.alive)) {
        f.hp -= it.bomb;
        this._floatOnFoe(f, it.bomb, false);
        this._updateFoeHp(f);
        if (f.hp <= 0) this._killFoe(f);
      }
    }
    this.sfx.heal();
  }

  // ---------- Serangan ----------
  _target() {
    const t = this.foes.find((f) => f.uid === this.targetUid && f.alive);
    return t || this.foes.find((f) => f.alive);
  }

  async _strike(attacker, foe, { power, stat, element, effect }) {
    if (!foe || !foe.alive) return;
    await this._wait(430);
    if (!this.active) return;
    const defStat = stat === 'mag' ? foe.res : foe.def;
    let dmg = attacker[stat] * power * (100 / (100 + defStat)) * (0.85 + Math.random() * 0.3);
    let weak = false;
    if (element && foe.weak.includes(element)) { dmg *= 1.5; weak = true; }
    const crit = Math.random() < CFG.CRIT_CHANCE;
    if (crit) dmg *= CFG.CRIT_MULT;
    dmg = Math.max(1, Math.round(dmg));
    foe.hp -= dmg;
    if (effect === 'poison' && Math.random() < 0.8) foe.poisonT = 3;
    this._log(`${attacker.name} → ${foe.name}: <span class="${crit ? 'crit' : 'dmg'}">${dmg}${crit ? ' KRITIS!' : ''}</span>${weak ? ` (lemah vs ${element}!)` : ''}`);
    this._floatOnFoe(foe, dmg, crit);
    this._updateFoeHp(foe);
    if (crit) this.sfx.crit(); else this.sfx.hit();
    if (foe.hp <= 0) this._killFoe(foe);
  }

  // ---------- Giliran musuh ----------
  async _foeTurn(f) {
    this.current = null;
    if (f.poisonT > 0) {
      f.poisonT--;
      const d = Math.max(1, Math.round(f.maxHp * 0.06));
      f.hp -= d;
      this._log(`${f.name} terluka racun (-${d})`, 'dmg');
      this._updateFoeHp(f);
      if (f.hp <= 0) { this._killFoe(f); return; }
      await this._wait(400);
    }
    const targets = this.party.filter((p) => p.alive);
    if (!targets.length) return;
    await this._wait(430);
    if (!this.active) return;
    const t = targets[Math.floor(Math.random() * targets.length)];
    const useMag = f.mag > f.atk * 1.4;
    let dmg = (useMag ? f.mag : f.atk) * (100 / (100 + (useMag ? t.res : t.def))) * (0.85 + Math.random() * 0.3);
    if (t.guard) dmg *= 0.5;
    dmg = Math.max(1, Math.round(dmg));
    t.hp -= dmg;
    this._log(`${f.name} menyerang ${t.name}: <span class="dmg">${dmg}</span>${t.guard ? ' (guard)' : ''}`);
    this._shakeParty(t);
    this.sfx.hurt();
    if (t.hp <= 0) this._killParty(t);
    this._renderParty();
  }

  _killFoe(f) {
    f.alive = false; f.hp = 0;
    this._log(`${f.name} dikalahkan!`, 'sys');
    const el = this.foeEls[f.uid];
    if (el) el.classList.add('dead');
    if (this.targetUid === f.uid) {
      const next = this.foes.find((x) => x.alive);
      if (next) { this.targetUid = next.uid; this._markTarget(); }
    }
  }

  _killParty(p) {
    p.alive = false; p.hp = 0;
    this._log(`${p.name} tumbang!`, 'sys');
  }

  // ---------- Akhir battle ----------
  _checkEnd() {
    if (this.foes.every((f) => !f.alive)) {
      const exp = this.foes.reduce((a, f) => a + ENEMIES[f.id].exp, 0);
      const gold = this.foes.reduce((a, f) => a + ENEMIES[f.id].gold, 0);
      for (const p of this.party) if (!p.alive) { p.alive = true; p.hp = Math.round(p.maxHp * 0.25); }
      this.sfx.victory();
      const foeIds = this.foes.map((f) => f.id);
      this._finish({
        victory: true, exp, gold, kills: this.foes.length,
        boss: this.opts.boss, bossId: this.opts.boss ? foeIds[0] : null, foeIds,
        title: 'KEMENANGAN!',
        sub: `+${exp} EXP · +${gold} Gold${this.opts.boss ? ' · Boss dikalahkan!' : ''}`,
      });
      return true;
    }
    if (this.party.every((p) => !p.alive)) {
      this._finish({ defeat: true, title: 'PARTY KALAH', sub: 'Luka yang dalam… kau terbangun di waystone kota.' });
      return true;
    }
    return false;
  }

  _finish(result) {
    this.active = false;
    this.actionsEl.innerHTML = '';
    this.bannerEl.classList.remove('hidden');
    this.bannerEl.innerHTML = `<h2>${result.title}</h2><p>${result.sub || ''}</p><button class="pixel-btn battle-btn" id="battle-ok">Lanjut ▸</button>`;
    $('battle-ok').onclick = () => {
      this.bannerEl.classList.add('hidden');
      this.overlay.classList.add('hidden');
      if (this.onEnd) this.onEnd(result);
    };
  }

  // ---------- Render & efek ----------
  _renderEnemies() {
    this.enemiesEl.innerHTML = '';
    this.foeEls = this.foes.map((f) => {
      const d = document.createElement('div');
      d.className = 'enemy-sprite' + (f.isBoss ? ' boss' : '');
      d.innerHTML = `<div class="e-name">${f.name} · Lv${f.lvl}</div><span>${f.emoji}</span><div class="e-hpbar"><div style="width:100%"></div></div>`;
      d.style.filter = `drop-shadow(0 0 16px ${ENEMIES[f.id].color})`;
      d.addEventListener('click', () => {
        if (!f.alive || !this.active) return;
        this.targetUid = f.uid;
        this._markTarget();
        this.sfx.blip();
      });
      this.enemiesEl.appendChild(d);
      return d;
    });
    this.targetUid = this.foes[0].uid;
    this._markTarget();
  }

  _markTarget() {
    this.foes.forEach((f, i) => this.foeEls[i].classList.toggle('targeted', f.uid === this.targetUid && f.alive));
  }

  _updateFoeHp(f) {
    const el = this.foeEls[f.uid];
    if (el) el.querySelector('.e-hpbar > div').style.width = Math.max(0, (f.hp / f.maxHp) * 100) + '%';
  }

  _renderParty() {
    this.partyEl.innerHTML = this.party.map((p) => `
      <div class="bp-card ${p.alive ? '' : 'dead'} ${this.current === p ? 'active-turn' : ''}">
        <div style="color:${p.color}">${p.emoji} ${p.name}<span style="float:right">Lv${p.lvl}</span></div>
        <div class="bar hp"><div class="fill" style="transform:scaleX(${Math.max(0, p.hp / p.maxHp)})"></div></div>
        <div class="bar-label"><span>HP ${Math.max(0, p.hp)}/${p.maxHp}</span><span>MP ${Math.max(0, p.mp)}/${p.maxMp}</span></div>
      </div>`).join('');
  }

  _shakeParty(p) {
    const i = this.party.indexOf(p);
    const el = this.partyEl.children[i];
    if (!el) return;
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  }

  _floatOnFoe(f, text, crit) {
    const el = this.foeEls[f.uid];
    if (!el) return;
    const d = document.createElement('div');
    d.className = 'float-dmg';
    d.textContent = '-' + text;
    if (crit) d.style.color = '#ffd34d';
    d.style.left = (el.offsetLeft + el.offsetWidth / 2 - 20) + 'px';
    d.style.top = (el.offsetTop + 26) + 'px';
    this.overlay.appendChild(d);
    setTimeout(() => d.remove(), 1000);
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  }

  _floatOnParty(p, text) {
    const i = this.party.indexOf(p);
    const el = this.partyEl.children[i];
    if (!el) return;
    const d = document.createElement('div');
    d.className = 'float-dmg';
    d.style.color = '#8fe08f';
    d.textContent = text;
    d.style.left = (el.offsetLeft + el.offsetWidth / 2) + 'px';
    d.style.top = (el.offsetTop - 6) + 'px';
    this.overlay.appendChild(d);
    setTimeout(() => d.remove(), 1000);
  }

  _log(html, cls) {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    d.innerHTML = html;
    this.logEl.appendChild(d);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }
}