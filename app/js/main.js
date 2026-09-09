// ============================================================
// main.js — titik masuk: loop game, state, simpan/muat,
//           quest logic, encounter, interaksi, wiring
// ============================================================
import * as THREE from 'three';
import { CFG, BIOME, BIOME_INFO, TILE_PALETTES } from './config.js';
import { CHARACTERS, INITIAL_PARTY, ENCOUNTER_TABLES, ITEMS, SHOPS, QUESTS, NPCS, CHESTS, BOSS_SPOTS } from './data.js';
import { Engine } from './engine.js';
import { World } from './terrain.js';
import { Player, NPC, Enemy, makeVoxelCharacter, makeEnemyModel } from './entities.js';
import { Battle } from './battle.js';
import { UI } from './ui.js';
import { buildDecorations, AmbientFX } from './worldfx.js';

const $ = (id) => document.getElementById(id);
const expNeed = (l) => 40 * l + 10 * l * l;
const SAVE_KEY = 'chronicles_3d_save_v1';

// ============================================================
// DIALOG LINES
// ============================================================
const DIALOGS = {
  elder: [
    { speaker: 'Elder Thornwood', text: 'Sir Cedric! Kau selamat dari serangan istana. Seluruh kerajaan berduka atas Raja Aldric.' },
    { speaker: 'Sir Cedric', text: 'Elder, aku melihat si pembunuh. Salah satu bangsawan telah mengkhianati mahkota.' },
    { speaker: 'Elder Thornwood', text: 'Berhati-hatilah. Pergilah ke Kota Valdria — Captain Rhea akan membantumu.' },
  ],
  herbalist: [
    { speaker: 'Herbalist Fae', text: 'Selamat datang, pengembara! Aku menjual ramuan dan penawar. Slime hutan menghasilkan jeli penyembuh yang bagus.' },
  ],
  captain: [
    { speaker: 'Captain Rhea', text: 'Sir Cedric! Kami mengira kau gugur bersama pengawal kerajaan.' },
    { speaker: 'Sir Cedric', text: 'Aku tahu siapa pembunuh raja. Marius merebut ibu kota timur dan membangun pasukan.' },
    { speaker: 'Captain Rhea', text: 'Kumpulkan sekutu: Seraphina, Rowan, dan Mira. Kalahkan Shadow Knight di hutan — ia menjaga bukti konspirasi!' },
  ],
  merchant: [
    { speaker: 'Merchant Gareth', text: 'Selamat datang di tokoku! Senjata, baju besi, dan ramuan — semua ada.' },
  ],
  seraphina: [
    { speaker: 'Seraphina', text: 'Jadi kau Sir Cedric? Ksatria yang selamat dari malam itu.' },
    { speaker: 'Seraphina', text: 'Aku akan bergabung denganmu. Valdria butuh pedang dan sihir bersatu.' },
  ],
  rowan: [
    { speaker: 'Rowan', text: 'Hutan ini penuh bahaya, tapi aku tahu setiap sudutnya.' },
    { speaker: 'Rowan', text: 'Aku ikut. Seseorang harus menembak para bandit itu.' },
  ],
  mira: [
    { speaker: 'Mira', text: 'Bayangan membisikkan namamu, ksatria. Aku mendengar kau melawan Marius.' },
    { speaker: 'Mira', text: 'Aku ikut — urusanku dengan para tiran belum selesai.' },
  ],
  lily: [
    { speaker: 'Lily', text: 'Tolong, Tuan Ksatria! Aku hanya butuh 3 Health Potion untuk bertahan hidup…' },
  ],
  lily_done: [
    { speaker: 'Lily', text: 'Terima kasih, Tuan Ksatria! Kau sungguh malaikat penjaga! 🌟' },
  ],
  scholar: [
    { speaker: 'Scholar Elara', text: 'Mahkota itu ditempa dari empat Kristal Elemental. Kehancurannya melemahkan seluruh kerajaan.' },
    { speaker: 'Scholar Elara', text: 'Kumpulkan pecahan mahkota untuk memulihkan sihir Valdria.' },
  ],
  miner: [
    { speaker: 'Miner Oskar', text: 'Gunung ini kaya kristal, tapi berbahaya. Seekor naga besar bersarang di puncak tertinggi.' },
  ],
  boss: [
    { speaker: '???', text: 'Kau datang ke sarangku sendiri? Keberanian yang bodoh…' },
  ],
};

