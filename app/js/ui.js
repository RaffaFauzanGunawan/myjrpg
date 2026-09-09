// ============================================================
// ui.js — HUD, minimap, dialog ketik, toko, quest tracker
// ============================================================
import { CFG, BIOME_INFO } from './config.js';
import { QUESTS, ITEMS } from './data.js';

const $ = (id) => document.getElementById(id);
const expNeed = (l) => 40 * l + 10 * l * l;

export class UI {
  constructor(sfx) {
    this.sfx = sfx;
    this.hud = $('hud');
    this.partyPanel = $('party-panel');
    this.mapCtx = $('minimap').getContext('2d');
    this.clockEl = $('clock-label');
    this.questEl = $('quest-tracker');
    this.toastEl = $('area-toast');
    this.promptEl = $('interact-prompt');
    this.dialogBox = $('dialog-box');
    this.dialogName = $('dialog-name');
    this.dialogText = $('dialog-text');
    this.dialog = { active: false };
    this.baseMap = null;
    this.dialogBox.addEventListener('click', () => this.advanceDialog());
  }

  hideLoading() { $('loading-screen').classList.add('hidden'); }
  showTitle(hasSave) { $('title-screen').classList.remove('hidden'); $('btn-continue').classList.toggle('hidden', !hasSave); }
  hideTitle() { $('title-screen').classList.add('hidden'); }
  showHUD() { this.hud.classList.remove('hidden'); }

  toast(info) {
    this.toastEl.innerHTML = `<h2>${info.name}</h2><p>${info.sub || ''}</p>`;
    this.toastEl.classList.remove('hidden');
    this.toastEl.style.animation = 'none';
    void this.toastEl.offsetWidth;
    this.toastEl.style.animation = '';
    clearTimeout(this._tt);
    this._tt = setTimeout(() => this.toastEl.classList.add('hidden'), 3300);
  }

  updateHUD(party, gold) {
    this.partyPanel.innerHTML = party.map((p) => {
      const need = expNeed(p.lvl);
      return `<div class="party-card">
        <div class="pc-name"><span>${p.emoji || ''} ${p.name || p.charId}</span><span class="lv">Lv ${p.lvl}</span></div>
        <div class="bar hp"><div class="fill" style="transform:scaleX(${Math.max(0, p.hp / p.maxHp)})"></div></div>
        <div class="bar-label"><span>HP</span><span>${Math.max(0, Math.round(p.hp))}/${p.maxHp}</span></div>
        <div class="bar mp"><div class="fill" style="transform:scaleX(${Math.max(0, p.mp / p.maxMp)})"></div></div>
        <div class="bar-label"><span>MP</span><span>${Math.max(0, Math.round(p.mp))}/${p.maxMp}</span></div>
        <div class="bar xp"><div class="fill" style="transform:scaleX(${Math.min(1, p.exp / need)})"></div></div>
      </div>`;
    }).join('') + `<div class="party-card" style="text-align:center;color:var(--gold)">💰 ${gold} Gold</div>`;
  }

  updateClock(hour, day) {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const phase = hour < 5 ? '🌙' : hour < 11 ? '🌅' : hour < 17 ? '☀️' : hour < 20 ? '🌇' : '🌙';
    this.clockEl.innerHTML = `${phase} Hari ${day}<br>${hh}:${mm}`;
  }

