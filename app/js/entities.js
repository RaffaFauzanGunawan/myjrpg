// ============================================================
// entities.js — pemain, NPC, dan musuh voxel + AI
// ============================================================
import * as THREE from 'three';
import { CFG } from './config.js';

const T = THREE;

// ============================================================
// Pembuat karakter voxel (kotak-kotak pixel)
// ============================================================
export function makeVoxelCharacter({ skin = '#d9a066', shirt = '#4a90d9', pants = '#3a3a55', hat = null, scale = 1 }) {
  const g = new T.Group();
  const mat = (c) => new T.MeshLambertMaterial({ color: c });
  const box = (w, h, d, c, x, y, z) => {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat(c));
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };

  // torso
  const torso = box(0.7, 0.75, 0.42, shirt, 0, 0.95, 0);
  // kepala
  const head = box(0.52, 0.52, 0.52, skin, 0, 1.62, 0);
  const hair = box(0.56, 0.16, 0.56, hat || '#5a4a2a', 0, 1.78, 0);
  // mata (2 pixel)
  box(0.1, 0.08, 0.06, '#1a1a2a', -0.13, 1.64, 0.27);
  box(0.1, 0.08, 0.06, '#1a1a2a', 0.13, 1.64, 0.27);
  // lengan (kiri/kanan)
  const armL = box(0.2, 0.65, 0.2, shirt, -0.46, 0.85, 0);
  const armR = box(0.2, 0.65, 0.2, shirt, 0.46, 0.85, 0);
  // tangan
  box(0.2, 0.16, 0.2, skin, -0.46, 0.46, 0);
  box(0.2, 0.16, 0.2, skin, 0.46, 0.46, 0);
  // kaki
  const legL = box(0.26, 0.7, 0.26, pants, -0.16, 0.35, 0);
  const legR = box(0.26, 0.7, 0.26, pants, 0.16, 0.35, 0);

  g.scale.setScalar(scale);
  g.userData.parts = { torso, head, armL, armR, legL, legR, hair };
  return g;
}