// ============================================================
// STATE GAME
// ============================================================
const statAt = (c, lvl, k) => c.base[k] + c.growth[k] * (lvl - 1);

// anggota party selalu punya nama/emoji/max stat agar HUD & battle konsisten
function makeMember(charId, lvl = 1) {
  const c = CHARACTERS[charId];
  return {
    charId, name: c.name, emoji: c.emoji, color: c.color, cls: c.cls,
    lvl, exp: 0,
    maxHp: statAt(c, lvl, 'hp'), maxMp: statAt(c, lvl, 'mp'),
    hp: statAt(c, lvl, 'hp'), mp: statAt(c, lvl, 'mp'),
  };
}

function refreshStats(p) {
  const c = CHARACTERS[p.charId];
  p.name = c.name; p.emoji = c.emoji; p.color = c.color; p.cls = c.cls;
  p.maxHp = statAt(c, p.lvl, 'hp');
  p.maxMp = statAt(c, p.lvl, 'mp');
  p.hp = Math.min(p.hp || p.maxHp, p.maxHp);
  p.mp = Math.min(p.mp || p.maxMp, p.maxMp);
}

function newGameState() {
  const party = INITIAL_PARTY.map((charId) => makeMember(charId));
  return {
    party,
    gold: 120,
    items: { hp_potion: 2, mp_potion: 1 },
    flags: {},           // chest terbuka, boss mati, dll
    quests: {},          // questId -> { stage, done }
    counts: {},          // questId -> counter
    pos: { x: 84, z: 132 },
    hour: CFG.START_HOUR,
    day: CFG.START_DAY,
  };
}