  // minimap dari peta bioma (dihitung sekali)
  buildMinimap(biomeGrid, size) {
    const c = this.mapCtx;
    const scale = c.canvas.width / size;
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const b = biomeGrid[z * size + x];
        c.fillStyle = BIOME_INFO[b].minimap;
        c.fillRect(x * scale, z * scale, scale + 0.5, scale + 0.5);
      }
    }
    this.baseMap = c.getImageData(0, 0, c.canvas.width, c.canvas.height);
  }

  updateMinimap(px, pz, size) {
    const c = this.mapCtx;
    if (this.baseMap) c.putImageData(this.baseMap, 0, 0);
    const s = c.canvas.width / size;
    c.fillStyle = '#ffffff';
    c.fillRect(px * s - 2, pz * s - 2, 4, 4);
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.strokeRect(0, 0, c.canvas.width, c.canvas.height);
  }

  setPrompt(text) {
    if (text) { this.promptEl.textContent = text; this.promptEl.classList.remove('hidden'); }
    else this.promptEl.classList.add('hidden');
  }

  // ---------- dialog ----------
  showDialog(lines, onDone) {
    this.dialog = { lines, i: 0, onDone, active: true };
    this.dialogBox.classList.remove('hidden');
    this._typeLine();
  }

  _typeLine() {
    const d = this.dialog;
    if (!d) return;
    const line = d.lines[d.i];
    this.dialogName.textContent = line.speaker || '???';
    this.dialogText.textContent = '';
    this._typing = 0;
    this._typeT = 0;
  }

  _tickDialog(dt) {
    const d = this.dialog;
    if (!d || !d.active) return;
    const line = d.lines[d.i];
    const full = line.text;
    this._typeT += dt;
    while (this._typeT > 0.02 && this._typing < full.length) {
      this._typing++;
      this._typeT -= 0.02;
    }
    this.dialogText.textContent = full.slice(0, this._typing);
  }

  advanceDialog() {
    const d = this.dialog;
    if (!d || !d.active) return;
    const line = d.lines[d.i];
    if (this._typing < line.text.length) {
      this._typing = line.text.length; // selesaikan seketika
      return;
    }
    d.i++;
    if (d.i >= d.lines.length) {
      this.dialog.active = false;
      this.dialogBox.classList.add('hidden');
      const cb = d.onDone;
      this.dialog = { active: false };
      if (cb) cb();
    } else {
      this._typeLine();
    }
  }

  closeDialog() {
    if (this.dialog.active) {
      this.dialog.active = false;
      this.dialogBox.classList.add('hidden');
      const cb = this.dialog.onDone;
      this.dialog = { active: false };
      if (cb) cb();
    }
  }

  // ---------- toko ----------
  openShop(stock, gold, { onBuy, onClose }) {
    this._shop = { onBuy, onClose };
    this._shopStock = stock;
    $('shop-title').textContent = '🛒 Toko';
    this._renderShop(stock, gold);
    $('shop-panel').classList.remove('hidden');
    $('shop-close').onclick = () => { $('shop-panel').classList.add('hidden'); if (onClose) onClose(); };
  }

  refreshShop(gold) {
    if (this._shopStock) this._renderShop(this._shopStock, gold);
  }

  _renderShop(stock, gold) {
    $('shop-gold').textContent = `💰 Gold: ${gold}`;
    const list = $('shop-list');
    list.innerHTML = '';
    for (const id of stock) {
      const it = ITEMS[id];
      if (!it) continue;
      const row = document.createElement('div');
      row.className = 'shop-row';
      row.innerHTML = `<div class="si"><div class="n">${it.emoji} ${it.name}</div><div class="d">${it.desc}</div></div><span class="price">${it.price}g</span>`;
      const btn = document.createElement('button');
      btn.className = 'pixel-btn';
      btn.textContent = 'Beli';
      btn.disabled = gold < it.price;
      btn.onclick = () => { if (this._shop.onBuy) this._shop.onBuy(id); };
      row.appendChild(btn);
      list.appendChild(row);
    }
  }

  // ---------- quest tracker ----------
  updateQuests(activeQuests, counts) {
    // activeQuests: [{ id, stage }]
    if (!activeQuests.length) { this.questEl.classList.add('hidden'); return; }
    this.questEl.classList.remove('hidden');
    let html = '<h3>📜 Quest</h3>';
    for (const q of activeQuests) {
      const def = QUESTS[q.id];
      if (!def) continue;
      const stage = def.stages[q.stage] || def.stages[def.stages.length - 1];
      let label = stage.desc;
      // ganti placeholder (x/y) dengan hitungan nyata
      const cnt = counts[q.id] || 0;
      label = label.replace(/(\d+)\/(\d+)/, () => `${cnt}/${stage.qty || 0}`);
      html += `<div class="qt-item">▸ ${def.name}: ${label}</div>`;
    }
    this.questEl.innerHTML = html;
  }

  showPause() {
    const el = document.createElement('div');
    el.id = 'pause-screen';
    el.innerHTML = `<div class="box">
      <h2>⏸ JEDA</h2>
      <p>WASD / Panah — gerak</p>
      <p>Space — lompat</p>
      <p>E — interaksi (bicara, buka peti, belanja)</p>
      <p>F5 — simpan game</p>
      <p>Esc — tutup jeda</p>
      <p class="title-hint">Klik di luar panel untuk lanjut</p>
    </div>`;
    el.addEventListener('click', () => el.remove());
    document.body.appendChild(el);
  }
}