// model musuh per tipe
export function makeEnemyModel(type) {
  const g = new T.Group();
  const mat = (c) => new T.MeshLambertMaterial({ color: c });
  const box = (w, h, d, c, x, y, z) => {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat(c));
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  switch (type) {
    case 'slime':
      box(0.9, 0.7, 0.9, '#27ae60', 0, 0.35, 0);
      box(0.12, 0.1, 0.06, '#0a1a0a', -0.2, 0.42, 0.46);
      box(0.12, 0.1, 0.06, '#0a1a0a', 0.2, 0.42, 0.46);
      break;
    case 'wolf':
      box(1.1, 0.5, 0.4, '#7f8c8d', 0, 0.45, 0);
      box(0.3, 0.3, 0.3, '#7f8c8d', 0.5, 0.6, 0);
      box(0.3, 0.25, 0.2, '#7f8c8d', -0.6, 0.55, 0);
      box(0.4, 0.14, 0.14, '#6a7075', -0.55, 0.25, 0.18);
      box(0.4, 0.14, 0.14, '#6a7075', -0.55, 0.25, -0.18);
      box(0.4, 0.14, 0.14, '#6a7075', 0.55, 0.25, 0.18);
      box(0.4, 0.14, 0.14, '#6a7075', 0.55, 0.25, -0.18);
      break;
    case 'goblin':
      box(0.6, 0.7, 0.4, '#4a7a3a', 0, 0.85, 0);
      box(0.5, 0.5, 0.5, '#6a9a4a', 0, 1.45, 0);
      box(0.12, 0.1, 0.06, '#ff2020', -0.1, 1.45, 0.26);
      box(0.12, 0.1, 0.06, '#ff2020', 0.14, 1.45, 0.26);
      box(0.24, 0.6, 0.24, '#4a7a3a', -0.42, 0.7, 0);
      box(0.24, 0.6, 0.24, '#4a7a3a', 0.42, 0.7, 0);
      box(0.24, 0.6, 0.24, '#2a4a2a', -0.15, 0.3, 0);
      box(0.24, 0.6, 0.24, '#2a4a2a', 0.15, 0.3, 0);
      break;
    case 'skeleton':
      box(0.6, 0.7, 0.36, '#e0e0e0', 0, 0.9, 0);
      box(0.5, 0.5, 0.5, '#d0d0d0', 0, 1.5, 0);
      box(0.5, 0.14, 0.4, '#101018', 0, 1.3, 0);
      box(0.2, 0.6, 0.2, '#e0e0e0', -0.42, 0.75, 0);
      box(0.2, 0.6, 0.2, '#e0e0e0', 0.42, 0.75, 0);
      box(0.24, 0.6, 0.24, '#e0e0e0', -0.15, 0.3, 0);
      box(0.24, 0.6, 0.24, '#e0e0e0', 0.15, 0.3, 0);
      break;
    case 'fire_imp':
      box(0.6, 0.6, 0.6, '#e25822', 0, 1.0, 0);
      box(0.5, 0.5, 0.5, '#f06a2e', 0, 1.6, 0);
      box(0.2, 0.3, 0.2, '#e25822', -0.45, 0.9, 0);
      box(0.2, 0.3, 0.2, '#e25822', 0.45, 0.9, 0);
      box(0.3, 0.3, 0.3, '#f6a623', 0, 0.35, 0);
      break;
    case 'bandit':
      box(0.7, 0.75, 0.42, '#2c3e50', 0, 0.95, 0);
      box(0.52, 0.52, 0.52, '#c68b59', 0, 1.62, 0);
      box(0.56, 0.14, 0.56, '#1a1a1a', 0, 1.78, 0);
      box(0.2, 0.65, 0.2, '#2c3e50', -0.46, 0.85, 0);
      box(0.2, 0.65, 0.2, '#2c3e50', 0.46, 0.85, 0);
      box(0.26, 0.7, 0.26, '#1a1a2e', -0.16, 0.35, 0);
      box(0.26, 0.7, 0.26, '#1a1a2e', 0.16, 0.35, 0);
      break;
    case 'golem':
      box(1.0, 1.0, 0.8, '#795548', 0, 1.0, 0);
      box(0.7, 0.6, 0.6, '#8a6455', 0, 1.85, 0);
      box(0.3, 0.1, 0.2, '#2a1a1a', -0.2, 1.85, 0.32);
      box(0.3, 0.1, 0.2, '#2a1a1a', 0.2, 1.85, 0.32);
      box(0.35, 0.8, 0.35, '#795548', -0.7, 0.8, 0);
      box(0.35, 0.8, 0.35, '#795548', 0.7, 0.8, 0);
      box(0.5, 0.5, 0.5, '#795548', -0.3, 0.4, 0);
      box(0.5, 0.5, 0.5, '#795548', 0.3, 0.4, 0);
      break;
    case 'mage_enemy':
      box(0.6, 0.75, 0.4, '#6c3483', 0, 0.95, 0);
      box(0.5, 0.5, 0.5, '#8e44ad', 0, 1.6, 0);
      box(0.6, 0.3, 0.6, '#4a1a5a', 0, 1.9, 0); // topi
      box(0.3, 0.65, 0.2, '#8e44ad', 0.5, 1.1, 0); // tongkat
      box(0.2, 0.6, 0.2, '#6c3483', -0.42, 0.75, 0);
      box(0.2, 0.6, 0.2, '#6c3483', 0.42, 0.75, 0);
      box(0.24, 0.6, 0.24, '#2a1a3a', -0.15, 0.3, 0);
      box(0.24, 0.6, 0.24, '#2a1a3a', 0.15, 0.3, 0);
      break;
    case 'wyvern':
      box(1.4, 0.5, 0.8, '#1a5276', 0, 0.6, 0);
      box(0.5, 0.45, 0.5, '#1a5276', 0.8, 0.85, 0);
      box(0.3, 0.1, 0.2, '#e8c9a0', 0.95, 0.85, 0.15);
      box(0.3, 0.1, 0.2, '#e8c9a0', 0.95, 0.85, -0.15);
      box(0.8, 0.06, 0.5, '#1a3a5a', 0.1, 1.2, 0); // sayap
      box(0.8, 0.06, 0.5, '#1a3a5a', 0.1, 1.2, 0);
      box(0.4, 0.14, 0.14, '#14344f', -0.9, 0.3, 0.3);
      box(0.4, 0.14, 0.14, '#14344f', -0.9, 0.3, -0.3);
      box(0.4, 0.14, 0.14, '#14344f', 0.9, 0.3, 0.3);
      box(0.4, 0.14, 0.14, '#14344f', 0.9, 0.3, -0.3);
      break;
    // boss besar
    case 'boss_shadow_knight':
      box(0.9, 1.0, 0.55, '#1a1a2e', 0, 1.2, 0);
      box(0.65, 0.65, 0.65, '#2a2a4a', 0, 2.0, 0);
      box(0.14, 0.1, 0.08, '#ff4040', -0.16, 2.0, 0.34);
      box(0.14, 0.1, 0.08, '#ff4040', 0.16, 2.0, 0.34);
      box(0.28, 0.9, 0.28, '#1a1a2e', -0.6, 1.0, 0);
      box(0.28, 0.9, 0.28, '#1a1a2e', 0.6, 1.0, 0);
      box(0.4, 1.3, 0.25, '#3a3a6a', 0.95, 1.1, 0); // pedang
      box(0.36, 0.9, 0.36, '#1a1a2e', -0.2, 0.45, 0);
      box(0.36, 0.9, 0.36, '#1a1a2e', 0.2, 0.45, 0);
      break;
    case 'boss_dragon_lord':
      box(2.0, 0.8, 1.1, '#922b21', 0, 0.9, 0);
      box(0.8, 0.7, 0.7, '#922b21', 1.1, 1.3, 0);
      box(0.5, 0.2, 0.3, '#e8c9a0', 1.4, 1.3, 0.3);
      box(1.4, 0.08, 0.7, '#7a1f18', 0.2, 1.7, 0); // sayap
      box(0.6, 0.2, 0.2, '#7a1f18', -1.3, 0.5, 0.4);
      box(0.6, 0.2, 0.2, '#7a1f18', -1.3, 0.5, -0.4);
      box(0.6, 0.2, 0.2, '#7a1f18', 1.3, 0.5, 0.4);
      box(0.6, 0.2, 0.2, '#7a1f18', 1.3, 0.5, -0.4);
      box(1.6, 0.3, 0.3, '#e25822', -0.2, 1.6, 0.5); // nafas api dekoratif
      break;
    case 'boss_tyrant':
      box(1.0, 1.1, 0.6, '#7d6608', 0, 1.3, 0);
      box(0.7, 0.7, 0.7, '#c9b89a', 0, 2.15, 0);
      box(0.8, 0.22, 0.8, '#d4af37', 0, 2.5, 0); // mahkota
      box(0.14, 0.1, 0.08, '#1a1a2a', -0.18, 2.15, 0.38);
      box(0.14, 0.1, 0.08, '#1a1a2a', 0.18, 2.15, 0.38);
      box(0.32, 1.0, 0.32, '#5a4a20', -0.66, 1.1, 0);
      box(0.32, 1.0, 0.32, '#5a4a20', 0.66, 1.1, 0);
      box(0.5, 1.2, 0.3, '#d4af37', 1.0, 1.2, 0); // tongkat kerajaan
      box(0.4, 1.0, 0.4, '#5a4a20', -0.22, 0.5, 0);
      box(0.4, 1.0, 0.4, '#5a4a20', 0.22, 0.5, 0);
      break;
    default: // humanoid generik
      return makeVoxelCharacter({ shirt: '#4a90d9', skin: '#d9a066' });
  }
  return g;
}