function saveGame(state) {
  state.hour = game.hour;
  state.day = game.day;
  state.pos = { x: player.pos.x, z: player.pos.z };
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function startQuest(id) {
  if (game.quests[id] || !QUESTS[id]) return;
  game.quests[id] = { stage: 0, done: false };
  game.counts[id] = 0;
}

function completeStage(questId) {
  const q = game.quests[questId];
  if (!q || q.done) return;
  const def = QUESTS[questId];
  if (q.stage < def.stages.length - 1) q.stage++;
  else completeQuest(questId);
}

function completeQuest(questId) {
  const q = game.quests[questId];
  if (!q || q.done) return;
  const def = QUESTS[questId];
  q.done = true;
  const r = def.rewards;
  if (r) {
    for (const p of game.party) p.exp += r.exp / game.party.length;
    game.gold += r.gold;
    if (r.items) for (const it of r.items) game.items[it.id] = (game.items[it.id] || 0) + it.qty;
    ui.toast({ name: '✓ Quest Selesai!', sub: `${def.name} — +${r.gold} Gold` });
  }
  // rantai quest utama
  if (questId === 'main_escape') startQuest('main_allies');
  if (questId === 'main_allies') startQuest('main_dragon');
  if (questId === 'main_dragon') startQuest('main_tyrant');
  checkLevelUps();
}

function checkLevelUps() {
  let leveled = false;
  for (const p of game.party) {
    while (p.exp >= expNeed(p.lvl)) {
      p.exp -= expNeed(p.lvl);
      p.lvl++;
      refreshStats(p);
      p.hp = p.maxHp; p.mp = p.maxMp; // naik level = pulih penuh
      leveled = true;
    }
  }
  if (leveled) {
    engine.audio.levelup();
    ui.toast({ name: '⬆ LEVEL UP!', sub: 'Seluruh party bertambah kuat!' });
  }
}

function grantBattleRewards(result) {
  if (!result.victory) return;
  for (const p of game.party) p.exp += result.exp / game.party.length;
  game.gold += result.gold;
  checkLevelUps();
  // quest: kill wolf (hitung per musuh yang benar-benar wolf)
  if (game.quests['side_wolf'] && !game.quests['side_wolf'].done && result.foeIds) {
    const stage = QUESTS['side_wolf'].stages[0];
    const wolves = result.foeIds.filter((id) => id === stage.target).length;
    if (wolves) {
      game.counts['side_wolf'] = (game.counts['side_wolf'] || 0) + wolves;
      if (game.counts['side_wolf'] >= stage.qty) completeQuest('side_wolf');
    }
  }
  // boss kills
  if (result.boss) {
    game.flags['boss_' + result.bossId] = true;
    if (result.bossId === 'boss_shadow_knight' && game.quests['main_allies']) completeStage('main_allies');
    if (result.bossId === 'boss_dragon_lord' && game.quests['main_dragon']) completeQuest('main_dragon');
    if (result.bossId === 'boss_tyrant' && game.quests['main_tyrant']) {
      completeQuest('main_tyrant');
      showEnding();
    }
    removeBoss(result.bossId);
  }
}

// ============================================================
// SETUP DUNIA
// ============================================================
let engine, world, ui, battle, player, game, npcs, enemies, chests, bossActors, fx;
let currentBiome = -1;
let walkTime = 0, safeUntil = 0, uiTick = 0;

function setupWorld() {
  // NPC
  npcs = NPCS.map((d) => new NPC(world, d, engine));

  // hiasan dunia (batu/semak/bunga) + partikel ambience
  buildDecorations(world, engine);
  fx = new AmbientFX(engine);

  // peti harta (voxel kecil)
  chests = CHESTS.map((c) => {
    const g = new THREE.Group();
    const mat = (col) => new THREE.MeshLambertMaterial({ color: col });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.7), mat('#8a5a2b'));
    base.position.y = 0.25;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.7), mat('#c0a030'));
    lid.position.y = 0.62;
    g.add(base, lid);
    const y = world.groundY(c.x, c.z);
    g.position.set(c.x, y, c.z);
    engine.scene.add(g);
    return { ...c, mesh: g, opened: !!game.flags['chest_' + c.id] };
  });
  chests.forEach((c) => { c.mesh.visible = !c.opened; });

  // boss arena
  bossActors = BOSS_SPOTS.map((b) => {
    const m = makeEnemyModel(b.enemy);
    const y = world.groundY(b.x, b.z);
    m.position.set(b.x, y, b.z);
    m.scale.setScalar(1.4);
    engine.scene.add(m);
    return { ...b, mesh: m, alive: !game.flags['boss_' + b.enemy] };
  });
  bossActors.forEach((b) => { b.mesh.visible = b.alive; });

  // musuh liar tersebar
  enemies = [];
  const rng = Math.random;
  for (let i = 0; i < 34; i++) {
    const x = 20 + Math.floor(rng() * (CFG.WORLD_SIZE - 40));
    const z = 20 + Math.floor(rng() * (CFG.WORLD_SIZE - 40));
    const bio = world.biomeAt(x, z);
    if (bio === BIOME.CITY || bio === BIOME.LAKE) continue;
    const table = ENCOUNTER_TABLES[bio === BIOME.SNOW ? 'snow' : bio === BIOME.ASH ? 'ash' : bio === BIOME.BEACH ? 'beach' : 'forest'];
    const roll = rng();
    let acc = 0, pick = table[0];
    for (const t of table) { acc += t.weight; if (roll < acc / 100) { pick = t; break; } }
    const type = pick.enemies[0];
    const e = new Enemy(world, type, x, z, engine);
    enemies.push(e);
    engine.scene.add(e.model);
  }
}

function removeBoss(bossId) {
  const b = bossActors.find((x) => x.enemy === bossId);
  if (b) { b.alive = false; b.mesh.visible = false; }
}

// ============================================================
// ENCOUNTER & INTERAKSI
// ============================================================
function pickFoes(biome) {
  const table = ENCOUNTER_TABLES[biome === BIOME.SNOW ? 'snow' : biome === BIOME.ASH ? 'ash' : biome === BIOME.BEACH ? 'beach' : 'forest'];
  const roll = Math.random();
  let acc = 0, pick = table[0];
  for (const t of table) { acc += t.weight; if (roll < acc / 100) { pick = t; break; } }
  const lvlBase = biome === BIOME.FOREST ? 1 : biome === BIOME.BEACH ? 1 : biome === BIOME.SNOW ? 4 : 6;
  return pick.enemies.map((id) => ({ id, lvl: lvlBase + Math.floor(Math.random() * 2) + Math.floor(game.day / 2) }));
}

function startEncounter(biome) {
  const foes = pickFoes(biome);
  safeUntil = performance.now() / 1000 + CFG.ENCOUNTER_SAFE;
  battle.start(game.party, foes, { items: game.items, boss: false }, onBattleEnd);
}

function startBossFight(bossId) {
  const spot = BOSS_SPOTS.find((b) => b.enemy === bossId);
  if (!spot) return;
  safeUntil = performance.now() / 1000 + CFG.ENCOUNTER_SAFE;
  ui.showDialog(DIALOGS.boss, () => {
    battle.start(game.party, [{ id: bossId, lvl: spot.lvl }], { items: game.items, boss: true }, onBattleEnd);
  });
}

function onBattleEnd(result) {
  if (result.victory) {
    grantBattleRewards(result);
    ui.toast({ name: result.title, sub: result.sub });
  } else if (result.defeat) {
    // bangun di waystone kota
    const wy = world.groundY(96, 96);
    player.pos.set(96, wy, 96);
    for (const p of game.party) { p.hp = Math.round(p.maxHp * 0.5); p.mp = Math.round(p.maxMp * 0.5); }
    ui.toast({ name: 'KAU TUMBANG…', sub: 'Bangun di waystone Kota Valdria.' });
  }
  ui.updateHUD(game.party, game.gold);
  updateQuestUI();
}

function interact() {
  const px = player.pos.x, pz = player.pos.z;

  // NPC terdekat
  for (const n of npcs) {
    if (Math.abs(n.pos.x - px) < 2.4 && Math.abs(n.pos.z - pz) < 2.4) return talkTo(n);
  }
  // peti
  for (const c of chests) {
    if (!c.opened && Math.abs(c.x - px) < 2.0 && Math.abs(c.z - pz) < 2.0) {
      c.opened = true;
      c.mesh.visible = false;
      game.flags['chest_' + c.id] = true;
      game.items[c.item] = (game.items[c.item] || 0) + c.qty;
      engine.audio.open();
      ui.toast({ name: '📦 Peti terbuka!', sub: `+${c.qty} ${ITEMS[c.item].name}` });
      return;
    }
  }
  // boss
  for (const b of bossActors) {
    if (b.alive && Math.abs(b.x - px) < 3.0 && Math.abs(b.z - pz) < 3.0) {
      return startBossFight(b.enemy);
    }
  }
  // waystone kota (simpan + pulih)
  if (Math.abs(96 - px) < 3.2 && Math.abs(96 - pz) < 3.2) {
    for (const p of game.party) { p.hp = p.maxHp; p.mp = p.maxMp; }
    saveGame(game);
    engine.audio.heal();
    ui.toast({ name: '💎 Waystone', sub: 'Party pulih penuh & game tersimpan!' });
    ui.updateHUD(game.party, game.gold);
    return;
  }
}

function talkTo(npc) {
  const d = npc.data;
  const lines = DIALOGS[d.dialog] || [];
  const questId = d.quest; // lily

  ui.showDialog(lines, () => {
    // quest lily: butuh 3 hp_potion
    if (d.quest === 'side_orphan') {
      if ((game.items['hp_potion'] || 0) >= 3) {
        game.items['hp_potion'] -= 3;
        completeQuest('side_orphan');
        ui.showDialog(DIALOGS.lily_done, () => ui.updateHUD(game.party, game.gold));
      } else {
        startQuest('side_orphan');
      }
    }
    // join party
    if (d.join && !game.party.some((p) => p.charId === d.join) && game.party.length < 4) {
      const c = CHARACTERS[d.join];
      game.party.push(makeMember(d.join));
      engine.audio.levelup();
      ui.toast({ name: `✨ ${c.name} bergabung!`, sub: `Anggota party: ${game.party.length}` });
      // hapus NPC dari dunia
      engine.scene.remove(npc.model);
      npcs = npcs.filter((n) => n !== npc);
    }
    // quest utama
    if (d.dialog === 'elder' && game.quests['main_escape']) completeStage('main_escape');
    if (d.dialog === 'seraphina' && game.quests['main_allies']) completeStage('main_allies');
    // toko
    if (d.shop) {
      currentShopStock = SHOPS[d.shop];
      ui.openShop(currentShopStock, game.gold, { onBuy: (id) => buyItem(id) });
    }
    ui.updateHUD(game.party, game.gold);
    updateQuestUI();
  });
}

let currentShopStock = null;
function buyItem(id) {
  const it = ITEMS[id];
  if (!it || game.gold < it.price) return;
  game.gold -= it.price;
  game.items[id] = (game.items[id] || 0) + 1;
  engine.audio.blip();
  ui.updateHUD(game.party, game.gold);
  ui.refreshShop(game.gold); // refresh panel
}

// ============================================================
// QUEST UI
// ============================================================
function updateQuestUI() {
  const active = Object.entries(game.quests)
    .filter(([, q]) => !q.done)
    .map(([id, q]) => ({ id, stage: q.stage }));
  ui.updateQuests(active, game.counts);
}