// ============================================================
// Kelas entity dasar (posisi + gravitasi + tanah)
// ============================================================
class Entity {
  constructor(world) {
    this.world = world;
    this.pos = new T.Vector3();
    this.vel = new T.Vector3();
    this.onGround = false;
    this.facing = 1; // 1 = +x, -1 = -x (untuk flip)
    this.anim = 0;
    this.model = new T.Group();
  }

  getY() {
    return this.world.groundY(this.pos.x, this.pos.z);
  }

  // cek bisa berdiri di (x, z) pada ketinggian y (feet)
  _canStand(x, z) {
    const gx = Math.round(x), gz = Math.round(z);
    if (gx < 0 || gz < 0 || gx >= this.world.size || gz >= this.world.size) return false;
    const bio = this.world.biomeAt(gx, gz);
    if (bio === 4) return false; // jangan masuk danau
    const gy = this.world.groundY(gx, gz);
    return Math.abs(gy - this.getY()) < 2.4; // tidak boleh menanjak terlalu curam
  }

  updatePhysics(dt) {
    // gravitasi & tanah
    const ground = this.getY();
    this.vel.y -= CFG.GRAVITY * dt;
    if (this.pos.y <= ground && this.vel.y <= 0) {
      this.pos.y = ground;
      this.vel.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
    this.pos.y += this.vel.y * dt;
  }
}

// ============================================================
// Pemain (dikontrol WASD)
// ============================================================
export class Player extends Entity {
  constructor(world, x, z) {
    super(world);
    this.size = world.size;
    this.pos.set(x, world.groundY(x, z), z);
    this.model = makeVoxelCharacter({ skin: '#e8c9a0', shirt: '#4a90d9', pants: '#5a5a7a', hat: '#8a6a3a' });
    this.model.position.copy(this.pos);
    this.speed = CFG.PLAYER_SPEED;
    this.animT = 0;
    this.moveAmt = 0;
    this.grounded = true;
    this.vx = 0; this.vz = 0;
  }