// ============================================================
// ENDING
// ============================================================
function showEnding() {
  const hasShadow = game.flags['boss_boss_shadow_knight'];
  const hasDragon = game.flags['boss_boss_dragon_lord'];
  const good = hasShadow && hasDragon;
  const title = good ? '🏆 AKHIR: RAJA SEJATI' : hasShadow || hasDragon ? '⚖️ AKHIR: WALI' : '💀 AKHIR: MAHKOTA JATUH';
  const sub = good
    ? 'Valdria bersatu di bawah dewan tiga rumah. Mahkota dipulihkan, kedamaian kembali.'
    : hasShadow || hasDragon
      ? 'Marius tumbang, tapi mahkota tak sepenuhnya pulih. Kau memimpin sebagai wali.'
      : 'Dalam kekacauan, kau mengambil kekuatan mahkota untuk dirimu sendiri…';
  const el = document.createElement('div');
  el.id = 'pause-screen';
  el.innerHTML = `<div class="box"><h2 style="color:var(--gold)">${title}</h2><p style="max-width:420px">${sub}</p><br><button class="pixel-btn" id="ending-again">Main Lagi</button></div>`;
  el.addEventListener('click', (e) => { if (e.target.id === 'ending-again') { localStorage.removeItem(SAVE_KEY); location.reload(); } });
  document.body.appendChild(el);
}

// ============================================================
// LOOP UTAMA
// ============================================================
function update(dt) {
  const now = performance.now() / 1000;

  // waktu
  game.hour += dt * 24 / CFG.DAY_LENGTH;
  if (game.hour >= 24) { game.hour -= 24; game.day++; }

  // input player: arah relatif kamera AKTUAL (posisi kamera, bukan yaw yang
  // bisa memicu loop umpan-balik/glitch). W maju, joystick analog.
  const camPos = engine.camera.position;
  const fwd = new THREE.Vector3(player.pos.x - camPos.x, 0, player.pos.z - camPos.z);
  if (fwd.lengthSq() < 0.0001) fwd.set(0, 0, -1); else fwd.normalize();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
  const move = new THREE.Vector3();
  if (engine.keys.has('KeyW') || engine.keys.has('ArrowUp')) move.add(fwd);
  if (engine.keys.has('KeyS') || engine.keys.has('ArrowDown')) move.sub(fwd);
  if (engine.keys.has('KeyD') || engine.keys.has('ArrowRight')) move.add(right);
  if (engine.keys.has('KeyA') || engine.keys.has('ArrowLeft')) move.sub(right);
  move.addScaledVector(right, engine.analog.x);   // joystick: kanan
  move.addScaledVector(fwd, -engine.analog.y);    // joystick: bawah = mundur
  move.jump = engine.keys.has('Space');
  if (move.x * move.x + move.z * move.z > 1) move.normalize();
  player.update(dt, move);

  // entitas lain
  for (const n of npcs) n.update(dt);
  for (const e of enemies) e.update(dt);
  for (const b of bossActors) if (b.alive) b.update && b.update(dt);

  // chunk streaming
  world.update(player.pos.x, player.pos.z);

  // kamera
  engine.follow(player.model.position, dt, player.model.rotation.y);
  engine.updateSky(game.hour / 24);

  // awan bergerak
  for (const c of engine.clouds.children) {
    c.position.x += c.userData.speed * dt * 0.4;
    if (c.position.x > 110) c.position.x = -110;
  }

  // dialog tick
  ui._tickDialog(dt);

  // bioma saat ini
  const bio = world.biomeAt(player.pos.x, player.pos.z);
  fx.update(dt, bio, player.pos);
  if (bio !== currentBiome) {
    currentBiome = bio;
    ui.toast(BIOME_INFO[bio]);
    if (bio === BIOME.CITY && game.quests['main_escape'] && game.quests['main_escape'].stage === 1) {
      completeQuest('main_escape');
      updateQuestUI();
    }
  }

  // encounter acak (hanya di area liar, saat berjalan, setelah masa aman)
  const moving = move.x * move.x + move.z * move.z > 0.01;
  if (moving && bio !== BIOME.CITY && bio !== BIOME.LAKE && now > safeUntil && !battle.active) {
    walkTime += dt;
    if (walkTime > 1.5 && Math.random() < CFG.ENCOUNTER_RATE * dt) {
      walkTime = 0;
      startEncounter(bio);
    }
  } else {
    walkTime = 0;
  }

  // UI (throttle 100ms)
  uiTick += dt;
  if (uiTick > 0.1) {
    uiTick = 0;
    ui.updateHUD(game.party, game.gold);
    ui.updateClock(game.hour, game.day);
    ui.updateMinimap(player.pos.x, player.pos.z, CFG.WORLD_SIZE);

    // prompt interaksi
    let prompt = '';
    for (const n of npcs) {
      if (Math.abs(n.pos.x - player.pos.x) < 2.4 && Math.abs(n.pos.z - player.pos.z) < 2.4) { prompt = '[E] Bicara'; break; }
    }
    if (!prompt) for (const c of chests) {
      if (!c.opened && Math.abs(c.x - player.pos.x) < 2.0 && Math.abs(c.z - player.pos.z) < 2.0) { prompt = '[E] Buka peti'; break; }
    }
    if (!prompt) for (const b of bossActors) {
      if (b.alive && Math.abs(b.x - player.pos.x) < 3.0 && Math.abs(b.z - player.pos.z) < 3.0) { prompt = '[E] Hadapi Boss!'; break; }
    }
    if (!prompt && Math.abs(96 - player.pos.x) < 3.2 && Math.abs(96 - player.pos.z) < 3.2) prompt = '[E] Waystone (simpan)';
    ui.setPrompt(prompt);
  }
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, engine.clock ? engine.clock.getDelta() : 1 / 60);
  // dialog selalu di-tick agar huruf muncul bertahap
  ui._tickDialog(dt);
  if (!battle.active && !ui.dialog.active) update(dt);
  engine.render();
}

// ============================================================
// INIT
// ============================================================
function boot() {
  engine = new Engine($('viewport'));
  world = new World(engine);
  ui = new UI(engine.audio);
  battle = new Battle(engine.audio);

  // minimap dari grid bioma
  ui.buildMinimap(world.biome, CFG.WORLD_SIZE);

  // state
  game = newGameState();

  // title screen
  const hasSave = !!loadGame();
  ui.showTitle(hasSave);
  ui.hideLoading();

  $('btn-new').onclick = () => {
    ui.hideTitle();
    startGame();
  };
  $('btn-continue').onclick = () => {
    const s = loadGame();
    if (s) {
      game = s;
      for (const p of game.party) refreshStats(p); // migrasi save lama
      ui.hideTitle();
      startGame(true);
    }
  };

  // input global: E, F5, Esc
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE' && gameStarted && !battle.active && !ui.dialog.active && $('shop-panel').classList.contains('hidden')) {
      interact();
    }
    if (e.code === 'KeyF5') { e.preventDefault(); saveGame(game); ui.toast({ name: '💾 Tersimpan!', sub: 'Game disimpan.' }); }
    if (e.code === 'Escape') {
      if (!ui.dialog.active && !battle.active && !$('shop-panel').classList.contains('hidden')) {
        $('shop-panel').classList.add('hidden');
      } else if (gameStarted && !battle.active && !ui.dialog.active && !document.getElementById('pause-screen')) {
        ui.showPause();
      }
    }
  });
}

let gameStarted = false;
function startGame(fromSave) {
  gameStarted = true;
  setupWorld();
  const sx = fromSave ? game.pos.x : game.pos.x;
  const sz = fromSave ? game.pos.z : game.pos.z;
  player = new Player(world, sx, sz);
  engine.scene.add(player.model);
  ui.showHUD();
  ui.hideTitle();
  // mulai quest pertama
  startQuest('main_escape');
  startQuest('side_wolf');
  updateQuestUI();
  ui.toast({ name: 'Chronicles of the Fallen Crown', sub: 'Petualanganmu dimulai!' });
  // clock untuk delta
  engine.clock = new THREE.Clock();
  requestAnimationFrame(loop);
}

// hook debug untuk testing dari console
window.__game = {
  get game() { return game; }, get player() { return player; }, get world() { return world; },
  get engine() { return engine; }, get ui() { return ui; }, interact, saveGame,
  encounter: (bio) => startEncounter(bio == null ? 1 : bio),
  boss: (id) => startBossFight(id),
  setLevel: (lvl) => { for (const p of game.party) { p.lvl = lvl; p.exp = 0; refreshStats(p); p.hp = p.maxHp; p.mp = p.maxMp; } },
};

boot();