  // move = { x, z, jump } — arah dunia relatif kamera, panjang = magnitude 0..1
  update(dt, move) {
    const mag = Math.min(1, Math.hypot(move.x, move.z));
    // percepatan/deselerasi halus (rasa analog, tidak nyentak)
    const speedScale = 0.3 + 0.7 * mag; // tepi joystick = pelan, penuh = cepat
    const k = 1 - Math.pow(0.0001, dt);
    this.vx += (move.x * this.speed * speedScale - this.vx) * k;
    this.vz += (move.z * this.speed * speedScale - this.vz) * k;

    const wasGrounded = this.grounded;
    // gerak horizontal dengan cek tabrakan blok
    const nx = this.pos.x + this.vx * dt;
    const nz = this.pos.z + this.vz * dt;
    if (this._canStand(nx, this.pos.z)) this.pos.x = nx;
    if (this._canStand(this.pos.x, nz)) this.pos.z = nz;

    // lompat (WASD fallback tetap bisa, joystick tidak melompat)
    if (move.jump && this.onGround) {
      this.vel.y = CFG.JUMP_SPEED;
      this.onGround = false;
    }
    this.updatePhysics(dt);

    const moving = mag > 0.02 || Math.abs(this.vx) + Math.abs(this.vz) > 0.3;
    // rotasi model: berputar halus ke arah gerak (tanpa spin/glitch)
    if (mag > 0.02) {
      const targetYaw = Math.atan2(move.x, move.z);
      let d = targetYaw - this.model.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.model.rotation.y += d * (1 - Math.pow(0.0005, dt));
    }
    // animasi jalan
    this.animT += dt * (moving ? 10 : 0);
    const p = this.model.userData.parts;
    const swing = Math.sin(this.animT) * (moving ? 0.5 : 0);
    if (p) {
      p.legL.rotation.x = swing;
      p.legR.rotation.x = -swing;
      p.armL.rotation.x = -swing * 0.7;
      p.armR.rotation.x = swing * 0.7;
    }
    this.model.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.grounded = this.onGround;
    if (this.onGround && !wasGrounded) this._landDust();
  }

  _landDust() {
    // debu kecil saat mendarat (opsional, abaikan untuk kesederhanaan)
  }
}

// ============================================================
// NPC (berdiri, animasi idle, dialog)
// ============================================================
export class NPC extends Entity {
  constructor(world, data, engine) {
    super(world);
    this.size = world.size;
    this.data = data;
    this.engine = engine;
    this.pos.set(data.x, world.groundY(data.x, data.z), data.z);
    const isFemale = data.name === 'Herbalist Fae' || data.name === 'Seraphina' || data.name === 'Mira' || data.name === 'Lily';
    this.model = makeVoxelCharacter({
      skin: data.skin || '#d9a066',
      shirt: data.shirt || '#7a5230',
      pants: '#4a3a2a',
      hat: data.id === 'elder' ? '#e8e8e8' : data.id === 'captain' ? '#3a5a3a' : isFemale ? null : '#5a4a2a',
    });
    // NPC menghadap pemain (acak)
    this.model.rotation.y = Math.random() * Math.PI * 2;
    this.model.position.copy(this.pos);
    this.bobT = Math.random() * 10;
    this.speakT = 0;
  }

  update(dt) {
    this.bobT += dt;
    this.model.position.set(this.pos.x, this.pos.y + Math.sin(this.bobT * 2) * 0.04, this.pos.z);
  }
}

// ============================================================
// Musuh liar (berjalan acak di bioma)
// ============================================================
export class Enemy extends Entity {
  constructor(world, type, x, z, engine) {
    super(world);
    this.size = world.size;
    this.type = type;
    this.engine = engine;
    this.pos.set(x, world.groundY(x, z), z);
    this.model = makeEnemyModel(type);
    this.model.position.copy(this.pos);
    this.wanderT = Math.random() * 5;
    this.dir = new T.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    this.animT = Math.random() * 10;
    this.idle = Math.random() < 0.3;
    this.speed = 1.5 + Math.random() * 1.2;
  }

  update(dt) {
    this.wanderT -= dt;
    if (this.wanderT <= 0) {
      this.wanderT = 2 + Math.random() * 4;
      this.idle = Math.random() < 0.35;
      this.dir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    }
    if (!this.idle) {
      const nx = this.pos.x + this.dir.x * this.speed * dt;
      const nz = this.pos.z + this.dir.z * this.speed * dt;
      if (this._canStand(nx, this.pos.z)) this.pos.x = nx;
      if (this._canStand(this.pos.x, nz)) this.pos.z = nz;
    }
    this.updatePhysics(dt);
    this.animT += dt * (this.idle ? 2 : 7);

    // animasi: slime memantul, lainnya berjalan
    if (this.type === 'slime') {
      const s = 1 + Math.abs(Math.sin(this.animT)) * 0.18;
      this.model.scale.set(s, 1 / s, s);
    } else if (this.type === 'wyvern' || this.type === 'boss_dragon_lord') {
      this.model.position.y = this.pos.y + Math.abs(Math.sin(this.animT)) * 0.5;
      this.model.rotation.z = Math.sin(this.animT) * 0.08;
    } else {
      const p = this.model.userData.parts;
      if (p) {
        const swing = Math.sin(this.animT) * (this.idle ? 0.05 : 0.4);
        p.legL.rotation.x = swing;
        p.legR.rotation.x = -swing;
      }
    }
    this.model.position.x = this.pos.x;
    this.model.position.z = this.pos.z;
  }
}